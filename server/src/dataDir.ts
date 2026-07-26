import path from 'path';

// DATA_DIR lets deployments point JSON storage at a mounted persistent
// volume (e.g. Fly.io `/data`) instead of the source tree's data/ folder.
export function dataFilePath(filename: string): string {
  const dir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
  return path.join(dir, filename);
}
