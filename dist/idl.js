"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDL = void 0;
// DCF program IDL — extracted from app/src/interfaces/idl_dcf_23.json
exports.IDL = {
    version: '1.0.0',
    name: 'dcf',
    instructions: [
        {
            name: 'seed',
            accounts: [
                { name: 'initializer', isMut: true, isSigner: true },
                { name: 'authority', isMut: false, isSigner: false },
                { name: 'coldHouse', isMut: false, isSigner: false },
                { name: 'houseTreasury', isMut: true, isSigner: false },
                { name: 'houseState', isMut: true, isSigner: false },
                { name: 'systemProgram', isMut: false, isSigner: false },
                { name: 'rent', isMut: false, isSigner: false },
            ],
            args: [{ name: 'initializerAmount', type: 'u64' }],
        },
        {
            name: 'invigorate',
            accounts: [
                { name: 'initializer', isMut: false, isSigner: false },
                { name: 'authority', isMut: false, isSigner: false },
                { name: 'coldHouse', isMut: false, isSigner: false },
                { name: 'payer', isMut: true, isSigner: true },
                { name: 'houseTreasury', isMut: true, isSigner: false },
                { name: 'houseState', isMut: true, isSigner: false },
                { name: 'systemProgram', isMut: false, isSigner: false },
                { name: 'rent', isMut: false, isSigner: false },
            ],
            args: [{ name: 'topUpAmount', type: 'u64' }],
        },
        {
            name: 'participate',
            accounts: [
                { name: 'degenerate', isMut: true, isSigner: true },
                { name: 'initializer', isMut: true, isSigner: false },
                { name: 'authority', isMut: true, isSigner: false },
                { name: 'coldHouse', isMut: true, isSigner: false },
                { name: 'houseTreasury', isMut: true, isSigner: false },
                { name: 'houseState', isMut: true, isSigner: false },
                { name: 'degenerateAccount', isMut: true, isSigner: false },
                { name: 'rewardsAccount', isMut: true, isSigner: false },
                { name: 'systemProgram', isMut: false, isSigner: false },
                { name: 'instructions', isMut: false, isSigner: false },
            ],
            args: [{ name: 'degenAmount', type: 'u64' }],
        },
        {
            name: 'consensus',
            accounts: [
                { name: 'degenerate', isMut: true, isSigner: false },
                { name: 'initializer', isMut: true, isSigner: false },
                { name: 'authority', isMut: true, isSigner: true },
                { name: 'coldHouse', isMut: true, isSigner: false },
                { name: 'houseTreasury', isMut: true, isSigner: false },
                { name: 'houseState', isMut: true, isSigner: false },
                { name: 'degenerateAccount', isMut: true, isSigner: false },
                { name: 'rewardsAccount', isMut: true, isSigner: false },
                { name: 'systemProgram', isMut: false, isSigner: false },
                { name: 'instructions', isMut: false, isSigner: false },
            ],
            args: [
                { name: 'side', type: 'bool' },
                { name: 'result', type: 'bool' },
                { name: 'amount', type: 'u64' },
            ],
        },
        {
            name: 'reveal',
            accounts: [
                { name: 'degenerate', isMut: true, isSigner: true },
                { name: 'initializer', isMut: false, isSigner: false },
                { name: 'authority', isMut: false, isSigner: false },
                { name: 'coldHouse', isMut: true, isSigner: false },
                { name: 'houseState', isMut: true, isSigner: false },
                { name: 'rewardsAccount', isMut: true, isSigner: false },
                { name: 'systemProgram', isMut: false, isSigner: false },
                { name: 'instructions', isMut: false, isSigner: false },
            ],
            args: [],
        },
    ],
    accounts: [
        {
            name: 'HouseStateAccount',
            type: {
                kind: 'struct',
                fields: [
                    { name: 'initializerKey', type: 'publicKey' },
                    { name: 'authorityKey', type: 'publicKey' },
                    { name: 'coldHouseKey', type: 'publicKey' },
                ],
            },
        },
    ],
    metadata: {
        address: 'BmjJ85zsP2xHPesBKpmHYKt136gzeTtNbeVDcdfybHHT',
    },
};
