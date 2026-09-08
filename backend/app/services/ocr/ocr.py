from pathlib import Path
from typing import Any, Dict

import numpy as np
from PIL import Image

try:
    from rapidocr_onnxruntime import RapidOCR
except ImportError:
    RapidOCR = None

# Global engine instance (loads ONNX models once into memory)
_engine = RapidOCR() if RapidOCR is not None else None


def extract_text_from_image(
    url: str,
    crop_top_pct: float = 0.12,  # Removes browser tabs / PDF toolbar
) -> Dict[str, Any]:
    path = Path(url)

    if not path.exists():
        return {
            "source": url,
            "text": "",
            "features": {},
            "message": "Image file not found",
        }

    if Image is None or RapidOCR is None or _engine is None:
        return {
            "source": url,
            "text": "",
            "features": {},
            "message": "rapidocr_onnxruntime is not installed",
        }

    with Image.open(path) as img:
        width, height = img.size
        img_mode = img.mode

        # Crop top UI region
        top_crop = int(height * crop_top_pct)
        cropped_img = img.crop((0, top_crop, width, height)).convert("RGB")
        img_np = np.array(cropped_img)

    # RapidOCR returns: result, elapse_time
    # Each result item: [bbox, text, score]
    results, _ = _engine(img_np)

    extracted_lines = []
    regions = []
    if results:
        for item in results:
            bbox = item[0]
            text = item[1].strip()
            score = float(item[2])
            if score >= 0.40 and text:
                extracted_lines.append(text)
                regions.append({
                    "text": text,
                    "confidence": score,
                    "bbox": [[float(point[0]), float(point[1])] for point in bbox],
                })

    extracted_text = "\n".join(extracted_lines).strip()

    features = {
        "width": width,
        "height": height,
        "mode": img_mode,
    }
    return {
        "source": url,
        "text": extracted_text,
        "regions": regions,
        "features": features,
        "message": "OCR text and image features extracted",
    }