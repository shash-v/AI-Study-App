from __future__ import annotations

import os
from collections.abc import Callable, Mapping
from functools import wraps
from typing import Any, ParamSpec, TypeVar

from dotenv import load_dotenv
from langsmith import traceable

load_dotenv()

P = ParamSpec("P")
R = TypeVar("R")


def _trace_inputs(inputs: Any) -> Any:
    """Keep trace inputs useful without sending study content or binary payloads."""
    if isinstance(inputs, Mapping):
        return {str(key): _trace_inputs(value) for key, value in inputs.items()}
    if isinstance(inputs, (list, tuple)):
        return {"count": len(inputs), "types": [type(value).__name__ for value in inputs[:10]]}
    if isinstance(inputs, (str, bytes, bytearray)):
        return {"type": type(inputs).__name__, "length": len(inputs)}
    if inputs is None or isinstance(inputs, (int, float, bool)):
        return inputs
    return {"type": type(inputs).__name__}


def _trace_outputs(output: Any) -> Any:
    """Summarize outputs so OCR, document, and LLM content stays out of traces."""
    if isinstance(output, Mapping):
        return {
            "keys": [str(key) for key in output.keys()],
            "counts": {
                str(key): len(value)
                for key, value in output.items()
                if isinstance(value, (list, tuple, dict, str))
            },
        }
    if isinstance(output, (list, tuple)):
        return {"count": len(output), "item_type": type(output[0]).__name__ if output else None}
    if isinstance(output, str):
        return {"type": "str", "length": len(output)}
    if output is None or isinstance(output, (int, float, bool)):
        return output
    return {"type": type(output).__name__}


def traced(name: str, *, metadata: Mapping[str, Any] | None = None) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Trace an application boundary without recording large or sensitive payloads."""
    if not os.getenv("LANGSMITH_TRACING", "").lower() in {"1", "true", "yes", "on"}:
        def passthrough(function: Callable[P, R]) -> Callable[P, R]:
            return function

        return passthrough

    os.environ.setdefault("LANGSMITH_TRACING_V2", "true")

    def decorator(function: Callable[P, R]) -> Callable[P, R]:
        traced_function = traceable(
            function,
            name=name,
            metadata=dict(metadata or {}),
            process_inputs=_trace_inputs,
            process_outputs=_trace_outputs,
        )

        @wraps(function)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            return traced_function(*args, **kwargs)

        return wrapper

    return decorator


def tracing_metadata(**values: Any) -> dict[str, Any]:
    """Keep trace metadata scalar and deliberately exclude raw image/document content."""
    return {
        key: value
        for key, value in values.items()
        if value is not None and isinstance(value, (str, int, float, bool))
    }
