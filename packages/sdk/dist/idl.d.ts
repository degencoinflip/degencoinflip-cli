export declare const IDL: {
    readonly version: "1.0.0";
    readonly name: "dcf";
    readonly instructions: readonly [{
        readonly name: "seed";
        readonly accounts: readonly [{
            readonly name: "initializer";
            readonly isMut: true;
            readonly isSigner: true;
        }, {
            readonly name: "authority";
            readonly isMut: false;
            readonly isSigner: false;
        }, {
            readonly name: "coldHouse";
            readonly isMut: false;
            readonly isSigner: false;
        }, {
            readonly name: "houseTreasury";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "houseState";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "systemProgram";
            readonly isMut: false;
            readonly isSigner: false;
        }, {
            readonly name: "rent";
            readonly isMut: false;
            readonly isSigner: false;
        }];
        readonly args: readonly [{
            readonly name: "initializerAmount";
            readonly type: "u64";
        }];
    }, {
        readonly name: "invigorate";
        readonly accounts: readonly [{
            readonly name: "initializer";
            readonly isMut: false;
            readonly isSigner: false;
        }, {
            readonly name: "authority";
            readonly isMut: false;
            readonly isSigner: false;
        }, {
            readonly name: "coldHouse";
            readonly isMut: false;
            readonly isSigner: false;
        }, {
            readonly name: "payer";
            readonly isMut: true;
            readonly isSigner: true;
        }, {
            readonly name: "houseTreasury";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "houseState";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "systemProgram";
            readonly isMut: false;
            readonly isSigner: false;
        }, {
            readonly name: "rent";
            readonly isMut: false;
            readonly isSigner: false;
        }];
        readonly args: readonly [{
            readonly name: "topUpAmount";
            readonly type: "u64";
        }];
    }, {
        readonly name: "participate";
        readonly accounts: readonly [{
            readonly name: "degenerate";
            readonly isMut: true;
            readonly isSigner: true;
        }, {
            readonly name: "initializer";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "authority";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "coldHouse";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "houseTreasury";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "houseState";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "degenerateAccount";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "rewardsAccount";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "systemProgram";
            readonly isMut: false;
            readonly isSigner: false;
        }, {
            readonly name: "instructions";
            readonly isMut: false;
            readonly isSigner: false;
        }];
        readonly args: readonly [{
            readonly name: "degenAmount";
            readonly type: "u64";
        }];
    }, {
        readonly name: "consensus";
        readonly accounts: readonly [{
            readonly name: "degenerate";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "initializer";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "authority";
            readonly isMut: true;
            readonly isSigner: true;
        }, {
            readonly name: "coldHouse";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "houseTreasury";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "houseState";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "degenerateAccount";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "rewardsAccount";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "systemProgram";
            readonly isMut: false;
            readonly isSigner: false;
        }, {
            readonly name: "instructions";
            readonly isMut: false;
            readonly isSigner: false;
        }];
        readonly args: readonly [{
            readonly name: "side";
            readonly type: "bool";
        }, {
            readonly name: "result";
            readonly type: "bool";
        }, {
            readonly name: "amount";
            readonly type: "u64";
        }];
    }, {
        readonly name: "reveal";
        readonly accounts: readonly [{
            readonly name: "degenerate";
            readonly isMut: true;
            readonly isSigner: true;
        }, {
            readonly name: "initializer";
            readonly isMut: false;
            readonly isSigner: false;
        }, {
            readonly name: "authority";
            readonly isMut: false;
            readonly isSigner: false;
        }, {
            readonly name: "coldHouse";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "houseState";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "rewardsAccount";
            readonly isMut: true;
            readonly isSigner: false;
        }, {
            readonly name: "systemProgram";
            readonly isMut: false;
            readonly isSigner: false;
        }, {
            readonly name: "instructions";
            readonly isMut: false;
            readonly isSigner: false;
        }];
        readonly args: readonly [];
    }];
    readonly accounts: readonly [{
        readonly name: "HouseStateAccount";
        readonly type: {
            readonly kind: "struct";
            readonly fields: readonly [{
                readonly name: "initializerKey";
                readonly type: "publicKey";
            }, {
                readonly name: "authorityKey";
                readonly type: "publicKey";
            }, {
                readonly name: "coldHouseKey";
                readonly type: "publicKey";
            }];
        };
    }];
    readonly metadata: {
        readonly address: "BmjJ85zsP2xHPesBKpmHYKt136gzeTtNbeVDcdfybHHT";
    };
};
