import { readFile } from 'node:fs/promises';
export async function fixture({ reviewed = false } = {}) {
  const config = JSON.parse(await readFile(new URL('../../../examples/static/notabenda.config.json', import.meta.url), 'utf8'));
  // A synthetic review declaration exercises the workflow; it is not legal review.
  if (reviewed) for (const doc of Object.values(config.documents)) doc.review.status = 'reviewed';
  return config;
}
