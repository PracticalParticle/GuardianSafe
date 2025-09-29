import { Address, PublicClient, WalletClient, Chain, Hex } from 'viem';
import SecureOwnableABIJson from '../../abi/SecureOwnable.abi.json';
import { TransactionOptions, TransactionResult } from './interfaces/base.index';
import { ISecureOwnable } from './interfaces/core.access.index';
import { TxRecord, MetaTransaction, MetaTxParams } from './interfaces/lib.index';
import { ExecutionType, TxAction } from './types/lib.index';
import { BaseStateMachine } from './BaseStateMachine';

/**
 * @title SecureOwnable
 * @notice TypeScript wrapper for SecureOwnable smart contract
 */
export class SecureOwnable extends BaseStateMachine implements ISecureOwnable {
  constructor(
    client: PublicClient,
    walletClient: WalletClient | undefined,
    contractAddress: Address,
    chain: Chain
  ) {
    super(client, walletClient, contractAddress, chain, SecureOwnableABIJson);
  }

  // Ownership Management
  async transferOwnershipRequest(options: TransactionOptions): Promise<TransactionResult> {
    return this.executeWriteContract('transferOwnershipRequest', [], options);
  }

  async transferOwnershipDelayedApproval(txId: bigint, options: TransactionOptions): Promise<TransactionResult> {
    return this.executeWriteContract('transferOwnershipDelayedApproval', [txId], options);
  }

  async transferOwnershipApprovalWithMetaTx(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult> {
    return this.executeWriteContract('transferOwnershipApprovalWithMetaTx', [metaTx], options);
  }

  async transferOwnershipCancellation(txId: bigint, options: TransactionOptions): Promise<TransactionResult> {
    return this.executeWriteContract('transferOwnershipCancellation', [txId], options);
  }

  async transferOwnershipCancellationWithMetaTx(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult> {
    return this.executeWriteContract('transferOwnershipCancellationWithMetaTx', [metaTx], options);
  }

  // Broadcaster Management
  async updateBroadcasterRequest(newBroadcaster: Address, options: TransactionOptions): Promise<TransactionResult> {
    return this.executeWriteContract('updateBroadcasterRequest', [newBroadcaster], options);
  }

  async updateBroadcasterDelayedApproval(txId: bigint, options: TransactionOptions): Promise<TransactionResult> {
    return this.executeWriteContract('updateBroadcasterDelayedApproval', [txId], options);
  }

  async updateBroadcasterApprovalWithMetaTx(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult> {
    return this.executeWriteContract('updateBroadcasterApprovalWithMetaTx', [metaTx], options);
  }

  async updateBroadcasterCancellation(txId: bigint, options: TransactionOptions): Promise<TransactionResult> {
    return this.executeWriteContract('updateBroadcasterCancellation', [txId], options);
  }

  async updateBroadcasterCancellationWithMetaTx(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult> {
    return this.executeWriteContract('updateBroadcasterCancellationWithMetaTx', [metaTx], options);
  }

  // Recovery Management
  async updateRecoveryExecutionOptions(newRecoveryAddress: Address): Promise<Hex> {
    return this.executeReadContract<Hex>('updateRecoveryExecutionOptions', [newRecoveryAddress]);
  }

  async updateRecoveryRequestAndApprove(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult> {
    return this.executeWriteContract('updateRecoveryRequestAndApprove', [metaTx], options);
  }

  // TimeLock Management
  async updateTimeLockExecutionOptions(newTimeLockPeriodInMinutes: bigint): Promise<Hex> {
    return this.executeReadContract<Hex>('updateTimeLockExecutionOptions', [newTimeLockPeriodInMinutes]);
  }

  async updateTimeLockRequestAndApprove(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult> {
    return this.executeWriteContract('updateTimeLockRequestAndApprove', [metaTx], options);
  }

  // SecureOwnable-specific getters

  async getBroadcaster(): Promise<Address> {
    return this.executeReadContract<Address>('getBroadcaster');
  }

  async getRecovery(): Promise<Address> {
    return this.executeReadContract<Address>('getRecovery');
  }


  async getTimeLockPeriodSec(): Promise<bigint> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'getTimeLockPeriodSec'
    }) as bigint;
  }

  async owner(): Promise<Address> {
    return this.executeReadContract<Address>('owner');
  }

  async getSupportedOperationTypes(): Promise<Hex[]> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'getSupportedOperationTypes'
    }) as Hex[];
  }

  async getSupportedRoles(): Promise<Hex[]> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'getSupportedRoles'
    }) as Hex[];
  }

  async getSupportedFunctions(): Promise<Hex[]> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'getSupportedFunctions'
    }) as Hex[];
  }

  async hasRole(roleHash: Hex, wallet: Address): Promise<boolean> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'hasRole',
      args: [roleHash, wallet]
    }) as boolean;
  }

  async isActionSupportedByFunction(functionSelector: Hex, action: TxAction): Promise<boolean> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'isActionSupportedByFunction',
      args: [functionSelector, action]
    }) as boolean;
  }

  async getSignerNonce(signer: Address): Promise<bigint> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'getSignerNonce',
      args: [signer]
    }) as bigint;
  }

  async getRolePermission(roleHash: Hex): Promise<any[]> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'getRolePermission',
      args: [roleHash]
    }) as any[];
  }

  async initialized(): Promise<boolean> {
    return await this.client.readContract({
      address: this.contractAddress,
      abi: SecureOwnableABIJson,
      functionName: 'initialized'
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