"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowStatus = exports.BlockchainType = void 0;
var BlockchainType;
(function (BlockchainType) {
    BlockchainType["TRON"] = "TRON";
    BlockchainType["BSC"] = "BSC";
})(BlockchainType || (exports.BlockchainType = BlockchainType = {}));
var EscrowStatus;
(function (EscrowStatus) {
    EscrowStatus["CREATED"] = "CREATED";
    EscrowStatus["FUNDED"] = "FUNDED";
    EscrowStatus["RELEASED"] = "RELEASED";
    EscrowStatus["REFUNDED"] = "REFUNDED";
})(EscrowStatus || (exports.EscrowStatus = EscrowStatus = {}));
//# sourceMappingURL=blockchain.interface.js.map