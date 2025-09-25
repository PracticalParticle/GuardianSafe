import { Address, PublicClient, WalletClient, Chain, Hex } from 'viem';
import DynamicRBACABIJson from '../../abi/DynamicRBAC.abi.json';
import { TransactionOptions, TransactionResult } from './interfaces/base.index';
import { IDynamicRBAC } from './interfaces/core.access.index';
import { TxAction } from './types/lib.index';
import { DYNAMIC_RBAC_FUNCTION_SELECTORS } from './types/core.access.index';

/**
 * @title DynamicRBAC
 * @notice TypeScript wrapper for DynamicRBAC smart contract
 */
export class DynamicRBAC implements IDynamicRBAC {
  constructor(
    protected client: PublicClient,
    protected walletClient: WalletClient | undefined,
    protected contractAddress: Address,
    protected chain: Chain
  ) {}

  // Role Management Functions
  async createRole(roleName: string, maxWallets: bigint, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'createRole',
      args: [roleName, maxWallets],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  async updateRole(roleHash: Hex, newRoleName: string, newMaxWallets: bigint, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'updateRole',
      args: [roleHash, newRoleName, newMaxWallets],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  async deleteRole(roleHash: Hex, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'deleteRole',
      args: [roleHash],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  // Wallet Management Functions
  async addWalletToRole(roleHash: Hex, wallet: Address, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'addWalletToRole',
      args: [roleHash, wallet],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  async removeAuthorizedWalletFromRole(roleHash: Hex, wallet: Address, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'removeAuthorizedWalletFromRole',
      args: [roleHash, wallet],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  async replaceWalletInRole(roleHash: Hex, newWallet: Address, oldWallet: Address, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'replaceWalletInRole',
      args: [roleHash, newWallet, oldWallet],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  // Permission Management Functions
  async addFunctionPermissionToRole(roleHash: Hex, functionSelector: Hex, action: TxAction, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'addFunctionPermissionToRole',
      args: [roleHash, functionSelector, action],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  async removeFunctionPermissionFromRole(roleHash: Hex, functionSelector: Hex, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'removeFunctionPermissionFromRole',
      args: [roleHash, functionSelector],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  // Query Functions
  async getDynamicRoles(): Promise<Hex[]> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'getDynamicRoles'
    }) as Hex[];
  }

  async getAllRoles(): Promise<Hex[]> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'getAllRoles'
    }) as Hex[];
  }

  async getRoleInfo(roleHash: Hex): Promise<{
    roleName: string;
    maxWallets: bigint;
    isProtected: boolean;
    authorizedWallets: Address[];
  }> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'getRoleInfo',
      args: [roleHash]
    }) as {
      roleName: string;
      maxWallets: bigint;
      isProtected: boolean;
      authorizedWallets: Address[];
    };
  }

  async hasRole(roleHash: Hex, wallet: Address): Promise<boolean> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'hasRole',
      args: [roleHash, wallet]
    }) as boolean;
  }

  async getWalletsInRole(roleHash: Hex): Promise<Address[]> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'getWalletsInRole',
      args: [roleHash]
    }) as Address[];
  }

  async getRolePermissions(roleHash: Hex): Promise<{
    functionSelectors: Hex[];
    actions: TxAction[];
  }> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'getRolePermissions',
      args: [roleHash]
    }) as {
      functionSelectors: Hex[];
      actions: TxAction[];
    };
  }

  async roleExists(roleHash: Hex): Promise<boolean> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'roleExists',
      args: [roleHash]
    }) as boolean;
  }

  async isRoleProtected(roleHash: Hex): Promise<boolean> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'isRoleProtected',
      args: [roleHash]
    }) as boolean;
  }

  async getRoleWalletCount(roleHash: Hex): Promise<bigint> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'getRoleWalletCount',
      args: [roleHash]
    }) as bigint;
  }

  async isRoleAtCapacity(roleHash: Hex): Promise<boolean> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: DynamicRBACABIJson,
      functionName: 'isRoleAtCapacity',
      args: [roleHash]
    }) as boolean;
  }
}

export default DynamicRBAC;
