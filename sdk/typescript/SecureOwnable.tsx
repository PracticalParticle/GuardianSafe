import { Address, PublicClient, WalletClient, Chain, Hex } from 'viem';
import SecureOwnableABIJson from '../../abi/SecureOwnable.abi.json';
import { TransactionOptions, TransactionResult } from './interfaces/base.index';
import { ISecureOwnable } from './interfaces/core.access.index';
import { TxRecord, MetaTransaction, MetaTxParams } from './interfaces/lib.index';
import { ExecutionType } from './types/lib.index';

/**
 * @title SecureOwnable
 * @notice TypeScript wrapper for SecureOwnable smart contract
 */
export class SecureOwnable implements ISecureOwnable {
  constructor(
    protected client: PublicClient,
    protected walletClient: WalletClient | undefined,
    protected contractAddress: Address,
    protected chain: Chain
  ) {}

  // Ownership Management
  async transferOwnershipRequest(options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'transferOwnershipRequest',
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  async transferOwnershipDelayedApproval(txId: bigint, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'transferOwnershipDelayedApproval',
      args: [txId],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  async transferOwnershipApprovalWithMetaTx(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'transferOwnershipApprovalWithMetaTx',
      args: [metaTx],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  async transferOwnershipCancellation(txId: bigint, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'transferOwnershipCancellation',
      args: [txId],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  async transferOwnershipCancellationWithMetaTx(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'transferOwnershipCancellationWithMetaTx',
      args: [metaTx],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  // Broadcaster Management
  async updateBroadcasterRequest(newBroadcaster: Address, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'updateBroadcasterRequest',
      args: [newBroadcaster],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  async updateBroadcasterDelayedApproval(txId: bigint, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    console.log('updateBroadcasterDelayedApproval', txId);
    console.log('options', options);
    console.log('this.contractAddress', this.contractAddress);
    console.log('this.chain', this.chain);
    console.log('SecureOwnableABIJson', SecureOwnableABIJson);
    console.log('args', [txId]);
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'updateBroadcasterDelayedApproval',
      args: [txId],
      account: options.from
    });
    console.log('hash', hash);
    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  async updateBroadcasterApprovalWithMetaTx(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'updateBroadcasterApprovalWithMetaTx',
      args: [metaTx],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  async updateBroadcasterCancellation(txId: bigint, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'updateBroadcasterCancellation',
      args: [txId],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  async updateBroadcasterCancellationWithMetaTx(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');
    
    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'updateBroadcasterCancellationWithMetaTx',
      args: [metaTx],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  // Recovery Management
  async updateRecoveryExecutionOptions(newRecoveryAddress: Address): Promise<Hex> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'updateRecoveryExecutionOptions',
      args: [newRecoveryAddress]
    }) as Hex;
  }

  async updateRecoveryRequestAndApprove(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');

    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'updateRecoveryRequestAndApprove',
      args: [metaTx],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  // TimeLock Management
  async updateTimeLockExecutionOptions(newTimeLockPeriodInMinutes: bigint): Promise<Hex> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'updateTimeLockExecutionOptions',
      args: [newTimeLockPeriodInMinutes]
    }) as Hex;
  }

  async updateTimeLockRequestAndApprove(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult> {
    if (!this.walletClient) throw new Error('Wallet client is required');

    const hash = await this.walletClient.writeContract({
      chain: this.chain,
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'updateTimeLockRequestAndApprove',
      args: [metaTx],
      account: options.from
    });

    return {
      hash,
      wait: () => this.client.waitForTransactionReceipt({ hash })
    };
  }

  // Meta Transaction Generation
  async createMetaTxParams(
    handlerContract: Address,
    handlerSelector: Hex,
    deadline: bigint,
    maxGasPrice: bigint,
    signer: Address
  ): Promise<MetaTxParams> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'createMetaTxParams',
      args: [handlerContract, handlerSelector, deadline, maxGasPrice, signer]
    }) as MetaTxParams;
  }

  async generateUnsignedMetaTransactionForNew(
    requester: Address,
    target: Address,
    value: bigint,
    gasLimit: bigint,
    operationType: Hex,
    executionType: ExecutionType,
    executionOptions: Hex,
    metaTxParams: MetaTxParams
  ): Promise<MetaTransaction> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'generateUnsignedMetaTransactionForNew',
      args: [
        requester,
        target,
        value,
        gasLimit,
        operationType,
        executionType,
        executionOptions,
        metaTxParams
      ]
    }) as MetaTransaction;
  }

  async generateUnsignedMetaTransactionForExisting(
    txId: bigint,
    metaTxParams: MetaTxParams
  ): Promise<MetaTransaction> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'generateUnsignedMetaTransactionForExisting',
      args: [txId, metaTxParams]
    }) as MetaTransaction;
  }

  // Getters
  async getOperationHistory(): Promise<TxRecord[]> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'getOperationHistory'
    }) as TxRecord[];
  }

  async getOperation(txId: bigint): Promise<TxRecord> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'getOperation',
      args: [txId]
    }) as TxRecord;
  }

  async getBroadcaster(): Promise<Address> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'getBroadcaster'
    }) as Address;
  }

  async getRecoveryAddress(): Promise<Address> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'getRecoveryAddress'
    }) as Address;
  }

  async getTimeLockPeriodInMinutes(): Promise<bigint> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'getTimeLockPeriodInMinutes'
    }) as bigint;
  }

  async owner(): Promise<Address> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'owner'
    }) as Address;
  }

  async getSupportedOperationTypes(): Promise<Array<{ operationType: Hex; name: string }>> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'getSupportedOperationTypes'
    }) as Array<{ operationType: Hex; name: string }>;
  }

  async isOperationTypeSupported(operationType: Hex): Promise<boolean> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'isOperationTypeSupported',
      args: [operationType]
    }) as boolean;
  }

  async supportsInterface(interfaceId: Hex): Promise<boolean> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'supportsInterface',
      args: [interfaceId]
    }) as boolean;
  }
}

export default SecureOwnable;