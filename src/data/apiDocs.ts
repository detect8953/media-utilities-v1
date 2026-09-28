export interface ApiParameter {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface ApiProcedure {
  name: string;
  module: 'pytoolkit.directories' | 'pytoolkit.files' | 'pytoolkit.images' | 'pytoolkit.pipelines';
  category: string;
  summary: string;
  signature: string;
  parameters: ApiParameter[];
  returns: {
    type: string;
    description: string;
  };
  example: string;
  tags: string[];
}

export const API_PROCEDURES: ApiProcedure[] = [
  // --- DIRECTORIES ---
  {
    name: "generate_tree",
    module: "pytoolkit.directories",
    category: "Directories",
    summary: "Renders a formatted Unicode or ASCII tree representation of a directory hierarchy.",
    signature: "generate_tree(dir_path: Union[str, Path], max_depth: Optional[int] = 3, show_hidden: bool = False, show_sizes: bool = True, pattern: Optional[str] = None) -> str",
    parameters: [
      { name: "dir_path", type: "str | Path", description: "Root folder path to traverse." },
      { name: "max_depth", type: "int | None", default: "3", description: "Maximum recursion depth limit (None for infinite)." },
      { name: "show_hidden", type: "bool", default: "False", description: "Whether to include dotfiles or hidden OS files." },
      { name: "show_sizes", type: "bool", default: "True", description: "Append human-readable size for each file." },
      { name: "pattern", type: "str | None", default: "None", description: "Glob pattern to filter entries (e.g. '*.py')." }
    ],
    returns: {
      type: "str",
      description: "Multi-line string with visual branch symbols (├──, └──, │)."
    },
    example: `from pytoolkit.directories import generate_tree

tree_output = generate_tree("./src", max_depth=2, show_sizes=True)
print(tree_output)`,
    tags: ["tree", "visualize", "structure", "scan", "depth"]
  },
  {
    name: "get_dir_summary",
    module: "pytoolkit.directories",
    category: "Directories",
    summary: "Computes total recursive byte size, file and directory counts, and extension distributions.",
    signature: "get_dir_summary(dir_path: Union[str, Path], follow_symlinks: bool = False) -> Dict[str, Any]",
    parameters: [
      { name: "dir_path", type: "str | Path", description: "Directory to analyze." },
      { name: "follow_symlinks", type: "bool", default: "False", description: "Whether to traverse symbolic links." }
    ],
    returns: {
      type: "Dict[str, Any]",
      description: "Dictionary with total_files, total_dirs, total_bytes, human_size, extension_counts, and extension_bytes."
    },
    example: `from pytoolkit.directories import get_dir_summary

summary = get_dir_summary("/data/dataset")
print(f"Total size: {summary['human_size']} across {summary['total_files']} files")
print(summary['extension_counts'])`,
    tags: ["summary", "size", "disk", "stats", "extensions"]
  },
  {
    name: "flatten_dir",
    module: "pytoolkit.directories",
    category: "Directories",
    summary: "Flattens nested subdirectories into a single level folder with collision resolution.",
    signature: "flatten_dir(source_dir: Union[str, Path], target_dir: Union[str, Path], conflict_strategy: str = 'rename', separator: str = '_') -> List[Tuple[Path, Path]]",
    parameters: [
      { name: "source_dir", type: "str | Path", description: "Directory containing nested subfolders." },
      { name: "target_dir", type: "str | Path", description: "Target directory for flattened files." },
      { name: "conflict_strategy", type: "str", default: "'rename'", description: "Collision action: 'rename', 'skip', or 'overwrite'." },
      { name: "separator", type: "str", default: "'_'", description: "Character separating path parts in flat names." }
    ],
    returns: {
      type: "List[Tuple[Path, Path]]",
      description: "List of (original_path, flattened_path) tuples."
    },
    example: `from pytoolkit.directories import flatten_dir

moved = flatten_dir("./nested_docs", "./flat_docs", conflict_strategy="rename")
print(f"Flattened {len(moved)} files.")`,
    tags: ["flatten", "restructure", "organize", "subfolders"]
  },
  {
    name: "find_empty_dirs",
    module: "pytoolkit.directories",
    category: "Directories",
    summary: "Discovers all empty subdirectories recursively with optional bottom-up pruning.",
    signature: "find_empty_dirs(root_dir: Union[str, Path], remove: bool = False) -> List[Path]",
    parameters: [
      { name: "root_dir", type: "str | Path", description: "Root folder to examine." },
      { name: "remove", type: "bool", default: "False", description: "If True, deletes discovered empty folders." }
    ],
    returns: {
      type: "List[Path]",
      description: "List of Path objects for empty directories."
    },
    example: `from pytoolkit.directories import find_empty_dirs

empty_folders = find_empty_dirs("./downloads", remove=True)
print(f"Cleaned {len(empty_folders)} empty folders.")`,
    tags: ["cleanup", "empty", "prune", "maintenance"]
  },
  {
    name: "sync_dirs",
    module: "pytoolkit.directories",
    category: "Directories",
    summary: "One-way high-performance directory sync with checksum diffing and deletion support.",
    signature: "sync_dirs(src_dir: Union[str, Path], dst_dir: Union[str, Path], delete_extra: bool = False, dry_run: bool = False) -> Dict[str, List[str]]",
    parameters: [
      { name: "src_dir", type: "str | Path", description: "Source directory." },
      { name: "dst_dir", type: "str | Path", description: "Destination directory." },
      { name: "delete_extra", type: "bool", default: "False", description: "Delete files in dst that do not exist in src." },
      { name: "dry_run", type: "bool", default: "False", description: "Simulate operations without touching filesystem." }
    ],
    returns: {
      type: "Dict[str, List[str]]",
      description: "Dict with lists of 'copied', 'updated', and 'deleted' relative paths."
    },
    example: `from pytoolkit.directories import sync_dirs

report = sync_dirs("./staging", "./backup", delete_extra=True)
print(f"Copied {len(report['copied'])}, Updated {len(report['updated'])}")`,
    tags: ["sync", "backup", "mirror", "rsync"]
  },

  // --- FILES ---
  {
    name: "atomic_write",
    module: "pytoolkit.files",
    category: "Files",
    summary: "Crash-proof atomic file writer using temporary swap file with optional .bak preservation.",
    signature: "atomic_write(file_path: Union[str, Path], data: Union[str, bytes], encoding: str = 'utf-8', backup: bool = False) -> Path",
    parameters: [
      { name: "file_path", type: "str | Path", description: "Target file path." },
      { name: "data", type: "str | bytes", description: "String or bytes to write." },
      { name: "encoding", type: "str", default: "'utf-8'", description: "Text encoding if string is provided." },
      { name: "backup", type: "bool", default: "False", description: "Create .bak backup copy if file exists." }
    ],
    returns: {
      type: "Path",
      description: "Resolved destination Path object."
    },
    example: `from pytoolkit.files import atomic_write

# Safe against sudden power outages or process crashes
atomic_write("./config.json", '{"version": 2}', backup=True)`,
    tags: ["atomic", "write", "safe", "io", "crash-proof"]
  },
  {
    name: "find_duplicates",
    module: "pytoolkit.files",
    category: "Files",
    summary: "Locates identical duplicate files using a 2-phase size-filter and hash-collision strategy.",
    signature: "find_duplicates(dir_path: Union[str, Path], hash_algorithm: str = 'sha256', fast_size_check: bool = True) -> Dict[str, List[Path]]",
    parameters: [
      { name: "dir_path", type: "str | Path", description: "Directory tree to inspect." },
      { name: "hash_algorithm", type: "str", default: "'sha256'", description: "'md5', 'sha1', 'sha256', 'blake2b'." },
      { name: "fast_size_check", type: "bool", default: "True", description: "Skip hashing files with unique byte lengths." }
    ],
    returns: {
      type: "Dict[str, List[Path]]",
      description: "Mapping of checksum hashes to lists of identical file paths."
    },
    example: `from pytoolkit.files import find_duplicates

dups = find_duplicates("./media_library")
for checksum, group in dups.items():
    print(f"Identical files ({len(group)}): {[f.name for f in group]}")`,
    tags: ["duplicates", "dedup", "hash", "checksum", "storage"]
  },
  {
    name: "batch_rename",
    module: "pytoolkit.files",
    category: "Files",
    summary: "Transforms file names in batch using format templates, regex, or replacement strings.",
    signature: "batch_rename(files: List[Union[str, Path]], pattern: Optional[str] = None, replacement: Optional[str] = None, template: Optional[str] = None, is_regex: bool = False, dry_run: bool = False, start_index: int = 1) -> List[Tuple[Path, Path]]",
    parameters: [
      { name: "files", type: "List[str | Path]", description: "List of files to rename." },
      { name: "template", type: "str | None", default: "None", description: "Template string (e.g. 'doc_{n:03d}_{name}')." },
      { name: "pattern", type: "str | None", default: "None", description: "Search pattern to replace." },
      { name: "replacement", type: "str | None", default: "None", description: "Replacement text." },
      { name: "is_regex", type: "bool", default: "False", description: "Treat pattern as regular expression." },
      { name: "dry_run", type: "bool", default: "False", description: "Preview planned renames without executing." }
    ],
    returns: {
      type: "List[Tuple[Path, Path]]",
      description: "Pairs of (original_path, new_path)."
    },
    example: `from pytoolkit.files import batch_rename
from pathlib import Path

files = list(Path("./scans").glob("*.png"))
batch_rename(files, template="scan_{n:03d}_{name}")`,
    tags: ["rename", "batch", "template", "regex", "counter"]
  },
  {
    name: "calculate_hash",
    module: "pytoolkit.files",
    category: "Files",
    summary: "Streams file chunks to compute cryptographic digests with minimal RAM usage.",
    signature: "calculate_hash(file_path: Union[str, Path], algorithm: str = 'sha256', chunk_size: int = 65536) -> str",
    parameters: [
      { name: "file_path", type: "str | Path", description: "File to hash." },
      { name: "algorithm", type: "str", default: "'sha256'", description: "'md5', 'sha1', 'sha256', 'sha512', 'blake2b'." },
      { name: "chunk_size", type: "int", default: "65536", description: "Buffer read size in bytes (64KB)." }
    ],
    returns: {
      type: "str",
      description: "Hex-encoded hash digest string."
    },
    example: `from pytoolkit.files import calculate_hash

sha256 = calculate_hash("./dataset.zip", algorithm="sha256")
print("SHA256:", sha256)`,
    tags: ["hash", "md5", "sha256", "checksum", "integrity"]
  },
  {
    name: "create_archive",
    module: "pytoolkit.files",
    category: "Files",
    summary: "Creates compressed .zip, .tar.gz, or .tar.bz2 archives from multiple file sources.",
    signature: "create_archive(source_paths: List[Union[str, Path]], output_archive: Union[str, Path], format: str = 'zip', compression_level: int = 6) -> Path",
    parameters: [
      { name: "source_paths", type: "List[str | Path]", description: "Files or folders to bundle." },
      { name: "output_archive", type: "str | Path", description: "Target archive filename." },
      { name: "format", type: "str", default: "'zip'", description: "'zip', 'tar.gz', or 'tar.bz2'." }
    ],
    returns: {
      type: "Path",
      description: "Path to generated archive file."
    },
    example: `from pytoolkit.files import create_archive

arch = create_archive(["./reports", "./summary.csv"], "bundle_2026.zip")`,
    tags: ["zip", "tar", "archive", "compress", "bundle"]
  },

  // --- IMAGES ---
  {
    name: "batch_resize_images",
    module: "pytoolkit.images",
    category: "Images",
    summary: "Resizes batches of images with Lanczos interpolation and aspect-ratio preservation.",
    signature: "batch_resize_images(image_paths: List[Union[str, Path]], width: Optional[int] = None, height: Optional[int] = None, max_dimension: Optional[int] = None, preserve_aspect_ratio: bool = True, output_dir: Optional[Union[str, Path]] = None, resample_filter: str = 'lanczos') -> List[Path]",
    parameters: [
      { name: "image_paths", type: "List[str | Path]", description: "List of input image paths." },
      { name: "max_dimension", type: "int | None", default: "None", description: "Fit within maximum width/height bounding box." },
      { name: "width", type: "int | None", default: "None", description: "Exact target width." },
      { name: "height", type: "int | None", default: "None", description: "Exact target height." },
      { name: "preserve_aspect_ratio", type: "bool", default: "True", description: "Prevent image distortion." }
    ],
    returns: {
      type: "List[Path]",
      description: "List of output resized image Paths."
    },
    example: `from pytoolkit.images import batch_resize_images

resized = batch_resize_images(["photo1.jpg", "photo2.png"], max_dimension=1200, output_dir="./web_ready")`,
    tags: ["resize", "thumbnail", "aspect-ratio", "lanczos", "scale"]
  },
  {
    name: "convert_image_format",
    module: "pytoolkit.images",
    category: "Images",
    summary: "Converts images between WebP, PNG, JPEG, and AVIF with quality compression controls.",
    signature: "convert_image_format(image_path: Union[str, Path], target_format: str = 'webp', quality: int = 85, optimize: bool = True, output_dir: Optional[Union[str, Path]] = None) -> Path",
    parameters: [
      { name: "image_path", type: "str | Path", description: "Input image." },
      { name: "target_format", type: "str", default: "'webp'", description: "'webp', 'png', 'jpeg', or 'avif'." },
      { name: "quality", type: "int", default: "85", description: "Compression quality (1-100)." },
      { name: "optimize", type: "bool", default: "True", description: "Enable PIL encoder optimization passes." }
    ],
    returns: {
      type: "Path",
      description: "Converted image path."
    },
    example: `from pytoolkit.images import convert_image_format

webp_path = convert_image_format("banner.png", target_format="webp", quality=80)`,
    tags: ["convert", "webp", "jpeg", "png", "optimize"]
  },
  {
    name: "add_watermark",
    module: "pytoolkit.images",
    category: "Images",
    summary: "Applies semi-transparent text watermarks with corner, center, or tiled positioning presets.",
    signature: "add_watermark(image_path: Union[str, Path], watermark_text: str = 'CONFIDENTIAL', position: str = 'bottom-right', opacity: float = 0.35, font_size: int = 28, color: Tuple[int, int, int] = (255, 255, 255), output_dir: Optional[Union[str, Path]] = None) -> Path",
    parameters: [
      { name: "image_path", type: "str | Path", description: "Target photo." },
      { name: "watermark_text", type: "str", default: "'CONFIDENTIAL'", description: "Watermark string." },
      { name: "position", type: "str", default: "'bottom-right'", description: "'bottom-right', 'bottom-left', 'top-right', 'center', 'tile'." },
      { name: "opacity", type: "float", default: "0.35", description: "Alpha transparency (0.0 to 1.0)." }
    ],
    returns: {
      type: "Path",
      description: "Watermarked image path."
    },
    example: `from pytoolkit.images import add_watermark

marked = add_watermark("sample.jpg", watermark_text="© 2026 PyToolkit", position="bottom-right", opacity=0.4)`,
    tags: ["watermark", "branding", "copyright", "stamp"]
  },
  {
    name: "strip_exif_metadata",
    module: "pytoolkit.images",
    category: "Images",
    summary: "Sanitizes images by removing GPS coordinates, camera serials, and privacy metadata.",
    signature: "strip_exif_metadata(image_path: Union[str, Path], output_dir: Optional[Union[str, Path]] = None) -> Tuple[Path, Dict[str, Any]]",
    parameters: [
      { name: "image_path", type: "str | Path", description: "Photo with potential EXIF metadata." }
    ],
    returns: {
      type: "Tuple[Path, Dict[str, Any]]",
      description: "(clean_image_path, extracted_exif_dict)."
    },
    example: `from pytoolkit.images import strip_exif_metadata

clean_path, raw_exif = strip_exif_metadata("camera_raw.jpg")
print("Removed tags:", len(raw_exif))`,
    tags: ["exif", "privacy", "gps", "sanitize", "scrub"]
  },
  {
    name: "image_to_ascii",
    module: "pytoolkit.images",
    category: "Images",
    summary: "Converts photos into high-contrast terminal ASCII art text strings.",
    signature: "image_to_ascii(image_path: Union[str, Path], width: int = 80, charset: str = '@%#*+=-:. ') -> str",
    parameters: [
      { name: "image_path", type: "str | Path", description: "Image file to render." },
      { name: "width", type: "int", default: "80", description: "Output character column width." },
      { name: "charset", type: "str", default: "'@%#*+=-:. '", description: "Luminance character ramp from dense to light." }
    ],
    returns: {
      type: "str",
      description: "Multi-line ASCII string suitable for terminal printing."
    },
    example: `from pytoolkit.images import image_to_ascii

ascii_banner = image_to_ascii("logo.png", width=60)
print(ascii_banner)`,
    tags: ["ascii", "terminal", "art", "cli", "render"]
  },
  {
    name: "detect_black_borders",
    module: "pytoolkit.images",
    category: "Images",
    summary: "Automatically identifies and crops black letterbox or pillarbox bars from images using threshold masking.",
    signature: "detect_black_borders(image: Image.Image, threshold: int = 5) -> Tuple[Image.Image, str]",
    parameters: [
      { name: "image", type: "Image.Image", description: "Pillow Image instance to inspect." },
      { name: "threshold", type: "int", default: "5", description: "Pixel luminance threshold for black border detection (0-255)." }
    ],
    returns: {
      type: "Tuple[Image.Image, str]",
      description: "(cropped_image, crop_coordinates_or_'Not Needed')"
    },
    example: `from PIL import Image
from pytoolkit.images import detect_black_borders

with Image.open("letterboxed_poster.jpg") as img:
    clean_img, crop_vals = detect_black_borders(img, threshold=5)
    print("Crop values:", crop_vals)
    clean_img.save("no_borders.jpg")`,
    tags: ["borders", "letterbox", "pillarbox", "autocrop", "media"]
  },
  {
    name: "enforce_16_9_ratio",
    module: "pytoolkit.images",
    category: "Images",
    summary: "Enforces strict 16:9 widescreen aspect ratio by symmetrically cropping excess width or height.",
    signature: "enforce_16_9_ratio(image: Image.Image, target_ratio: float = 16/9) -> Tuple[Image.Image, str]",
    parameters: [
      { name: "image", type: "Image.Image", description: "Pillow Image instance." },
      { name: "target_ratio", type: "float", default: "1.777... (16/9)", description: "Target aspect ratio (width / height)." }
    ],
    returns: {
      type: "Tuple[Image.Image, str]",
      description: "(aspect_fitted_image, crop_offsets_or_'Not Needed')"
    },
    example: `from PIL import Image
from pytoolkit.images import enforce_16_9_ratio

with Image.open("artwork.jpg") as img:
    fixed_img, fix_vals = enforce_16_9_ratio(img)
    print("Aspect fix:", fix_vals)
    fixed_img.save("artwork_16x9.jpg")`,
    tags: ["aspect-ratio", "16:9", "widescreen", "tv", "crop"]
  },
  {
    name: "process_images",
    module: "pytoolkit.images",
    category: "Images",
    summary: "Batch processes TV season artwork: strips black borders, enforces 16:9 ratio, and scales to 1920x1080 with progress tracking.",
    signature: "process_images(target_dir: Union[str, Path], dry_run: bool = False, season_pattern: Optional[str] = r'Season \\d{2}$', target_resolution: Tuple[int, int] = (1920, 1080), valid_extensions: Tuple[str, ...] = ('.jpg', '.jpeg'), threshold: int = 5) -> Dict[str, Dict[str, Any]]",
    parameters: [
      { name: "target_dir", type: "str | Path", description: "Root folder of TV show or series." },
      { name: "dry_run", type: "bool", default: "False", description: "If True, only analyzes dimensions without altering files." },
      { name: "season_pattern", type: "str | None", default: "r'Season \\d{2}$'", description: "Regex to match Season folders (e.g. 'Season 01')." },
      { name: "target_resolution", type: "Tuple[int, int]", default: "(1920, 1080)", description: "Final scaled resolution (Lanczos)." }
    ],
    returns: {
      type: "Dict[str, Dict[str, Any]]",
      description: "Map of filenames to dictionary containing crop_values, aspect_fix_values, original_size, and final_size."
    },
    example: `from pytoolkit.images import process_images, print_processing_results

# Process all season title cards and thumbnails
results = process_images("./Slow Horses (2022)", dry_run=False)
print_processing_results(results)`,
    tags: ["tv", "season", "series", "batch", "artwork", "1080p"]
  },

  // --- PIPELINES ---
  {
    name: "Pipeline",
    module: "pytoolkit.pipelines",
    category: "Pipelines",
    summary: "Fluent chainable workflow orchestrator with step timing, error handling, and context passing.",
    signature: "Pipeline(name: str = 'Anonymous Pipeline').add(fn, name=None).run(initial_context=None) -> Dict[str, Any]",
    parameters: [
      { name: "name", type: "str", default: "'Anonymous Pipeline'", description: "Readable pipeline name." }
    ],
    returns: {
      type: "Dict[str, Any]",
      description: "Execution summary dict with success, total_duration_ms, steps_executed, context, and logs."
    },
    example: `from pytoolkit.pipelines import Pipeline
from pytoolkit.directories import ensure_dir

pipe = (
    Pipeline("Media Ingest")
    .add(lambda ctx: {"work_dir": ensure_dir(ctx["root"])}, name="Ensure Dir")
    .add(lambda ctx: print(f"Processing in {ctx['work_dir']}"), name="Log")
)

result = pipe.run({"root": "./output"})`,
    tags: ["pipeline", "workflow", "compose", "orchestrator", "chain"]
  }
];
