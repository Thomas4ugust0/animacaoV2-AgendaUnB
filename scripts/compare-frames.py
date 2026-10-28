"""Compare a code-rendered PNG with a reference frame without hiding errors in black background."""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageEnhance


def metrics(reference, rendered, bounds):
    width, height = reference.size
    x0, y0, x1, y1 = bounds
    box = (round(x0 * width), round(y0 * height), round(x1 * width), round(y1 * height))
    a = np.asarray(reference.crop(box), dtype=np.float64) / 255
    b = np.asarray(rendered.crop(box), dtype=np.float64) / 255
    delta = np.abs(a - b)
    luma_a = a @ np.array([0.2126, 0.7152, 0.0722])
    luma_b = b @ np.array([0.2126, 0.7152, 0.0722])
    # Low threshold deliberately retains the reference's dark blue dots.
    mask_a = a.max(axis=2) > 0.045
    mask_b = b.max(axis=2) > 0.045
    union = np.logical_or(mask_a, mask_b)
    active_error = delta[union].mean() if union.any() else 0
    intersection = np.logical_and(mask_a, mask_b).sum()
    return {
        "bounds_normalized": bounds,
        "mean_absolute_error_0_255": float(delta.mean() * 255),
        "active_pixel_error_0_255": float(active_error * 255),
        "active_pixel_iou": float(intersection / union.sum()) if union.any() else 1.0,
        "mean_luminance_reference": float(luma_a.mean()),
        "mean_luminance_render": float(luma_b.mean()),
        "occupied_fraction_reference": float(mask_a.mean()),
        "occupied_fraction_render": float(mask_b.mean()),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("reference", type=Path)
    parser.add_argument("render", type=Path)
    parser.add_argument("--out", type=Path, default=Path("output/comparison"))
    parser.add_argument("--resize", action="store_true", help="Explicitly resize the render to reference dimensions")
    options = parser.parse_args()
    reference = Image.open(options.reference).convert("RGB")
    rendered = Image.open(options.render).convert("RGB")
    original_render_size = rendered.size
    if reference.size != rendered.size:
        if not options.resize:
            parser.error(f"Dimensions differ: reference {reference.size}, render {rendered.size}. Render at the same resolution or opt into --resize.")
        rendered = rendered.resize(reference.size, Image.Resampling.LANCZOS)
    options.out.mkdir(parents=True, exist_ok=True)
    report = {
        "reference": str(options.reference.resolve()), "render": str(options.render.resolve()),
        "size": reference.size, "original_render_size": original_render_size,
        "resized": original_render_size != reference.size,
        "note": "Metrics are diagnostic, not a claim of fidelity. Dot alignment, time, compression and resizing affect the scores. ROI bounds suit the supplied reference.",
        "regions": {
            "full_frame": metrics(reference, rendered, [0, 0, 1, 1]),
            "hourglass": metrics(reference, rendered, [0.405, 0.21, 0.60, 0.85]),
            "ribbons_left": metrics(reference, rendered, [0, 0.48, 0.40, 0.76]),
            "ribbons_right": metrics(reference, rendered, [0.60, 0.48, 1, 0.76]),
        },
    }
    (options.out / "metrics.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    difference = ImageChops.difference(reference, rendered)
    difference.save(options.out / "difference.png")
    ImageEnhance.Brightness(difference).enhance(6).save(options.out / "difference-6x.png")
    Image.blend(reference, rendered, 0.5).save(options.out / "overlay.png")
    width, height = reference.size
    sheet = Image.new("RGB", (width * 2, height + 44), "#16171c")
    sheet.paste(reference, (0, 44))
    sheet.paste(rendered, (width, 44))
    draw = ImageDraw.Draw(sheet)
    draw.text((16, 14), "REFERENCE", fill="white")
    draw.text((width + 16, 14), "CODE RENDER", fill="white")
    sheet.save(options.out / "side-by-side.png")
    # Enlarged, equally brightened crops make low-luminance dot structure inspectable.
    roi = (round(width * 0.405), round(height * 0.21), round(width * 0.60), round(height * 0.85))
    crops = [ImageEnhance.Brightness(image.crop(roi)).enhance(4) for image in [reference, rendered]]
    crop_sheet = Image.new("RGB", (crops[0].width * 2, crops[0].height), "black")
    for index, crop in enumerate(crops):
        crop_sheet.paste(crop, (index * crop.width, 0))
    crop_sheet.resize((crop_sheet.width * 2, crop_sheet.height * 2), Image.Resampling.NEAREST).save(options.out / "hourglass-4x-brightness.png")
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
