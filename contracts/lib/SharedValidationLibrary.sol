// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

/**
 * @title SharedValidationLibrary
 * @dev A shared library containing common validation functions, error messages, and utilities
 * 
 * This library is designed to reduce contract size by centralizing common validation logic
 * and error messages used across multiple contracts in the Guardian system.
 * 
 * Features:
 * - Common error message constants
 * - Address validation functions
 * - Time and deadline validation
 * - Signature validation utilities
 * - Permission and authorization checks
 * - Operation type validation
 * - Gas and transaction validation
 * 
 * This library follows the security rules defined in .cursorrules and implements
 * the Checks-Effects-Interactions pattern where applicable.
 */
library SharedValidationLibrary {
    
    // ============ ERROR MESSAGES ============
    
    // Address validation errors
    string internal constant ERROR_INVALID_ADDRESS = "Invalid address";
    string internal constant ERROR_INVALID_ROLE_ADDRESS = "Invalid role address";
    string internal constant ERROR_INVALID_TARGET_ADDRESS = "Invalid target address";
    string internal constant ERROR_INVALID_REQUESTER_ADDRESS = "Invalid requester address";
    string internal constant ERROR_INVALID_HANDLER_CONTRACT = "Invalid handler contract";
    string internal constant ERROR_INVALID_SIGNER_ADDRESS = "Invalid signer address";
    string internal constant ERROR_CANNOT_SET_ZERO_ADDRESS = "Cannot set role to zero address";
    string internal constant ERROR_CANNOT_ADD_ZERO_ADDRESS = "Cannot add zero address to role";
    string internal constant ERROR_NOT_NEW_ADDRESS = "Not new address";
    
    // Time and deadline errors
    string internal constant ERROR_INVALID_TIME_LOCK_PERIOD = "Invalid time lock period";
    string internal constant ERROR_TIME_LOCK_PERIOD_ZERO = "Time lock period must be greater than zero";
    string internal constant ERROR_DEADLINE_IN_PAST = "Deadline must be in the future";
    string internal constant ERROR_META_TX_EXPIRED = "Meta-transaction expired";
    string internal constant ERROR_BEFORE_RELEASE_TIME = "Current time is before release time";
    string internal constant ERROR_NEW_TIMELOCK_SAME = "New timelock must be different";
    
    // Permission and authorization errors
    string internal constant ERROR_NO_PERMISSION = "Caller have no permission";
    string internal constant ERROR_NO_PERMISSION_EXECUTE = "Caller does not have permission to execute this function";
    string internal constant ERROR_RESTRICTED_OWNER = "Ownable: caller is not the owner";
    string internal constant ERROR_RESTRICTED_OWNER_RECOVERY = "Restricted to owner or recovery";
    string internal constant ERROR_RESTRICTED_RECOVERY = "Restricted to recovery";
    string internal constant ERROR_RESTRICTED_BROADCASTER = "Restricted to Broadcaster";
    string internal constant ERROR_SIGNER_NOT_AUTHORIZED = "Signer not authorized";
    string internal constant ERROR_ONLY_CALLABLE_BY_CONTRACT = "Only callable by contract itself";
    
    // Transaction and operation errors
    string internal constant ERROR_OPERATION_NOT_SUPPORTED = "Operation not supported";
    string internal constant ERROR_OPERATION_TYPE_EXISTS = "Operation type already exists";
    string internal constant ERROR_INVALID_OPERATION_TYPE = "Invalid operation type";
    string internal constant ERROR_TRANSACTION_NOT_FOUND = "Transaction not found";
    string internal constant ERROR_CAN_ONLY_APPROVE_PENDING = "Can only approve pending requests";
    string internal constant ERROR_CAN_ONLY_CANCEL_PENDING = "Can only cancel pending requests";
    string internal constant ERROR_TRANSACTION_NOT_PENDING = "Transaction not in pending state";
    string internal constant ERROR_REQUEST_ALREADY_PENDING = "Request is already pending";
    string internal constant ERROR_ALREADY_INITIALIZED = "Already initialized";
    string internal constant ERROR_TRANSACTION_ID_MISMATCH = "Transaction ID mismatch - invalid txId";
    
    // Signature and meta-transaction errors
    
    // Signature and meta-transaction errors
    string internal constant ERROR_INVALID_SIGNATURE_LENGTH = "Invalid signature length";
    string internal constant ERROR_INVALID_SIGNATURE = "Invalid signature";
    string internal constant ERROR_INVALID_NONCE = "Invalid nonce";
    string internal constant ERROR_CHAIN_ID_MISMATCH = "Chain ID mismatch";
    string internal constant ERROR_HANDLER_CONTRACT_MISMATCH = "Handler contract mismatch";
    string internal constant ERROR_INVALID_HANDLER_SELECTOR = "Invalid handler selector";
    string internal constant ERROR_INVALID_S_VALUE = "Invalid s value";
    string internal constant ERROR_INVALID_V_VALUE = "Invalid v value";
    string internal constant ERROR_ECDSA_INVALID_SIGNATURE = "ECDSA: invalid signature";
    string internal constant ERROR_GAS_PRICE_EXCEEDS_MAX = "Current gas price exceeds maximum";
    
    // Role and function errors
    string internal constant ERROR_ROLE_DOES_NOT_EXIST = "Role does not exist";
    string internal constant ERROR_ROLE_ALREADY_EXISTS = "Role already exists";
    string internal constant ERROR_FUNCTION_ALREADY_EXISTS = "Function already exists";
    string internal constant ERROR_FUNCTION_DOES_NOT_EXIST = "Function does not exist";
    string internal constant ERROR_WALLET_ALREADY_IN_ROLE = "Wallet already in role";
    string internal constant ERROR_ROLE_WALLET_LIMIT_REACHED = "Role wallet limit reached";
    string internal constant ERROR_OLD_WALLET_NOT_FOUND = "Old wallet not found in role";
    string internal constant ERROR_CANNOT_REMOVE_LAST_WALLET = "Cannot remove the last wallet from a role";
    string internal constant ERROR_ROLE_NAME_EMPTY = "Role name cannot be empty";
    string internal constant ERROR_MAX_WALLETS_ZERO = "Max wallets must be greater than zero";
    string internal constant ERROR_CANNOT_MODIFY_PROTECTED_ROLES = "Cannot modify protected roles";
    string internal constant ERROR_CANNOT_REMOVE_PROTECTED_ROLE = "Cannot remove protected role";
    string internal constant ERROR_ROLE_EDITING_DISABLED = "Role editing is currently disabled";
    string internal constant ERROR_FUNCTION_PERMISSION_EXISTS = "Function permission already exists";
    string internal constant ERROR_ACTION_NOT_SUPPORTED = "Action not supported by function";
    
    // ============ ADDRESS VALIDATION FUNCTIONS ============
    
    /**
     * @dev Validates that an address is not the zero address
     * @param addr The address to validate
     * @param errorMessage The custom error message to use
     */
    function validateNotZeroAddress(address addr, string memory errorMessage) internal pure {
        require(addr != address(0), errorMessage);
    }
    
    /**
     * @dev Validates that an address is not the zero address using default error message
     * @param addr The address to validate
     */
    function validateNotZeroAddress(address addr) internal pure {
        validateNotZeroAddress(addr, ERROR_INVALID_ADDRESS);
    }
    
    /**
     * @dev Validates that a new address is different from the current address
     * @param newAddress The proposed new address
     * @param currentAddress The current address to compare against
     */
    function validateNewAddress(address newAddress, address currentAddress) internal pure {
        require(newAddress != currentAddress, ERROR_NOT_NEW_ADDRESS);
    }
    
    /**
     * @dev Validates that an address is not the zero address and is different from current
     * @param newAddress The proposed new address
     * @param currentAddress The current address to compare against
     * @param addressType The type of address for error messaging
     */
    function validateAddressUpdate(
        address newAddress, 
        address currentAddress, 
        string memory addressType
    ) internal pure {
        validateNotZeroAddress(newAddress, string(abi.encodePacked("Invalid ", addressType, " address")));
        validateNewAddress(newAddress, currentAddress);
    }
    
    // ============ TIME AND DEADLINE VALIDATION FUNCTIONS ============
    
    /**
     * @dev Validates that a time lock period is greater than zero
     * @param timeLockPeriod The time lock period to validate
     */
    function validateTimeLockPeriod(uint256 timeLockPeriod) internal pure {
        require(timeLockPeriod > 0, ERROR_TIME_LOCK_PERIOD_ZERO);
    }
    
    /**
     * @dev Validates that a deadline is in the future
     * @param deadline The deadline timestamp to validate
     */
    function validateDeadline(uint256 deadline) internal view {
        require(deadline > block.timestamp, ERROR_DEADLINE_IN_PAST);
    }
    
    /**
     * @dev Validates that a new time lock period is different from the current one
     * @param newPeriod The new time lock period
     * @param currentPeriod The current time lock period
     */
    function validateTimeLockUpdate(uint256 newPeriod, uint256 currentPeriod) internal pure {
        validateTimeLockPeriod(newPeriod);
        require(newPeriod != currentPeriod, ERROR_NEW_TIMELOCK_SAME);
    }
    
    /**
     * @dev Validates that the current time is after the release time
     * @param releaseTime The release time to check against
     */
    function validateReleaseTime(uint256 releaseTime) internal view {
        require(block.timestamp >= releaseTime, ERROR_BEFORE_RELEASE_TIME);
    }
    
    /**
     * @dev Validates that a meta-transaction has not expired
     * @param deadline The deadline of the meta-transaction
     */
    function validateMetaTxDeadline(uint256 deadline) internal view {
        require(block.timestamp <= deadline, ERROR_META_TX_EXPIRED);
    }
    
    // ============ SIGNATURE VALIDATION FUNCTIONS ============
    
    /**
     * @dev Validates that a signature has the correct length (65 bytes)
     * @param signature The signature to validate
     */
    function validateSignatureLength(bytes memory signature) internal pure {
        require(signature.length == 65, ERROR_INVALID_SIGNATURE_LENGTH);
    }
    
    /**
     * @dev Validates ECDSA signature parameters
     * @param s The s parameter of the signature
     * @param v The v parameter of the signature
     */
    function validateSignatureParams(bytes32 s, uint8 v) internal pure {
        require(uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0, ERROR_INVALID_S_VALUE);
        require(v == 27 || v == 28, ERROR_INVALID_V_VALUE);
    }
    
    /**
     * @dev Validates that a recovered signer is not the zero address
     * @param signer The recovered signer address
     */
    function validateRecoveredSigner(address signer) internal pure {
        require(signer != address(0), ERROR_ECDSA_INVALID_SIGNATURE);
    }
    
    // ============ PERMISSION AND AUTHORIZATION FUNCTIONS ============
    
    /**
     * @dev Validates that the caller is the owner
     * @param owner The current owner address
     */
    function validateOwner(address owner) internal view {
        require(owner == msg.sender, ERROR_RESTRICTED_OWNER);
    }
    
    /**
     * @dev Validates that the caller is either the owner or recovery
     * @param owner The current owner address
     * @param recovery The current recovery address
     */
    function validateOwnerOrRecovery(address owner, address recovery) internal view {
        require(msg.sender == owner || msg.sender == recovery, ERROR_RESTRICTED_OWNER_RECOVERY);
    }
    
    /**
     * @dev Validates that the caller is the recovery address
     * @param recovery The current recovery address
     */
    function validateRecovery(address recovery) internal view {
        require(msg.sender == recovery, ERROR_RESTRICTED_RECOVERY);
    }
    
    /**
     * @dev Validates that the caller is the broadcaster
     * @param broadcaster The current broadcaster address
     */
    function validateBroadcaster(address broadcaster) internal view {
        require(msg.sender == broadcaster, ERROR_RESTRICTED_BROADCASTER);
    }
    
    /**
     * @dev Validates that the function is being called internally by the contract itself
     * @param contractAddress The address of the contract
     */
    function validateInternalCall(address contractAddress) internal view {
        require(msg.sender == contractAddress, ERROR_ONLY_CALLABLE_BY_CONTRACT);
    }
    
    // ============ TRANSACTION AND OPERATION VALIDATION FUNCTIONS ============
    
    /**
     * @dev Validates that an operation type is supported
     * @param isSupported Whether the operation type is supported
     */
    function validateOperationSupported(bool isSupported) internal pure {
        require(isSupported, ERROR_OPERATION_NOT_SUPPORTED);
    }
    
    /**
     * @dev Validates that an operation type doesn't already exist
     * @param exists Whether the operation type already exists
     */
    function validateOperationTypeNew(bool exists) internal pure {
        require(!exists, ERROR_OPERATION_TYPE_EXISTS);
    }
    
    /**
     * @dev Validates that an operation type matches the expected type
     * @param actualType The actual operation type
     * @param expectedType The expected operation type
     */
    function validateOperationType(bytes32 actualType, bytes32 expectedType) internal pure {
        require(actualType == expectedType, ERROR_INVALID_OPERATION_TYPE);
    }
    
    /**
     * @dev Validates that a transaction is in pending state
     * @param status The transaction status
     */
    function validatePendingTransaction(uint8 status) internal pure {
        require(status == 1, ERROR_CAN_ONLY_APPROVE_PENDING); // 1 = PENDING in TxStatus enum
    }
    
    /**
     * @dev Validates that a request is not already pending
     * @param hasOpenRequest Whether there's already an open request
     */
    function validateNoOpenRequest(bool hasOpenRequest) internal pure {
        require(!hasOpenRequest, ERROR_REQUEST_ALREADY_PENDING);
    }
    
    // ============ META-TRANSACTION VALIDATION FUNCTIONS ============
    
    /**
     * @dev Validates chain ID matches the current chain
     * @param chainId The chain ID to validate
     */
    function validateChainId(uint256 chainId) internal view {
        require(chainId == block.chainid, ERROR_CHAIN_ID_MISMATCH);
    }
    
    /**
     * @dev Validates that handler contract matches target
     * @param handlerContract The handler contract address
     * @param target The target contract address
     */
    function validateHandlerContract(address handlerContract, address target) internal pure {
        require(handlerContract == target, ERROR_HANDLER_CONTRACT_MISMATCH);
    }
    
    /**
     * @dev Validates that a handler selector is not zero
     * @param selector The handler selector to validate
     */
    function validateHandlerSelector(bytes4 selector) internal pure {
        require(selector != bytes4(0), ERROR_INVALID_HANDLER_SELECTOR);
    }

    /**
     * @dev Validates that a transaction ID matches the expected next transaction ID
     * @param txId The transaction ID to validate
     * @param expectedTxId The expected next transaction ID
     */
    function validateTransactionId(uint256 txId, uint256 expectedTxId) internal pure {
        require(txId == expectedTxId, ERROR_TRANSACTION_ID_MISMATCH);
    }
    
    /**
     * @dev Validates that a nonce matches the expected value
     * @param nonce The nonce to validate
     * @param expectedNonce The expected nonce value
     */
    function validateNonce(uint256 nonce, uint256 expectedNonce) internal pure {
        require(nonce == expectedNonce, ERROR_INVALID_NONCE);
    }
    
    /**
     * @dev Validates gas price is within limits
     * @param maxGasPrice The maximum allowed gas price
     */
    function validateGasPrice(uint256 maxGasPrice) internal view {
        if (maxGasPrice > 0) {
            require(block.basefee <= maxGasPrice, ERROR_GAS_PRICE_EXCEEDS_MAX);
        }
    }
    
    // ============ ROLE AND FUNCTION VALIDATION FUNCTIONS ============
    
    /**
     * @dev Validates that a role exists
     * @param roleHash The role hash to check
     */
    function validateRoleExists(bytes32 roleHash) internal pure {
        require(roleHash != bytes32(0), ERROR_ROLE_DOES_NOT_EXIST);
    }
    
    /**
     * @dev Validates that a role doesn't already exist
     * @param roleHash The role hash to check
     */
    function validateRoleNew(bytes32 roleHash) internal pure {
        require(roleHash == bytes32(0), ERROR_ROLE_ALREADY_EXISTS);
    }
    
    /**
     * @dev Validates that a function doesn't already exist
     * @param functionSelector The function selector to check
     */
    function validateFunctionNew(bytes4 functionSelector) internal pure {
        require(functionSelector == bytes4(0), ERROR_FUNCTION_ALREADY_EXISTS);
    }
    
    /**
     * @dev Validates that a function exists
     * @param functionSelector The function selector to check
     */
    function validateFunctionExists(bytes4 functionSelector) internal pure {
        require(functionSelector != bytes4(0), ERROR_FUNCTION_DOES_NOT_EXIST);
    }
    
    /**
     * @dev Validates that a wallet is not already in a role
     * @param isInRole Whether the wallet is already in the role
     */
    function validateWalletNotInRole(bool isInRole) internal pure {
        require(!isInRole, ERROR_WALLET_ALREADY_IN_ROLE);
    }
    
    /**
     * @dev Validates that a role hasn't reached its wallet limit
     * @param currentCount The current number of wallets in the role
     * @param maxWallets The maximum number of wallets allowed
     */
    function validateWalletLimit(uint256 currentCount, uint256 maxWallets) internal pure {
        require(currentCount < maxWallets, ERROR_ROLE_WALLET_LIMIT_REACHED);
    }
    
    /**
     * @dev Validates that a function permission doesn't already exist
     * @param exists Whether the permission already exists
     */
    function validatePermissionNew(bool exists) internal pure {
        require(!exists, ERROR_FUNCTION_PERMISSION_EXISTS);
    }
    
    /**
     * @dev Validates that an action is supported by a function
     * @param isSupported Whether the action is supported
     */
    function validateActionSupported(bool isSupported) internal pure {
        require(isSupported, ERROR_ACTION_NOT_SUPPORTED);
    }
    
    /**
     * @dev Validates that a role name is not empty
     * @param roleName The role name to validate
     */
    function validateRoleNameNotEmpty(string memory roleName) internal pure {
        require(bytes(roleName).length > 0, ERROR_ROLE_NAME_EMPTY);
    }
    
    /**
     * @dev Validates that a role is not protected
     * @param isProtected Whether the role is protected
     */
    function validateRoleNotProtected(bool isProtected) internal pure {
        require(!isProtected, ERROR_CANNOT_MODIFY_PROTECTED_ROLES);
    }
    
    /**
     * @dev Validates that role editing is enabled
     * @param roleEditingEnabled Whether role editing is enabled
     */
    function validateRoleEditingEnabled(bool roleEditingEnabled) internal pure {
        require(roleEditingEnabled, ERROR_ROLE_EDITING_DISABLED);
    }
    
    // ============ UTILITY FUNCTIONS ============
    
    /**
     * @dev Validates that a value is greater than zero
     * @param value The value to validate
     * @param errorMessage The error message to use
     */
    function validateGreaterThanZero(uint256 value, string memory errorMessage) internal pure {
        require(value > 0, errorMessage);
    }
    
    /**
     * @dev Validates that two values are equal
     * @param actual The actual value
     * @param expected The expected value
     * @param errorMessage The error message to use
     */
    function validateEqual(uint256 actual, uint256 expected, string memory errorMessage) internal pure {
        require(actual == expected, errorMessage);
    }
    
    /**
     * @dev Validates that two bytes4 values are equal
     * @param actual The actual value
     * @param expected The expected value
     * @param errorMessage The error message to use
     */
    function validateEqual(bytes4 actual, bytes4 expected, string memory errorMessage) internal pure {
        require(actual == expected, errorMessage);
    }
    
    /**
     * @dev Validates that two bytes32 values are equal
     * @param actual The actual value
     * @param expected The expected value
     * @param errorMessage The error message to use
     */
    function validateEqual(bytes32 actual, bytes32 expected, string memory errorMessage) internal pure {
        require(actual == expected, errorMessage);
    }
    
    /**
     * @dev Validates that two address values are equal
     * @param actual The actual value
     * @param expected The expected value
     * @param errorMessage The error message to use
     */
    function validateEqual(address actual, address expected, string memory errorMessage) internal pure {
        require(actual == expected, errorMessage);
    }
    
    /**
     * @dev Validates that a boolean condition is true
     * @param condition The condition to validate
     * @param errorMessage The error message to use
     */
    function validateTrue(bool condition, string memory errorMessage) internal pure {
        require(condition, errorMessage);
    }
    
    /**
     * @dev Validates that a boolean condition is false
     * @param condition The condition to validate
     * @param errorMessage The error message to use
     */
    function validateFalse(bool condition, string memory errorMessage) internal pure {
        require(!condition, errorMessage);
    }
}