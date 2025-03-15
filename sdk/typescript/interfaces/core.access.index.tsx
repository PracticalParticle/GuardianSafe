import { Address, Hex } from 'viem';
import { TransactionResult, TransactionOptions } from '../interfaces/base.index';
import { TxRecord, MetaTransaction, MetaTxParams } from '../interfaces/lib.index';
import { ExecutionType } from '../types/lib.index';

/**
 * Interface for SecureOwnable contract events
 */
export interface OwnershipTransferRequestEvent {
  currentOwner: Address;
  newOwner: Address;
}

export interface OwnershipTransferCancelledEvent {
  txId: bigint;
}

export interface OwnershipTransferUpdatedEvent {
  oldOwner: Address;
  newOwner: Address;
}

export interface BroadcasterUpdateRequestEvent {
  currentBroadcaster: Address;
  newBroadcaster: Address;
}

export interface BroadcasterUpdateCancelledEvent {
  txId: bigint;
}

export interface BroadcasterUpdatedEvent {
  oldBroadcaster: Address;
  newBroadcaster: Address;
}

export interface RecoveryAddressUpdatedEvent {
  oldRecovery: Address;
  newRecovery: Address;
}

export interface TimeLockPeriodUpdatedEvent {
  oldPeriod: bigint;
  newPeriod: bigint;
}

/**
 * Interface for SecureOwnable contract state
 */
export interface SecureOwnableState {
  owner: Address;
  broadcaster: Address;
  recoveryAddress: Address;
  timeLockPeriodInMinutes: bigint;
  operationHistory: Map<bigint, TxRecord>;
}

/**
 * Interface for SecureOwnable contract methods
 */
export interface ISecureOwnable {
  // Ownership Management
  transferOwnershipRequest(options: TransactionOptions): Promise<TransactionResult>;
  transferOwnershipDelayedApproval(txId: bigint, options: TransactionOptions): Promise<TransactionResult>;
  transferOwnershipApprovalWithMetaTx(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult>;
  transferOwnershipCancellation(txId: bigint, options: TransactionOptions): Promise<TransactionResult>;
  transferOwnershipCancellationWithMetaTx(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult>;

  // Broadcaster Management
  updateBroadcasterRequest(newBroadcaster: Address, options: TransactionOptions): Promise<TransactionResult>;
  updateBroadcasterDelayedApproval(txId: bigint, options: TransactionOptions): Promise<TransactionResult>;
  updateBroadcasterApprovalWithMetaTx(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult>;
  updateBroadcasterCancellation(txId: bigint, options: TransactionOptions): Promise<TransactionResult>;
  updateBroadcasterCancellationWithMetaTx(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult>;

  // Recovery Management
  updateRecoveryExecutionOptions(newRecoveryAddress: Address): Promise<Hex>;
  updateRecoveryRequestAndApprove(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult>;

  // TimeLock Management
  updateTimeLockExecutionOptions(newTimeLockPeriodInMinutes: bigint): Promise<Hex>;
  updateTimeLockRequestAndApprove(metaTx: MetaTransaction, options: TransactionOptions): Promise<TransactionResult>;

  // Meta Transaction Management
  createMetaTxParams(
    handlerContract: Address,
    handlerSelector: Hex,
    deadline: bigint,
    maxGasPrice: bigint,
    signer: Address
  ): Promise<MetaTxParams>;

  generateUnsignedMetaTransactionForNew(
    requester: Address,
    target: Address,
    value: bigint,
    gasLimit: bigint,
    operationType: Hex,
    executionType: ExecutionType,
    executionOptions: Hex,
    metaTxParams: MetaTxParams
  ): Promise<MetaTransaction>;

  generateUnsignedMetaTransactionForExisting(
    txId: bigint,
    metaTxParams: MetaTxParams
  ): Promise<MetaTransaction>;

  // Getters
  getOperationHistory(): Promise<TxRecord[]>;
  getOperation(txId: bigint): Promise<TxRecord>;
  getBroadcaster(): Promise<Address>;
  getRecoveryAddress(): Promise<Address>;
  getTimeLockPeriodInMinutes(): Promise<bigint>;
  owner(): Promise<Address>;

  // Operation Type Support
  getSupportedOperationTypes(): Promise<Array<{ operationType: Hex; name: string }>>;
  isOperationTypeSupported(operationType: Hex): Promise<boolean>;
}
