export declare class DcfError extends Error {
    readonly hint?: string | undefined;
    readonly exitCode: number;
    constructor(message: string, hint?: string | undefined, exitCode?: number);
    format(): string;
}
export declare const Errors: {
    readonly noKeypair: () => DcfError;
    readonly insufficientBalance: (need: number, have: number) => DcfError;
    readonly invalidSide: (side: string) => DcfError;
    readonly invalidAmount: (amount: number, min: number, max: number) => DcfError;
    readonly depositFailed: (detail?: string) => DcfError;
    readonly claimFailed: (detail?: string) => DcfError;
    readonly timeout: (seconds: number) => DcfError;
    readonly authFailed: (detail?: string) => DcfError;
    readonly apiFailed: (method: string, detail?: string) => DcfError;
    readonly nothingToResume: () => DcfError;
};
