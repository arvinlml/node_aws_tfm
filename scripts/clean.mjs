import { rm } from 'fs/promises';

await rm('dist', { recursive: true, force: true });
await rm('coverage', { recursive: true, force: true });
await rm('.nyc_output', { recursive: true, force: true });