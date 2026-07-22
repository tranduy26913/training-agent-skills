"""Export the supplied scanned N4 vocabulary PDF as reviewable Markdown OCR."""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
IMAGE_DIR = ROOT / "tmp" / "pdfs"
OUTPUT = ROOT / "docs" / "n4-vocabulary-ocr.md"
TESSERACT = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def extract_page(image_path: Path) -> str:
    result = subprocess.run(
        [TESSERACT, str(image_path), "stdout", "-l", "jpn+vie", "--psm", "4"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
        check=False,
    )
    return result.stdout.replace(
        "Error opening data file C:\\Program Files\\Tesseract-OCR/tessdata/jpn_vert.traineddata",
        "",
    ).replace(
        "Please make sure the TESSDATA_PREFIX environment variable is set to your \"tessdata\" directory.",
        "",
    ).replace("Failed loading language 'jpn_vert'", "").strip()


parser = argparse.ArgumentParser()
parser.add_argument("--start", type=int, default=1)
parser.add_argument("--end", type=int, default=41)
parser.add_argument("--append", action="store_true")
args = parser.parse_args()

mode = "a" if args.append else "w"
with OUTPUT.open(mode, encoding="utf-8") as output:
    if not args.append:
        output.write(
            "# Từ vựng N4 - OCR từ PDF người dùng cung cấp\n\n"
            "Nguồn: `Từ vựng N4.pdf`. Đây là bản trích xuất OCR từ PDF scan; "
            "cần rà soát các dòng có ký tự nhận diện sai trước khi import database.\n\n"
        )
    for page_number in range(args.start, args.end + 1):
        image_path = IMAGE_DIR / f"n4-{page_number:02}.png"
        if not image_path.exists():
            continue
        output.write(f"## Trang {page_number}\n\n```text\n")
        output.write(extract_page(image_path))
        output.write("\n```\n\n")

print(f"Exported pages {args.start}-{args.end} to {OUTPUT}")
