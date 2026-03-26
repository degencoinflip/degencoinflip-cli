"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setVerbose = setVerbose;
exports.setQuiet = setQuiet;
exports.verboseLog = verboseLog;
exports.log = log;
let _verbose = false;
let _quiet = false;
function setVerbose(v) { _verbose = v; }
function setQuiet(q) { _quiet = q; }
function verboseLog(msg) { if (_verbose && !_quiet)
    console.error(`[verbose] ${msg}`); }
function log(msg) { if (!_quiet)
    console.error(msg); }
