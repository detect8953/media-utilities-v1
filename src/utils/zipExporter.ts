import JSZip from 'jszip';
import { PYTHON_LIBRARY_FILES, PYTHON_PACKAGE_NAME } from '../data/pythonLibraryCode';

export async function downloadPythonPackageZip(): Promise<void> {
  const zip = new JSZip();
  const rootFolder = zip.folder(PYTHON_PACKAGE_NAME) || zip;

  for (const file of PYTHON_LIBRARY_FILES) {
    rootFolder.file(file.path, file.code);
  }

  // Generate binary zip
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${PYTHON_PACKAGE_NAME}-1.0.0.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadSingleFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
