"""
Unified Interactive Media Manager
Select and execute tools independently with interactive prompts.
"""

import sys
from media_config import load_config
import crop_and_resize_artwork
import sync_mkv_thumbnails
import ffmpeg_downscale_thumbnails


def show_menu() -> None:
    while True:
        print("\n" + "=" * 70)
        print("         🎬 MEDIA ARTWORK & THUMBNAIL SUITE")
        print("=" * 70)
        print("  [1] 🖼️  Auto-Crop Black Borders & Enforce 16:9 Ratio (1080p)")
        print("  [2] 🎞️  Sync Season Thumbnail to Episode .MKV Files (Pillow)")
        print("  [3] 🎬  FFmpeg Downscale & Replace MKV Thumbnails (q=4)")
        print("  [4] ⚡  Run Full Pipeline (Border Crop + FFmpeg Thumbnail Sync)")
        print("  [0] 🚪  Exit")
        print("-" * 70)

        choice = input("Enter your choice [0-4]: ").strip()

        if choice == "1":
            print("\n--- [1] 16:9 Border Auto-Crop & Resize ---")
            crop_and_resize_artwork.run_standalone()

        elif choice == "2":
            print("\n--- [2] MKV Thumbnail Synchronizer ---")
            sync_mkv_thumbnails.run_standalone()

        elif choice == "3":
            print("\n--- [3] FFmpeg Season Thumbnail Downscaler & Replacer ---")
            ffmpeg_downscale_thumbnails.run_standalone()

        elif choice == "4":
            print("\n--- [4] Full Pipeline Execution ---")
            print("Step 1: 16:9 Border Auto-Crop")
            crop_and_resize_artwork.run_standalone()
            print("\nStep 2: FFmpeg Thumbnail Downscale & Sync")
            ffmpeg_downscale_thumbnails.run_standalone()

        elif choice in ("0", "exit", "q"):
            print("\n👋 Goodbye!")
            sys.exit(0)

        else:
            print("❌ Invalid selection. Please enter 0, 1, 2, 3, or 4.")


if __name__ == "__main__":
    show_menu()
