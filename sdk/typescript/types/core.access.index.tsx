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
 * Constants for DynamicRBAC function selectors
 */
export const DYNAMIC_RBAC_FUNCTION_SELECTORS = {
  CREATE_ROLE: keccak256(new TextEncoder().encode("createRole(string,uint256)")).slice(0, 10),
  UPDATE_ROLE: keccak256(new TextEncoder().encode("updateRole(bytes32,string,uint256)")).slice(0, 10),
  DELETE_ROLE: keccak256(new TextEncoder().encode("deleteRole(bytes32)")).slice(0, 10),
  ADD_WALLET_TO_ROLE: keccak256(new TextEncoder().encode("addWalletToRole(bytes32,address)")).slice(0, 10),
  REMOVE_WALLET_FROM_ROLE: keccak256(new TextEncoder().encode("removeWalletFromRole(bytes32,address)")).slice(0, 10),
  REPLACE_WALLET_IN_ROLE: keccak256(new TextEncoder().encode("replaceWalletInRole(bytes32,address,address)")).slice(0, 10),
  ADD_FUNCTION_PERMISSION_TO_ROLE: keccak256(new TextEncoder().encode("addFunctionPermissionToRole(bytes32,bytes4,uint8)")).slice(0, 10),
  REMOVE_FUNCTION_PERMISSION_FROM_ROLE: keccak256(new TextEncoder().encode("removeFunctionPermissionFromRole(bytes32,bytes4)")).slice(0, 10)
} as const;

