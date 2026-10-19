import { lstat, mkdir, rename, writeFile, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';

/** @requirements REQ-PRODUCT-SAFE-CONTENT REQ-EU-GUARANTEE-LABEL: no traversal, symlink following, or recursive deletion. */
export async function writeBuildFiles(outputDirectory: string, files: Record<string, string | Uint8Array>): Promise<void> {
  const root = resolve(outputDirectory);
  async function safeDirectory(directory: string): Promise<void> {
    const parent = dirname(directory);
    if (directory !== root && parent !== directory) await safeDirectory(parent);
    try {
      const info = await lstat(directory);
      if (info.isSymbolicLink() || !info.isDirectory()) throw new Error('Output directories must be ordinary directories, not symbolic links.');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      await mkdir(directory);
    }
  }
  // Validate every path before creating or replacing files.
  for (const file of Object.keys(files)) {
    const target = resolve(root, file);
    if (isAbsolute(file) || file.includes('\\') || !target.startsWith(root + sep)) throw new Error('Build output path escapes its directory.');
  }
  // Ancestors outside the chosen output root can include OS aliases such as /tmp.
  // The root itself and every directory beneath it must not be symbolic links.
  await mkdir(dirname(root), { recursive: true });
  for (const [file, content] of Object.entries(files)) {
    const target = join(root, file);
    await safeDirectory(dirname(target));
    try { if ((await lstat(target)).isSymbolicLink()) throw new Error('Refusing to replace a symbolic-link output file.'); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    const temporary = join(dirname(target), `.notabenda-${randomUUID()}.tmp`);
    try { await writeFile(temporary, content, { flag: 'wx' }); await rename(temporary, target); }
    finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
  }
}
