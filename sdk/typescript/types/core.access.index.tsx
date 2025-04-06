import {  keccak256 } from 'viem';


/**
 * Constants for SecureOwnable operations
 */
export const OPERATION_TYPES = {
  OWNERSHIP_TRANSFER: keccak256(new TextEncoder().encode("OWNERSHIP_TRANSFER")),
  BROADCASTER_UPDATE: keccak256(new TextEncoder().encode("BROADCASTER_UPDATE")),
  RECOVERY_UPDATE: keccak256(new TextEncoder().encode("RECOVERY_UPDATE")),
  TIMELOCK_UPDATE: keccak256(new TextEncoder().encode("TIMELOCK_UPDATE"))
} as const;

export type OperationType = typeof OPERATION_TYPES[keyof typeof OPERATION_TYPES];

/**
 * Constants for function selectors
 */
export const FUNCTION_SELECTORS = {
  TRANSFER_OWNERSHIP: keccak256(new TextEncoder().encode("executeTransferOwnership(address)")).slice(0, 10),
  UPDATE_BROADCASTER: keccak256(new TextEncoder().encode("executeBroadcasterUpdate(address)")).slice(0, 10),
  UPDATE_RECOVERY: keccak256(new TextEncoder().encode("executeRecoveryUpdate(address)")).slice(0, 10),
  UPDATE_TIMELOCK: keccak256(new TextEncoder().encode("executeTimeLockUpdate(uint256)")).slice(0, 10),
  TRANSFER_OWNERSHIP_APPROVE_META: keccak256(new TextEncoder().encode("transferOwnershipApprovalWithMetaTx((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))")).slice(0, 10),
  TRANSFER_OWNERSHIP_CANCEL_META: keccak256(new TextEncoder().encode("transferOwnershipCancellationWithMetaTx((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))")).slice(0, 10),
  UPDATE_BROADCASTER_APPROVE_META: keccak256(new TextEncoder().encode("updateBroadcasterApprovalWithMetaTx((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))")).slice(0, 10),
  UPDATE_BROADCASTER_CANCEL_META: keccak256(new TextEncoder().encode("updateBroadcasterCancellationWithMetaTx((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))")).slice(0, 10),
  UPDATE_RECOVERY_META: keccak256(new TextEncoder().encode("updateRecoveryRequestAndApprove((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))")).slice(0, 10),
  UPDATE_TIMELOCK_META: keccak256(new TextEncoder().encode("updateTimeLockRequestAndApprove((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))")).slice(0, 10)
} as const;

export type FunctionSelector = typeof FUNCTION_SELECTORS[keyof typeof FUNCTION_SELECTORS];

/**
 * Constants for SecureOwnable events
 */
export const EVENT_TYPES = {
  OWNERSHIP_TRANSFER_REQUEST: "OwnershipTransferRequest",
  OWNERSHIP_TRANSFER_CANCELLED: "OwnershipTransferCancelled",
  OWNERSHIP_TRANSFER_UPDATED: "OwnershipTransferUpdated",
  BROADCASTER_UPDATE_REQUEST: "BroadcasterUpdateRequest",
  BROADCASTER_UPDATE_CANCELLED: "BroadcasterUpdateCancelled",
  BROADCASTER_UPDATED: "BroadcasterUpdated",
  RECOVERY_ADDRESS_UPDATED: "RecoveryAddressUpdated",
  TIMELOCK_PERIOD_UPDATED: "TimeLockPeriodUpdated"
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];
