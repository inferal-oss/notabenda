import { copyFile, chmod, mkdir, readdir } from 'node:fs/promises';
await copyFile(new URL('../src/styles.css', import.meta.url), new URL('../dist/styles.css', import.meta.url));
await chmod(new URL('../dist/cli.js', import.meta.url), 0o755);
await mkdir(new URL('../dist/astro/',import.meta.url),{recursive:true});
for(const file of await readdir(new URL('../src/astro/',import.meta.url)))if(file.endsWith('.astro'))await copyFile(new URL('../src/astro/'+file,import.meta.url),new URL('../dist/astro/'+file,import.meta.url));
