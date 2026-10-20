import {copyFile} from 'node:fs/promises';
await copyFile(new URL('../../../LICENSE',import.meta.url),new URL('../LICENSE',import.meta.url));

// @requirements REQ-PRODUCT-AUTHORED-PREVIEW
await copyFile(new URL('../src/preview.css',import.meta.url),new URL('../dist/preview.css',import.meta.url));
