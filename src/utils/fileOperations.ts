/**
 * In-browser Virtual File System and File Operations Engine for PyToolkit Interactive Workbench
 */

export interface VFSNode {
  name: string;
  type: 'file' | 'dir';
  size?: number; // bytes
  content?: string;
  children?: VFSNode[];
  modified?: string;
  hash?: string;
}

export const SAMPLE_VFS: VFSNode = {
  name: "project_root",
  type: "dir",
  children: [
    {
      name: "src",
      type: "dir",
      children: [
        { name: "__init__.py", type: "file", size: 420, content: "# pytoolkit package" },
        { name: "directories.py", type: "file", size: 8412, content: "def generate_tree(): ..." },
        { name: "files.py", type: "file", size: 10240, content: "def atomic_write(): ..." },
        { name: "images.py", type: "file", size: 14200, content: "def batch_resize(): ..." },
      ]
    },
    {
      name: "assets",
      type: "dir",
      children: [
        {
          name: "raw_photos",
          type: "dir",
          children: [
            { name: "DSC_0042.jpg", type: "file", size: 3450000, hash: "a8f3b2c1" },
            { name: "DSC_0043.jpg", type: "file", size: 4120000, hash: "d9e4c5b2" },
            { name: "DSC_0042_copy.jpg", type: "file", size: 3450000, hash: "a8f3b2c1" }, // Duplicate!
          ]
        },
        {
          name: "icons",
          type: "dir",
          children: [
            { name: "logo.png", type: "file", size: 45000 },
            { name: "favicon.ico", type: "file", size: 15200 },
          ]
        },
        {
          name: "temp_cache",
          type: "dir",
          children: [] // Empty dir for testing
        }
      ]
    },
    {
      name: "docs",
      type: "dir",
      children: [
        { name: "index.md", type: "file", size: 2400, content: "# Documentation" },
        { name: "api_spec.yaml", type: "file", size: 6800, content: "openapi: 3.0.0" },
        {
          name: "legacy_drafts",
          type: "dir",
          children: [
            { name: "draft_v1.txt", type: "file", size: 1200 },
            { name: "draft_v1_backup.txt", type: "file", size: 1200, hash: "7c2b8a10" },
            { name: "draft_v1_old.txt", type: "file", size: 1200, hash: "7c2b8a10" }, // Duplicate!
          ]
        }
      ]
    },
    { name: "pyproject.toml", type: "file", size: 980 },
    { name: "README.md", type: "file", size: 3400 },
    { name: ".gitignore", type: "file", size: 150 },
  ]
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export interface TreeOptions {
  maxDepth?: number;
  showHidden?: boolean;
  showSizes?: boolean;
  filterPattern?: string;
}

export function generateAsciiTree(node: VFSNode, options: TreeOptions = {}): string {
  const { maxDepth = 4, showHidden = false, showSizes = true, filterPattern = '' } = options;
  const lines: string[] = [`📁 ${node.name}/`];

  function matchesFilter(name: string): boolean {
    if (!filterPattern) return true;
    const lower = name.toLowerCase();
    const pat = filterPattern.toLowerCase().replace(/\*/g, '');
    return lower.includes(pat);
  }

  function walk(current: VFSNode, prefix: string, depth: number) {
    if (depth > maxDepth || !current.children) return;

    let entries = [...current.children];
    if (!showHidden) {
      entries = entries.filter(e => !e.name.startsWith('.'));
    }

    // Sort: directories first, then alphabetically
    entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const total = entries.length;
    entries.forEach((entry, idx) => {
      const isLast = idx === total - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = isLast ? '    ' : '│   ';

      if (entry.type === 'dir') {
        lines.push(`${prefix}${connector}📁 ${entry.name}/`);
        walk(entry, prefix + childPrefix, depth + 1);
      } else {
        if (matchesFilter(entry.name)) {
          const sizeStr = showSizes && entry.size ? ` (${formatBytes(entry.size)})` : '';
          lines.push(`${prefix}${connector}📄 ${entry.name}${sizeStr}`);
        }
      }
    });
  }

  walk(node, '', 1);
  return lines.join('\n');
}

export interface VFSSummary {
  totalFiles: number;
  totalDirs: number;
  totalBytes: number;
  humanSize: string;
  extensionCounts: Record<string, number>;
  extensionBytes: Record<string, number>;
  emptyDirs: string[];
}

export function calculateVFSSummary(root: VFSNode): VFSSummary {
  let totalFiles = 0;
  let totalDirs = 0;
  let totalBytes = 0;
  const extensionCounts: Record<string, number> = {};
  const extensionBytes: Record<string, number> = {};
  const emptyDirs: string[] = [];

  function traverse(node: VFSNode, currentPath: string) {
    if (node.type === 'dir') {
      totalDirs++;
      if (!node.children || node.children.length === 0) {
        emptyDirs.push(currentPath);
      } else {
        node.children.forEach(child => traverse(child, `${currentPath}/${child.name}`));
      }
    } else {
      totalFiles++;
      const sz = node.size || 0;
      totalBytes += sz;
      const ext = node.name.includes('.') ? `.${node.name.split('.').pop()?.toLowerCase()}` : '[no ext]';
      extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
      extensionBytes[ext] = (extensionBytes[ext] || 0) + sz;
    }
  }

  traverse(root, root.name);

  return {
    totalFiles,
    totalDirs,
    totalBytes,
    humanSize: formatBytes(totalBytes),
    extensionCounts,
    extensionBytes,
    emptyDirs,
  };
}

export interface FlattenedFile {
  originalPath: string;
  flatName: string;
  size: number;
}

export function simulateFlatten(root: VFSNode, separator = '_'): FlattenedFile[] {
  const result: FlattenedFile[] = [];

  function traverse(node: VFSNode, pathSegments: string[]) {
    if (node.type === 'file') {
      const flatName = pathSegments.join(separator);
      result.push({
        originalPath: pathSegments.join('/'),
        flatName,
        size: node.size || 0,
      });
    } else if (node.children) {
      node.children.forEach(child => {
        traverse(child, [...pathSegments, child.name]);
      });
    }
  }

  if (root.children) {
    root.children.forEach(child => traverse(child, [child.name]));
  }

  return result;
}

export interface RenamePlanItem {
  original: string;
  renamed: string;
  status: 'ok' | 'clash' | 'unchanged';
}

export function previewBatchRename(
  filenames: string[],
  options: {
    template?: string; // e.g. "photo_{n:03d}_{name}"
    findPattern?: string;
    replaceWith?: string;
    isRegex?: boolean;
    caseTransform?: 'none' | 'lowercase' | 'uppercase' | 'slugify';
    startIndex?: number;
  }
): RenamePlanItem[] {
  const { template, findPattern, replaceWith = '', isRegex = false, caseTransform = 'none', startIndex = 1 } = options;
  const plan: RenamePlanItem[] = [];
  const seen = new Set<string>();

  filenames.forEach((original, idx) => {
    const counter = startIndex + idx;
    const lastDot = original.lastIndexOf('.');
    const stem = lastDot !== -1 ? original.substring(0, lastDot) : original;
    const ext = lastDot !== -1 ? original.substring(lastDot + 1) : '';
    const suffix = ext ? `.${ext}` : '';

    let transformedName = original;

    if (template && template.trim()) {
      let templated = template;
      // Replace counter tokens: {n}, {n:02d}, {n:03d}, {n:04d}
      templated = templated.replace(/\{n:0(\d+)d\}/g, (_, digits) => String(counter).padStart(parseInt(digits, 10), '0'));
      templated = templated.replace(/\{n\}/g, String(counter));
      templated = templated.replace(/\{name\}/g, stem);
      templated = templated.replace(/\{ext\}/g, ext);
      templated = templated.replace(/\{suffix\}/g, suffix);
      templated = templated.replace(/\{date\}/g, new Date().toISOString().slice(0, 10).replace(/-/g, ''));

      // If extension not in template and not appended, append original suffix
      if (!templated.endsWith(suffix) && suffix && !template.includes('{ext}') && !template.includes('{suffix}')) {
        templated += suffix;
      }
      transformedName = templated;
    } else if (findPattern) {
      if (isRegex) {
        try {
          const reg = new RegExp(findPattern, 'g');
          transformedName = original.replace(reg, replaceWith);
        } catch {
          transformedName = original;
        }
      } else {
        transformedName = original.split(findPattern).join(replaceWith);
      }
    }

    if (caseTransform === 'lowercase') {
      transformedName = transformedName.toLowerCase();
    } else if (caseTransform === 'uppercase') {
      transformedName = transformedName.toUpperCase();
    } else if (caseTransform === 'slugify') {
      const parts = transformedName.split('.');
      const fileExt = parts.length > 1 ? parts.pop() : '';
      const base = parts.join('.');
      const slug = base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      transformedName = fileExt ? `${slug}.${fileExt}` : slug;
    }

    const isClash = seen.has(transformedName);
    seen.add(transformedName);

    plan.push({
      original,
      renamed: transformedName,
      status: isClash ? 'clash' : (transformedName === original ? 'unchanged' : 'ok')
    });
  });

  return plan;
}

export async function computeFileCryptoHash(file: File, algorithm: 'SHA-256' | 'SHA-1' | 'MD5'): Promise<string> {
  const buffer = await file.arrayBuffer();
  if (algorithm === 'MD5') {
    // Simple quick fallback hash for MD5 simulation
    let hash = 0;
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      hash = (hash << 5) - hash + bytes[i];
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
  }

  const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
