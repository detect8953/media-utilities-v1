"""
Tool: FFmpeg Season Thumbnail Downscaler & MKV Replacer
Uses FFmpeg to scale master season thumbnails to max 1920x1080 with qscale:v JPEG compression,
then synchronizes them across all episode .mkv video files.
Reuses output framework and printing routines from crop_and_resize_artwork.py (total width = 211, filename column = 80).
"""

import os
import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from PIL import Image

try:
    import ffmpeg
    HAS_FFMPEG = True
except ImportError:
    HAS_FFMPEG = False

from media_config import (
    load_config,
    prompt_for_directory,
    prompt_for_dry_run,
    print_progress,
    print_table_report,
)

MAX_WIDTH = 1920
MAX_HEIGHT = 1080
JPEG_QUALITY = 4  # Lower = better quality; 2 is high, 4 is balanced, 5 is light compression


def get_image_resolution(image_path: Path) -> Tuple[int, int]:
    """Get resolution of the image (width, height)."""
    try:
        with Image.open(image_path) as img:
            return img.size  # (width, height)
    except Exception as e:
        print(f"⚠️ [ERROR] Couldn't read image size: {image_path} - {e}")
        return (0, 0)


def downscale_and_compress_image(
    image_path: Path,
    dry_run: bool = True,
    max_width: int = MAX_WIDTH,
    max_height: int = MAX_HEIGHT,
    jpeg_quality: int = JPEG_QUALITY,
) -> Tuple[bool, str]:
    """
    Downscale and compress image using ffmpeg, overwrite original if changes occurred.
    Returns: (was_processed, details_message)
    """
    width, height = get_image_resolution(image_path)
    if width == 0:
        return False, "Invalid image"
    if width <= max_width and height <= max_height:
        return False, f"Already compliant ({width}x{height})"

    if dry_run:
        msg = f"Would downscale ({width}x{height} -> max {max_width}x{max_height}, q={jpeg_quality})"
        return True, msg

    temp_output = image_path.with_name(image_path.stem + "_temp1080.jpg")

    if HAS_FFMPEG:
        try:
            (
                ffmpeg
                .input(str(image_path))
                .filter('scale', f"min({max_width},iw)", f"min({max_height},ih)")
                .output(str(temp_output), **{'qscale:v': jpeg_quality})
                .run(overwrite_output=True, quiet=True)
            )
            temp_output.replace(image_path)
            new_w, new_h = get_image_resolution(image_path)
            return True, f"Downscaled via FFmpeg ({width}x{height} -> {new_w}x{new_h}, q={jpeg_quality})"
        except Exception as e:
            if temp_output.exists():
                try:
                    temp_output.unlink()
                except OSError:
                    pass
            # Fallback to Pillow if ffmpeg binary failed
            try:
                with Image.open(image_path) as img:
                    img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
                    img.save(image_path, quality=88, optimize=True)
                new_w, new_h = get_image_resolution(image_path)
                return True, f"Downscaled via Pillow fallback ({width}x{height} -> {new_w}x{new_h})"
            except Exception as pe:
                return False, f"FFmpeg & Pillow error: {e} / {pe}"
    else:
        # Fallback when ffmpeg-python is not installed
        try:
            with Image.open(image_path) as img:
                img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
                img.save(image_path, quality=88, optimize=True)
            new_w, new_h = get_image_resolution(image_path)
            return True, f"Downscaled via Pillow ({width}x{height} -> {new_w}x{new_h})"
        except Exception as pe:
            return False, f"Pillow error: {pe}"


