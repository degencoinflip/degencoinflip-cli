export declare function getNonce(walletId: string, referral?: string): Promise<{
    nonce: string;
}>;
export declare function authorize(walletId: string, signatureBase64: string): Promise<{
    username: string;
    idToken: string;
    exp: number;
    status: string;
}>;
export declare function getCoinFlip(token: string): Promise<any>;
export declare function getCoinFlipById(id: string, token: string): Promise<any>;
export declare function createCoinFlip(coinFlip: {
    side: string;
    amount: number;
    mode?: string;
    isMobile?: boolean;
}, token: string): Promise<any>;
export declare function processCoinFlipWithMemo(id: string, signature: string, token: string): Promise<any>;
