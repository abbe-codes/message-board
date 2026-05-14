import { resolve } from 'node:path';

export const envFilePaths = [
  resolve(__dirname, '..', '..', '.env'),
  resolve(__dirname, '..', '..', '..', '..', '.env'),
];
