// Browser shim for 'path'
export function join(...args: string[]): string {
  return args.join('/');
}
export default { join };
