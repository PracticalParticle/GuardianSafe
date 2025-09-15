// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

// Local imports
import "./IDefinitionContract.sol";
import "./SharedValidationLibrary.sol";
import "./MultiPhaseSecureOperationDefinitions.sol";

/**
 * @title MultiPhaseSecureOperation
 * @dev A library for implementing secure multi-phase operations with time-locks and meta-transactions
 * 
 * This library provides a comprehensive framework for creating secure operations that require
 * multiple phases of approval before execution. It supports:
 * 
 * - Time-locked operations that can only be executed after a waiting period
 * - Meta-transactions for delegated approvals
 * - Role-based access control for different operation types
 * - Multiple execution types (standard function calls or raw transaction data)
 * - Payment handling for both native tokens and ERC20 tokens
 * 
 * The library uses MultiPhaseSecureOperationDefinitions for modular configuration,
 * allowing easy customization of operation types, function schemas, and role permissions
 * without modifying the core library code.
 * 
 * The library is designed to be used as a building block for secure smart contract systems
 * that require high levels of security and flexibility.
 */
library MultiPhaseSecureOperation {
    using MessageHashUtils for bytes32;
    using SharedValidationLibrary for *;

    enum TxStatus {
        UNDEFINED,
        PENDING,
        CANCELLED,
        COMPLETED,
        FAILED,
        REJECTED
    }

    enum TxAction {
        EXECUTE_TIME_DELAY_REQUEST,
        EXECUTE_TIME_DELAY_APPROVE,
        EXECUTE_TIME_DELAY_CANCEL,
        SIGN_META_REQUEST_AND_APPROVE,
        SIGN_META_APPROVE,
        SIGN_META_CANCEL,
        EXECUTE_META_REQUEST_AND_APPROVE,
        EXECUTE_META_APPROVE,
        EXECUTE_META_CANCEL
    }

    enum ExecutionType {
        NONE,
        STANDARD,
        RAW
    }

    struct StandardExecutionOptions {
        bytes4 functionSelector;
        bytes params;
    }

    struct RawExecutionOptions {
        bytes rawTxData;
    }

    struct TxParams {
        address requester;
        address target;
        uint256 value;
        uint256 gasLimit;
        bytes32 operationType;
        ExecutionType executionType;
        bytes executionOptions;
    }

    struct MetaTxParams {
        uint256 chainId;
        uint256 nonce;
        address handlerContract;
        bytes4 handlerSelector;
        TxAction action;
        uint256 deadline;
        uint256 maxGasPrice;
        address signer;
    }

    struct TxRecord {
        uint256 txId;
        uint256 releaseTime;
        TxStatus status;
        TxParams params;
        bytes32 message;
        bytes result;
        PaymentDetails payment;
    }

    struct MetaTransaction {
        TxRecord txRecord;
        MetaTxParams params;
        bytes32 message;
        bytes signature;
        bytes data;
    }

    struct PaymentDetails {
        address recipient;
        uint256 nativeTokenAmount;
        address erc20TokenAddress;
        uint256 erc20TokenAmount;
    }

    struct Role {
        string roleName;
        bytes32 roleHash;
        address[] authorizedWallets;
        FunctionPermission[] functionPermissions;
        uint256 maxWallets;
        bool isProtected;
    }

    struct FunctionPermission {
        bytes4 functionSelector;
        TxAction grantedAction;
    }

    struct FunctionSchema {
        string functionName;
        bytes4 functionSelector;
        bytes32 operationType;
        TxAction[] supportedActions;
    }

    struct ReadableOperationType {
        bytes32 operationType;
        string name;
    }

    struct SecureOperationState {
        // ============ SYSTEM STATE ============
        bool initialized;
        uint256 txCounter;
        uint256 timeLockPeriodInMinutes;
        
        // ============ TRANSACTION MANAGEMENT ============
        mapping(uint256 => TxRecord) txRecords;
        uint256[] pendingTransactionsList;
        
        // ============ ROLE-BASED ACCESS CONTROL ============
        mapping(bytes32 => Role) roles;
        bytes32[] supportedRolesList;
        
        // ============ FUNCTION MANAGEMENT ============
        mapping(bytes4 => FunctionSchema) functions;
        bytes4[] supportedFunctionsList;
        
        // ============ OPERATION TYPES ============
        mapping(bytes32 => ReadableOperationType) supportedOperationTypes;
        bytes32[] supportedOperationTypesList;
        
        // ============ META-TRANSACTION SUPPORT ============
        mapping(address => uint256) signerNonces;
    }

    bytes32 constant OWNER_ROLE = keccak256(bytes("OWNER_ROLE"));
    bytes32 constant BROADCASTER_ROLE = keccak256(bytes("BROADCASTER_ROLE"));
    bytes32 constant RECOVERY_ROLE = keccak256(bytes("RECOVERY_ROLE"));

    // EIP-712 Type Hashes
    bytes32 private constant TYPE_HASH = keccak256("MetaTransaction(TxRecord txRecord,MetaTxParams params,bytes data)TxRecord(uint256 txId,uint256 releaseTime,uint8 status,TxParams params,bytes32 message,bytes result,PaymentDetails payment)TxParams(address requester,address target,uint256 value,uint256 gasLimit,bytes32 operationType,uint8 executionType,bytes executionOptions)MetaTxParams(uint256 chainId,uint256 nonce,address handlerContract,bytes4 handlerSelector,uint8 action,uint256 deadline,uint256 maxGasPrice,address signer)PaymentDetails(address recipient,uint256 nativeTokenAmount,address erc20TokenAddress,uint256 erc20TokenAmount)");
    bytes32 private constant DOMAIN_SEPARATOR_TYPE_HASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");


    event RequestedTx(uint256 indexed txId, uint256 releaseTime, address target, ExecutionType executionType, bytes executionOptions);
    event TxApproved(uint256 indexed txId);
    event TxCancelled(uint256 indexed txId);
    event TxExecuted(uint256 indexed txId, bool success, bytes result);

    // ============ SYSTEM STATE FUNCTIONS ============

    /**
     * @dev Initializes the SecureOperationState with the specified time lock period and roles.
     * @param self The SecureOperationState to initialize.
     * @param _timeLockPeriodInMinutes The time lock period in minutes.
     * @param _owner The address of the owner.
     * @param _broadcaster The address of the broadcaster.
     * @param _recovery The address of the recovery.
     */
    function initialize(
        SecureOperationState storage self,  
        address _owner, 
        address _broadcaster,
        address _recovery,
        uint256 _timeLockPeriodInMinutes
    ) public {
        SharedValidationLibrary.validateTrue(!self.initialized, SharedValidationLibrary.ERROR_ALREADY_INITIALIZED); 
        SharedValidationLibrary.validateNotZeroAddress(_owner, SharedValidationLibrary.ERROR_INVALID_ROLE_ADDRESS);
        SharedValidationLibrary.validateNotZeroAddress(_broadcaster, SharedValidationLibrary.ERROR_INVALID_ROLE_ADDRESS);
        SharedValidationLibrary.validateNotZeroAddress(_recovery, SharedValidationLibrary.ERROR_INVALID_ROLE_ADDRESS);
        SharedValidationLibrary.validateTimeLockPeriod(_timeLockPeriodInMinutes);

        self.timeLockPeriodInMinutes = _timeLockPeriodInMinutes;
        self.txCounter = 0;

        // Create base roles first
        createRole(self, "OWNER_ROLE", 1, true);
        createRole(self, "BROADCASTER_ROLE", 1, true);
        createRole(self, "RECOVERY_ROLE", 1, true);
        
        // Add authorized wallets to roles
        addAuthorizedWalletToRole(self, OWNER_ROLE, _owner);
        addAuthorizedWalletToRole(self, BROADCASTER_ROLE, _broadcaster);
        addAuthorizedWalletToRole(self, RECOVERY_ROLE, _recovery);

        // Load all definitions from the definition library
        MultiPhaseSecureOperationDefinitions.loadDefinitionContract(self);
        
        // Mark as initialized after successful setup
        self.initialized = true;
    }

    /**
     * @dev Updates the time lock period for the SecureOperationState.
     * @param self The SecureOperationState to modify.
     * @param _newTimeLockPeriodInMinutes The new time lock period in minutes.
     */
    function updateTimeLockPeriod(SecureOperationState storage self, uint256 _newTimeLockPeriodInMinutes) public {
        SharedValidationLibrary.validateTimeLockPeriod(_newTimeLockPeriodInMinutes);
        self.timeLockPeriodInMinutes = _newTimeLockPeriodInMinutes;
    }

    /**
     * @dev Gets the current time lock period for the SecureOperationState.
     * @param self The SecureOperationState to check.
     * @return The current time lock period in minutes.
     */
    function getTimeLockPeriod(SecureOperationState storage self) public view returns (uint256) {
        return self.timeLockPeriodInMinutes;
    }

    /**
     * @dev Gets the current transaction ID.
     * @param self The SecureOperationState to check.
     * @return The current transaction ID.
     */
    function getCurrentTxId(SecureOperationState storage self) public view returns (uint256) {
        return self.txCounter;
    }

    /**
     * @dev Gets the next transaction ID.
     * @param self The SecureOperationState to check.
     * @return The next transaction ID.
     */
    function getNextTxId(SecureOperationState storage self) private view returns (uint256) {
        return self.txCounter + 1;
    }

    /**
     * @dev Increments the transaction counter to set the next transaction ID.
     * @param self The SecureOperationState to modify.
     */
    function setNextTxId(SecureOperationState storage self) private {
        self.txCounter++;
    }

    // ============ TRANSACTION MANAGEMENT FUNCTIONS ============

    /**
     * @dev Gets the transaction record by its ID.
     * @param self The SecureOperationState to check.
     * @param txId The ID of the transaction to check.
     * @return The TxRecord associated with the transaction ID.
     */
    function getTxRecord(SecureOperationState storage self, uint256 txId) public view returns (TxRecord memory) {
        return self.txRecords[txId];
    }

    /**
     * @dev Requests a transaction with the specified parameters.
     * @param self The SecureOperationState to modify.
     * @param requester The address of the requester.
     * @param target The target contract address for the transaction.
     * @param value The value to send with the transaction.
     * @param gasLimit The gas limit for the transaction.
     * @param operationType The type of operation.
     * @param executionType The type of execution (STANDARD or RAW).
     * @param executionOptions The execution options for the transaction.
     * @return The created TxRecord.
     */
    function txRequest(
        SecureOperationState storage self,
        address requester,
        address target,
        uint256 value,
        uint256 gasLimit,
        bytes32 operationType,
        ExecutionType executionType,
        bytes memory executionOptions
    ) public returns (TxRecord memory) {
        SharedValidationLibrary.validateTrue(
            checkPermissionPermissive(self, MultiPhaseSecureOperationDefinitions.TX_REQUEST_SELECTOR) || checkPermissionPermissive(self, MultiPhaseSecureOperationDefinitions.META_TX_REQUEST_AND_APPROVE_SELECTOR),
            SharedValidationLibrary.ERROR_NO_PERMISSION_EXECUTE
        );
        SharedValidationLibrary.validateNotZeroAddress(target, SharedValidationLibrary.ERROR_INVALID_TARGET_ADDRESS);
        SharedValidationLibrary.validateOperationSupported(isOperationTypeSupported(self, operationType));

        TxRecord memory txRequestRecord = createNewTxRecord(
            self,
            requester,
            target,
            value,
            gasLimit,
            operationType,
            executionType,
            executionOptions
        );
    
        self.txRecords[txRequestRecord.txId] = txRequestRecord;
        setNextTxId(self);

        // Add to pending transactions list
        addToPendingTransactionsList(self, txRequestRecord.txId);

        emit RequestedTx(txRequestRecord.txId, txRequestRecord.releaseTime, txRequestRecord.params.target, txRequestRecord.params.executionType, txRequestRecord.params.executionOptions);
        
        return txRequestRecord;
    }

    /**
     * @dev Approves a pending transaction after the release time.
     * @param self The SecureOperationState to modify.
     * @param txId The ID of the transaction to approve.
     * @return The updated TxRecord.
     */
    function txDelayedApproval(SecureOperationState storage self, uint256 txId) public returns (TxRecord memory) {
        checkPermission(self, MultiPhaseSecureOperationDefinitions.TX_DELAYED_APPROVAL_SELECTOR);
        SharedValidationLibrary.validatePendingTransaction(uint8(self.txRecords[txId].status));
        SharedValidationLibrary.validateReleaseTime(self.txRecords[txId].releaseTime);
        
        (bool success, bytes memory result) = executeTransaction(self.txRecords[txId]);
        
        // Update storage with new status and result
        if (success) {
            self.txRecords[txId].status = TxStatus.COMPLETED;
            self.txRecords[txId].result = result;
        } else {
            self.txRecords[txId].status = TxStatus.FAILED;
        }
        
        // Remove from pending transactions list
        removeFromPendingTransactionsList(self, txId);
        
        emit TxApproved(txId);
        emit TxExecuted(txId, success, result);
        
        return self.txRecords[txId];
    }

    /**
     * @dev Cancels a pending transaction.
     * @param self The SecureOperationState to modify.
     * @param txId The ID of the transaction to cancel.
     * @return The updated TxRecord.
     */
    function txCancellation(SecureOperationState storage self, uint256 txId) public returns (TxRecord memory) {
        checkPermission(self, MultiPhaseSecureOperationDefinitions.TX_CANCELLATION_SELECTOR);
        SharedValidationLibrary.validatePendingTransaction(uint8(self.txRecords[txId].status));
        
        self.txRecords[txId].status = TxStatus.CANCELLED;
        
        // Remove from pending transactions list
        removeFromPendingTransactionsList(self, txId);
        
        emit TxCancelled(txId);
        
        return self.txRecords[txId];
    }

    /**
     * @dev Cancels a pending transaction using a meta-transaction.
     * @param self The SecureOperationState to modify.
     * @param metaTx The meta-transaction containing the signature and nonce.
     * @return The updated TxRecord.
     */
    function txCancellationWithMetaTx(SecureOperationState storage self, MetaTransaction memory metaTx) public returns (TxRecord memory) {
        uint256 txId = metaTx.txRecord.txId;
        checkPermission(self, MultiPhaseSecureOperationDefinitions.META_TX_CANCELLATION_SELECTOR);
        SharedValidationLibrary.validatePendingTransaction(uint8(self.txRecords[txId].status));
        SharedValidationLibrary.validateTrue(verifySignature(self, metaTx), SharedValidationLibrary.ERROR_INVALID_SIGNATURE);
        
        incrementSignerNonce(self, metaTx.params.signer);
        self.txRecords[txId].status = TxStatus.CANCELLED;
        
        // Remove from pending transactions list
        removeFromPendingTransactionsList(self, txId);
        
        emit TxCancelled(txId);
        
        return self.txRecords[txId];
    }

    /**
     * @dev Approves a pending transaction immediately using a meta-transaction.
     * @param self The SecureOperationState to modify.
     * @param metaTx The meta-transaction containing the signature and nonce.
     * @return The updated TxRecord.
     */
    function txApprovalWithMetaTx(SecureOperationState storage self, MetaTransaction memory metaTx) public returns (TxRecord memory) {
        uint256 txId = metaTx.txRecord.txId;
        checkPermission(self, MultiPhaseSecureOperationDefinitions.META_TX_APPROVAL_SELECTOR);
        SharedValidationLibrary.validatePendingTransaction(uint8(self.txRecords[txId].status));
        SharedValidationLibrary.validateTrue(verifySignature(self, metaTx), SharedValidationLibrary.ERROR_INVALID_SIGNATURE);
        
        incrementSignerNonce(self, metaTx.params.signer);
        (bool success, bytes memory result) = executeTransaction(self.txRecords[txId]);
        
        // Update storage with new status and result
        if (success) {
            self.txRecords[txId].status = TxStatus.COMPLETED;
            self.txRecords[txId].result = result;
        } else {
            self.txRecords[txId].status = TxStatus.FAILED;
        }
        
        // Remove from pending transactions list
        removeFromPendingTransactionsList(self, txId);
        
        emit TxApproved(txId);
        emit TxExecuted(txId, success, result);
        
        return self.txRecords[txId];
    }

    /**
     * @dev Requests and immediately approves a transaction.
     * @param self The SecureOperationState to modify.
     * @param metaTx The meta-transaction containing the signature and nonce.
     * @return The updated TxRecord.
     */
    function requestAndApprove(
        SecureOperationState storage self,
        MetaTransaction memory metaTx
    ) public returns (TxRecord memory) {
        checkPermission(self, MultiPhaseSecureOperationDefinitions.META_TX_REQUEST_AND_APPROVE_SELECTOR);
        
        TxRecord memory txRecord = txRequest(
            self,
            metaTx.txRecord.params.requester,
            metaTx.txRecord.params.target,
            metaTx.txRecord.params.value,
            metaTx.txRecord.params.gasLimit,
            metaTx.txRecord.params.operationType,
            metaTx.txRecord.params.executionType,
            metaTx.txRecord.params.executionOptions
        );

        metaTx.txRecord = txRecord;
        return txApprovalWithMetaTx(self, metaTx);
    }

    /**
     * @dev Executes a transaction based on its execution type.
     * @param record The transaction record to execute.
     * @return A tuple containing the success status and result of the execution.
     */
    function executeTransaction(TxRecord memory record) private returns (bool, bytes memory) {
        bytes memory txData = prepareTransactionData(record);
        uint gas = record.params.gasLimit;
        if (gas == 0) {
            gas = gasleft();
        }
        (bool success, bytes memory result) = record.params.target.call{value: record.params.value, gas: gas}(
            txData
        );

        if (success) {
            record.status = TxStatus.COMPLETED;
            record.result = result;
        } else {
            record.status = TxStatus.FAILED;
        }

        return (success, result);
    }

    /**
     * @dev Prepares transaction data based on execution type without executing it.
     * @param record The transaction record to prepare data for.
     * @return The prepared transaction data.
     */
    function prepareTransactionData(TxRecord memory record) private pure returns (bytes memory) {
        if (record.params.executionType == ExecutionType.STANDARD) {
            StandardExecutionOptions memory options = abi.decode(record.params.executionOptions, (StandardExecutionOptions));
            return abi.encodePacked(options.functionSelector, options.params);
        } else if (record.params.executionType == ExecutionType.RAW) {
            RawExecutionOptions memory options = abi.decode(record.params.executionOptions, (RawExecutionOptions));
            return options.rawTxData;
        } else {
            revert(SharedValidationLibrary.ERROR_OPERATION_NOT_SUPPORTED);
        }
    }

    /**
     * @dev Creates StandardExecutionOptions with proper encoding
     * @param functionSelector The function selector to call
     * @param params The encoded parameters for the function
     * @return Encoded execution options ready for use in a transaction
     */
    function createStandardExecutionOptions(
        bytes4 functionSelector,
        bytes memory params
    ) public pure returns (bytes memory) {
        StandardExecutionOptions memory options = StandardExecutionOptions({
            functionSelector: functionSelector,
            params: params
        });
        return abi.encode(options);
    }

    /**
     * @dev Creates RawExecutionOptions with proper encoding
     * @param rawTxData The raw transaction data
     * @return Encoded execution options ready for use in a transaction
     */
    function createRawExecutionOptions(
        bytes memory rawTxData
    ) public pure returns (bytes memory) {
        RawExecutionOptions memory options = RawExecutionOptions({
            rawTxData: rawTxData
        });
        return abi.encode(options);
    }

    /**
     * @notice Creates a new transaction record with basic fields populated
     * @dev Initializes a TxRecord struct with the provided parameters and default values
     * @param self The SecureOperationState to reference for txId and timelock
     * @param requester The address initiating the transaction
     * @param target The contract address that will receive the transaction
     * @param value The amount of native tokens to send with the transaction
     * @param gasLimit The maximum gas allowed for the transaction
     * @param operationType The type of operation being performed
     * @param executionType The method of execution (STANDARD or RAW)
     * @param executionOptions The encoded parameters for the execution
     * @return TxRecord A new transaction record with populated fields
     */
    function createNewTxRecord(
        SecureOperationState storage self,
        address requester,
        address target,
        uint256 value,
        uint256 gasLimit,
        bytes32 operationType,
        ExecutionType executionType,
        bytes memory executionOptions
    ) private view returns (TxRecord memory) {        
        return TxRecord({
            txId: getNextTxId(self),
            releaseTime: block.timestamp + (self.timeLockPeriodInMinutes * 1 minutes),
            status: TxStatus.PENDING,
            params: TxParams({
                requester: requester,
                target: target,
                value: value,
                gasLimit: gasLimit,
                operationType: operationType,
                executionType: executionType,
                executionOptions: executionOptions
            }),
            message: bytes32(0),
            result: new bytes(0),
            payment: PaymentDetails({
                recipient: address(0),
                nativeTokenAmount: 0,
                erc20TokenAddress: address(0),
                erc20TokenAmount: 0
            })
        });
    }

    /**
     * @dev Adds a transaction ID to the pending transactions list.
     * @param self The SecureOperationState to modify.
     * @param txId The transaction ID to add to the pending list.
     */
    function addToPendingTransactionsList(SecureOperationState storage self, uint256 txId) private {
        SharedValidationLibrary.validateTrue(txId > 0, SharedValidationLibrary.ERROR_TRANSACTION_NOT_FOUND);
        SharedValidationLibrary.validatePendingTransaction(uint8(self.txRecords[txId].status));
        
        // Check if transaction ID is already in the list
        for (uint i = 0; i < self.pendingTransactionsList.length; i++) {
            SharedValidationLibrary.validateTrue(self.pendingTransactionsList[i] != txId, SharedValidationLibrary.ERROR_REQUEST_ALREADY_PENDING);
        }
        
        self.pendingTransactionsList.push(txId);
    }

    /**
     * @dev Removes a transaction ID from the pending transactions list.
     * @param self The SecureOperationState to modify.
     * @param txId The transaction ID to remove from the pending list.
     */
    function removeFromPendingTransactionsList(SecureOperationState storage self, uint256 txId) private {
        SharedValidationLibrary.validateTrue(txId > 0, SharedValidationLibrary.ERROR_TRANSACTION_NOT_FOUND);
        
        // Find and remove the transaction ID from the list
        for (uint i = 0; i < self.pendingTransactionsList.length; i++) {
            if (self.pendingTransactionsList[i] == txId) {
                // Move the last element to the position of the element to delete
                self.pendingTransactionsList[i] = self.pendingTransactionsList[self.pendingTransactionsList.length - 1];
                // Remove the last element
                self.pendingTransactionsList.pop();
                return;
            }
        }
        
        revert(SharedValidationLibrary.ERROR_TRANSACTION_NOT_FOUND);
    }

    /**
     * @dev Gets all pending transaction IDs.
     * @param self The SecureOperationState to check.
     * @return Array of pending transaction IDs.
     */
    function getPendingTransactionsList(SecureOperationState storage self) private view returns (uint256[] memory) {
        return self.pendingTransactionsList;
    }

    // ============ ROLE-BASED ACCESS CONTROL FUNCTIONS ============

    /**
     * @dev Checks if the caller has permission to execute a function.
     * @param self The SecureOperationState to check.
     * @param functionSelector The selector of the function to check permissions for.
     */
    function checkPermission(SecureOperationState storage self, bytes4 functionSelector) public view {
        bool hasPermission = checkPermissionPermissive(self,functionSelector);       
        SharedValidationLibrary.validateTrue(hasPermission, SharedValidationLibrary.ERROR_NO_PERMISSION);
    }

    /**
     * @dev Checks if the caller has permission to execute a function.
     * @param self The SecureOperationState to check.
     * @param functionSelector The selector of the function to check permissions for.
     * @return True if the caller has permission, false otherwise.
     */
    function checkPermissionPermissive(SecureOperationState storage self, bytes4 functionSelector) private view returns (bool) {
        // Check if caller has any role that grants permission for this function
        for (uint i = 0; i < self.supportedRolesList.length; i++) {
            bytes32 roleHash = self.supportedRolesList[i];
            Role storage role = self.roles[roleHash];
            
            (bool hasRole,) = findWalletInRole(self, roleHash, msg.sender);
            if (hasRole) {
                // Check if role has permission for this function
                for (uint j = 0; j < role.functionPermissions.length; j++) {
                    FunctionPermission storage permission = role.functionPermissions[j];
                    if (permission.functionSelector == functionSelector) {
                        return true; // Role has permission for this function
                    }
                }
            }
        }
        return false;
    }

    /**
     * @dev Checks if a signer has meta-transaction signing permissions for a specific function selector and action.
     * @param self The SecureOperationState to check.
     * @param signer The address of the signer to check.
     * @param functionSelector The function selector to check permissions for.
     * @param requestedAction The specific action being requested in the meta-transaction.
     * @return True if the signer has meta-transaction signing permissions for the function and action, false otherwise.
     */
    function hasMetaTxSigningPermission(
        SecureOperationState storage self,
        address signer,
        bytes4 functionSelector,
        TxAction requestedAction
    ) private view returns (bool) {
        // Check if signer has any role that grants meta-transaction signing permissions for this function
        for (uint i = 0; i < self.supportedRolesList.length; i++) {
            bytes32 roleHash = self.supportedRolesList[i];
            Role storage role = self.roles[roleHash];
            
            (bool hasRole,) = findWalletInRole(self, roleHash, signer);
            if (hasRole) {
                // Check if role has meta-transaction signing permissions for this function
                for (uint j = 0; j < role.functionPermissions.length; j++) {
                    FunctionPermission storage permission = role.functionPermissions[j];
                    if (permission.functionSelector == functionSelector) {
                        // Check if the granted action matches the requested action
                        TxAction grantedAction = permission.grantedAction;
                        if (grantedAction == requestedAction) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    /**
     * @dev Creates a role with specified function permissions.
     * @param self The SecureOperationState to check.
     * @param roleName Name of the role.
     * @param maxWallets Maximum number of wallets allowed for this role.
     * @param isProtected Whether the role is protected from removal.
     */
    function createRole(
        SecureOperationState storage self,
        string memory roleName,
        uint256 maxWallets,
        bool isProtected
    ) public {
        bytes32 roleHash = keccak256(bytes(roleName));
        SharedValidationLibrary.validateRoleNew(self.roles[roleHash].roleHash);
        
        // Create the role with empty arrays
        self.roles[roleHash].roleName = roleName;
        self.roles[roleHash].roleHash = roleHash;
        self.roles[roleHash].maxWallets = maxWallets;
        self.roles[roleHash].isProtected = isProtected;
        
        self.supportedRolesList.push(roleHash);
    }

    /**
     * @dev Removes a role from the system.
     * @param self The SecureOperationState to modify.
     * @param roleHash The hash of the role to remove.
     * @notice Security: Cannot remove protected roles to maintain system integrity.
     */
    function removeRole(
        SecureOperationState storage self,
        bytes32 roleHash
    ) public {
        // Validate that the role exists
        SharedValidationLibrary.validateRoleExists(self.roles[roleHash].roleHash);
        
        // Security check: Prevent removing protected roles
        Role memory role = self.roles[roleHash];
        if (role.isProtected) {
            revert(SharedValidationLibrary.ERROR_CANNOT_REMOVE_PROTECTED_ROLE);
        }
        
        // Remove the role from the supported roles list
        for (uint i = 0; i < self.supportedRolesList.length; i++) {
            if (self.supportedRolesList[i] == roleHash) {
                // Move the last element to the position of the element to delete
                self.supportedRolesList[i] = self.supportedRolesList[self.supportedRolesList.length - 1];
                // Remove the last element
                self.supportedRolesList.pop();
                break;
            }
        }
        
        // Clear the role data
        delete self.roles[roleHash];
    }

    /**
     * @dev Gets the role by its hash.
     * @param self The SecureOperationState to check.
     * @param role The role to get the hash for.
     * @return The role associated with the hash, or Role(0) if the role doesn't exist.
     */
    function getRole(SecureOperationState storage self, bytes32 role) public view returns (Role memory) {
        return self.roles[role];
    }

    /**
     * @dev Adds a wallet address to a role in the roles mapping.
     * @param self The SecureOperationState to modify.
     * @param role The role hash to add the wallet to.
     * @param wallet The wallet address to add.
     */
    function addAuthorizedWalletToRole(SecureOperationState storage self, bytes32 role, address wallet) public {
        SharedValidationLibrary.validateNotZeroAddress(wallet, SharedValidationLibrary.ERROR_CANNOT_ADD_ZERO_ADDRESS);
        SharedValidationLibrary.validateRoleExists(getRole(self, role).roleHash);
        
        Role memory roleData = getRole(self, role);
        SharedValidationLibrary.validateWalletLimit(roleData.authorizedWallets.length, roleData.maxWallets);
        
        // Check if wallet is already in the role
        (bool isInRole,) = findWalletInRole(self, role, wallet);
        SharedValidationLibrary.validateWalletNotInRole(isInRole);
        
        self.roles[role].authorizedWallets.push(wallet);
    }

    /**
     * @dev Finds a wallet in a role and returns its existence status and position.
     * @param self The SecureOperationState to check.
     * @param role The role to check.
     * @param wallet The address to find in the role.
     * @return found True if the address has the role, false otherwise.
     * @return index The index of the wallet in the role's authorizedWallets array, or 0 if not found.
     */
    function findWalletInRole(SecureOperationState storage self, bytes32 role, address wallet) public view returns (bool found, uint256 index) {
        Role memory roleData = getRole(self, role);
        if (roleData.roleHash == bytes32(0)) {
            return (false, 0);
        }
        
        for (uint i = 0; i < roleData.authorizedWallets.length; i++) {
            if (roleData.authorizedWallets[i] == wallet) {
                return (true, i);
            }
        }
        return (false, 0);
    }

    /**
     * @dev Updates a role from an old address to a new address.
     * @param self The SecureOperationState to modify.
     * @param role The role to update.
     * @param newWallet The new wallet address to assign the role to.
     * @param oldWallet The old wallet address to remove from the role.
     */
    function updateAuthorizedWalletInRole(SecureOperationState storage self, bytes32 role, address newWallet, address oldWallet) public {
        SharedValidationLibrary.validateRoleExists(self.roles[role].roleHash);
        SharedValidationLibrary.validateNotZeroAddress(newWallet, SharedValidationLibrary.ERROR_CANNOT_SET_ZERO_ADDRESS);
        
        // Use findWalletInRole to get the index directly instead of linear search
        (bool found, uint256 index) = findWalletInRole(self, role, oldWallet);
        if (!found) {
            revert(SharedValidationLibrary.ERROR_OLD_WALLET_NOT_FOUND);
        }
        
        // Update the wallet at the found index
        self.roles[role].authorizedWallets[index] = newWallet;
    }

    /**
     * @dev Removes a wallet from a role.
     * @param self The SecureOperationState to modify.
     * @param role The role to remove the wallet from.
     * @param wallet The wallet address to remove.
     * @notice Security: Cannot remove the last wallet from a role to prevent empty roles.
     */
    function removeWalletFromRole(SecureOperationState storage self, bytes32 role, address wallet) public {
        SharedValidationLibrary.validateRoleExists(self.roles[role].roleHash);
        
        // Use findWalletInRole to get the index directly
        (bool found, uint256 index) = findWalletInRole(self, role, wallet);
        if (!found) {
            revert(SharedValidationLibrary.ERROR_OLD_WALLET_NOT_FOUND);
        }
        
        // Security check: Prevent removing the last wallet from a role
        address[] storage wallets = self.roles[role].authorizedWallets;
        if (wallets.length <= 1) {
            revert(SharedValidationLibrary.ERROR_CANNOT_REMOVE_LAST_WALLET);
        }
        
        // Remove the wallet using efficient array removal (swap with last element and pop)
        uint256 lastIndex = wallets.length - 1;
        
        if (index != lastIndex) {
            // Move the last element to the position of the element to delete
            wallets[index] = wallets[lastIndex];
        }
        
        // Remove the last element
        wallets.pop();
    }

    /**
     * @dev Adds a function permission to an existing role.
     * @param self The SecureOperationState to modify.
     * @param roleHash The role hash to add the function permission to.
     * @param functionSelector The function selector to add permission for.
     * @param grantedAction The action granted for this function selector.
     */
    function addFunctionToRole(
        SecureOperationState storage self,
        bytes32 roleHash,
        bytes4 functionSelector,
        TxAction grantedAction
    ) public {
        SharedValidationLibrary.validateRoleExists(self.roles[roleHash].roleHash);
        SharedValidationLibrary.validateFunctionExists(self.functions[functionSelector].functionSelector);
        
        // Validate that the grantedAction is supported by the function
        SharedValidationLibrary.validateActionSupported(isActionSupportedByFunction(self, functionSelector, grantedAction));
        
        Role storage role = self.roles[roleHash];
        
        // Check if permission already exists
        bool permissionExists = false;
        for (uint i = 0; i < role.functionPermissions.length; i++) {
            if (role.functionPermissions[i].functionSelector == functionSelector) {
                permissionExists = true;
                break;
            }
        }
        SharedValidationLibrary.validatePermissionNew(permissionExists);
        
        // If it doesn't exist, add it
        role.functionPermissions.push(FunctionPermission({
            functionSelector: functionSelector,
            grantedAction: grantedAction
        }));
    }

    // ============ FUNCTION MANAGEMENT FUNCTIONS ============

    /**
     * @dev Creates a function access control with specified permissions.
     * @param self The SecureOperationState to check.
     * @param functionName Name of the function.
     * @param functionSelector Hash identifier for the function.
     * @param operationType The operation type this function belongs to.
     * @param supportedActions Array of permissions required to execute this function.
     */
    function createFunctionSchema(
        SecureOperationState storage self,
        string memory functionName,
        bytes4 functionSelector,
        bytes32 operationType,
        TxAction[] memory supportedActions
    ) public {
        SharedValidationLibrary.validateFunctionNew(self.functions[functionSelector].functionSelector);
        self.functions[functionSelector] = FunctionSchema({
            functionName: functionName,
            functionSelector: functionSelector,
            operationType: operationType,
            supportedActions: supportedActions
        });
        self.supportedFunctionsList.push(functionSelector);
    }

    /**
     * @dev Checks if a specific action is supported by a function.
     * @param self The SecureOperationState to check.
     * @param functionSelector The function selector to check.
     * @param action The action to check for support.
     * @return True if the action is supported by the function, false otherwise.
     */
    function isActionSupportedByFunction(
        SecureOperationState storage self,
        bytes4 functionSelector,
        TxAction action
    ) private view returns (bool) {
        FunctionSchema memory functionSchema = self.functions[functionSelector];
        if (functionSchema.functionSelector == bytes4(0)) {
            return false; 
        }
        
        for (uint i = 0; i < functionSchema.supportedActions.length; i++) {
            if (functionSchema.supportedActions[i] == action) {
                return true;
            }
        }
        return false;
    }

    // ============ OPERATION TYPES FUNCTIONS ============

    /**
    * @dev Registers a new operation type with a human-readable name
    * @param self The SecureOperationState to modify
    * @param readableType The operation type with its human-readable name
    */
    function addOperationType(
        SecureOperationState storage self,
        ReadableOperationType memory readableType
    ) public {
        SharedValidationLibrary.validateOperationTypeNew(self.supportedOperationTypes[readableType.operationType].operationType != bytes32(0));
        self.supportedOperationTypes[readableType.operationType] = readableType;
        self.supportedOperationTypesList.push(readableType.operationType);
    }

    /**
     * @dev Checks if an operation type is supported
     * @param self The SecureOperationState to check
     * @param operationType The operation type to check
     * @return bool True if the operation type is supported
     */
    function isOperationTypeSupported(SecureOperationState storage self, bytes32 operationType) private view returns (bool) {
        return self.supportedOperationTypes[operationType].operationType != bytes32(0);
    }

    /**
     * @dev Gets all supported operation types
     * @param self The SecureOperationState to check
     * @return Array of supported operation type hashes
     */
    function getSupportedOperationTypes(
        SecureOperationState storage self
    ) public view returns (bytes32[] memory) {
        return self.supportedOperationTypesList;
    }

    // ============ META-TRANSACTION SUPPORT FUNCTIONS ============

    /**
     * @dev Gets the current nonce for a specific signer.
     * @param self The SecureOperationState to check.
     * @param signer The address of the signer.
     * @return The current nonce for the signer.
     */
    function getSignerNonce(SecureOperationState storage self, address signer) public view returns (uint256) {
        return self.signerNonces[signer];
    }

    /**
     * @dev Increments the nonce for a specific signer.
     * @param self The SecureOperationState to modify.
     * @param signer The address of the signer.
     */
    function incrementSignerNonce(SecureOperationState storage self, address signer) private {
        self.signerNonces[signer]++;
    }

    /**
     * @dev Verifies the signature of a meta-transaction with detailed error reporting
     * @param self The SecureOperationState to check against
     * @param metaTx The meta-transaction containing the signature to verify
     * @return True if the signature is valid, false otherwise
     */
    function verifySignature(
        SecureOperationState storage self,
        MetaTransaction memory metaTx
    ) public view returns (bool) {
        // Basic validation
        SharedValidationLibrary.validateSignatureLength(metaTx.signature);
        SharedValidationLibrary.validatePendingTransaction(uint8(metaTx.txRecord.status));
        
        // Transaction parameters validation
        SharedValidationLibrary.validateNotZeroAddress(metaTx.txRecord.params.requester, SharedValidationLibrary.ERROR_INVALID_REQUESTER_ADDRESS);
        SharedValidationLibrary.validateOperationSupported(isOperationTypeSupported(self, metaTx.txRecord.params.operationType));
        
        // Meta-transaction parameters validation
        SharedValidationLibrary.validateChainId(metaTx.params.chainId);
        SharedValidationLibrary.validateHandlerContract(metaTx.params.handlerContract, metaTx.txRecord.params.target);
        SharedValidationLibrary.validateMetaTxDeadline(metaTx.params.deadline);
        
        // Gas price validation (if applicable)
        // SharedValidationLibrary.validateGasPrice(metaTx.params.maxGasPrice);
        
        // Validate signer-specific nonce
        SharedValidationLibrary.validateNonce(metaTx.params.nonce, getSignerNonce(self, metaTx.params.signer));

        // Validate txId matches expected next transaction ID
        SharedValidationLibrary.validateTransactionId(metaTx.txRecord.txId, getNextTxId(self));
        
        // Signature verification
        bytes32 messageHash = generateMessageHash(metaTx);
        address recoveredSigner = recoverSigner(messageHash, metaTx.signature);
        require(recoveredSigner == metaTx.params.signer, SharedValidationLibrary.ERROR_INVALID_SIGNATURE);

        // Authorization check - verify signer has meta-transaction signing permissions for the function and action
        bool isAuthorized = hasMetaTxSigningPermission(self, metaTx.params.signer, metaTx.params.handlerSelector, metaTx.params.action);
        SharedValidationLibrary.validateTrue(isAuthorized, SharedValidationLibrary.ERROR_SIGNER_NOT_AUTHORIZED);
        
        return true;
    }

    /**
     * @dev Generates a message hash for the specified meta-transaction following EIP-712
     * @param metaTx The meta-transaction to generate the hash for
     * @return The generated message hash
     */
    function generateMessageHash(MetaTransaction memory metaTx) private view returns (bytes32) {
        bytes32 domainSeparator = keccak256(abi.encode(
            DOMAIN_SEPARATOR_TYPE_HASH,
            keccak256("MultiPhaseSecureOperation"),
            keccak256("1"),
            block.chainid,
            address(this)
        ));

        bytes32 structHash = keccak256(abi.encode(
            TYPE_HASH,
            keccak256(abi.encode(
                metaTx.txRecord.txId,
                metaTx.txRecord.params.requester,
                metaTx.txRecord.params.target,
                metaTx.txRecord.params.value,
                metaTx.txRecord.params.gasLimit,
                metaTx.txRecord.params.operationType,
                uint8(metaTx.txRecord.params.executionType),
                keccak256(metaTx.txRecord.params.executionOptions)
            )),
            metaTx.params.chainId,
            metaTx.params.nonce,
            metaTx.params.handlerContract,
            metaTx.params.handlerSelector,
            uint8(metaTx.params.action),
            metaTx.params.deadline,
            metaTx.params.maxGasPrice
        ));

        return keccak256(abi.encodePacked(
            "\x19\x01",
            domainSeparator,
            structHash
        ));
    }

    /**
     * @dev Recovers the signer address from a message hash and signature.
     * @param messageHash The hash of the message that was signed.
     * @param signature The signature to recover the address from.
     * @return The address of the signer.
     */
    function recoverSigner(bytes32 messageHash, bytes memory signature) private pure returns (address) {
        SharedValidationLibrary.validateSignatureLength(signature);

        bytes32 r;
        bytes32 s;
        uint8 v;

        // More efficient assembly block with better memory safety
        assembly {
            // First 32 bytes stores the length of the signature
            // add(signature, 32) = pointer of sig + 32
            // effectively, skips first 32 bytes of signature
            r := mload(add(signature, 0x20))
            // add(signature, 64) = pointer of sig + 64
            // effectively, skips first 64 bytes of signature
            s := mload(add(signature, 0x40))
            // add(signature, 96) = pointer of sig + 96
            // effectively, skips first 96 bytes of signature
            // byte(0, mload(add(signature, 96))) = first byte of the next 32 bytes
            v := byte(0, mload(add(signature, 0x60)))
        }

        // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
        // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
        // the valid range for s in (301): 0 < s < secp256k1n ÷ 2 + 1, and for v in (302): v ∈ {27, 28}
        SharedValidationLibrary.validateSignatureParams(s, v);

        address signer = ecrecover(messageHash.toEthSignedMessageHash(), v, r, s);
        SharedValidationLibrary.validateRecoveredSigner(signer);

        return signer;
    }


    /**
     * @dev Creates a meta-transaction for a new operation
     */
    function generateUnsignedForNewMetaTx(
        SecureOperationState storage self,
        TxParams memory txParams,
        MetaTxParams memory metaTxParams
    ) public view returns (MetaTransaction memory) {
        SharedValidationLibrary.validateOperationSupported(isOperationTypeSupported(self, txParams.operationType));
        SharedValidationLibrary.validateNotZeroAddress(txParams.target, SharedValidationLibrary.ERROR_INVALID_TARGET_ADDRESS);
        
        TxRecord memory txRecord = createNewTxRecord(
            self,
            txParams.requester,
            txParams.target,
            txParams.value,
            txParams.gasLimit,
            txParams.operationType,
            txParams.executionType,
            txParams.executionOptions
        );

         MetaTransaction memory res = generateMetaTransaction(self, txRecord, metaTxParams);
         return res;
    }

    /**
     * @dev Creates a meta-transaction for an existing transaction
     */
    function generateUnsignedForExistingMetaTx(
        SecureOperationState storage self,
        uint256 txId,
        MetaTxParams memory metaTxParams
    ) public view returns (MetaTransaction memory) {
        TxRecord memory txRecord = getTxRecord(self, txId);
        require(txRecord.txId == txId, SharedValidationLibrary.ERROR_TRANSACTION_NOT_FOUND);
        
        return generateMetaTransaction(self, txRecord, metaTxParams);
    }

    /**
     * @notice Creates a meta-transaction structure with default parameters
     * @dev Initializes a MetaTransaction with transaction record data and empty signature fields.
     *      The caller is responsible for filling in the following fields:
     *      - handlerContract: The contract that will handle the meta-transaction
     *      - handlerSelector: The function selector for the handler
     *      - deadline: The timestamp after which the meta-transaction expires
     *      - maxGasPrice: The maximum gas price allowed for execution
     *      - signer: The address that will sign the meta-transaction
     * @param self The SecureOperationState to reference for nonce
     * @param txRecord The transaction record to include in the meta-transaction
     * @param metaTxParams The meta-transaction parameters to include in the meta-transaction
     * @return MetaTransaction A new meta-transaction structure with default values
     */
    function generateMetaTransaction(
        SecureOperationState storage self,
        TxRecord memory txRecord,
        MetaTxParams memory metaTxParams
    ) private view returns (MetaTransaction memory) {
        SharedValidationLibrary.validateChainId(metaTxParams.chainId);
        SharedValidationLibrary.validateNonce(metaTxParams.nonce, getSignerNonce(self, metaTxParams.signer));
        SharedValidationLibrary.validateNotZeroAddress(metaTxParams.handlerContract, SharedValidationLibrary.ERROR_INVALID_HANDLER_CONTRACT);
        SharedValidationLibrary.validateHandlerSelector(metaTxParams.handlerSelector);
        SharedValidationLibrary.validateDeadline(metaTxParams.deadline);
        SharedValidationLibrary.validateNotZeroAddress(metaTxParams.signer, SharedValidationLibrary.ERROR_INVALID_SIGNER_ADDRESS);

        MetaTransaction memory metaTx = MetaTransaction({
            txRecord: txRecord,
            params: metaTxParams,
            message: bytes32(0),
            signature: new bytes(0),
            data: prepareTransactionData(txRecord)
        });

        // Generate the message hash for ready to sign meta-transaction
        bytes32 msgHash = generateMessageHash(metaTx);
        metaTx.message = msgHash;

        return metaTx;
    }

    /**
     * @notice Creates meta-transaction parameters with specified values
     * @dev Helper function to create properly formatted MetaTxParams
     * @param handlerContract The contract that will handle the meta-transaction
     * @param handlerSelector The function selector for the handler
     * @param action The transaction action type
     * @param deadline The timestamp after which the meta-transaction expires
     * @param maxGasPrice The maximum gas price allowed for execution
     * @param signer The address that will sign the meta-transaction
     * @return MetaTxParams The formatted meta-transaction parameters
     */
    function createMetaTxParams(
        SecureOperationState storage self,
        address handlerContract,
        bytes4 handlerSelector,
        TxAction action,
        uint256 deadline,
        uint256 maxGasPrice,
        address signer
    ) public view returns (MetaTxParams memory) {
        SharedValidationLibrary.validateNotZeroAddress(handlerContract, SharedValidationLibrary.ERROR_INVALID_HANDLER_CONTRACT);
        SharedValidationLibrary.validateHandlerSelector(handlerSelector);
        SharedValidationLibrary.validateDeadline(deadline);
        SharedValidationLibrary.validateNotZeroAddress(signer, SharedValidationLibrary.ERROR_INVALID_SIGNER_ADDRESS);
        return MetaTxParams({
            chainId: block.chainid,
            nonce: getSignerNonce(self, signer),
            handlerContract: handlerContract,
            handlerSelector: handlerSelector,
            action: action,
            deadline:  deadline,
            maxGasPrice: maxGasPrice,
            signer: signer
        });
    }

    // /**
    //  * @dev Executes the payment associated with a meta-transaction.
    //  * @param self The SecureOperationState to modify.
    //  * @param metaTx The meta-transaction containing the payment details.
    //  * @notice This function verifies the signature of the meta-transaction and transfers
    //  *         the specified native tokens and/or ERC20 tokens to the recipient.
    //  */
    // function executePayment(
    //     SecureOperationState storage self,
    //     MetaTransaction memory metaTx
    // ) public {
    //     require(verifySignature(self, metaTx), "Invalid signature");

    //     PaymentDetails memory payment = metaTx.txRecord.payment;
    //     if (payment.nativeTokenAmount > 0) {
    //         require(address(this).balance >= payment.nativeTokenAmount, "Insufficient native token balance");
    //         (bool success, ) = payment.recipient.call{value: payment.nativeTokenAmount}("");
    //         require(success, "Native token transfer failed");
    //     }
        
    //     if (payment.erc20TokenAmount > 0) {
    //         require(payment.erc20TokenAddress != address(0), "Invalid token address");
    //         IERC20 erc20Token = IERC20(payment.erc20TokenAddress);
    //         require(erc20Token.balanceOf(address(this)) >= payment.erc20TokenAmount, "Insufficient token balance");
            
    //         bool success = erc20Token.transfer(payment.recipient, payment.erc20TokenAmount);
    //         require(success, "ERC20 token transfer failed");
    //     }

    //     self.txRecords[metaTx.txRecord.txId].payment = payment;
    // }

}
