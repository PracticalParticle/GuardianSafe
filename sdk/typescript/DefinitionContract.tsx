import { PublicClient, WalletClient, Address, Chain, Hex } from 'viem';
import { 
  IDefinition, 
  DefinitionsConfig
} from './interfaces/definition.index';
import { 
  ReadableOperationType, 
  FunctionSchema, 
  RolePermission, 
  OperationWorkflow, 
  WorkflowPath 
} from './types/definition.index';

// Import the ABI
import IDefinitionABI from '../../abi/IDefinition.abi.json';

/**
 * Definitions class for interacting with any definition library
 * that implements the IDefinition interface
 * 
 * This class provides type-safe access to contract definitions including:
 * - Operation types and their configurations
 * - Function schemas and permissions
 * - Role-based access control definitions
 * - Workflow definitions and execution paths
 * 
 * @example
 * ```typescript
 * const definitions = new Definitions(
 *   publicClient,
 *   walletClient,
 *   '0x1234...',
 *   chain
 * );
 * 
 * // Get all operation types
 * const operationTypes = await definitions.getOperationTypes();
 * 
 * // Get workflow for specific operation
 * const workflow = await definitions.getWorkflowForOperation('0xabcd...');
 * ```
 */
export class Definitions implements IDefinition {
  protected client: PublicClient;
  protected walletClient: WalletClient | undefined;
  protected contractAddress: Address;
  protected chain: Chain;
  protected config: DefinitionsConfig;

  constructor(
    client: PublicClient,
    walletClient: WalletClient | undefined,
    contractAddress: Address,
    chain: Chain,
    config?: Partial<DefinitionsConfig>
  ) {
    this.client = client;
    this.walletClient = walletClient;
    this.contractAddress = contractAddress;
    this.chain = chain;
    this.config = {
      contractAddress,
      chainId: chain.id,
      ...config
    };
  }

