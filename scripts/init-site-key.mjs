import { randomBytes } from 'node:crypto';
import { open, chmod, lstat, readFile } from 'node:fs/promises';
// Never print credentials. This host-only file is git-ignored and outside the asset directory.
const path = new URL('../site/.dev.vars',import.meta.url);
let file;
try {
  file=await open(path,'wx',0o600);
  await file.writeFile(`ADMIN_KEY=${randomBytes(32).toString('hex')}\n`);
  console.log('Created git-ignored site/.dev.vars with a random local admin key.');
} catch(error) {
  if(error.code !== 'EEXIST') throw error;
  if(!(await lstat(path)).isFile() || !/^ADMIN_KEY=[a-f0-9]{64}$/mu.test(await readFile(path,'utf8'))) throw new Error('The local key file must be an ordinary file containing a valid ADMIN_KEY.');
  await chmod(path,0o600); console.log('Keeping the existing git-ignored local admin key.');
} finally { await file?.close(); }
