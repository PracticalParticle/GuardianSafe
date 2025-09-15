// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

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
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.AddressSet;

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
        EnumerableSet.AddressSet authorizedWallets;
        FunctionPermission[] functionPermissions;
        uint256 maxWallets;
        bool isProtected;
    }

    struct FunctionPermission {
        bytes4 functionSelector;
        TxAction[] grantedActions;
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
        EnumerableSet.UintSet pendingTransactionsSet;
        
        // ============ ROLE-BASED ACCESS CONTROL ============
        mapping(bytes32 => Role) roles;
        EnumerableSet.Bytes32Set supportedRolesSet;
        
        // ============ FUNCTION MANAGEMENT ============
        mapping(bytes4 => FunctionSchema) functions;
        EnumerableSet.Bytes32Set supportedFunctionsSet; // Using Bytes32Set for bytes4 selectors
        
        // ============ OPERATION TYPES ============
        mapping(bytes32 => ReadableOperationType) supportedOperationTypes;
        EnumerableSet.Bytes32Set supportedOperationTypesSet;
        
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
    event PaymentUpdated(uint256 indexed txId, address recipient, uint256 nativeAmount, uint256 erc20Amount);
    event PaymentExecuted(uint256 indexed txId, bool success, bytes result);

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
        if (self.initialized) revert SharedValidationLibrary.AlreadyInitialized();
        SharedValidationLibrary.validateNotZeroAddress(_owner, "owner");
        SharedValidationLibrary.validateNotZeroAddress(_broadcaster, "broadcaster");
        SharedValidationLibrary.validateNotZeroAddress(_recovery, "recovery");
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
        if (!checkPermissionPermissive(self, MultiPhaseSecureOperationDefinitions.TX_REQUEST_SELECTOR) && !checkPermissionPermissive(self, MultiPhaseSecureOperationDefinitions.META_TX_REQUEST_AND_APPROVE_SELECTOR)) {
            revert SharedValidationLibrary.NoPermissionExecute(msg.sender, "execute");
        }
        SharedValidationLibrary.validateTargetAddress(target);
        if (!isOperationTypeSupported(self, operationType)) revert SharedValidationLibrary.OperationNotSupported("unsupported operation");

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
        self.txCounter++;

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
        if (!verifySignature(self, metaTx)) revert SharedValidationLibrary.InvalidSignature(metaTx.signature);
        
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
        if (!verifySignature(self, metaTx)) revert SharedValidationLibrary.InvalidSignature(metaTx.signature);
        
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
     * @dev Executes a transaction based on its execution type and attached payment.
     * @param record The transaction record to execute.
     * @return A tuple containing the success status and result of the execution.
     */
    function executeTransaction(TxRecord memory record) private returns (bool, bytes memory) {
        bytes memory txData = prepareTransactionData(record);
        uint gas = record.params.gasLimit;
        if (gas == 0) {
            gas = gasleft();
        }
        
        // Execute the main transaction
        (bool success, bytes memory result) = record.params.target.call{value: record.params.value, gas: gas}(
            txData
        );

        if (success) {
            record.status = TxStatus.COMPLETED;
            record.result = result;
            
            // Execute attached payment if transaction was successful
            if (record.payment.recipient != address(0)) {
                (bool paymentSuccess, bytes memory paymentResult) = executeAttachedPayment(record);
                if (!paymentSuccess) {
                    // Revert the entire transaction if payment fails
                    revert(string(paymentResult));
                }
            }
        } else {
            record.status = TxStatus.FAILED;
        }

        return (success, result);
    }

    /**
     * @dev Executes the payment attached to a transaction record
     * @param record The transaction record containing payment details
     * @return A tuple containing the success status and result of the payment execution
     */
    function executeAttachedPayment(TxRecord memory record) private returns (bool, bytes memory) {
        PaymentDetails memory payment = record.payment;
        bool paymentSuccess = true;
        bytes memory paymentResult = "";
        
        // Execute native token payment if specified
        if (payment.nativeTokenAmount > 0) {
            if (address(this).balance < payment.nativeTokenAmount) {
                paymentSuccess = false;
                paymentResult = abi.encode("Insufficient native token balance");
            } else {
                (bool success, bytes memory result) = payment.recipient.call{value: payment.nativeTokenAmount}("");
                if (!success) {
                    paymentSuccess = false;
                    paymentResult = result.length > 0 ? result : abi.encode("Native token transfer failed");
                }
            }
        }
        
        // Execute ERC20 token payment if specified
        if (payment.erc20TokenAmount > 0 && paymentSuccess) {
            if (payment.erc20TokenAddress == address(0)) {
                paymentSuccess = false;
                paymentResult = abi.encode("Invalid token address");
            } else {
                IERC20 erc20Token = IERC20(payment.erc20TokenAddress);
                if (erc20Token.balanceOf(address(this)) < payment.erc20TokenAmount) {
                    paymentSuccess = false;
                    paymentResult = abi.encode("Insufficient token balance");
                } else {
                    bool success = erc20Token.transfer(payment.recipient, payment.erc20TokenAmount);
                    if (!success) {
                        paymentSuccess = false;
                        paymentResult = abi.encode("ERC20 token transfer failed");
                    }
                }
            }
        }
        
        emit PaymentExecuted(record.txId, paymentSuccess, paymentResult);
        return (paymentSuccess, paymentResult);
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
            revert SharedValidationLibrary.OperationNotSupported("unsupported operation");
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
            txId: self.txCounter + 1,
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
     * @dev Adds a transaction ID to the pending transactions set.
     * @param self The SecureOperationState to modify.
     * @param txId The transaction ID to add to the pending set.
     */
    function addToPendingTransactionsList(SecureOperationState storage self, uint256 txId) private {
        SharedValidationLibrary.validateTransactionExists(txId);
        SharedValidationLibrary.validatePendingTransaction(uint8(self.txRecords[txId].status));
        
        // Check if transaction ID is already in the set (O(1) operation)
        if (self.pendingTransactionsSet.contains(txId)) revert SharedValidationLibrary.RequestAlreadyPending(txId);
        
        self.pendingTransactionsSet.add(txId);
    }

    /**
     * @dev Removes a transaction ID from the pending transactions set.
     * @param self The SecureOperationState to modify.
     * @param txId The transaction ID to remove from the pending set.
     */
    function removeFromPendingTransactionsList(SecureOperationState storage self, uint256 txId) private {
        SharedValidationLibrary.validateTransactionExists(txId);
        
        // Remove the transaction ID from the set (O(1) operation)
        if (!self.pendingTransactionsSet.remove(txId)) {
            revert SharedValidationLibrary.TransactionNotFound(txId);
        }
    }

    // ============ PAYMENT MANAGEMENT FUNCTIONS ============

    /**
     * @dev Updates payment details for a pending transaction
     * @param self The SecureOperationState to modify
     * @param txId The transaction ID to update payment for
     * @param paymentDetails The new payment details
     */
    function updatePaymentForTransaction(
        SecureOperationState storage self,
        uint256 txId,
        PaymentDetails memory paymentDetails
    ) public {
        checkPermission(self, MultiPhaseSecureOperationDefinitions.UPDATE_PAYMENT_SELECTOR);
        SharedValidationLibrary.validatePendingTransaction(uint8(self.txRecords[txId].status));
           
        self.txRecords[txId].payment = paymentDetails;
        
        emit PaymentUpdated(txId, paymentDetails.recipient, paymentDetails.nativeTokenAmount, paymentDetails.erc20TokenAmount);
    }

    // ============ ROLE-BASED ACCESS CONTROL FUNCTIONS ============


    /**
     * @dev Gets the role by its hash.
     * @param self The SecureOperationState to check.
     * @param role The role to get the hash for.
     * @return The role associated with the hash, or Role(0) if the role doesn't exist.
     */
    function getRole(SecureOperationState storage self, bytes32 role) public view returns (Role storage) {
        return self.roles[role];
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
        if (self.roles[roleHash].roleHash != bytes32(0)) revert SharedValidationLibrary.RoleAlreadyExists("role");
        
        // Create the role with empty arrays
        self.roles[roleHash].roleName = roleName;
        self.roles[roleHash].roleHash = roleHash;
        self.roles[roleHash].maxWallets = maxWallets;
        self.roles[roleHash].isProtected = isProtected;
        
        self.supportedRolesSet.add(roleHash);
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
        if (self.roles[roleHash].roleHash == bytes32(0)) revert SharedValidationLibrary.RoleDoesNotExist("role");
        
        // Security check: Prevent removing protected roles
        if (self.roles[roleHash].isProtected) {
            revert SharedValidationLibrary.CannotRemoveProtectedRole("protected role");
        }
        
        // Remove the role from the supported roles set (O(1) operation)
        self.supportedRolesSet.remove(roleHash);
        
        // Clear the role data
        delete self.roles[roleHash];
    }

    /**
     * @dev Adds a wallet address to a role in the roles mapping.
     * @param self The SecureOperationState to modify.
     * @param role The role hash to add the wallet to.
     * @param wallet The wallet address to add.
     */
    function addAuthorizedWalletToRole(SecureOperationState storage self, bytes32 role, address wallet) public {
        SharedValidationLibrary.validateNotZeroAddress(wallet, "wallet");
        if (self.roles[role].roleHash == bytes32(0)) revert SharedValidationLibrary.RoleDoesNotExist("role");
        
        Role storage roleData = self.roles[role];
        SharedValidationLibrary.validateWalletLimit(roleData.authorizedWallets.length(), roleData.maxWallets, "role");
        
        // Check if wallet is already in the role (O(1) operation)
        if (roleData.authorizedWallets.contains(wallet)) revert SharedValidationLibrary.WalletAlreadyInRole(wallet, "role");
        
        roleData.authorizedWallets.add(wallet);
    }

    /**
     * @dev Updates a role from an old address to a new address.
     * @param self The SecureOperationState to modify.
     * @param role The role to update.
     * @param newWallet The new wallet address to assign the role to.
     * @param oldWallet The old wallet address to remove from the role.
     */
    function updateAuthorizedWalletInRole(SecureOperationState storage self, bytes32 role, address newWallet, address oldWallet) public {
        if (self.roles[role].roleHash == bytes32(0)) revert SharedValidationLibrary.RoleDoesNotExist("role");
        SharedValidationLibrary.validateNotZeroAddress(newWallet, "new wallet");
        
        // Check if old wallet exists in the role
        Role storage roleData = self.roles[role];
        if (!roleData.authorizedWallets.contains(oldWallet)) {
            revert SharedValidationLibrary.OldWalletNotFound(oldWallet, "role");
        }
        
        // Remove old wallet and add new wallet (O(1) operations)
        roleData.authorizedWallets.remove(oldWallet);
        roleData.authorizedWallets.add(newWallet);
    }

    /**
     * @dev Removes a wallet from a role.
     * @param self The SecureOperationState to modify.
     * @param role The role to remove the wallet from.
     * @param wallet The wallet address to remove.
     * @notice Security: Cannot remove the last wallet from a role to prevent empty roles.
     */
    function removeWalletFromRole(SecureOperationState storage self, bytes32 role, address wallet) public {
        if (self.roles[role].roleHash == bytes32(0)) revert SharedValidationLibrary.RoleDoesNotExist("role");
        
        // Check if wallet exists in the role
        Role storage roleData = self.roles[role];
        if (!roleData.authorizedWallets.contains(wallet)) {
            revert SharedValidationLibrary.OldWalletNotFound(wallet, "role");
        }
        
        // Security check: Prevent removing the last wallet from a role
        if (roleData.authorizedWallets.length() <= 1) {
            revert SharedValidationLibrary.CannotRemoveLastWallet(wallet, "role");
        }
        
        // Remove the wallet (O(1) operation)
        roleData.authorizedWallets.remove(wallet);
    }

    /**
     * @dev Adds a function permission to an existing role.
     * @param self The SecureOperationState to modify.
     * @param roleHash The role hash to add the function permission to.
     * @param functionSelector The function selector to add permission for.
     * @param grantedActions The actions granted for this function selector.
     */
    function addFunctionToRole(
        SecureOperationState storage self,
        bytes32 roleHash,
        bytes4 functionSelector,
        TxAction[] memory grantedActions
    ) public {
        if (self.roles[roleHash].roleHash == bytes32(0)) revert SharedValidationLibrary.RoleDoesNotExist("role");
        SharedValidationLibrary.validateFunctionExists(self.functions[functionSelector].functionSelector);
        
        // Validate that all grantedActions are supported by the function
        for (uint i = 0; i < grantedActions.length; i++) {
            if (!isActionSupportedByFunction(self, functionSelector, grantedActions[i])) {
                revert SharedValidationLibrary.ActionNotSupported("action", "function");
            }
        }
        
        Role storage role = self.roles[roleHash];
        
        // Check if permission already exists
        bool permissionExists = false;
        for (uint i = 0; i < role.functionPermissions.length; i++) {
            if (role.functionPermissions[i].functionSelector == functionSelector) {
                permissionExists = true;
                break;
            }
        }
        if (permissionExists) revert SharedValidationLibrary.FunctionPermissionExists(functionSelector, "role");
        
        // If it doesn't exist, add it
        role.functionPermissions.push(FunctionPermission({
            functionSelector: functionSelector,
            grantedActions: grantedActions
        }));
    }

    /**
     * @dev Checks if the caller has permission to execute a function.
     * @param self The SecureOperationState to check.
     * @param functionSelector The selector of the function to check permissions for.
     */
    function checkPermission(SecureOperationState storage self, bytes4 functionSelector) public view {
        bool hasPermission = checkPermissionPermissive(self,functionSelector);       
        if (!hasPermission) revert SharedValidationLibrary.NoPermission(msg.sender);
    }

    /**
     * @dev Checks if the caller has permission to execute a function.
     * @param self The SecureOperationState to check.
     * @param functionSelector The selector of the function to check permissions for.
     * @return True if the caller has permission, false otherwise.
     */
    function checkPermissionPermissive(SecureOperationState storage self, bytes4 functionSelector) private view returns (bool) {
        // Check if caller has any role that grants permission for this function
        uint256 rolesLength = self.supportedRolesSet.length();
        for (uint i = 0; i < rolesLength; i++) {
            bytes32 roleHash = self.supportedRolesSet.at(i);
            Role storage role = self.roles[roleHash];
            
            if (role.authorizedWallets.contains(msg.sender)) {
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
        uint256 rolesLength = self.supportedRolesSet.length();
        for (uint i = 0; i < rolesLength; i++) {
            bytes32 roleHash = self.supportedRolesSet.at(i);
            Role storage role = self.roles[roleHash];
            
            if (role.authorizedWallets.contains(signer)) {
                // Check if role has meta-transaction signing permissions for this function
                for (uint j = 0; j < role.functionPermissions.length; j++) {
                    FunctionPermission storage permission = role.functionPermissions[j];
                    if (permission.functionSelector == functionSelector) {
                        // Check if any of the granted actions matches the requested action
                        for (uint k = 0; k < permission.grantedActions.length; k++) {
                            if (permission.grantedActions[k] == requestedAction) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
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
        self.supportedFunctionsSet.add(bytes32(functionSelector));
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
        if (self.supportedOperationTypes[readableType.operationType].operationType != bytes32(0)) revert SharedValidationLibrary.OperationTypeExists("operation type");
        self.supportedOperationTypes[readableType.operationType] = readableType;
        self.supportedOperationTypesSet.add(readableType.operationType);
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

    // ============ BACKWARD COMPATIBILITY FUNCTIONS ============

    /**
     * @dev Gets all pending transaction IDs as an array for backward compatibility
     * @param self The SecureOperationState to check
     * @return Array of pending transaction IDs
     */
    function getPendingTransactionsList(SecureOperationState storage self) public view returns (uint256[] memory) {
        uint256 length = self.pendingTransactionsSet.length();
        uint256[] memory result = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = self.pendingTransactionsSet.at(i);
        }
        return result;
    }

    /**
     * @dev Gets all supported roles as an array for backward compatibility
     * @param self The SecureOperationState to check
     * @return Array of supported role hashes
     */
    function getSupportedRolesList(SecureOperationState storage self) public view returns (bytes32[] memory) {
        uint256 length = self.supportedRolesSet.length();
        bytes32[] memory result = new bytes32[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = self.supportedRolesSet.at(i);
        }
        return result;
    }

    /**
     * @dev Gets all supported function selectors as an array for backward compatibility
     * @param self The SecureOperationState to check
     * @return Array of supported function selectors
     */
    function getSupportedFunctionsList(SecureOperationState storage self) public view returns (bytes4[] memory) {
        uint256 length = self.supportedFunctionsSet.length();
        bytes4[] memory result = new bytes4[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = bytes4(self.supportedFunctionsSet.at(i));
        }
        return result;
    }

    /**
     * @dev Gets all supported operation types as an array for backward compatibility
     * @param self The SecureOperationState to check
     * @return Array of supported operation type hashes
     */
    function getSupportedOperationTypesList(SecureOperationState storage self) public view returns (bytes32[] memory) {
        uint256 length = self.supportedOperationTypesSet.length();
        bytes32[] memory result = new bytes32[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = self.supportedOperationTypesSet.at(i);
        }
        return result;
    }

    /**
     * @dev Gets the authorized wallet at a specific index from a role
     * @param self The SecureOperationState to check
     * @param roleHash The role hash to get the wallet from
     * @param index The index position of the wallet to retrieve
     * @return The authorized wallet address at the specified index
     */
    function getAuthorizedWalletAt(SecureOperationState storage self, bytes32 roleHash, uint256 index) public view returns (address) {
        Role storage role = self.roles[roleHash];
        require(role.authorizedWallets.length() > index, "Index out of bounds or role has no authorized wallets");
        return role.authorizedWallets.at(index);
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
        SharedValidationLibrary.validateRequesterAddress(metaTx.txRecord.params.requester);
        if (!isOperationTypeSupported(self, metaTx.txRecord.params.operationType)) revert SharedValidationLibrary.OperationNotSupported("unsupported operation");
        
        // Meta-transaction parameters validation
        SharedValidationLibrary.validateChainId(metaTx.params.chainId);
        SharedValidationLibrary.validateHandlerContractMatch(metaTx.params.handlerContract, metaTx.txRecord.params.target);
        SharedValidationLibrary.validateMetaTxDeadline(metaTx.params.deadline);
        
        // Gas price validation (if applicable)
        // SharedValidationLibrary.validateGasPrice(metaTx.params.maxGasPrice);
        
        // Validate signer-specific nonce
        SharedValidationLibrary.validateNonce(metaTx.params.nonce, getSignerNonce(self, metaTx.params.signer));

        // Validate txId matches expected next transaction ID
        SharedValidationLibrary.validateTransactionId(metaTx.txRecord.txId, self.txCounter + 1);
        
        // Signature verification
        bytes32 messageHash = generateMessageHash(metaTx);
        address recoveredSigner = recoverSigner(messageHash, metaTx.signature);
        if (recoveredSigner != metaTx.params.signer) revert SharedValidationLibrary.InvalidSignature(metaTx.signature);

        // Authorization check - verify signer has meta-transaction signing permissions for the function and action
        bool isAuthorized = hasMetaTxSigningPermission(self, metaTx.params.signer, metaTx.params.handlerSelector, metaTx.params.action);
        if (!isAuthorized) revert SharedValidationLibrary.SignerNotAuthorized(metaTx.params.signer);
        
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
        if (!isOperationTypeSupported(self, txParams.operationType)) revert SharedValidationLibrary.OperationNotSupported("unsupported operation");
        SharedValidationLibrary.validateTargetAddress(txParams.target);
        
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
        if (txRecord.txId != txId) revert SharedValidationLibrary.TransactionNotFound(txId);
        
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
        SharedValidationLibrary.validateHandlerContract(metaTxParams.handlerContract);
        SharedValidationLibrary.validateHandlerSelector(metaTxParams.handlerSelector);
        SharedValidationLibrary.validateDeadline(metaTxParams.deadline);
        SharedValidationLibrary.validateSignerAddress(metaTxParams.signer);

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
        SharedValidationLibrary.validateHandlerContract(handlerContract);
        SharedValidationLibrary.validateHandlerSelector(handlerSelector);
        SharedValidationLibrary.validateDeadline(deadline);
        SharedValidationLibrary.validateSignerAddress(signer);
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

}
