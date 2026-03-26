"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findHouseTreasury = findHouseTreasury;
exports.findHouseState = findHouseState;
exports.findDegenerateAccount = findDegenerateAccount;
exports.findRewardsAccount = findRewardsAccount;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("./constants");
async function findHouseTreasury(initializer = constants_1.INITIALIZER_ID, authority = (0, constants_1.getAuthorityId)(), coldHouse = constants_1.COLD_HOUSE_ID) {
    return web3_js_1.PublicKey.findProgramAddress([Buffer.from(constants_1.SEEDS.HOUSE_TREASURY), initializer.toBuffer(), authority.toBuffer(), coldHouse.toBuffer()], constants_1.PROGRAM_ID);
}
async function findHouseState(initializer = constants_1.INITIALIZER_ID, authority = (0, constants_1.getAuthorityId)(), coldHouse = constants_1.COLD_HOUSE_ID) {
    return web3_js_1.PublicKey.findProgramAddress([Buffer.from(constants_1.SEEDS.HOUSE_STATE), initializer.toBuffer(), authority.toBuffer(), coldHouse.toBuffer()], constants_1.PROGRAM_ID);
}
async function findDegenerateAccount(player, initializer = constants_1.INITIALIZER_ID, authority = (0, constants_1.getAuthorityId)(), coldHouse = constants_1.COLD_HOUSE_ID) {
    return web3_js_1.PublicKey.findProgramAddress([Buffer.from(constants_1.SEEDS.DEGENERATE), player.toBuffer(), initializer.toBuffer(), authority.toBuffer(), coldHouse.toBuffer()], constants_1.PROGRAM_ID);
}
async function findRewardsAccount(player, initializer = constants_1.INITIALIZER_ID, authority = (0, constants_1.getAuthorityId)(), coldHouse = constants_1.COLD_HOUSE_ID) {
    return web3_js_1.PublicKey.findProgramAddress([Buffer.from(constants_1.SEEDS.REWARDS), player.toBuffer(), initializer.toBuffer(), authority.toBuffer(), coldHouse.toBuffer()], constants_1.PROGRAM_ID);
}
