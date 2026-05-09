import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TronAdapter } from './tron.adapter';
import { BscAdapter } from './bsc.adapter';
import { BlockchainAdapter, BlockchainType, EscrowStatus, TokenInfo } from './blockchain.interface';
export declare class BlockchainService implements OnModuleInit {
    private configService;
    private prisma;
    private tronAdapter;
    private bscAdapter;
    private adapters;
    constructor(configService: ConfigService, prisma: PrismaService, tronAdapter: TronAdapter, bscAdapter: BscAdapter);
    onModuleInit(): Promise<void>;
    private initializeNetworks;
    getAdapter(networkType: BlockchainType): BlockchainAdapter;
    getSupportedNetworks(): Promise<({
        tokens: {
            symbol: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            networkId: string;
            contractAddress: string | null;
            decimals: number;
            isNative: boolean;
            isActive: boolean;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        displayName: string;
        chainId: string | null;
        rpcUrl: string;
    })[]>;
    getToken(networkName: string, symbol: string): Promise<TokenInfo | null>;
    createOnchainEscrow(orderId: string, networkType: BlockchainType, buyerAddress: string, sellerAddress: string, amount: string, tokenSymbol: string): Promise<{
        escrowId: string;
        txHash: string;
    }>;
    fundOnchainEscrow(orderId: string, networkType: BlockchainType, buyerAddress: string, amount: string, tokenSymbol: string): Promise<{
        txHash: string;
    }>;
    releaseOnchainEscrow(orderId: string, networkType: BlockchainType): Promise<{
        txHash: string;
    }>;
    refundOnchainEscrow(orderId: string, networkType: BlockchainType): Promise<{
        txHash: string;
    }>;
    getOnchainEscrowStatus(orderId: string, networkType: BlockchainType): Promise<EscrowStatus>;
    getOnchainBalance(address: string, networkType: BlockchainType, tokenSymbol: string): Promise<string>;
    isValidAddress(address: string, networkType: BlockchainType): boolean;
    private getTokenIdFromSymbol;
    getWalletAddress(userId: string, networkName: string): Promise<string | null>;
    setWalletAddress(userId: string, networkName: string, address: string): Promise<{
        success: boolean;
    }>;
}