  /**
   * Returns all operation type definitions
   * @returns Array of operation type definitions
   */
  async getOperationTypes(): Promise<ReadableOperationType[]> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: IDefinitionABI,
        functionName: 'getOperationTypes'
      }) as any[];

      return result.map((item: any) => ({
        operationType: item.operationType as Hex,
        name: item.name as string
      }));
    } catch (error) {
      throw new Error(`Failed to get operation types: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Returns all function schema definitions
   * @returns Array of function schema definitions
   */
  async getFunctionSchemas(): Promise<FunctionSchema[]> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: IDefinitionABI,
        functionName: 'getFunctionSchemas'
      }) as any[];

      return result.map((item: any) => ({
        functionName: item.functionName as string,
        functionSelector: item.functionSelector as Hex,
        parameters: item.parameters as string[],
        returnTypes: item.returnTypes as string[],
        description: item.description as string
      }));
    } catch (error) {
      throw new Error(`Failed to get function schemas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Returns all role hashes and their corresponding function permissions
   * @returns RolePermission struct containing roleHashes and functionPermissions arrays
   */
  async getRolePermissions(): Promise<RolePermission> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: IDefinitionABI,
        functionName: 'getRolePermissions'
      }) as any;

      return {
        roleHashes: result.roleHashes.map((hash: any) => hash as Hex),
        functionPermissions: result.functionPermissions.map((perm: any) => ({
          functionSelector: perm.functionSelector as Hex,
          allowedRoles: perm.allowedRoles.map((role: any) => role as Hex),
          requiresSignature: perm.requiresSignature as boolean,
          isOffChain: perm.isOffChain as boolean
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get role permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Returns all operation workflows
   * @returns Array of operation workflow definitions
   */
  async getOperationWorkflows(): Promise<OperationWorkflow[]> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: IDefinitionABI,
        functionName: 'getOperationWorkflows'
      }) as any[];

      return result.map((workflow: any) => ({
        operationType: workflow.operationType as Hex,
        operationName: workflow.operationName as string,
        paths: workflow.paths.map((path: any) => ({
          name: path.name as string,
          description: path.description as string,
          steps: path.steps.map((step: any) => ({
            functionName: step.functionName as string,
            functionSelector: step.functionSelector as Hex,
            action: step.action as number,
            roles: step.roles as string[],
            description: step.description as string,
            isOffChain: step.isOffChain as boolean,
            phaseType: step.phaseType as string
          })),
          workflowType: path.workflowType as number,
          estimatedTimeSec: BigInt(path.estimatedTimeSec),
          requiresSignature: path.requiresSignature as boolean,
          hasOffChainPhase: path.hasOffChainPhase as boolean
        })),
        supportedRoles: workflow.supportedRoles as string[]
      }));
    } catch (error) {
      throw new Error(`Failed to get operation workflows: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Returns workflow information for a specific operation type
   * @param operationType The operation type hash to get workflow for
   * @returns OperationWorkflow struct containing workflow information for the operation
   */
  async getWorkflowForOperation(operationType: Hex): Promise<OperationWorkflow> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: IDefinitionABI,
        functionName: 'getWorkflowForOperation',
        args: [operationType]
      }) as any;

      return {
        operationType: result.operationType as Hex,
        operationName: result.operationName as string,
        paths: result.paths.map((path: any) => ({
          name: path.name as string,
          description: path.description as string,
          steps: path.steps.map((step: any) => ({
            functionName: step.functionName as string,
            functionSelector: step.functionSelector as Hex,
            action: step.action as number,
            roles: step.roles as string[],
            description: step.description as string,
            isOffChain: step.isOffChain as boolean,
            phaseType: step.phaseType as string
          })),
          workflowType: path.workflowType as number,
          estimatedTimeSec: BigInt(path.estimatedTimeSec),
          requiresSignature: path.requiresSignature as boolean,
          hasOffChainPhase: path.hasOffChainPhase as boolean
        })),
        supportedRoles: result.supportedRoles as string[]
      };
    } catch (error) {
      throw new Error(`Failed to get workflow for operation ${operationType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Returns all available workflow paths
   * @returns Array of workflow path definitions
   */
  async getWorkflowPaths(): Promise<WorkflowPath[]> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: IDefinitionABI,
        functionName: 'getWorkflowPaths'
      }) as any[];

      return result.map((path: any) => ({
        name: path.name as string,
        description: path.description as string,
        steps: path.steps.map((step: any) => ({
          functionName: step.functionName as string,
          functionSelector: step.functionSelector as Hex,
          action: step.action as number,
          roles: step.roles as string[],
          description: step.description as string,
          isOffChain: step.isOffChain as boolean,
          phaseType: step.phaseType as string
        })),
        workflowType: path.workflowType as number,
        estimatedTimeSec: BigInt(path.estimatedTimeSec),
        requiresSignature: path.requiresSignature as boolean,
        hasOffChainPhase: path.hasOffChainPhase as boolean
      }));
    } catch (error) {
      throw new Error(`Failed to get workflow paths: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Utility method to get operation type by name
   * @param operationName The name of the operation to find
   * @returns The operation type hash if found, undefined otherwise
   */
  async getOperationTypeByName(operationName: string): Promise<Hex | undefined> {
    const operationTypes = await this.getOperationTypes();
    const operation = operationTypes.find(op => op.name === operationName);
    return operation?.operationType;
  }

  /**
   * Utility method to get function schema by selector
   * @param functionSelector The function selector to find
   * @returns The function schema if found, undefined otherwise
   */
  async getFunctionSchemaBySelector(functionSelector: Hex): Promise<FunctionSchema | undefined> {
    const schemas = await this.getFunctionSchemas();
    return schemas.find(schema => schema.functionSelector === functionSelector);
  }

  /**
   * Utility method to check if a role has permission for a function
   * @param roleHash The role hash to check
   * @param functionSelector The function selector to check permission for
   * @returns True if the role has permission, false otherwise
   */
  async hasRolePermission(roleHash: Hex, functionSelector: Hex): Promise<boolean> {
    const rolePermissions = await this.getRolePermissions();
    
    for (const permission of rolePermissions.functionPermissions) {
      if (permission.functionSelector === functionSelector) {
        return permission.allowedRoles.includes(roleHash);
      }
    }
    
    return false;
  }

  /**
   * Utility method to get all roles that can execute a specific function
   * @param functionSelector The function selector to check
   * @returns Array of role hashes that can execute the function
   */
  async getRolesForFunction(functionSelector: Hex): Promise<Hex[]> {
    const rolePermissions = await this.getRolePermissions();
    
    for (const permission of rolePermissions.functionPermissions) {
      if (permission.functionSelector === functionSelector) {
        return permission.allowedRoles;
      }
    }
    
    return [];
  }

  /**
   * Get contract configuration
   * @returns The current contract configuration
   */
  getConfig(): DefinitionsConfig {
    return { ...this.config };
  }

  /**
   * Update contract configuration
   * @param config Partial configuration to update
   */
  updateConfig(config: Partial<DefinitionsConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
