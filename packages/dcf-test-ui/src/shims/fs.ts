// Browser shim for 'fs' — SDK's loadKeypair uses require('fs') but we bypass it
export function readFileSync(): never {
  throw new Error('fs.readFileSync not available in browser');
}
export function writeFileSync(): void {}
export function mkdirSync(): void {}
export function existsSync(): boolean { return false; }
export default { readFileSync, writeFileSync, mkdirSync, existsSync };