def replace_thumbnails_in_directory(
    directory: str,
    dry_run: bool = True,
    max_width: int = MAX_WIDTH,
    max_height: int = MAX_HEIGHT,
    jpeg_quality: int = JPEG_QUALITY,
    video_extensions: Optional[Tuple[str, ...]] = None,
) -> List[Dict[str, Any]]:
    """
    Replace thumbnails for .mkv files using optimized (compressed) season thumbnail images.
    Reuses printing routines from crop_and_resize_artwork.py (total width = 211, filename column = 80).
    """
    base_dir = Path(directory).resolve()
    if not base_dir.exists() or not base_dir.is_dir():
        print(f"❌ [ERROR] Directory does not exist: {base_dir}")
        return []

    if video_extensions is None:
        video_extensions = ('.mkv', '.mp4')

    # Track all directories that need processing (season folders)
    all_seasons = [p for p in base_dir.rglob('*') if p.is_dir()]
    total_seasons = len(all_seasons)

    if total_seasons == 0:
        print(f"ℹ️ No season subfolders found in {base_dir}")
        return []

    print(f"\n🚀 Found {total_seasons} season folders in '{base_dir.name}'. Executing thumbnail replacement...")
    results: List[Dict[str, Any]] = []

    # Cache for master season thumbnails to avoid redundant downscaling
    processed_masters: Dict[str, Tuple[bool, str]] = {}

    for idx, subdir in enumerate(all_seasons, 1):
        folder_name = subdir.name
        normalized = folder_name.replace(' ', '').lower()
        thumb_source = base_dir / f"{normalized}-thumb.jpg"

        # Check season directory as fallback if not at series root
        if not thumb_source.exists():
            alt_thumb = subdir / f"{normalized}-thumb.jpg"
            if alt_thumb.exists():
                thumb_source = alt_thumb
            else:
                print_progress(idx, total_seasons, prefix="Processing Seasons")
                continue

        # Downscale and compress original master thumb in-place if needed (cached)
        thumb_key = str(thumb_source.resolve())
        if thumb_key not in processed_masters:
            downscaled, details = downscale_and_compress_image(
                thumb_source,
                dry_run=dry_run,
                max_width=max_width,
                max_height=max_height,
                jpeg_quality=jpeg_quality,
            )
            processed_masters[thumb_key] = (downscaled, details)
        else:
            downscaled, details = processed_masters[thumb_key]

        # Scan for matching video files in this season
        video_files = [f for f in subdir.rglob("*") if f.suffix.lower() in video_extensions]

        for mkv_file in video_files:
            thumb_target = mkv_file.with_name(mkv_file.stem + "-thumb.jpg")

            if dry_run:
                status = "Dry-Run Sim"
            else:
                try:
                    shutil.copy2(thumb_source, thumb_target)
                    status = "Synced"
                except Exception as e:
                    status = f"Copy Err: {e}"

            results.append({
                "season": folder_name,
                "master_thumb": thumb_source.name,
                "video_file": mkv_file.name,
                "target_thumb": thumb_target.name,
                "status": status,
                "details": details,
            })

        print_progress(idx, total_seasons, prefix="Processing Seasons")

    return results


def run_standalone() -> None:
    """Interactive entry point called by PyCharm Run Configuration."""
    config = load_config()
    default_dir = config.get("paths", {}).get("default_reality_series_dir", r"E:\MediaStore\TV\Reality\Survivor (2000)")
    opts = config.get("thumbnail_replacement", {})

    target_dir = prompt_for_directory("Reality / TV Series Folder for FFmpeg Thumbnail Downscale & Sync", default_dir)
    dry_run = prompt_for_dry_run()

    max_width = opts.get("max_width", MAX_WIDTH)
    max_height = opts.get("max_height", MAX_HEIGHT)
    jpeg_quality = opts.get("ffmpeg_qscale", JPEG_QUALITY)
    video_extensions = tuple(opts.get("video_extensions", [".mkv", ".mp4"]))

    results = replace_thumbnails_in_directory(
        directory=target_dir,
        dry_run=dry_run,
        max_width=max_width,
        max_height=max_height,
        jpeg_quality=jpeg_quality,
        video_extensions=video_extensions,
    )

    rows = [
        [
            r.get("season", ""),
            r.get("master_thumb", ""),
            r.get("video_file", ""),
            r.get("target_thumb", ""),
            r.get("status", ""),
        ]
        for r in results
    ]

    # Total width = 211 chars. Video File Name column = 80 chars.
    # 16 + 36 + 80 + 44 + 19 = 195 content + 16 border chars = 211 total width
    col_widths = [16, 36, 80, 44, 19]

    print_table_report(
        title="FFmpeg MKV Thumbnail Downscale & Sync Summary",
        headers=["Season", "Master Thumbnail", "Video File (.mkv)", "Created Thumbnail", "Status"],
        rows=rows,
        col_widths=col_widths,
    )


if __name__ == "__main__":
    run_standalone()
