import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const distRoot = resolve(projectRoot, 'dist');
const distAssets = resolve(distRoot, 'assets');
const publicAssets = resolve(projectRoot, 'assets');

await mkdir(publicAssets, { recursive: true });

for (const filename of await readdir(publicAssets)) {
  if (filename.startsWith('surkove-')) {
    await rm(resolve(publicAssets, filename), { force: true });
  }
}

for (const filename of await readdir(distAssets)) {
  await copyFile(resolve(distAssets, filename), resolve(publicAssets, filename));
}

await copyFile(resolve(distRoot, 'index.html'), resolve(projectRoot, 'index.html'));
console.log('Static production build copied to the repository root.');
