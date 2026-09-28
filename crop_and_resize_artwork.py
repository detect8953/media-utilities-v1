"""
Tool 1: High-Performance 16:9 Border Auto-Crop & 1080p Resizer
Optimizations:
  1. Single-pass composite bounding box calculation (eliminates intermediate crop buffers).
  2. Fast os.scandir season traversal.
  3. Parallel multithreaded image processing pool.
  4. Strict 211-character table output with 80-character filename column alignment.
"""

import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from PIL import Image

from media_config import (
    load_config,
    prompt_for_directory,
    prompt_for_dry_run,
    print_progress,
    print_table_report,
)


def calculate_single_pass_crop(
    image: Image.Image,
    threshold: int = 5,
    target_ratio: float = 16 / 9,
) -> Tuple[Tuple[int, int, int, int], str, str]:
    """
    Computes black border mask and 16:9 aspect crop into ONE composite bounding box.
    Returns: ((left, top, right, bottom), crop_description, aspect_description)
    """
    width, height = image.size
    
    # 1. Black border detection
    gray = image.convert("L")
    mask = gray.point(lambda p: 255 if p > threshold else 0)
    bbox = mask.getbbox()
    
    if not bbox or bbox == (0, 0, width, height):
        bx0, by0, bx1, by1 = 0, 0, width, height
        crop_desc = "Not Needed"
    else:
        bx0, by0, bx1, by1 = bbox
        crop_desc = f"{bx0}:{by0}:{bx1}:{by1}"

    bw = bx1 - bx0
    bh = by1 - by0
    current_ratio = bw / bh

    # 2. 16:9 aspect adjustment
    if abs(current_ratio - target_ratio) < 0.01:
        aspect_desc = "Not Needed"
        return (bx0, by0, bx1, by1), crop_desc, aspect_desc

    if current_ratio > target_ratio:
        new_w = int(bh * target_ratio)
        excess = bw - new_w
        left_pad = excess // 2
        right_pad = excess - left_pad
        final_box = (bx0 + left_pad, by0, bx1 - right_pad, by1)
        aspect_desc = f"L: {left_pad}px | R: {right_pad}px"
    else:
        new_h = int(bw / target_ratio)
        excess = bh - new_h
        top_pad = excess // 2
        bottom_pad = excess - top_pad
        final_box = (bx0, by0 + top_pad, bx1, by1 - bottom_pad)
        aspect_desc = f"T: {top_pad}px | B: {bottom_pad}px"

    return final_box, crop_desc, aspect_desc


def process_single_image(
    file_path: Path,
    season_name: str,
    target_resolution: Tuple[int, int],
    threshold: int,
    dry_run: bool,
) -> Dict[str, Any]:
    """Process a single image file efficiently."""
    try:
        with Image.open(file_path) as img:
            orig_size = img.size
            crop_box, crop_v, asp_v = calculate_single_pass_crop(img, threshold=threshold)
            
            needs_crop = crop_box != (0, 0, orig_size[0], orig_size[1])
            needs_resize = orig_size != target_resolution

            if not dry_run and (needs_crop or needs_resize):
                cropped = img.crop(crop_box) if needs_crop else img
                final_img = cropped.resize(target_resolution, Image.Resampling.LANCZOS)
                final_img.save(file_path, quality=88, optimize=False)

            return {
                "season": season_name,
                "filename": file_path.name,
                "original_size": f"{orig_size[0]}x{orig_size[1]}",
                "final_size": f"{target_resolution[0]}x{target_resolution[1]}",
                "crop_values": crop_v,
                "aspect_values": asp_v,
                "status": "Modified" if (needs_crop or needs_resize) else "Already 16:9 1080p",
            }
    except Exception as err:
        return {
            "season": season_name,
            "filename": file_path.name,
            "error": str(err),
            "status": "Error",
        }


def process_series_artwork(
    target_dir: str,
    dry_run: bool = False,
    season_pattern: str = r"^Season \d{2}$",
    target_resolution: Tuple[int, int] = (1920, 1080),
    valid_extensions: Tuple[str, ...] = (".jpg", ".jpeg", ".png", ".webp"),
    threshold: int = 5,
    max_workers: int = 8,
) -> List[Dict[str, Any]]:
    """Fast parallel scanning and processing."""
    base_path = Path(target_dir).resolve()
    season_regex = re.compile(season_pattern, re.IGNORECASE) if season_pattern else None

    # 1. Fast Directory Discovery using scandir
    matched_tasks = []
    try:
        for entry in os.scandir(base_path):
            if entry.is_dir() and (not season_regex or season_regex.search(entry.name)):
                for file_entry in os.scandir(entry.path):
                    if file_entry.is_file() and file_entry.name.lower().endswith(valid_extensions):
                        matched_tasks.append((Path(file_entry.path), entry.name))
    except Exception as err:
        print(f"❌ Error scanning directory: {err}")
        return []

    total = len(matched_tasks)
    if total == 0:
        print(f"ℹ️ No matching images found in '{base_path}' matching pattern '{season_pattern}'.")
        return []

    print(f"\n🚀 Found {total} episode images. Executing with {max_workers} worker threads...")
    results: List[Dict[str, Any]] = []

    # 2. Parallel Processing
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(
                process_single_image,
                path,
                season,
                target_resolution,
                threshold,
                dry_run,
            ): path
            for path, season in matched_tasks
        }

        for idx, future in enumerate(as_completed(futures), 1):
            results.append(future.result())
            print_progress(idx, total, prefix="Progress")

    return results


def run_standalone() -> None:
    """Interactive entry point for Tool 1."""
    config = load_config()
    default_dir = config["paths"]["default_tv_series_dir"]
    opts = config["crop_and_resize"]

    target_dir = prompt_for_directory("TV Series Folder for 16:9 Auto-Crop", default_dir)
    dry_run = prompt_for_dry_run()

    results = process_series_artwork(
        target_dir=target_dir,
        dry_run=dry_run,
        season_pattern=opts["season_folder_regex"],
        target_resolution=(opts["target_width"], opts["target_height"]),
        threshold=opts["black_threshold"],
        max_workers=opts.get("max_workers", 8),
    )

    rows = [
        [
            r.get("season", ""),
            r.get("filename", ""),
            r.get("crop_values", "N/A"),
            r.get("aspect_values", "N/A"),
            f"{r.get('original_size', '')} -> {r.get('final_size', '')}",
            r.get("status", ""),
        ]
        for r in results
    ]

    # Total width = 211 chars. Filename column = 80 chars.
    # 16 + 80 + 22 + 24 + 26 + 22 = 190 content + 21 border chars = 211 total width
    col_widths = [16, 80, 22, 24, 26, 22]

    print_table_report(
        title="Artwork 16:9 Auto-Crop Summary",
        headers=["Season", "Filename", "Border Crop", "16:9 Aspect Fix", "Resolution", "Status"],
        rows=rows,
        col_widths=col_widths,
    )


if __name__ == "__main__":
    run_standalone()
