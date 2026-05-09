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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BscAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ethers_1 = require("ethers");
const blockchain_interface_1 = require("./blockchain.interface");
let BscAdapter = class BscAdapter {
    configService;
    provider;
    wallet;
    contract;
    config;
    constructor(configService) {
        this.configService = configService;
        this.config = {
            name: blockchain_interface_1.BlockchainType.BSC,
            displayName: 'BSC (BEP-20)',
            chainId: '56',
            rpcUrl: configService.get('BSC_RPC_URL', 'https://bsc-dataseed.binance.org'),
            escrowContractAddress: configService.get('BSC_ESCROW_ADDRESS', ''),
            escrowContractAbi: null,
        };
    }
    async onModuleInit() {
        this.provider = new ethers_1.ethers.providers.JsonRpcProvider(this.config.rpcUrl);
        const privateKey = this.configService.get('BSC_PRIVATE_KEY', '');
        if (privateKey) {
            this.wallet = new ethers_1.Wallet(privateKey, this.provider);
        }
        if (this.config.escrowContractAddress && this.wallet) {
            const abi = await this.loadContractAbi();
            this.contract = new ethers_1.Contract(this.config.escrowContractAddress, abi, this.wallet);
        }
    }
    async loadContractAbi() {
        return [
            'function createOrder(bytes32 _orderId, address _buyer, address _seller, uint256 _amount, address _token)',
            'function fundOrder(bytes32 _orderId)',
            'function release(bytes32 _orderId)',
            'function refund(bytes32 _orderId)',
            'function getOrder(bytes32 _orderId) returns (address buyer, address seller, uint256 amount, address token, uint8 status, uint256 createdAt, uint256 fundedAt)',
            'function getOrderStatus(bytes32 _orderId) returns (uint8)',
            'function admin() returns (address)',
            'event OrderCreated(bytes32 orderId, address buyer, address seller, uint256 amount, address token)',
            'event OrderFunded(bytes32 orderId, uint256 amount, uint256 fundedAt)',
            'event OrderReleased(bytes32 orderId, address seller, uint256 amount, uint256 releasedAt)',
            'event OrderRefunded(bytes32 orderId, address buyer, uint256 amount, uint256 refundedAt)',
        ];
    }
    getNetworkName() {
        return blockchain_interface_1.BlockchainType.BSC;
    }
    getChainId() {
        return this.config.chainId;
    }
    async createEscrowOrder(orderId, buyerAddress, sellerAddress, amount, token) {
        if (!this.contract) {
            throw new Error('Escrow contract not initialized');
        }
        const orderIdBytes32 = ethers_1.ethers.utils.formatBytes32String(orderId);
        const amountWei = ethers_1.ethers.utils.parseUnits(amount, token.decimals);
        const tokenAddress = token.isNative ? ethers_1.ethers.constants.AddressZero : token.contractAddress;
        const tx = await this.contract.createOrder(orderIdBytes32, buyerAddress, sellerAddress, amountWei, tokenAddress);
        const receipt = await tx.wait();
        return {
            escrowId: orderId,
            txHash: receipt.transactionHash,
        };
    }
    async fundEscrowOrder(orderId, buyerAddress, amount, token) {
        if (!this.contract) {
            throw new Error('Escrow contract not initialized');
        }
        const orderIdBytes32 = ethers_1.ethers.utils.formatBytes32String(orderId);
        const amountWei = ethers_1.ethers.utils.parseUnits(amount, token.decimals);
        if (token.isNative) {
            const tx = await this.contract.fundOrder(orderIdBytes32, {
                value: amountWei,
            });
            const receipt = await tx.wait();
            return { txHash: receipt.transactionHash };
        }
        else {
            throw new Error('BEP-20 token funding requires approval first');
        }
    }
    async releaseEscrow(orderId) {
        if (!this.contract) {
            throw new Error('Escrow contract not initialized');
        }
        const orderIdBytes32 = ethers_1.ethers.utils.formatBytes32String(orderId);
        const tx = await this.contract.release(orderIdBytes32);
        const receipt = await tx.wait();
        return { txHash: receipt.transactionHash };
    }
    async refundEscrow(orderId) {
        if (!this.contract) {
            throw new Error('Escrow contract not initialized');
        }
        const orderIdBytes32 = ethers_1.ethers.utils.formatBytes32String(orderId);
        const tx = await this.contract.refund(orderIdBytes32);
        const receipt = await tx.wait();
        return { txHash: receipt.transactionHash };
    }
    async getEscrowOrder(orderId) {
        if (!this.contract) {
            throw new Error('Escrow contract not initialized');
        }
        const orderIdBytes32 = ethers_1.ethers.utils.formatBytes32String(orderId);
        const result = await this.contract.getOrder(orderIdBytes32);
        return {
            orderId,
            buyerAddress: result.buyer,
            sellerAddress: result.seller,
            amount: ethers_1.ethers.utils.formatUnits(result.amount, 18),
            tokenAddress: result.token === ethers_1.ethers.constants.AddressZero ? 'BNB' : result.token,
            status: this.parseEscrowStatus(result.status),
            createdAt: Number(result.createdAt),
            fundedAt: Number(result.fundedAt),
        };
    }
    async getEscrowStatus(orderId) {
        if (!this.contract) {
            throw new Error('Escrow contract not initialized');
        }
        const orderIdBytes32 = ethers_1.ethers.utils.formatBytes32String(orderId);
        const status = await this.contract.getOrderStatus(orderIdBytes32);
        return this.parseEscrowStatus(status);
    }
    async getBalance(address, token) {
        if (token.isNative) {
            const balance = await this.provider.getBalance(address);
            return ethers_1.ethers.utils.formatEther(balance);
        }
        else {
            const tokenContract = new ethers_1.Contract(token.contractAddress, ['function balanceOf(address) returns (uint256)'], this.provider);
            const balance = await tokenContract.balanceOf(address);
            return ethers_1.ethers.utils.formatUnits(balance, token.decimals);
        }
    }
    isValidAddress(address) {
        return ethers_1.ethers.utils.isAddress(address);
    }
    async getTransaction(txHash) {
        const tx = await this.provider.getTransaction(txHash);
        if (!tx) {
            return {
                status: 'pending',
                blockNumber: null,
                timestamp: null,
            };
        }
        if (!tx.blockNumber) {
            return {
                status: 'pending',
                blockNumber: null,
                timestamp: null,
            };
        }
        const receipt = await this.provider.getTransactionReceipt(txHash);
        if (receipt.status === 0) {
            return {
                status: 'failed',
                blockNumber: tx.blockNumber,
                timestamp: null,
            };
        }
        const block = await this.provider.getBlock(tx.blockNumber);
        return {
            status: 'confirmed',
            blockNumber: tx.blockNumber,
            timestamp: block.timestamp,
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
exports.BscAdapter = BscAdapter;
exports.BscAdapter = BscAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], BscAdapter);
//# sourceMappingURL=bsc.adapter.js.map