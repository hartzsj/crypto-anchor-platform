"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TronAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const tronweb_1 = __importDefault(require("tronweb"));
const blockchain_interface_1 = require("./blockchain.interface");
const TronWeb = tronweb_1.default;
let TronAdapter = class TronAdapter {
    configService;
    tronWeb;
    contract;
    config;
    constructor(configService) {
        this.configService = configService;
        this.config = {
            name: blockchain_interface_1.BlockchainType.TRON,
            displayName: 'TRON (TRC-20)',
            chainId: null,
            rpcUrl: configService.get('TRON_RPC_URL', 'https://api.trongrid.io'),
            escrowContractAddress: configService.get('TRON_ESCROW_ADDRESS', ''),
            escrowContractAbi: null,
        };
    }
    async onModuleInit() {
        this.tronWeb = TronWeb.createInstance({
            fullHost: this.config.rpcUrl,
            privateKey: this.configService.get('TRON_PRIVATE_KEY', ''),
        });
        if (this.config.escrowContractAddress) {
            const abi = await this.loadContractAbi();
            this.contract = await this.tronWeb.contract(abi, this.config.escrowContractAddress);
        }
    }
    async loadContractAbi() {
        return [
            {
                name: 'createOrder',
                inputs: [
                    { name: '_orderId', type: 'bytes32' },
                    { name: '_buyer', type: 'address' },
                    { name: '_seller', type: 'address' },
                    { name: '_amount', type: 'uint256' },
                    { name: '_token', type: 'address' },
                ],
                outputs: [],
            },
            {
                name: 'fundOrder',
                inputs: [{ name: '_orderId', type: 'bytes32' }],
                outputs: [],
            },
            {
                name: 'release',
                inputs: [{ name: '_orderId', type: 'bytes32' }],
                outputs: [],
            },
            {
                name: 'refund',
                inputs: [{ name: '_orderId', type: 'bytes32' }],
                outputs: [],
            },
            {
                name: 'getOrder',
                inputs: [{ name: '_orderId', type: 'bytes32' }],
                outputs: [
                    { name: 'buyer', type: 'address' },
                    { name: 'seller', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                    { name: 'token', type: 'address' },
                    { name: 'status', type: 'uint8' },
                    { name: 'createdAt', type: 'uint256' },
                    { name: 'fundedAt', type: 'uint256' },
                ],
            },
            {
                name: 'getOrderStatus',
                inputs: [{ name: '_orderId', type: 'bytes32' }],
                outputs: [{ name: '', type: 'uint8' }],
            },
        ];
    }
    getNetworkName() {
        return blockchain_interface_1.BlockchainType.TRON;
    }
    getChainId() {
        return null;
    }
    async createEscrowOrder(orderId, buyerAddress, sellerAddress, amount, token) {
        if (!this.contract) {
            throw new Error('Escrow contract not initialized');
        }
        const buyerHex = this.tronWeb.address.toHex(buyerAddress);
        const sellerHex = this.tronWeb.address.toHex(sellerAddress);
        const tokenHex = token.isNative ? '0x0000000000000000000000000000000000000000' : this.tronWeb.address.toHex(token.contractAddress);
        const orderIdHex = this.tronWeb.utils.bytes.bytes32ToHex(orderId);
        const tx = await this.contract.createOrder(orderIdHex, buyerHex, sellerHex, this.tronWeb.utils.toSun(amount), tokenHex).send({
            feeLimit: 100_000_000,
        });
        return {
            escrowId: orderId,
            txHash: tx,
        };
    }
    async fundEscrowOrder(orderId, buyerAddress, amount, token) {
        if (!this.contract) {
            throw new Error('Escrow contract not initialized');
        }
        const orderIdHex = this.tronWeb.utils.bytes.bytes32ToHex(orderId);
        const amountSun = this.tronWeb.utils.toSun(amount);
        if (token.isNative) {
            const tx = await this.contract.fundOrder(orderIdHex).send({
                callValue: amountSun,
                feeLimit: 100_000_000,
            });
            return { txHash: tx };
        }
        else {
            throw new Error('TRC-20 token funding requires approval first');
        }
    }
    async releaseEscrow(orderId) {
        if (!this.contract) {
            throw new Error('Escrow contract not initialized');
        }
        const orderIdHex = this.tronWeb.utils.bytes.bytes32ToHex(orderId);
        const tx = await this.contract.release(orderIdHex).send({
            feeLimit: 100_000_000,
        });
        return { txHash: tx };
    }
    async refundEscrow(orderId) {
        if (!this.contract) {
            throw new Error('Escrow contract not initialized');
        }
        const orderIdHex = this.tronWeb.utils.bytes.bytes32ToHex(orderId);
        const tx = await this.contract.refund(orderIdHex).send({
            feeLimit: 100_000_000,
        });
        return { txHash: tx };
    }
    async getEscrowOrder(orderId) {
        if (!this.contract) {
            throw new Error('Escrow contract not initialized');
        }
        const orderIdHex = this.tronWeb.utils.bytes.bytes32ToHex(orderId);
        const result = await this.contract.getOrder(orderIdHex).call();
        return {
            orderId,
            buyerAddress: this.tronWeb.address.fromHex(result.buyer),
            sellerAddress: this.tronWeb.address.fromHex(result.seller),
            amount: this.tronWeb.utils.fromSun(result.amount),
            tokenAddress: result.token === '0x0000000000000000000000000000000000000000'
                ? 'TRX'
                : this.tronWeb.address.fromHex(result.token),
            status: this.parseEscrowStatus(result.status),
            createdAt: Number(result.createdAt),
            fundedAt: Number(result.fundedAt),
        };
    }
    async getEscrowStatus(orderId) {
        if (!this.contract) {
            throw new Error('Escrow contract not initialized');
        }
        const orderIdHex = this.tronWeb.utils.bytes.bytes32ToHex(orderId);
        const status = await this.contract.getOrderStatus(orderIdHex).call();
        return this.parseEscrowStatus(status);
    }
    async getBalance(address, token) {
        if (token.isNative) {
            const balance = await this.tronWeb.trx.getBalance(address);
            return this.tronWeb.utils.fromSun(balance);
        }
        else {
            const tokenContract = await this.tronWeb.contract().at(token.contractAddress);
            const balance = await tokenContract.balanceOf(address).call();
            return this.tronWeb.utils.fromSun(balance);
        }
    }
    isValidAddress(address) {
        return this.tronWeb.utils.validation.isValidAddress(address);
    }
    async getTransaction(txHash) {
        const tx = await this.tronWeb.trx.getTransactionInfo(txHash);
        if (!tx || !tx.blockNumber) {
            return {
                status: 'pending',
                blockNumber: null,
                timestamp: null,
            };
        }
        const block = await this.tronWeb.trx.getBlockByNumber(tx.blockNumber);
        return {
            status: 'confirmed',
            blockNumber: Number(tx.blockNumber),
            timestamp: Number(block.block_header.raw_data.timestamp),
        };
    }
    parseEscrowStatus(status) {
        switch (status) {
            case 0:
                return blockchain_interface_1.EscrowStatus.CREATED;
            case 1:
                return blockchain_interface_1.EscrowStatus.FUNDED;
            case 2:
                return blockchain_interface_1.EscrowStatus.RELEASED;
            case 3:
                return blockchain_interface_1.EscrowStatus.REFUNDED;
            default:
                throw new Error(`Unknown escrow status: ${status}`);
        }
    }
};
exports.TronAdapter = TronAdapter;
exports.TronAdapter = TronAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TronAdapter);
//# sourceMappingURL=tron.adapter.js.map