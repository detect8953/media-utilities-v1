"""
Optimized Configuration & Utilities for Media Processing Suite.
Handles JSON persistence, fast I/O prompts, progress rendering, and tabular outputs.
"""

import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

CONFIG_FILE = Path(__file__).resolve().parent / "config.json"

DEFAULT_CONFIG: Dict[str, Any] = {
    "paths": {
        "default_tv_series_dir": r"F:\MediaStore\TV\Series\Slow Horses (2022)",
        "default_reality_series_dir": r"E:\MediaStore\TV\Reality\Survivor (2000)",
    },
    "crop_and_resize": {
        "target_width": 1920,
        "target_height": 1080,
        "target_aspect_ratio": 16 / 9,
        "black_threshold": 5,
        "season_folder_regex": r"^Season \d{2}$",
        "supported_image_extensions": [".jpg", ".jpeg", ".png", ".webp"],
        "max_workers": 8,
    },
    "thumbnail_replacement": {
        "max_width": 1920,
        "max_height": 1080,
        "video_extensions": [".mkv", ".mp4"],
        "thumb_suffix": "-thumb.jpg",
        "jpeg_quality": 88,
    },
}


def load_config() -> Dict[str, Any]:
    """Load configuration from disk with fallback to defaults."""
    if not CONFIG_FILE.exists():
        save_config(DEFAULT_CONFIG)
        return DEFAULT_CONFIG
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as err:
        print(f"⚠️ Warning: Could not read {CONFIG_FILE} ({err}). Using defaults.")
        return DEFAULT_CONFIG


def save_config(config_data: Dict[str, Any]) -> None:
    """Save updated configuration to disk."""
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config_data, f, indent=2)
    except Exception as err:
        print(f"⚠️ Warning: Failed to save config to {CONFIG_FILE}: {err}")


def prompt_for_directory(prompt_label: str, default_path: str) -> str:
    """Fast directory prompt with quote sanitization and path validation."""
    print("-" * 72)
    print(f"📁 {prompt_label}")
    print(f"   Default: {default_path}")
    user_input = input("   Enter path (or press Enter to accept default):\n   > ").strip()

    target = user_input if user_input else default_path
    target = target.strip('"').strip("'")

    if not os.path.isdir(target):
        print(f"\n❌ Error: Directory '{target}' does not exist.")
        retry = input("Re-enter path? [Y/n]: ").strip().lower()
        if retry in ("y", "yes", ""):
            return prompt_for_directory(prompt_label, default_path)
        raise FileNotFoundError(f"Directory not found: {target}")

    return os.path.abspath(target)


def prompt_for_dry_run() -> bool:
    """Interactive mode toggle."""
    choice = input("\n⚙️  Run in Dry-Run simulation mode? [y/N] (default: No): ").strip().lower()
    return choice in ("y", "yes", "true", "1")


def print_progress(current: int, total: int, prefix: str = "Processing", length: int = 40) -> None:
    """Memory-efficient single-line progress indicator."""
    if total == 0:
        return
    pct = 100.0 * current / total
    filled = int(length * current // total)
    bar = "█" * filled + "-" * (length - filled)
    sys.stdout.write(f"\r{prefix} |{bar}| {pct:5.1f}% ({current}/{total})")
    sys.stdout.flush()
    if current >= total:
        print()


def print_table_report(title: str, headers: List[str], rows: List[List[str]], col_widths: Optional[List[int]] = None) -> None:
    """Unified formatted ASCII table renderer."""
    if not rows:
        return
    widths = col_widths or [max(len(str(r[i])) for r in rows + [headers]) + 2 for i in range(len(headers))]
    separator = "-" * (sum(widths) + len(widths) * 3 + 1)
    
    print(f"\n{'=' * len(separator)}")
    print(f"  {title.upper()}")
    print(f"{'=' * len(separator)}")
    
    header_str = " | ".join(f"{h:<{w}}" for h, w in zip(headers, widths))
    print(f"| {header_str} |")
    print(separator)
    for r in rows:
        row_str = " | ".join(f"{str(val):<{w}}" for val, w in zip(r, widths))
        print(f"| {row_str} |")
    print(f"{separator}\n")
