from pathlib import Path

import pytest

from app.services.ocr.ocr import extract_text_from_image


def test_extract_text_from_image_on_sample_screenshot():
    image_path = Path(r"C:\Users\shash\Downloads\test_screenshot_image.png")

    if not image_path.exists():
        pytest.skip(f"Image not found: {image_path}")

    result = extract_text_from_image(str(image_path))

    assert isinstance(result, dict)
    assert "text" in result
    assert "features" in result
    assert "message" in result
    assert result["source"] == str(image_path)
