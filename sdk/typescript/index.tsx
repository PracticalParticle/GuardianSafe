// Guardian Framework TypeScript SDK
// Main entry point for all SDK functionality

// Core Classes
export { default as SecureOwnable } from './SecureOwnable';
export { default as DynamicRBAC } from './DynamicRBAC';
export { DefinitionContract } from './DefinitionContract';

// Interfaces
export * from './interfaces/base.index';
export * from './interfaces/core.access.index';
export * from './interfaces/lib.index';
export * from './interfaces/definition.index';

// Types and Constants
export { 
  OPERATION_TYPES, 
  OperationType, 
  DYNAMIC_RBAC_FUNCTION_SELECTORS
} from './types/core.access.index';
export * from './types/lib.index';
export * from './types/definition.index';

// Utilities
export * from './utils/validations';
export * from './utils/erc20/erc20Token';
export { MetaTransactionSigner, MetaTransactionBuilder } from './utils/metaTx/metaTransaction';

// Re-export commonly used types from viem
export type { Address, Hex, PublicClient, WalletClient, Chain } from 'viem';
