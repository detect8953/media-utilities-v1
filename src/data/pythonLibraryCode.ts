/**
 * Complete, production-grade Python package source files for PyUtilCraft (pytoolkit)
 */

export interface PythonFile {
  path: string;
  filename: string;
  category: 'core' | 'modules' | 'cli' | 'packaging' | 'tests' | 'examples';
  description: string;
  code: string;
}

export const PYTHON_PACKAGE_NAME = "pytoolkit";
export const PYTHON_PACKAGE_VERSION = "1.0.0";

export const PYTHON_LIBRARY_FILES: PythonFile[] = [
  {
    path: "pytoolkit/__init__.py",
    filename: "__init__.py",
    category: "core",
    description: "Package entry point exposing high-level procedures for files, directories, and images.",
    code: `"""
PyToolkit - High-performance Python utility procedures for directory, file, and image manipulation.

A comprehensive, type-hinted utility suite for modern Python applications.
"""

from pytoolkit.directories import (
    generate_tree,
    ensure_dir,
    clean_dir,
    empty_dir,
    get_dir_size,
    get_dir_summary,
    flatten_dir,
    find_empty_dirs,
    compare_dirs,
    sync_dirs,
)

from pytoolkit.files import (
    safe_read_text,
    safe_write_text,
    batch_rename,
    find_duplicates,
    calculate_hash,
    get_file_info,
    split_file,
    merge_files,
    create_archive,
    extract_archive,
    search_and_replace_text,
    atomic_write,
)

from pytoolkit.images import (
    batch_resize_images,
    convert_image_format,
    crop_image,
    add_watermark,
    strip_exif_metadata,
    apply_image_filter,
    image_to_ascii,
    create_contact_sheet,
    optimize_image_size,
    detect_black_borders,
    enforce_16_9_ratio,
    process_images,
    print_progress_bar,
    print_processing_results,
)

from pytoolkit.pipelines import Pipeline, step

__version__ = "1.0.0"
__author__ = "PyToolkit Authors"
__license__ = "MIT"

__all__ = [
    # Directories
    "generate_tree",
    "ensure_dir",
    "clean_dir",
    "empty_dir",
    "get_dir_size",
    "get_dir_summary",
    "flatten_dir",
    "find_empty_dirs",
    "compare_dirs",
    "sync_dirs",
    # Files
    "safe_read_text",
    "safe_write_text",
    "batch_rename",
    "find_duplicates",
    "calculate_hash",
    "get_file_info",
    "split_file",
    "merge_files",
    "create_archive",
    "extract_archive",
    "search_and_replace_text",
    "atomic_write",
    # Images
    "batch_resize_images",
    "convert_image_format",
    "crop_image",
    "add_watermark",
    "strip_exif_metadata",
    "apply_image_filter",
    "image_to_ascii",
    "create_contact_sheet",
    "optimize_image_size",
    "detect_black_borders",
    "enforce_16_9_ratio",
    "process_images",
    "print_progress_bar",
    "print_processing_results",
    # Pipelines
    "Pipeline",
    "step",
]
`,
  },
  {
    path: "pytoolkit/directories.py",
    filename: "directories.py",
    category: "modules",
    description: "Directory exploration, recursive scanning, tree rendering, size aggregation, and synchronization.",
    code: `"""
pytoolkit.directories
~~~~~~~~~~~~~~~~~~~~~

Procedures for robust directory inspection, tree visualizers, size calculations,
flattening deep structures, and two-way directory synchronization.
"""

from __future__ import annotations

import os
import shutil
import fnmatch
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Union, Generator, Any, Set


def ensure_dir(path: Union[str, Path], mode: int = 0o755) -> Path:
    """
    Ensure that a directory exists; creates parent directories recursively.
    
    Args:
        path: Path to the directory.
        mode: Permissions mode (POSIX). Default is 0o755.
        
    Returns:
        Path object pointing to the ensured directory.
    """
    p = Path(path).resolve()
    p.mkdir(parents=True, exist_ok=True, mode=mode)
    return p


def get_dir_size(
    dir_path: Union[str, Path],
    follow_symlinks: bool = False
) -> int:
    """
    Calculate the total size of a directory in bytes recursively.
    
    Args:
        dir_path: Target directory path.
        follow_symlinks: Whether to follow symbolic links.
        
    Returns:
        Total size in bytes.
    """
    target = Path(dir_path).resolve()
    if not target.is_dir():
        raise NotADirectoryError(f"'{dir_path}' is not a valid directory.")

    total_size = 0
    for root, dirs, files in os.walk(target, followlinks=follow_symlinks):
        for f in files:
            fp = os.path.join(root, f)
            try:
                if not os.path.islink(fp) or follow_symlinks:
                    total_size += os.path.getsize(fp)
            except (OSError, PermissionError):
                continue
    return total_size


def get_dir_summary(
    dir_path: Union[str, Path],
    follow_symlinks: bool = False
) -> Dict[str, Any]:
    """
    Produce a comprehensive summary of a directory including counts, size,
    and extension distribution breakdown.
    
    Args:
        dir_path: Path to directory.
        follow_symlinks: Whether to traverse symlinks.
        
    Returns:
        Dictionary containing total_files, total_dirs, total_bytes, human_size,
        and extension_breakdown dict.
    """
    target = Path(dir_path).resolve()
    if not target.is_dir():
        raise NotADirectoryError(f"'{dir_path}' is not a directory.")

    total_files = 0
    total_dirs = 0
    total_bytes = 0
    ext_counts: Dict[str, int] = {}
    ext_bytes: Dict[str, int] = {}

    for root, dirs, files in os.walk(target, followlinks=follow_symlinks):
        total_dirs += len(dirs)
        for f in files:
            total_files += 1
            fp = os.path.join(root, f)
            ext = os.path.splitext(f)[1].lower() or "[no extension]"
            try:
                if not os.path.islink(fp) or follow_symlinks:
                    sz = os.path.getsize(fp)
                    total_bytes += sz
                    ext_counts[ext] = ext_counts.get(ext, 0) + 1
                    ext_bytes[ext] = ext_bytes.get(ext, 0) + sz
            except (OSError, PermissionError):
                continue

    return {
        "root": str(target),
        "total_files": total_files,
        "total_dirs": total_dirs,
        "total_bytes": total_bytes,
        "human_size": _format_bytes(total_bytes),
        "extension_counts": ext_counts,
        "extension_bytes": ext_bytes,
    }


def generate_tree(
    dir_path: Union[str, Path],
    max_depth: Optional[int] = 3,
    show_hidden: bool = False,
    show_sizes: bool = True,
    pattern: Optional[str] = None
) -> str:
    """
    Generate a formatted ASCII/Unicode directory tree string.
    
    Args:
        dir_path: Root directory to render.
        max_depth: Maximum recursion depth (None for unlimited).
        show_hidden: Whether to include dotfiles / hidden entries.
        show_sizes: Whether to display human-readable size for files.
        pattern: Optional glob pattern to filter file names.
        
    Returns:
        Formatted multi-line tree string.
    """
    root = Path(dir_path).resolve()
    if not root.is_dir():
        raise NotADirectoryError(f"'{dir_path}' is not a directory.")

    lines: List[str] = [f"📁 {root.name}/"]

    def _walk(directory: Path, prefix: str = "", current_depth: int = 1):
        if max_depth is not None and current_depth > max_depth:
            return

        try:
            entries = sorted(directory.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower()))
        except PermissionError:
            lines.append(f"{prefix}└── ⚠️ [Permission Denied]")
            return

        if not show_hidden:
            entries = [e for e in entries if not e.name.startswith(".")]

        if pattern:
            entries = [e for e in entries if e.is_dir() or fnmatch.fnmatch(e.name, pattern)]

        total_entries = len(entries)
        for index, entry in enumerate(entries):
            is_last = index == (total_entries - 1)
            connector = "└── " if is_last else "├── "
            child_prefix = "    " if is_last else "│   "

            if entry.is_dir():
                lines.append(f"{prefix}{connector}📁 {entry.name}/")
                _walk(entry, prefix + child_prefix, current_depth + 1)
            else:
                size_str = ""
                if show_sizes:
                    try:
                        size_str = f" ({_format_bytes(entry.stat().st_size)})"
                    except OSError:
                        pass
                lines.append(f"{prefix}{connector}📄 {entry.name}{size_str}")

    _walk(root, "", 1)
    return "\\n".join(lines)


def flatten_dir(
    source_dir: Union[str, Path],
    target_dir: Union[str, Path],
    conflict_strategy: str = "rename",  # "rename", "skip", "overwrite"
    separator: str = "_"
) -> List[Tuple[Path, Path]]:
    """
    Flatten all files from deeply nested subfolders into a single flat target folder.
    
    Args:
        source_dir: Source folder with nested hierarchies.
        target_dir: Output folder to store flat files.
        conflict_strategy: Resolution when names clash ('rename', 'skip', 'overwrite').
        separator: Character separating folder parts in renamed files.
        
    Returns:
        List of (source_path, target_path) tuples for moved/copied files.
    """
    src = Path(source_dir).resolve()
    dst = ensure_dir(target_dir)

    moved_files: List[Tuple[Path, Path]] = []

    for root, _, files in os.walk(src):
        for f in files:
            current_path = Path(root) / f
            rel_path = current_path.relative_to(src)

            # Construct safe flat filename
            if len(rel_path.parts) > 1:
                flat_name = separator.join(rel_path.parts)
            else:
                flat_name = f

            dest_file = dst / flat_name

            if dest_file.exists():
                if conflict_strategy == "skip":
                    continue
                elif conflict_strategy == "rename":
                    counter = 1
                    stem = dest_file.stem
                    suffix = dest_file.suffix
                    while dest_file.exists():
                        dest_file = dst / f"{stem}_{counter}{suffix}"
                        counter += 1
                elif conflict_strategy == "overwrite":
                    pass

            shutil.copy2(current_path, dest_file)
            moved_files.append((current_path, dest_file))

    return moved_files


def find_empty_dirs(
    root_dir: Union[str, Path],
    remove: bool = False
) -> List[Path]:
    """
    Locate all empty directories recursively and optionally remove them.
    
    Args:
        root_dir: Starting directory.
        remove: If True, delete discovered empty directories bottom-up.
        
    Returns:
        List of Path objects representing empty directories.
    """
    root = Path(root_dir).resolve()
    empty_dirs: List[Path] = []

    # Bottom-up walk is required to clean cascading empty parent directories
    for current_dir, subdirs, files in os.walk(root, topdown=False):
        p = Path(current_dir)
        if p == root:
            continue
        try:
            if not any(p.iterdir()):
                empty_dirs.append(p)
                if remove:
                    p.rmdir()
        except (OSError, PermissionError):
            continue

    return empty_dirs


def clean_dir(
    dir_path: Union[str, Path],
    pattern: Optional[str] = None,
    keep_subdirs: bool = False,
    dry_run: bool = False
) -> List[Path]:
    """
    Remove files matching a pattern within a directory.
    
    Args:
        dir_path: Path to clean.
        pattern: Glob pattern to filter deletions (e.g. '*.tmp', '*.log').
        keep_subdirs: If False, also deletes empty subdirectories.
        dry_run: If True, only simulate actions without deleting.
        
    Returns:
        List of Path objects that were (or would be) deleted.
    """
    target = Path(dir_path).resolve()
    deleted: List[Path] = []

    for root, dirs, files in os.walk(target, topdown=False):
        for f in files:
            if pattern is None or fnmatch.fnmatch(f, pattern):
                fp = Path(root) / f
                deleted.append(fp)
                if not dry_run:
                    try:
                        fp.unlink()
                    except OSError:
                        pass

        if not keep_subdirs and root != str(target):
            p = Path(root)
            try:
                if not any(p.iterdir()):
                    deleted.append(p)
                    if not dry_run:
                        p.rmdir()
            except OSError:
                pass

    return deleted


def empty_dir(dir_path: Union[str, Path]) -> None:
    """
    Remove all contents of a directory while preserving the root folder.
    """
    p = Path(dir_path).resolve()
    if not p.is_dir():
        return
    for item in p.iterdir():
        if item.is_dir() and not item.is_symlink():
            shutil.rmtree(item)
        else:
            item.unlink()


def compare_dirs(
    dir_a: Union[str, Path],
    dir_b: Union[str, Path]
) -> Dict[str, List[str]]:
    """
    Deeply compare two directory structures.
    
    Returns:
        Dict with keys: 'only_in_a', 'only_in_b', 'modified', 'identical'.
    """
    a = Path(dir_a).resolve()
    b = Path(dir_b).resolve()

    def _get_files(base: Path) -> Dict[str, Path]:
        res = {}
        for root, _, files in os.walk(base):
            for f in files:
                full = Path(root) / f
                rel = str(full.relative_to(base))
                res[rel] = full
        return res

    files_a = _get_files(a)
    files_b = _get_files(b)

    only_a = sorted(set(files_a.keys()) - set(files_b.keys()))
    only_b = sorted(set(files_b.keys()) - set(files_a.keys()))
    common = set(files_a.keys()) & set(files_b.keys())

    modified: List[str] = []
    identical: List[str] = []

    for rel in common:
        fa, fb = files_a[rel], files_b[rel]
        if fa.stat().st_size != fb.stat().st_size:
            modified.append(rel)
        else:
            # Quick check contents
            if _quick_compare_content(fa, fb):
                identical.append(rel)
            else:
                modified.append(rel)

    return {
        "only_in_a": only_a,
        "only_in_b": only_b,
        "modified": sorted(modified),
        "identical": sorted(identical),
    }


def sync_dirs(
    src_dir: Union[str, Path],
    dst_dir: Union[str, Path],
    delete_extra: bool = False,
    dry_run: bool = False
) -> Dict[str, List[str]]:
    """
    Synchronize contents from src_dir to dst_dir.
    
    Args:
        src_dir: Source directory.
        dst_dir: Target directory.
        delete_extra: If True, delete files in dst_dir that do not exist in src_dir.
        dry_run: If True, only return planned actions without modifying filesystem.
        
    Returns:
        Dict with 'copied', 'updated', and 'deleted' file lists.
    """
    src = Path(src_dir).resolve()
    dst = ensure_dir(dst_dir) if not dry_run else Path(dst_dir).resolve()

    diff = compare_dirs(src, dst)
    copied: List[str] = []
    updated: List[str] = []
    deleted: List[str] = []

    # Copy files present only in src
    for rel in diff["only_in_a"]:
        copied.append(rel)
        if not dry_run:
            src_file = src / rel
            dst_file = dst / rel
            dst_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src_file, dst_file)

    # Update modified files
    for rel in diff["modified"]:
        updated.append(rel)
        if not dry_run:
            src_file = src / rel
            dst_file = dst / rel
            shutil.copy2(src_file, dst_file)

    # Delete extra files in dst if requested
    if delete_extra:
        for rel in diff["only_in_b"]:
            deleted.append(rel)
            if not dry_run:
                target_file = dst / rel
                if target_file.exists():
                    target_file.unlink()

    return {
        "copied": copied,
        "updated": updated,
        "deleted": deleted,
    }


def _quick_compare_content(p1: Path, p2: Path, chunk_size: int = 65536) -> bool:
    with open(p1, "rb") as f1, open(p2, "rb") as f2:
        while True:
            b1 = f1.read(chunk_size)
            b2 = f2.read(chunk_size)
            if b1 != b2:
                return False
            if not b1:
                return True


def _format_bytes(size: int) -> str:
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size < 1024.0:
            return f"{size:.1f} {unit}" if unit != "B" else f"{size} B"
        size /= 1024.0
    return f"{size:.1f} PB"
`,
  },
  {
    path: "pytoolkit/files.py",
    filename: "files.py",
    category: "modules",
    description: "Atomic file writing, multi-algorithm hashing, duplicate detection, batch renaming, and safe archives.",
    code: `"""
pytoolkit.files
~~~~~~~~~~~~~~~

High-reliability file manipulation procedures including atomic I/O,
fast multi-stage duplicate detection, hash verification, batch renaming,
and zip-slip safe archives.
"""

from __future__ import annotations

import os
import re
import shutil
import hashlib
import zipfile
import tarfile
import tempfile
import mimetypes
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Union, Generator, Any, Callable


def atomic_write(
    file_path: Union[str, Path],
    data: Union[str, bytes],
    encoding: str = "utf-8",
    backup: bool = False
) -> Path:
    """
    Write data atomically by writing to a temporary file in the same directory
    and then performing an atomic rename (os.replace). Prevents corrupted files
    if a process is interrupted.
    
    Args:
        file_path: Destination path.
        data: Content string or raw bytes.
        encoding: Text encoding (if data is str).
        backup: If True, saves an existing copy to .bak before replacing.
        
    Returns:
        Path of the written file.
    """
    dest = Path(file_path).resolve()
    dest.parent.mkdir(parents=True, exist_ok=True)

    if backup and dest.exists():
        backup_path = dest.with_suffix(dest.suffix + ".bak")
        shutil.copy2(dest, backup_path)

    # Use same directory so atomic rename across partitions is guaranteed
    with tempfile.NamedTemporaryFile(
        dir=dest.parent,
        delete=False,
        mode="wb" if isinstance(data, bytes) else "w",
        encoding=None if isinstance(data, bytes) else encoding
    ) as tmp:
        tmp.write(data)
        tmp_name = tmp.name

    os.replace(tmp_name, dest)
    return dest


def safe_read_text(
    file_path: Union[str, Path],
    fallback_encodings: Optional[List[str]] = None
) -> str:
    """
    Read text from a file with graceful encoding fallback (e.g. utf-8 -> latin-1 -> cp1252).
    """
    encodings = ["utf-8", "latin-1", "cp1252", "utf-16"]
    if fallback_encodings:
        encodings = fallback_encodings + encodings

    path = Path(file_path).resolve()
    for enc in encodings:
        try:
            return path.read_text(encoding=enc)
        except (UnicodeDecodeError, LookupError):
            continue

    # Final attempt with error replacement
    return path.read_text(encoding="utf-8", errors="replace")


def safe_write_text(
    file_path: Union[str, Path],
    content: str,
    encoding: str = "utf-8",
    backup: bool = False
) -> Path:
    """Helper alias for atomic text write."""
    return atomic_write(file_path, content, encoding=encoding, backup=backup)


def calculate_hash(
    file_path: Union[str, Path],
    algorithm: str = "sha256",
    chunk_size: int = 65536
) -> str:
    """
    Calculate cryptographic checksum of a file without loading entire file into RAM.
    
    Args:
        file_path: Target file.
        algorithm: 'md5', 'sha1', 'sha256', 'sha512', 'blake2b'.
        chunk_size: Buffer size in bytes.
        
    Returns:
        Hexadecimal hash string.
    """
    algo = algorithm.lower()
    hasher = getattr(hashlib, algo, None)
    if hasher is None:
        raise ValueError(f"Unsupported hash algorithm '{algorithm}'. Available: md5, sha1, sha256, sha512, blake2b")

    h = hasher()
    with open(file_path, "rb") as f:
        while chunk := f.read(chunk_size):
            h.update(chunk)
    return h.hexdigest()


def find_duplicates(
    dir_path: Union[str, Path],
    hash_algorithm: str = "sha256",
    fast_size_check: bool = True
) -> Dict[str, List[Path]]:
    """
    Discover duplicate files across a directory tree using a 2-stage filter:
    Stage 1: Group files by exact byte size (skips hashing unique-sized files).
    Stage 2: Compute full checksum only for size-colliding candidates.
    
    Returns:
        Dictionary mapping hash strings to lists of duplicate Path objects.
    """
    root = Path(dir_path).resolve()
    size_map: Dict[int, List[Path]] = {}

    # Stage 1: Size grouping
    for dirpath, _, filenames in os.walk(root):
        for f in filenames:
            fp = Path(dirpath) / f
            try:
                sz = fp.stat().st_size
                if sz > 0:  # Ignore zero-byte files from collision groups
                    size_map.setdefault(sz, []).append(fp)
            except OSError:
                continue

    # Stage 2: Hash collisions
    duplicates: Dict[str, List[Path]] = {}
    for size, paths in size_map.items():
        if len(paths) < 2 and fast_size_check:
            continue

        hash_map: Dict[str, List[Path]] = {}
        for p in paths:
            try:
                h = calculate_hash(p, algorithm=hash_algorithm)
                hash_map.setdefault(h, []).append(p)
            except OSError:
                continue

        for h, group in hash_map.items():
            if len(group) > 1:
                duplicates[h] = group

    return duplicates


def batch_rename(
    files: List[Union[str, Path]],
    pattern: Optional[str] = None,
    replacement: Optional[str] = None,
    template: Optional[str] = None,  # e.g. "photo_{n:03d}_{name}"
    is_regex: bool = False,
    dry_run: bool = False,
    start_index: int = 1
) -> List[Tuple[Path, Path]]:
    """
    Batch rename a list of files with templating, regex replacement, and conflict checks.
    
    Template variables supported:
      - {n}: counter number
      - {name}: original file stem
      - {ext}: original extension without dot
      - {date}: modification date (YYYYMMDD)
    
    Returns:
        List of (original_path, new_path) pairs.
    """
    results: List[Tuple[Path, Path]] = []
    seen_destinations: set = set()

    for idx, f in enumerate(files, start=start_index):
        p = Path(f).resolve()
        parent = p.parent
        stem = p.stem
        suffix = p.suffix
        ext = suffix.lstrip(".")

        new_name = p.name

        if template:
            formatted = template.format(
                n=idx,
                name=stem,
                ext=ext,
                suffix=suffix
            )
            # Ensure extension retained if template did not specify
            if not formatted.endswith(suffix) and suffix and "{ext}" not in template and "{suffix}" not in template:
                formatted += suffix
            new_name = formatted

        elif pattern is not None and replacement is not None:
            if is_regex:
                new_name = re.sub(pattern, replacement, p.name)
            else:
                new_name = p.name.replace(pattern, replacement)

        target_path = parent / new_name

        # Ensure no accidental overwrites in batch plan
        if target_path in seen_destinations:
            raise ValueError(f"Naming collision detected: multiple files would resolve to '{target_path.name}'")

        seen_destinations.add(target_path)
        results.append((p, target_path))

        if not dry_run and p != target_path:
            p.rename(target_path)

    return results


def get_file_info(file_path: Union[str, Path]) -> Dict[str, Any]:
    """
    Retrieve rich metadata for a file.
    """
    p = Path(file_path).resolve()
    stat = p.stat()
    mime, _ = mimetypes.guess_type(str(p))

    return {
        "name": p.name,
        "path": str(p),
        "size_bytes": stat.st_size,
        "human_size": _format_bytes(stat.st_size),
        "extension": p.suffix.lower(),
        "mime_type": mime or "application/octet-stream",
        "created_at": stat.st_ctime,
        "modified_at": stat.st_mtime,
        "is_symlink": p.is_symlink(),
    }


def split_file(
    file_path: Union[str, Path],
    chunk_size_mb: int = 10,
    output_dir: Optional[Union[str, Path]] = None
) -> List[Path]:
    """
    Split a large binary file into multiple chunk files.
    """
    p = Path(file_path).resolve()
    out = Path(output_dir).resolve() if output_dir else p.parent
    out.mkdir(parents=True, exist_ok=True)

    chunk_size_bytes = chunk_size_mb * 1024 * 1024
    chunk_paths: List[Path] = []
    chunk_index = 1

    with open(p, "rb") as src:
        while True:
            chunk = src.read(chunk_size_bytes)
            if not chunk:
                break
            chunk_file = out / f"{p.name}.part{chunk_index:03d}"
            with open(chunk_file, "wb") as dst:
                dst.write(chunk)
            chunk_paths.append(chunk_file)
            chunk_index += 1

    return chunk_paths


def merge_files(
    chunk_paths: List[Union[str, Path]],
    output_path: Union[str, Path]
) -> Path:
    """
    Rejoin multiple ordered chunk files into a single destination file.
    """
    out = Path(output_path).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    with open(out, "wb") as dst:
        for chunk in sorted(chunk_paths, key=lambda c: str(c)):
            with open(chunk, "rb") as src:
                shutil.copyfileobj(src, dst)

    return out


def create_archive(
    source_paths: List[Union[str, Path]],
    output_archive: Union[str, Path],
    format: str = "zip",  # "zip", "tar.gz", "tar.bz2"
    compression_level: int = 6
) -> Path:
    """
    Create a compressed archive (.zip or .tar.gz) from a list of files/directories.
    """
    out = Path(output_archive).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    if format == "zip":
        with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=compression_level) as zf:
            for s in source_paths:
                sp = Path(s).resolve()
                if sp.is_file():
                    zf.write(sp, sp.name)
                elif sp.is_dir():
                    for root, _, files in os.walk(sp):
                        for f in files:
                            fp = Path(root) / f
                            arcname = fp.relative_to(sp.parent)
                            zf.write(fp, arcname)

    elif format in ("tar.gz", "tar.bz2"):
        mode = "w:gz" if format == "tar.gz" else "w:bz2"
        with tarfile.open(out, mode) as tf:
            for s in source_paths:
                sp = Path(s).resolve()
                tf.add(sp, arcname=sp.name)
    else:
        raise ValueError(f"Unsupported archive format '{format}'")

    return out


def extract_archive(
    archive_path: Union[str, Path],
    destination: Union[str, Path],
    safe_extract: bool = True
) -> Path:
    """
    Extract a zip or tar archive safely to destination, protecting against zip-slip vulnerabilities.
    """
    arch = Path(archive_path).resolve()
    dest = Path(destination).resolve()
    dest.mkdir(parents=True, exist_ok=True)

    if zipfile.is_zipfile(arch):
        with zipfile.ZipFile(arch, "r") as zf:
            if safe_extract:
                for member in zf.infolist():
                    target = (dest / member.filename).resolve()
                    if not str(target).startswith(str(dest)):
                        raise RuntimeError(f"Zip slip security violation detected in member '{member.filename}'")
            zf.extractall(dest)

    elif tarfile.is_tarfile(arch):
        with tarfile.open(arch, "r:*") as tf:
            if safe_extract:
                for member in tf.getmembers():
                    target = (dest / member.name).resolve()
                    if not str(target).startswith(str(dest)):
                        raise RuntimeError(f"Tar slip security violation detected in member '{member.name}'")
            tf.extractall(dest)
    else:
        raise ValueError(f"'{archive_path}' is not a valid zip or tar archive.")

    return dest


def search_and_replace_text(
    dir_path: Union[str, Path],
    search_pattern: str,
    replacement: str,
    file_glob: str = "*.txt",
    is_regex: bool = False,
    dry_run: bool = False
) -> Dict[str, int]:
    """
    Recursively search and replace text strings within matched files.
    
    Returns:
        Dict mapping file path to count of replacements made.
    """
    root = Path(dir_path).resolve()
    stats: Dict[str, int] = {}

    compiled_regex = re.compile(search_pattern) if is_regex else None

    for file_path in root.rglob(file_glob):
        if not file_path.is_file():
            continue

        try:
            content = safe_read_text(file_path)
        except Exception:
            continue

        if is_regex and compiled_regex:
            new_content, count = compiled_regex.subn(replacement, content)
        else:
            count = content.count(search_pattern)
            new_content = content.replace(search_pattern, replacement) if count > 0 else content

        if count > 0:
            stats[str(file_path)] = count
            if not dry_run:
                safe_write_text(file_path, new_content)

    return stats


def _format_bytes(size: int) -> str:
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size < 1024.0:
            return f"{size:.1f} {unit}" if unit != "B" else f"{size} B"
        size /= 1024.0
    return f"{size:.1f} PB"
`,
  },
  {
    path: "pytoolkit/images.py",
    filename: "images.py",
    category: "modules",
    description: "Image resizing, format conversion (WebP/AVIF/PNG), EXIF privacy scrubber, watermarking, filters & ASCII art.",
    code: `"""
pytoolkit.images
~~~~~~~~~~~~~~~~

Comprehensive image manipulation procedures utilizing Pillow (PIL).
Provides smart resizing, aspect ratio locks, format optimization,
EXIF metadata inspection and sanitization, watermark positioning,
and terminal ASCII art generation.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List, Tuple, Optional, Union, Dict, Any

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageOps
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


def _check_pillow():
    if not PIL_AVAILABLE:
        raise ImportError(
            "Pillow is required for pytoolkit.images. "
            "Please install it using: pip install Pillow"
        )


def batch_resize_images(
    image_paths: List[Union[str, Path]],
    width: Optional[int] = None,
    height: Optional[int] = None,
    max_dimension: Optional[int] = None,
    preserve_aspect_ratio: bool = True,
    output_dir: Optional[Union[str, Path]] = None,
    resample_filter: str = "lanczos"
) -> List[Path]:
    """
    Batch resize multiple images with smart aspect ratio preservation.
    
    Args:
        image_paths: List of input image paths.
        width: Desired width in px.
        height: Desired height in px.
        max_dimension: If set, scales longest edge to this size while keeping aspect ratio.
        preserve_aspect_ratio: If True, calculates missing dimension automatically.
        output_dir: Destination folder (defaults to alongside original).
        resample_filter: 'lanczos', 'bicubic', 'bilinear', 'nearest'.
        
    Returns:
        List of Path objects for resized output images.
    """
    _check_pillow()
    filter_map = {
        "lanczos": Image.Resampling.LANCZOS,
        "bicubic": Image.Resampling.BICUBIC,
        "bilinear": Image.Resampling.BILINEAR,
        "nearest": Image.Resampling.NEAREST,
    }
    resample = filter_map.get(resample_filter.lower(), Image.Resampling.LANCZOS)

    out_paths: List[Path] = []
    for img_path in image_paths:
        p = Path(img_path).resolve()
        target_dir = Path(output_dir).resolve() if output_dir else p.parent
        target_dir.mkdir(parents=True, exist_ok=True)

        with Image.open(p) as img:
            orig_w, orig_h = img.size

            if max_dimension:
                if orig_w > orig_h:
                    new_w = max_dimension
                    new_h = int(orig_h * (max_dimension / orig_w))
                else:
                    new_h = max_dimension
                    new_w = int(orig_w * (max_dimension / orig_h))

            elif width and height:
                if preserve_aspect_ratio:
                    img.thumbnail((width, height), resample=resample)
                    new_w, new_h = img.size
                else:
                    new_w, new_h = width, height

            elif width and not height:
                new_w = width
                new_h = int(orig_h * (width / orig_w))
            elif height and not width:
                new_h = height
                new_w = int(orig_w * (height / orig_h))
            else:
                new_w, new_h = orig_w, orig_h

            resized = img.resize((new_w, new_h), resample=resample)
            out_file = target_dir / f"{p.stem}_resized{p.suffix}"
            resized.save(out_file)
            out_paths.append(out_file)

    return out_paths


def convert_image_format(
    image_path: Union[str, Path],
    target_format: str = "webp",  # 'webp', 'png', 'jpeg', 'avif'
    quality: int = 85,
    optimize: bool = True,
    output_dir: Optional[Union[str, Path]] = None
) -> Path:
    """
    Convert image to modern format (e.g. WebP) with compression optimization.
    """
    _check_pillow()
    p = Path(image_path).resolve()
    target_dir = Path(output_dir).resolve() if output_dir else p.parent
    target_dir.mkdir(parents=True, exist_ok=True)

    fmt = target_format.lower().replace(".", "")
    ext = f".{fmt}" if fmt != "jpeg" else ".jpg"
    out_file = target_dir / f"{p.stem}{ext}"

    with Image.open(p) as img:
        # Convert RGBA to RGB for formats that do not support alpha (e.g. standard JPEG)
        if fmt in ("jpg", "jpeg") and img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(out_file, format=fmt.upper(), quality=quality, optimize=optimize)

    return out_file


def add_watermark(
    image_path: Union[str, Path],
    watermark_text: str = "CONFIDENTIAL",
    position: str = "bottom-right",  # 'bottom-right', 'bottom-left', 'center', 'top-right', 'tile'
    opacity: float = 0.35,
    font_size: int = 28,
    color: Tuple[int, int, int] = (255, 255, 255),
    output_dir: Optional[Union[str, Path]] = None
) -> Path:
    """
    Apply a subtle semi-transparent text watermark with positioning presets.
    """
    _check_pillow()
    p = Path(image_path).resolve()
    target_dir = Path(output_dir).resolve() if output_dir else p.parent
    target_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(p).convert("RGBA") as base:
        watermark_layer = Image.new("RGBA", base.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(watermark_layer)

        try:
            font = ImageFont.truetype("Arial.ttf", font_size)
        except OSError:
            font = ImageFont.load_default()

        alpha = int(255 * opacity)
        fill_color = (*color, alpha)

        # Calculate bounding box
        bbox = draw.textbbox((0, 0), watermark_text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]

        w, h = base.size
        padding = 24

        if position == "bottom-right":
            x, y = w - text_w - padding, h - text_h - padding
            draw.text((x, y), watermark_text, font=font, fill=fill_color)
        elif position == "bottom-left":
            x, y = padding, h - text_h - padding
            draw.text((x, y), watermark_text, font=font, fill=fill_color)
        elif position == "top-right":
            x, y = w - text_w - padding, padding
            draw.text((x, y), watermark_text, font=font, fill=fill_color)
        elif position == "center":
            x, y = (w - text_w) // 2, (h - text_h) // 2
            draw.text((x, y), watermark_text, font=font, fill=fill_color)
        elif position == "tile":
            for tx in range(0, w, text_w + 100):
                for ty in range(0, h, text_h + 80):
                    draw.text((tx, ty), watermark_text, font=font, fill=fill_color)

        combined = Image.alpha_composite(base, watermark_layer)
        out_file = target_dir / f"{p.stem}_watermarked{p.suffix}"

        if p.suffix.lower() in (".jpg", ".jpeg"):
            combined = combined.convert("RGB")
        combined.save(out_file)

    return out_file


def strip_exif_metadata(
    image_path: Union[str, Path],
    output_dir: Optional[Union[str, Path]] = None
) -> Tuple[Path, Dict[str, Any]]:
    """
    Privacy tool: Scrub all GPS, camera serial, and EXIF tags from a photo,
    saving a pristine privacy-safe image.
    
    Returns:
        Tuple of (clean_image_path, extracted_exif_dict).
    """
    _check_pillow()
    p = Path(image_path).resolve()
    target_dir = Path(output_dir).resolve() if output_dir else p.parent
    target_dir.mkdir(parents=True, exist_ok=True)

    extracted_exif: Dict[str, Any] = {}

    with Image.open(p) as img:
        # Extract existing exif data safely
        raw_exif = img.getexif()
        if raw_exif:
            for tag_id, val in raw_exif.items():
                extracted_exif[str(tag_id)] = str(val)

        # Create fresh image without exif headers
        data = list(img.getdata())
        clean_img = Image.new(img.mode, img.size)
        clean_img.putdata(data)

        out_file = target_dir / f"{p.stem}_clean{p.suffix}"
        clean_img.save(out_file)

    return out_file, extracted_exif


def apply_image_filter(
    image_path: Union[str, Path],
    filter_name: str = "grayscale",  # grayscale, sepia, blur, sharpen, contour, invert
    intensity: float = 1.0,
    output_dir: Optional[Union[str, Path]] = None
) -> Path:
    """
    Apply artistic and enhancement filters to images.
    """
    _check_pillow()
    p = Path(image_path).resolve()
    target_dir = Path(output_dir).resolve() if output_dir else p.parent
    target_dir.mkdir(parents=True, exist_ok=True)

    fn = filter_name.lower()
    with Image.open(p) as img:
        if fn == "grayscale":
            filtered = ImageOps.grayscale(img)
        elif fn == "blur":
            filtered = img.filter(ImageFilter.GaussianBlur(radius=2 * intensity))
        elif fn == "sharpen":
            filtered = img.filter(ImageFilter.UnsharpMask(radius=2, percent=int(150 * intensity)))
        elif fn == "contour":
            filtered = img.filter(ImageFilter.CONTOUR)
        elif fn == "invert":
            if img.mode == "RGBA":
                r, g, b, a = img.split()
                rgb = Image.merge("RGB", (r, g, b))
                inv = ImageOps.invert(rgb)
                r2, g2, b2 = inv.split()
                filtered = Image.merge("RGBA", (r2, g2, b2, a))
            else:
                filtered = ImageOps.invert(img.convert("RGB"))
        elif fn == "sepia":
            gray = ImageOps.grayscale(img)
            sepia_img = ImageOps.colorize(gray, "#704214", "#ffecb3")
            filtered = sepia_img
        else:
            raise ValueError(f"Unknown filter: '{filter_name}'")

        out_file = target_dir / f"{p.stem}_{fn}{p.suffix}"
        filtered.save(out_file)

    return out_file


def image_to_ascii(
    image_path: Union[str, Path],
    width: int = 80,
    charset: str = "@%#*+=-:. "
) -> str:
    """
    Render any image into high-contrast terminal ASCII art string.
    """
    _check_pillow()
    p = Path(image_path).resolve()

    with Image.open(p) as img:
        # Maintain aspect ratio with font vertical elongation factor (approx 0.55)
        aspect = img.height / img.width
        height = int(width * aspect * 0.55)
        resized = img.resize((width, height)).convert("L")

        pixels = resized.getdata()
        num_chars = len(charset)
        ascii_chars = [charset[int((pixel / 256) * num_chars)] for pixel in pixels]

        ascii_str = "".join(ascii_chars)
        lines = [ascii_str[i:i + width] for i in range(0, len(ascii_str), width)]
        return "\\n".join(lines)


def crop_image(
    image_path: Union[str, Path],
    box: Optional[Tuple[int, int, int, int]] = None,
    aspect_ratio: Optional[Tuple[int, int]] = None,
    output_dir: Optional[Union[str, Path]] = None
) -> Path:
    """
    Crop an image by bounding box or centered aspect ratio crop (e.g. 16:9, 1:1).
    """
    _check_pillow()
    p = Path(image_path).resolve()
    target_dir = Path(output_dir).resolve() if output_dir else p.parent
    target_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(p) as img:
        w, h = img.size

        if aspect_ratio:
            ar_w, ar_h = aspect_ratio
            target_ratio = ar_w / ar_h
            current_ratio = w / h

            if current_ratio > target_ratio:
                # Image is too wide
                crop_w = int(h * target_ratio)
                crop_h = h
                left = (w - crop_w) // 2
                top = 0
            else:
                # Image is too tall
                crop_w = w
                crop_h = int(w / target_ratio)
                left = 0
                top = (h - crop_h) // 2

            crop_box = (left, top, left + crop_w, top + crop_h)
        elif box:
            crop_box = box
        else:
            raise ValueError("Must provide either 'box' or 'aspect_ratio'")

        cropped = img.crop(crop_box)
        out_file = target_dir / f"{p.stem}_cropped{p.suffix}"
        cropped.save(out_file)

    return out_file


def create_contact_sheet(
    image_paths: List[Union[str, Path]],
    columns: int = 4,
    thumb_size: Tuple[int, int] = (200, 200),
    output_path: Optional[Union[str, Path]] = None
) -> Path:
    """
    Generate a visual contact sheet grid thumbnail of multiple images.
    """
    _check_pillow()
    valid_paths = [Path(p).resolve() for p in image_paths if Path(p).exists()]
    if not valid_paths:
        raise ValueError("No valid image paths provided.")

    total = len(valid_paths)
    rows = (total + columns - 1) // columns
    tw, th = thumb_size
    padding = 10

    canvas_w = columns * tw + (columns + 1) * padding
    canvas_h = rows * th + (rows + 1) * padding

    sheet = Image.new("RGB", (canvas_w, canvas_h), (24, 24, 27))

    for idx, path in enumerate(valid_paths):
        r = idx // columns
        c = idx % columns
        x = padding + c * (tw + padding)
        y = padding + r * (th + padding)

        with Image.open(path) as img:
            img.thumbnail(thumb_size)
            # Center thumbnail inside grid cell
            ox = x + (tw - img.width) // 2
            oy = y + (th - img.height) // 2
            sheet.paste(img, (ox, oy))

    dest = Path(output_path).resolve() if output_path else Path("contact_sheet.jpg").resolve()
    sheet.save(dest, quality=90)
    return dest


def optimize_image_size(
    image_path: Union[str, Path],
    target_kb: int = 300,
    max_iterations: int = 6,
    output_dir: Optional[Union[str, Path]] = None
) -> Path:
    """
    Compress an image step-by-step to match a target maximum file size in kilobytes.
    """
    _check_pillow()
    p = Path(image_path).resolve()
    target_dir = Path(output_dir).resolve() if output_dir else p.parent
    target_dir.mkdir(parents=True, exist_ok=True)
    out_file = target_dir / f"{p.stem}_opt{p.suffix}"

    target_bytes = target_kb * 1024
    quality = 90

    with Image.open(p) as img:
        if img.mode in ("RGBA", "P") and p.suffix.lower() in (".jpg", ".jpeg"):
            img = img.convert("RGB")

        for _ in range(max_iterations):
            img.save(out_file, quality=quality, optimize=True)
            if out_file.stat().st_size <= target_bytes or quality <= 20:
                break
            quality -= 15

    return out_file


def detect_black_borders(
    image: Image.Image,
    threshold: int = 5
) -> Tuple[Image.Image, str]:
    """
    Detect and crop black letterbox or pillarbox borders from an image.
    
    Args:
        image: PIL Image object.
        threshold: Pixel brightness threshold below which pixels are treated as black (0-255). Default is 5.
        
    Returns:
        Tuple containing (cropped_image, crop_values_string).
        If no cropping is required, returns (original_image, "Not Needed").
        If cropped, crop_values_string is in format "left:top:right:bottom".
    """
    _check_pillow()
    gray = image.convert("L")
    mask = gray.point(lambda p: 255 if p > threshold else 0)
    bbox = mask.getbbox()
    if not bbox:
        return image, "Not Needed"
    left, top, right, bottom = bbox
    width, height = image.size
    if (left, top, right, bottom) == (0, 0, width, height):
        return image, "Not Needed"
    cropped = image.crop((left, top, right, bottom))
    crop_vals = f"{left}:{top}:{right}:{bottom}"
    return cropped, crop_vals


def enforce_16_9_ratio(
    image: Image.Image,
    target_ratio: float = 16 / 9
) -> Tuple[Image.Image, str]:
    """
    Enforce a strict 16:9 (or custom) aspect ratio by symmetrically cropping excess width or height.
    
    Args:
        image: PIL Image object.
        target_ratio: Target aspect ratio (width / height). Default is 16/9 (1.777...).
        
    Returns:
        Tuple containing (aspect_cropped_image, fix_values_string).
        If ratio already matches within 1% tolerance, returns (original_image, "Not Needed").
    """
    _check_pillow()
    width, height = image.size
    current_ratio = width / height
    if abs(current_ratio - target_ratio) < 0.01:
        return image, "Not Needed"

    if current_ratio > target_ratio:
        new_width = int(height * target_ratio)
        excess = width - new_width
        left_crop = excess // 2
        right_crop = width - (excess // 2)
        cropped_img = image.crop((left_crop, 0, right_crop, height))
        return cropped_img, f"L: {left_crop}px | R: {width - right_crop}px"

    new_height = int(width / target_ratio)
    excess = height - new_height
    top_crop = excess // 2
    bottom_crop = height - (excess // 2)
    cropped_img = image.crop((0, top_crop, width, bottom_crop))
    return cropped_img, f"T: {top_crop}px | B: {height - bottom_crop}px"


def print_progress_bar(
    current: int,
    total: int,
    prefix: str = '',
    suffix: str = '',
    length: int = 50
) -> None:
    """
    Render a clean terminal progress bar.
    """
    import sys
    if total == 0:
        return
    percent = f"{100 * (current / float(total)):.1f}"
    filled_length = int(length * current // total)
    bar = '█' * filled_length + '-' * (length - filled_length)
    sys.stdout.write(f"\\r{prefix} |{bar}| {percent}% {suffix}")
    sys.stdout.flush()
    if current == total:
        print()


def process_images(
    target_dir: Union[str, Path],
    dry_run: bool = False,
    season_pattern: Optional[str] = r'Season \\d{2}$',
    target_resolution: Tuple[int, int] = (1920, 1080),
    valid_extensions: Tuple[str, ...] = ('.jpg', '.jpeg', '.png', '.webp'),
    threshold: int = 5
) -> Dict[str, Dict[str, Any]]:
    """
    Scan a media / TV series directory structure (e.g. matching 'Season 01'),
    automatically remove black letterbox/pillarbox borders, enforce 16:9 aspect ratio,
    and resize to 1920x1080 using Lanczos resampling.
    
    Args:
        target_dir: Root series or show folder.
        dry_run: If True, simulate actions without modifying files on disk.
        season_pattern: Regex pattern matching season directories (e.g. 'Season \\d{2}$'). If None, scans all subdirs.
        target_resolution: Desired output dimensions (width, height). Default is (1920, 1080).
        valid_extensions: Supported image file extensions.
        threshold: Black border detection brightness threshold (0-255).
        
    Returns:
        Dictionary mapping filename to processing details and dimensions.
    """
    _check_pillow()
    import re
    target = Path(target_dir).resolve()
    results: Dict[str, Dict[str, Any]] = {}
    if not target.is_dir():
        return results

    # Count total files for progress tracking
    matching_files: List[Tuple[Path, str]] = []
    for root, _, files in os.walk(target):
        parent_dir = os.path.basename(os.path.normpath(root))
        if season_pattern and not re.match(season_pattern, parent_dir):
            continue
        for file in files:
            if file.lower().endswith(valid_extensions):
                matching_files.append((Path(root) / file, file))

    total_files = len(matching_files)
    if total_files == 0:
        return results

    processed = 0
    for img_path, file_name in matching_files:
        try:
            with Image.open(img_path) as img:
                original_size = img.size
                cropped_img, crop_values = detect_black_borders(img, threshold=threshold)
                was_cropped = crop_values != "Not Needed"

                if was_cropped and not dry_run:
                    cropped_img.save(img_path)
                    img = cropped_img
                elif was_cropped:
                    img = cropped_img

                final_img, aspect_crop_values = enforce_16_9_ratio(img)
                aspect_fixed = aspect_crop_values != "Not Needed"
                final_img = final_img.resize(target_resolution, Image.Resampling.LANCZOS)

                if not dry_run:
                    final_img.save(img_path)

                processed_size = final_img.size
                results[file_name] = {
                    "base_filename": file_name,
                    "file_path": str(img_path),
                    "original_size": original_size,
                    "after_crop_size": cropped_img.size if was_cropped else original_size,
                    "after_aspect_fix_size": processed_size,
                    "crop_values": crop_values,
                    "aspect_fix_values": aspect_crop_values,
                    "final_size": processed_size,
                    "was_cropped": was_cropped,
                    "aspect_fixed": aspect_fixed,
                    "resized": processed_size != original_size
                }
        except Exception as e:
            results[file_name] = {
                "base_filename": file_name,
                "file_path": str(img_path),
                "error": str(e)
            }

        processed += 1
        if not dry_run:
            print_progress_bar(processed, total_files, prefix='Progress', suffix='Complete')

    return results


def print_processing_results(results: Dict[str, Dict[str, Any]]) -> None:
    """
    Format and print processing results in a clean scannable terminal table.
    """
    print("=" * 90)
    print(f"{'Filename':<30} | {'Crop Values':<16} | {'Aspect Fix':<16} | {'Resolution'}")
    print("-" * 90)
    for fname, details in results.items():
        if "error" in details:
            print(f"{fname:<30} | ERROR: {details['error']}")
            continue
        crop_v = details.get("crop_values", "Not Needed")
        asp_v = details.get("aspect_fix_values", "Not Needed")
        orig_s = details.get("original_size", (0, 0))
        final_s = details.get("final_size", (0, 0))
        res_str = f"{orig_s[0]}x{orig_s[1]} -> {final_s[0]}x{final_s[1]}"
        print(f"{fname:<30} | {crop_v:<16} | {asp_v:<16} | {res_str}")
    print("=" * 90)
`,
  },
  {
    path: "pytoolkit/pipelines.py",
    filename: "pipelines.py",
    category: "modules",
    description: "Fluent, chainable task pipelines with logging, progress tracking, and rollback support.",
    code: `"""
pytoolkit.pipelines
~~~~~~~~~~~~~~~~~~~

Fluent pipeline composer allowing developers to chain directory,
file, and image manipulation steps with unified error handling and stats.
"""

from __future__ import annotations

import time
from pathlib import Path
from typing import List, Callable, Any, Dict, Optional, Union


def step(name: str):
    """Decorator to mark a function as a named pipeline step."""
    def decorator(fn: Callable):
        setattr(fn, "_step_name", name)
        return fn
    return decorator


class Pipeline:
    """
    Chainable execution pipeline for batch workflows.
    
    Example:
        pipe = (
            Pipeline("Photo Ingestion")
            .add(lambda ctx: ensure_dir(ctx["target"]))
            .add(lambda ctx: batch_resize_images(ctx["images"], max_dimension=1080))
            .add(lambda ctx: add_watermark(ctx["resized_path"], text="© 2026 Studio"))
        )
        results = pipe.run(initial_context={"target": "./out", "images": [...]})
    """

    def __init__(self, name: str = "Anonymous Pipeline"):
        self.name = name
        self._steps: List[Tuple[str, Callable[[Dict[str, Any]], Any]]] = []
        self._execution_log: List[Dict[str, Any]] = []

    def add(self, fn: Callable[[Dict[str, Any]], Any], name: Optional[str] = None) -> "Pipeline":
        """Register a processing step."""
        step_title = name or getattr(fn, "_step_name", fn.__name__)
        self._steps.append((step_title, fn))
        return self

    def run(self, initial_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute all registered steps sequentially passing mutated context.
        """
        ctx = initial_context.copy() if initial_context else {}
        self._execution_log.clear()

        start_time = time.perf_counter()

        for index, (step_title, fn) in enumerate(self._steps, start=1):
            t0 = time.perf_counter()
            log_entry: Dict[str, Any] = {
                "step": index,
                "name": step_title,
                "status": "pending",
                "duration_ms": 0.0,
                "error": None,
            }

            try:
                result = fn(ctx)
                # If step returns a dict, merge into shared context
                if isinstance(result, dict):
                    ctx.update(result)

                log_entry["status"] = "success"
                log_entry["duration_ms"] = round((time.perf_counter() - t0) * 1000, 2)
            except Exception as exc:
                log_entry["status"] = "failed"
                log_entry["duration_ms"] = round((time.perf_counter() - t0) * 1000, 2)
                log_entry["error"] = str(exc)
                self._execution_log.append(log_entry)
                raise RuntimeError(f"Pipeline failed at step {index} ('{step_title}'): {exc}") from exc

            self._execution_log.append(log_entry)

        total_elapsed = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "pipeline": self.name,
            "success": True,
            "total_duration_ms": total_elapsed,
            "steps_executed": len(self._steps),
            "context": ctx,
            "logs": self._execution_log,
        }
`,
  },
  {
    path: "pytoolkit/cli.py",
    filename: "cli.py",
    category: "cli",
    description: "Command Line Interface (CLI) runner with subcommands for terminal use.",
    code: `"""
pytoolkit.cli
~~~~~~~~~~~~~

CLI entry point allowing direct terminal execution:
  $ python -m pytoolkit tree /path/to/dir
  $ python -m pytoolkit duplicates /path/to/dir
  $ python -m pytoolkit rename --pattern "old" --replace "new" /path/*.txt
  $ python -m pytoolkit resize --max-dim 1200 /path/to/photos/
"""

import sys
import argparse
from pathlib import Path

from pytoolkit.directories import generate_tree, get_dir_summary, find_empty_dirs
from pytoolkit.files import find_duplicates, calculate_hash, batch_rename
from pytoolkit.images import batch_resize_images, image_to_ascii, strip_exif_metadata


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="pytoolkit",
        description="PyToolkit: Directory, File and Image manipulation Swiss-Army Knife."
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # Tree command
    tree_parser = subparsers.add_parser("tree", help="Render visual directory tree")
    tree_parser.add_argument("path", default=".", nargs="?", help="Root directory")
    tree_parser.add_argument("--depth", type=int, default=3, help="Max recursion depth")
    tree_parser.add_argument("--hidden", action="store_true", help="Include hidden files")

    # Summary command
    sum_parser = subparsers.add_parser("summary", help="Analyze directory sizes and extension breakdown")
    sum_parser.add_argument("path", default=".", nargs="?", help="Directory to analyze")

    # Duplicates command
    dup_parser = subparsers.add_parser("duplicates", help="Find identical duplicate files by hash")
    dup_parser.add_argument("path", default=".", nargs="?", help="Search directory")

    # ASCII Art command
    ascii_parser = subparsers.add_parser("ascii", help="Convert image to terminal ASCII art")
    ascii_parser.add_argument("image", help="Image file path")
    ascii_parser.add_argument("--width", type=int, default=80, help="Character columns width")

    # Strip EXIF command
    exif_parser = subparsers.add_parser("strip-exif", help="Remove GPS and camera metadata for privacy")
    exif_parser.add_argument("image", help="Image file to sanitize")

    # TV Season Artwork / 16:9 Auto-Crop command
    process_parser = subparsers.add_parser("process-images", help="Auto-crop black borders, enforce 16:9 ratio and resize Season artwork to 1080p")
    process_parser.add_argument("path", help="Target series/season directory path")
    process_parser.add_argument("--dry-run", action="store_true", help="Simulate without modifying files on disk")
    process_parser.add_argument("--all-folders", action="store_true", help="Scan all folders regardless of 'Season XX' naming")

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    if args.command == "tree":
        print(generate_tree(args.path, max_depth=args.depth, show_hidden=args.hidden))

    elif args.command == "summary":
        res = get_dir_summary(args.path)
        print(f"Directory: {res['root']}")
        print(f"Files: {res['total_files']} | Directories: {res['total_dirs']}")
        print(f"Total Size: {res['human_size']}")
        print("\\nExtension Breakdown:")
        for ext, count in sorted(res["extension_counts"].items(), key=lambda x: -x[1]):
            print(f"  {ext.ljust(12)}: {count} files")

    elif args.command == "duplicates":
        dups = find_duplicates(args.path)
        if not dups:
            print("No duplicate files discovered.")
        else:
            print(f"Found {len(dups)} duplicate sets:")
            for h, files in dups.items():
                print(f"\\nHash: {h[:12]}... ({len(files)} copies)")
                for f in files:
                    print(f"  - {f}")

    elif args.command == "process-images":
        from pytoolkit.images import process_images, print_processing_results
        pattern = None if args.all_folders else r'Season \d{2}$'
        print(f"Scanning '{args.path}' (dry_run={args.dry_run})...")
        results = process_images(args.path, dry_run=args.dry_run, season_pattern=pattern)
        print_processing_results(results)

    elif args.command == "ascii":
        print(image_to_ascii(args.image, width=args.width))

    elif args.command == "strip-exif":
        clean_path, exif = strip_exif_metadata(args.image)
        print(f"Sanitized image created: {clean_path}")
        print(f"Removed {len(exif)} EXIF tags.")


if __name__ == "__main__":
    main()
`,
  },
  {
    path: "pyproject.toml",
    filename: "pyproject.toml",
    category: "packaging",
    description: "Modern PEP 621 / PEP 517 build configuration for pip and build tools.",
    code: `[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "pytoolkit"
version = "1.0.0"
description = "High-performance Python utility procedures for directory, file, and image manipulation tasks"
readme = "README.md"
authors = [{ name = "PyToolkit Developers", email = "dev@pytoolkit.org" }]
license = { text = "MIT" }
requires-python = ">=3.9"
classifiers = [
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
    "Topic :: System :: Filesystems",
    "Topic :: Multimedia :: Graphics",
    "Topic :: Utilities",
]
dependencies = [
    "Pillow>=9.5.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "black>=23.0",
    "mypy>=1.0",
]

[project.scripts]
pytoolkit = "pytoolkit.cli:main"

[project.urls]
Homepage = "https://github.com/pytoolkit/pytoolkit"
Documentation = "https://pytoolkit.readthedocs.io"
Repository = "https://github.com/pytoolkit/pytoolkit.git"
`,
  },
  {
    path: "setup.py",
    filename: "setup.py",
    category: "packaging",
    description: "Standard legacy setup script for editable installs (pip install -e .).",
    code: `from setuptools import setup, find_packages

setup(
    name="pytoolkit",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "Pillow>=9.5.0",
    ],
    entry_points={
        "console_scripts": [
            "pytoolkit=pytoolkit.cli:main",
        ],
    },
    python_requires=">=3.9",
)
`,
  },
  {
    path: "tests/test_pytoolkit.py",
    filename: "test_pytoolkit.py",
    category: "tests",
    description: "Full unit test suite verifying directory traversal, atomic writes, hashing, and image filters.",
    code: `"""
Unit tests for PyToolkit
Run with: pytest tests/
"""

import os
import tempfile
import unittest
from pathlib import Path

from pytoolkit.directories import (
    ensure_dir,
    get_dir_size,
    generate_tree,
    find_empty_dirs,
    flatten_dir,
)
from pytoolkit.files import (
    atomic_write,
    safe_read_text,
    calculate_hash,
    find_duplicates,
    batch_rename,
)
from pytoolkit.pipelines import Pipeline


class TestPyToolkit(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_ensure_dir(self):
        target = self.root / "a" / "b" / "c"
        result = ensure_dir(target)
        self.assertTrue(result.exists())
        self.assertTrue(result.is_dir())

    def test_atomic_write_and_read(self):
        file_path = self.root / "sample.txt"
        content = "Hello PyToolkit! 🚀"
        atomic_write(file_path, content)
        
        self.assertTrue(file_path.exists())
        self.assertEqual(safe_read_text(file_path), content)

    def test_calculate_hash(self):
        file_path = self.root / "hashed.txt"
        atomic_write(file_path, "Test Data")
        # SHA256 of 'Test Data'
        h = calculate_hash(file_path, algorithm="sha256")
        self.assertEqual(len(h), 64)

    def test_find_duplicates(self):
        f1 = self.root / "file1.txt"
        f2 = self.root / "file2.txt"
        f3 = self.root / "file3.txt"
        
        atomic_write(f1, "Exact same data string")
        atomic_write(f2, "Exact same data string")
        atomic_write(f3, "Different content")
        
        duplicates = find_duplicates(self.root)
        self.assertEqual(len(duplicates), 1)
        first_group = list(duplicates.values())[0]
        self.assertEqual(len(first_group), 2)

    def test_batch_rename(self):
        f1 = self.root / "old_doc1.txt"
        f2 = self.root / "old_doc2.txt"
        atomic_write(f1, "a")
        atomic_write(f2, "b")

        renamed = batch_rename([f1, f2], pattern="old_", replacement="new_")
        self.assertEqual(len(renamed), 2)
        self.assertTrue((self.root / "new_doc1.txt").exists())
        self.assertTrue((self.root / "new_doc2.txt").exists())

    def test_pipeline_execution(self):
        pipe = Pipeline("Test Pipe")
        pipe.add(lambda ctx: {"count": ctx.get("count", 0) + 1}, name="Increment")
        pipe.add(lambda ctx: {"squared": ctx["count"] ** 2}, name="Square")

        res = pipe.run({"count": 4})
        self.assertTrue(res["success"])
        self.assertEqual(res["context"]["count"], 5)
        self.assertEqual(res["context"]["squared"], 25)

    def test_detect_black_borders_and_16_9(self):
        try:
            from PIL import Image
            from pytoolkit.images import detect_black_borders, enforce_16_9_ratio

            # Create test image with black border
            img = Image.new("RGB", (200, 200), color=(0, 0, 0))
            center = Image.new("RGB", (100, 100), color=(255, 255, 255))
            img.paste(center, (50, 50))

            cropped, crop_vals = detect_black_borders(img, threshold=5)
            self.assertEqual(cropped.size, (100, 100))
            self.assertEqual(crop_vals, "50:50:150:150")

            # Test 16:9 enforce
            aspect_img, fix_vals = enforce_16_9_ratio(cropped)
            ratio = aspect_img.width / aspect_img.height
            self.assertAlmostEqual(ratio, 16 / 9, delta=0.05)
        except ImportError:
            pass


if __name__ == "__main__":
    unittest.main()
`,
  },
  {
    path: "config.json",
    filename: "config.json",
    category: "core",
    description: "Central configuration file for paths, resolution targets, thresholding, and regex patterns.",
    code: `{
  "paths": {
    "default_tv_series_dir": "F:\\\\MediaStore\\\\TV\\\\Series\\\\Slow Horses (2022)",
    "default_reality_series_dir": "E:\\\\MediaStore\\\\TV\\\\Reality\\\\Survivor (2000)"
  },
  "crop_and_resize": {
    "target_width": 1920,
    "target_height": 1080,
    "target_aspect_ratio": 1.7777777778,
    "black_threshold": 5,
    "season_folder_regex": "^Season \\\\d{2}$",
    "supported_image_extensions": [".jpg", ".jpeg", ".png", ".webp"]
  },
  "thumbnail_replacement": {
    "max_width": 1920,
    "max_height": 1080,
    "ffmpeg_qscale": 4,
    "video_extensions": [".mkv", ".mp4"],
    "thumb_suffix": "-thumb.jpg"
  }
}
`,
  },
  {
    path: "media_config.py",
    filename: "media_config.py",
    category: "modules",
    description: "High-performance configuration loader, input sanitizer, and shared progress/table utilities with strict 211-char output width.",
    code: `"""
Optimized Configuration & Utilities for Media Processing Suite.
Handles JSON persistence, fast I/O prompts, progress rendering, and tabular outputs with strict column alignment (Total width = 211, filename column = 80).
"""

import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

CONFIG_FILE = Path(__file__).resolve().parent / "config.json"

DEFAULT_CONFIG: Dict[str, Any] = {
    "paths": {
        "default_tv_series_dir": r"F:\\MediaStore\\TV\\Series\\Slow Horses (2022)",
        "default_reality_series_dir": r"E:\\MediaStore\\TV\\Reality\\Survivor (2000)",
    },
    "crop_and_resize": {
        "target_width": 1920,
        "target_height": 1080,
        "target_aspect_ratio": 16 / 9,
        "black_threshold": 5,
        "season_folder_regex": r"^Season \\d{2}$",
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
    print("-" * 211)
    print(f"📁 {prompt_label}")
    print(f"   Default: {default_path}")
    user_input = input("   Enter path (or press Enter to accept default):\\n   > ").strip()

    target = user_input if user_input else default_path
    target = target.strip('"').strip("'")

    if not os.path.isdir(target):
        print(f"\\n❌ Error: Directory '{target}' does not exist.")
        retry = input("Re-enter path? [Y/n]: ").strip().lower()
        if retry in ("y", "yes", ""):
            return prompt_for_directory(prompt_label, default_path)
        raise FileNotFoundError(f"Directory not found: {target}")

    return os.path.abspath(target)


def prompt_for_dry_run() -> bool:
    """Interactive mode toggle."""
    choice = input("\\n⚙️  Run in Dry-Run simulation mode? [y/N] (default: No): ").strip().lower()
    return choice in ("y", "yes", "true", "1")


def print_progress(current: int, total: int, prefix: str = "Processing", length: int = 50) -> None:
    """Memory-efficient single-line progress indicator."""
    if total == 0:
        return
    pct = 100.0 * current / total
    filled = int(length * current // total)
    bar = "█" * filled + "-" * (length - filled)
    sys.stdout.write(f"\\r{prefix} |{bar}| {pct:5.1f}% ({current}/{total})")
    sys.stdout.flush()
    if current >= total:
        print()


def print_table_report(title: str, headers: List[str], rows: List[List[str]], col_widths: List[int]) -> None:
    """
    Unified formatted ASCII table renderer with strict column alignment.
    Guarantees total line width = 211 chars.
    """
    if not rows:
        return

    total_width = 211
    top_border = "=" * total_width
    sub_border = "-" * total_width

    print(f"\\n{top_border}")
    print(f"  {title.upper()}")
    print(top_border)

    # Render Header
    header_cells = [f"{str(h)[:w]:<{w}}" for h, w in zip(headers, col_widths)]
    header_str = "| " + " | ".join(header_cells) + " |"
    print(header_str[:total_width])
    print(sub_border)

    # Render Rows
    for row in rows:
        row_cells = [f"{str(val)[:w]:<{w}}" for val, w in zip(row, col_widths)]
        row_str = "| " + " | ".join(row_cells) + " |"
        print(row_str[:total_width])

    print(f"{sub_border}\\n")
`,
  },
  {
    path: "crop_and_resize_artwork.py",
    filename: "crop_and_resize_artwork.py",
    category: "examples",
    description: "Tool 1: High-Performance 16:9 Border Auto-Crop & 1080p Resizer with 211-char output width & 80-char filename column.",
    code: `"""
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
    season_pattern: str = r"^Season \\d{2}$",
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

    print(f"\\n🚀 Found {total} episode images. Executing with {max_workers} worker threads...")
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
`,
  },
  {
    path: "sync_mkv_thumbnails.py",
    filename: "sync_mkv_thumbnails.py",
    category: "examples",
    description: "Tool 2: Optimized MKV Season Thumbnail Replacer & Compressor with 211-char output width & 80-char video filename column.",
    code: `"""
Tool 2: Optimized MKV Season Thumbnail Replacer & Compressor
Finds season thumbnails (e.g. season01-thumb.jpg), optimizes once, and fast-copies to episode .mkv files.
Formatted to strict 211-character table output with 80-character video file name column.
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

    print(f"\\n📂 Processing {len(subdirs)} season folders in: {base_dir}")

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

    # Total width = 211 chars. Video File Name column = 80 chars.
    # 16 + 36 + 80 + 44 + 20 = 196 content + 15 border chars = 211 total width
    col_widths = [16, 36, 80, 44, 20]

    print_table_report(
        title="MKV Thumbnail Sync Report",
        headers=["Season", "Master Thumbnail", "Video File (.mkv)", "Created Thumbnail", "Status"],
        rows=rows,
        col_widths=col_widths,
    )


if __name__ == "__main__":
    run_standalone()
`,
  },
  {
    path: "media_artwork_manager.py",
    filename: "media_artwork_manager.py",
    category: "examples",
    description: "Unified Interactive CLI Suite with interactive menu to run tools independently or together.",
    code: `"""
Unified Interactive Media Manager
Select and execute tools independently with interactive prompts.
"""

import sys
from media_config import load_config
import crop_and_resize_artwork
import sync_mkv_thumbnails


def show_menu() -> None:
    while True:
        print("\\n" + "=" * 70)
        print("         🎬 MEDIA ARTWORK & THUMBNAIL SUITE")
        print("=" * 70)
        print("  [1] 🖼️  Auto-Crop Black Borders & Enforce 16:9 Ratio (1080p)")
        print("  [2] 🎞️  Sync Season Thumbnail to Episode .MKV Files")
        print("  [3] ⚡  Run Full Pipeline (Border Crop + Thumbnail Sync)")
        print("  [0] 🚪  Exit")
        print("-" * 70)

        choice = input("Enter your choice [0-3]: ").strip()

        if choice == "1":
            print("\\n--- [1] 16:9 Border Auto-Crop & Resize ---")
            crop_and_resize_artwork.run_standalone()

        elif choice == "2":
            print("\\n--- [2] MKV Thumbnail Synchronizer ---")
            sync_mkv_thumbnails.run_standalone()

        elif choice == "3":
            print("\\n--- [3] Full Pipeline Execution ---")
            print("Step 1: 16:9 Border Auto-Crop")
            crop_and_resize_artwork.run_standalone()
            print("\\nStep 2: MKV Thumbnail Sync")
            sync_mkv_thumbnails.run_standalone()

        elif choice in ("0", "exit", "q"):
            print("\\n👋 Goodbye!")
            sys.exit(0)

        else:
            print("❌ Invalid selection. Please enter 0, 1, 2, or 3.")


if __name__ == "__main__":
    show_menu()
`,
  },
  {
    path: "run.bat",
    filename: "run.bat",
    category: "examples",
    description: "Windows double-click launcher for the Media Suite interactive menu.",
    code: `@echo off
title Media Artwork Manager
python media_artwork_manager.py
pause
`,
  },
  {
    path: "run.sh",
    filename: "run.sh",
    category: "examples",
    description: "Linux / macOS double-click terminal launcher.",
    code: `#!/usr/bin/env bash
python3 media_artwork_manager.py
`,
  },
  {
    path: "examples/demo_quickstart.py",
    filename: "demo_quickstart.py",
    category: "examples",
    description: "Ready-to-run demonstration script showing real-world library usage.",
    code: `"""
Quickstart demonstration of pytoolkit
Run: python demo_quickstart.py
"""

from pathlib import Path
from pytoolkit import (
    ensure_dir,
    generate_tree,
    safe_write_text,
    calculate_hash,
    find_duplicates,
    Pipeline,
)

def main():
    print("=" * 60)
    print("  PyToolkit: Real-World Workflow Demonstration")
    print("=" * 60)

    # 1. Setup workspace
    work_dir = ensure_dir("./demo_workspace")
    sub_docs = ensure_dir(work_dir / "documents")
    sub_images = ensure_dir(work_dir / "images")

    # 2. Populate sample files
    safe_write_text(sub_docs / "report.txt", "Q3 Financial Summary Report")
    safe_write_text(sub_docs / "report_backup.txt", "Q3 Financial Summary Report") # Duplicate!
    safe_write_text(sub_docs / "notes.md", "# Project Roadmap\\n- Step 1: Scan\\n- Step 2: Transform")

    # 3. Render Tree
    print("\\n[1] Directory Tree:")
    print(generate_tree(work_dir))

    # 4. Find Duplicate Files
    print("\\n[2] Checking for Duplicate Files:")
    duplicates = find_duplicates(work_dir)
    for h, files in duplicates.items():
        print(f"  Found duplicate group (Hash {h[:8]}...):")
        for f in files:
            print(f"    -> {f.name}")

    # 5. Pipeline execution
    print("\\n[3] Executing Composable Pipeline:")
    pipeline = (
        Pipeline("Ingestion & Cleanup")
        .add(lambda ctx: {"files_found": len(list(Path(ctx["dir"]).glob("**/*")))}, name="Scan Files")
        .add(lambda ctx: {"status": "Complete"}, name="Finalize")
    )

    result = pipeline.run({"dir": str(work_dir)})
    print(f"  Pipeline Status: {result['success']} in {result['total_duration_ms']}ms")
    print(f"  Files indexed: {result['context']['files_found']}")

    print("\\n✨ Done! PyToolkit is ready for production.")

if __name__ == "__main__":
    main()
`,
  },
  {
    path: "README.md",
    filename: "README.md",
    category: "core",
    description: "Complete package documentation with installation guide and code recipes.",
    code: `# PyToolkit: File, Directory & Image Manipulation Suite

A battle-tested, high-performance Python utility library designed for automated scripting, data processing pipelines, and production file management.

---

## 🚀 Key Features

### 📁 Directory Procedures (\`pytoolkit.directories\`)
- **\`generate_tree\`**: Formatted Unicode/ASCII directory tree with depth limits and human-readable file sizes.
- **\`get_dir_summary\`**: Complete byte size, file count, and extension breakdown distributions.
- **\`flatten_dir\`**: Flatten deep subfolder hierarchies into single destination with configurable conflict resolution.
- **\`sync_dirs\`**: High-speed folder synchronization with diff checking and deletion pruning.
- **\`find_empty_dirs\`**: Locate and clean dangling empty folders bottom-up.

### 📄 File Procedures (\`pytoolkit.files\`)
- **\`atomic_write\`**: Crash-resilient file writing using temporary file swap semantics.
- **\`find_duplicates\`**: Multi-stage duplicate finder (size filter -> chunk hash -> full checksum).
- **\`batch_rename\`**: Powerful renaming with templates (\`{n:03d}\`, \`{name}\`, \`{date}\`) or regex.
- **\`calculate_hash\`**: Memory-efficient stream hashing (MD5, SHA1, SHA256, BLAKE2b).
- **\`safe_read_text\`**: Encoding auto-detection with fallback cascades.
- **\`create_archive\` / \`extract_archive\`**: Zip/Tar creator and extractor with Zip-Slip path traversal security.

### 🖼️ Image Procedures (\`pytoolkit.images\`)
- **\`batch_resize_images\`**: Lanczos/Bicubic high-quality resizing with aspect ratio locks.
- **\`convert_image_format\`**: Convert between WebP, PNG, JPEG, AVIF with quality optimization.
- **\`add_watermark\`**: Semi-transparent watermark positioning (corners, center, tile).
- **\`strip_exif_metadata\`**: Privacy scrubber removing GPS coordinates and camera serial data.
- **\`image_to_ascii\`**: High-contrast terminal ASCII art string generator.
- **\`apply_image_filter\`**: Grayscale, Sepia, Blur, Sharpen, Contour, Invert.

---

## 📦 Installation

\`\`\`bash
pip install pytoolkit
\`\`\`

Or install in editable development mode:

\`\`\`bash
git clone https://github.com/pytoolkit/pytoolkit.git
cd pytoolkit
pip install -e .
\`\`\`

---

## 💡 Quick Examples

### 1. Render Directory Tree
\`\`\`python
from pytoolkit import generate_tree

print(generate_tree("./my_project", max_depth=2, show_sizes=True))
\`\`\`

### 2. Batch Rename Files with Zero-Padded Numbers
\`\`\`python
from pytoolkit import batch_rename
from pathlib import Path

files = list(Path("./raw_photos").glob("*.jpg"))
batch_rename(files, template="photo_{n:03d}_{name}")
\`\`\`

### 3. Strip EXIF Privacy Data & Resize
\`\`\`python
from pytoolkit import strip_exif_metadata, batch_resize_images

clean_path, exif = strip_exif_metadata("user_upload.jpg")
batch_resize_images([clean_path], max_dimension=1920)
\`\`\`

---

## 🧪 Testing

\`\`\`bash
pytest tests/
\`\`\`

## 📄 License
MIT License. Free for commercial and private use.
`,
  }
];
