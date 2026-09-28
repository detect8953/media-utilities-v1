"""
Tool 2: Optimized MKV Season Thumbnail Replacer & Compressor
Finds season thumbnails (e.g. season01-thumb.jpg), optimizes once, and fast-copies to episode .mkv files.
"""

import os
import shutil
from pathlib import Path
from typing import List, Tuple
from PIL import Image

from media_config import (
    load_config,
    prompt_for_directory,
    prompt_for_dry_run,
    print_table_report,
)


def optimize_master_thumbnail(image_path: Path, max_width: int = 1920, max_height: int = 1080, quality: int = 88, dry_run: bool = False) -> bool:
    """Downscales master thumbnail in-place only if dimensions exceed limits."""
    try:
        with Image.open(image_path) as img:
            w, h = img.size
            if w <= max_width and h <= max_height:
                return False
            
            if dry_run:
                print(f"  [DRY RUN] Would downscale master: {image_path.name} ({w}x{h} -> max {max_width}x{max_height})")
                return True

            img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            img.save(image_path, quality=quality, optimize=False)
            return True
    except Exception as err:
        print(f"⚠️ Error optimizing {image_path.name}: {err}")
        return False


def replace_thumbnails_in_directory(
    directory: str,
    dry_run: bool = False,
    max_width: int = 1920,
    max_height: int = 1080,
    video_extensions: Tuple[str, ...] = (".mkv", ".mp4"),
    quality: int = 88,
) -> List[List[str]]:
    """Scan season folders, downscale master thumbs, and duplicate to episode video targets."""
    base_dir = Path(directory).resolve()
    if not base_dir.is_dir():
        print(f"❌ Error: Directory does not exist: {base_dir}")
        return []

    report_rows: List[List[str]] = []
    
    # Fast iteration over subdirectories
    subdirs = [Path(entry.path) for entry in os.scandir(base_dir) if entry.is_dir()]
    if not subdirs:
        print(f"ℹ️ No subfolders found in {base_dir}")
        return []

    print(f"\n📂 Processing {len(subdirs)} season folders in: {base_dir}")

    for subdir in subdirs:
        folder_name = subdir.name
        normalized = folder_name.replace(" ", "").lower()
        thumb_source = base_dir / f"{normalized}-thumb.jpg"

        if not thumb_source.exists():
            alt_thumb = subdir / f"{normalized}-thumb.jpg"
            if alt_thumb.exists():
                thumb_source = alt_thumb
            else:
                continue

        # Optimize master thumbnail once per season
        optimize_master_thumbnail(thumb_source, max_width, max_height, quality, dry_run)

        # Fast discovery of episode files
        for f in os.scandir(subdir):
            if f.is_file() and Path(f.name).suffix.lower() in video_extensions:
                target_thumb = subdir / f"{Path(f.name).stem}-thumb.jpg"
                
                if not dry_run:
                    try:
                        shutil.copy2(thumb_source, target_thumb)
                        status = "Synced"
                    except Exception as e:
                        status = f"Error: {e}"
                else:
                    status = "Dry-Run Sim"

                report_rows.append([
                    folder_name,
                    thumb_source.name,
                    f.name,
                    target_thumb.name,
                    status,
                ])

    return report_rows


def run_standalone() -> None:
    """Interactive entry point for Tool 2."""
    config = load_config()
    default_dir = config["paths"]["default_reality_series_dir"]
    opts = config["thumbnail_replacement"]

    target_dir = prompt_for_directory("Reality / TV Series Folder for Thumbnail Sync", default_dir)
    dry_run = prompt_for_dry_run()

    rows = replace_thumbnails_in_directory(
        directory=target_dir,
        dry_run=dry_run,
        max_width=opts["max_width"],
        max_height=opts["max_height"],
        video_extensions=tuple(opts["video_extensions"]),
        quality=opts.get("jpeg_quality", 88),
    )

    print_table_report(
        title="MKV Thumbnail Sync Report",
        headers=["Season", "Master Thumbnail", "Video File (.mkv)", "Created Thumbnail", "Status"],
        rows=rows,
        col_widths=[12, 22, 34, 34, 14],
    )


if __name__ == "__main__":
    run_standalone()
