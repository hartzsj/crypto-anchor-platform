import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainAdapter, BlockchainType, EscrowStatus, EscrowOrderInfo, TokenInfo } from './blockchain.interface';
export declare class BscAdapter implements BlockchainAdapter, OnModuleInit {
    private configService;
    private provider;
    private wallet;
    private contract;
    private config;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private loadContractAbi;
    getNetworkName(): BlockchainType;
    getChainId(): string | null;
    createEscrowOrder(orderId: string, buyerAddress: string, sellerAddress: string, amount: string, token: TokenInfo): Promise<{
        escrowId: string;
        txHash: string;
    }>;
    fundEscrowOrder(orderId: string, buyerAddress: string, amount: string, token: TokenInfo): Promise<{
        txHash: string;
    }>;
    releaseEscrow(orderId: string): Promise<{
        txHash: string;
    }>;
    refundEscrow(orderId: string): Promise<{
        txHash: string;
    }>;
    getEscrowOrder(orderId: string): Promise<EscrowOrderInfo>;
    getEscrowStatus(orderId: string): Promise<EscrowStatus>;
    getBalance(address: string, token: TokenInfo): Promise<string>;
    isValidAddress(address: string): boolean;
    getTransaction(txHash: string): Promise<{
        status: 'pending' | 'confirmed' | 'failed';
        blockNumber: number | null;
        timestamp: number | null;
    }>;
    private parseEscrowStatus;
}
