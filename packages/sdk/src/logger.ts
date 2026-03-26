let _verbose = false;
let _quiet = false;
export function setVerbose(v: boolean) { _verbose = v; }
export function setQuiet(q: boolean) { _quiet = q; }
export function verboseLog(msg: string) { if (_verbose && !_quiet) console.error(`[verbose] ${msg}`); }
export function log(msg: string) { if (!_quiet) console.error(msg); }
