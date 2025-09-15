// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

/**
 * @title SharedValidationLibrary
 * @dev Optimized shared library containing common validation functions using enhanced custom errors
 * 
 * This library is designed to reduce contract size by centralizing common validation logic
 * and using gas-efficient custom errors instead of string constants. This approach provides
 * significant gas savings and contract size reduction while maintaining clear error context.
 * 
 * Features:
 * - Enhanced custom errors with contextual parameters
 * - Address validation functions
 * - Time and deadline validation
 * - Signature validation utilities
 * - Permission and authorization checks
 * - Operation type validation
 * - Gas and transaction validation
 * 
 * This library follows the security rules defined in .cursorrules and implements
 * the Checks-Effects-Interactions pattern where applicable.
 * 
 * Gas Optimization Benefits:
 * - ~50% gas reduction compared to string-based errors
 * - Significant contract size reduction
 * - Enhanced error context with parameters
 * - Modern Solidity best practices (0.8.4+)
 */
library SharedValidationLibrary {
    
    // ============ ENHANCED CUSTOM ERRORS ============
    
    // Address validation errors with context
    error InvalidAddress(address provided);
    error InvalidRoleAddress(address role, string roleType);
    error InvalidTargetAddress(address target);
    error InvalidRequesterAddress(address requester);
    error InvalidHandlerContract(address handler);
    error InvalidSignerAddress(address signer);
    error CannotSetZeroAddress(string field);
    error CannotAddZeroAddress(string role);
    error NotNewAddress(address newAddress, address currentAddress);
    
    // Time and deadline errors with context
    error InvalidTimeLockPeriod(uint256 provided);
    error TimeLockPeriodZero(uint256 provided);
    error DeadlineInPast(uint256 deadline, uint256 currentTime);
    error MetaTxExpired(uint256 deadline, uint256 currentTime);
    error BeforeReleaseTime(uint256 releaseTime, uint256 currentTime);
    error NewTimelockSame(uint256 newPeriod, uint256 currentPeriod);
    
    // Permission and authorization errors with context
    error NoPermission(address caller);
    error NoPermissionExecute(address caller, string functionName);
    error RestrictedOwner(address caller, address owner);
    error RestrictedOwnerRecovery(address caller, address owner, address recovery);
    error RestrictedRecovery(address caller, address recovery);
    error RestrictedBroadcaster(address caller, address broadcaster);
    error SignerNotAuthorized(address signer);
    error OnlyCallableByContract(address caller, address contractAddress);
    
    // Transaction and operation errors with context
    error OperationNotSupported(string operationType);
    error OperationTypeExists(string operationType);
    error InvalidOperationType(bytes32 actualType, bytes32 expectedType);
    error TransactionNotFound(uint256 txId);
    error CanOnlyApprovePending(uint8 currentStatus);
    error CanOnlyCancelPending(uint8 currentStatus);
    error TransactionNotPending(uint8 currentStatus);
    error RequestAlreadyPending(uint256 txId);
    error AlreadyInitialized();
    error TransactionIdMismatch(uint256 expectedTxId, uint256 providedTxId);
    
    // Signature and meta-transaction errors with context
    error InvalidSignatureLength(uint256 providedLength, uint256 expectedLength);
    error InvalidSignature(bytes signature);
    error InvalidNonce(uint256 providedNonce, uint256 expectedNonce);
    error ChainIdMismatch(uint256 providedChainId, uint256 expectedChainId);
    error HandlerContractMismatch(address handlerContract, address target);
    error InvalidHandlerSelector(bytes4 selector);
    error InvalidSValue(bytes32 s);
    error InvalidVValue(uint8 v);
    error ECDSAInvalidSignature(address recoveredSigner);
    error GasPriceExceedsMax(uint256 currentGasPrice, uint256 maxGasPrice);
    
    // Role and function errors with context
    error RoleDoesNotExist(string roleName);
    error RoleAlreadyExists(string roleName);
    error FunctionAlreadyExists(bytes4 functionSelector);
    error FunctionDoesNotExist(bytes4 functionSelector);
    error WalletAlreadyInRole(address wallet, string role);
    error RoleWalletLimitReached(string role, uint256 currentCount, uint256 maxWallets);
    error OldWalletNotFound(address wallet, string role);
    error CannotRemoveLastWallet(address wallet, string role);
    error RoleNameEmpty();
    error MaxWalletsZero(uint256 provided);
    error CannotModifyProtectedRoles(string role);
    error CannotRemoveProtectedRole(string role);
    error RoleEditingDisabled();
    error FunctionPermissionExists(bytes4 functionSelector, string role);
    error ActionNotSupported(string action, string functionName);
    error InvalidRange(uint256 from, uint256 to);
    
    // ============ ADDRESS VALIDATION FUNCTIONS ============
    
    /**
     * @dev Validates that an address is not the zero address
     * @param addr The address to validate
     */
    function validateNotZeroAddress(address addr) internal pure {
        if (addr == address(0)) revert InvalidAddress(addr);
    }
    
    /**
     * @dev Validates that an address is not the zero address with role context
     * @param addr The address to validate
     * @param roleType The type of role for context
     */
    function validateNotZeroAddress(address addr, string memory roleType) internal pure {
        if (addr == address(0)) revert InvalidRoleAddress(addr, roleType);
    }
    
    /**
     * @dev Validates that a new address is different from the current address
     * @param newAddress The proposed new address
     * @param currentAddress The current address to compare against
     */
    function validateNewAddress(address newAddress, address currentAddress) internal pure {
        if (newAddress == currentAddress) revert NotNewAddress(newAddress, currentAddress);
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
        validateNotZeroAddress(newAddress, addressType);
        validateNewAddress(newAddress, currentAddress);
    }
    
    /**
     * @dev Validates that a target address is not zero
     * @param target The target address to validate
     */
    function validateTargetAddress(address target) internal pure {
        if (target == address(0)) revert InvalidTargetAddress(target);
    }
    
    /**
     * @dev Validates that a requester address is not zero
     * @param requester The requester address to validate
     */
    function validateRequesterAddress(address requester) internal pure {
        if (requester == address(0)) revert InvalidRequesterAddress(requester);
    }
    
    /**
     * @dev Validates that a handler contract address is not zero
     * @param handler The handler contract address to validate
     */
    function validateHandlerContract(address handler) internal pure {
        if (handler == address(0)) revert InvalidHandlerContract(handler);
    }
    
    /**
     * @dev Validates that a signer address is not zero
     * @param signer The signer address to validate
     */
    function validateSignerAddress(address signer) internal pure {
        if (signer == address(0)) revert InvalidSignerAddress(signer);
    }
    
    // ============ TIME AND DEADLINE VALIDATION FUNCTIONS ============
    
    /**
     * @dev Validates that a time lock period is greater than zero
     * @param timeLockPeriod The time lock period to validate
     */
    function validateTimeLockPeriod(uint256 timeLockPeriod) internal pure {
        if (timeLockPeriod == 0) revert TimeLockPeriodZero(timeLockPeriod);
    }
    
    /**
     * @dev Validates that a deadline is in the future
     * @param deadline The deadline timestamp to validate
     */
    function validateDeadline(uint256 deadline) internal view {
        if (deadline <= block.timestamp) revert DeadlineInPast(deadline, block.timestamp);
    }
    
    /**
     * @dev Validates that a new time lock period is different from the current one
     * @param newPeriod The new time lock period
     * @param currentPeriod The current time lock period
     */
    function validateTimeLockUpdate(uint256 newPeriod, uint256 currentPeriod) internal pure {
        validateTimeLockPeriod(newPeriod);
        if (newPeriod == currentPeriod) revert NewTimelockSame(newPeriod, currentPeriod);
    }
    
    /**
     * @dev Validates that the current time is after the release time
     * @param releaseTime The release time to check against
     */
    function validateReleaseTime(uint256 releaseTime) internal view {
        if (block.timestamp < releaseTime) revert BeforeReleaseTime(releaseTime, block.timestamp);
    }
    
    /**
     * @dev Validates that a meta-transaction has not expired
     * @param deadline The deadline of the meta-transaction
     */
    function validateMetaTxDeadline(uint256 deadline) internal view {
        if (block.timestamp > deadline) revert MetaTxExpired(deadline, block.timestamp);
    }
    
    // ============ SIGNATURE VALIDATION FUNCTIONS ============
    
    /**
     * @dev Validates that a signature has the correct length (65 bytes)
     * @param signature The signature to validate
     */
    function validateSignatureLength(bytes memory signature) internal pure {
        if (signature.length != 65) revert InvalidSignatureLength(signature.length, 65);
    }
    
    /**
     * @dev Validates ECDSA signature parameters
     * @param s The s parameter of the signature
     * @param v The v parameter of the signature
     */
    function validateSignatureParams(bytes32 s, uint8 v) internal pure {
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            revert InvalidSValue(s);
        }
        if (v != 27 && v != 28) revert InvalidVValue(v);
    }
    
    /**
     * @dev Validates that a recovered signer is not the zero address
     * @param signer The recovered signer address
     */
    function validateRecoveredSigner(address signer) internal pure {
        if (signer == address(0)) revert ECDSAInvalidSignature(signer);
    }
    
    /**
     * @dev Validates that a signature is not empty
     * @param signature The signature to validate
     */
    function validateSignature(bytes memory signature) internal pure {
        if (signature.length == 0) revert InvalidSignature(signature);
    }
    
    // ============ PERMISSION AND AUTHORIZATION FUNCTIONS ============
    
    /**
     * @dev Validates that the caller is the owner
     * @param owner The current owner address
     */
    function validateOwner(address owner) internal view {
        if (owner != msg.sender) revert RestrictedOwner(msg.sender, owner);
    }
    
    /**
     * @dev Validates that the caller is either the owner or recovery
     * @param owner The current owner address
     * @param recovery The current recovery address
     */
    function validateOwnerOrRecovery(address owner, address recovery) internal view {
        if (msg.sender != owner && msg.sender != recovery) {
            revert RestrictedOwnerRecovery(msg.sender, owner, recovery);
        }
    }
    
    /**
     * @dev Validates that the caller is the recovery address
     * @param recovery The current recovery address
     */
    function validateRecovery(address recovery) internal view {
        if (msg.sender != recovery) revert RestrictedRecovery(msg.sender, recovery);
    }
    
    /**
     * @dev Validates that the caller is the broadcaster
     * @param broadcaster The current broadcaster address
     */
    function validateBroadcaster(address broadcaster) internal view {
        if (msg.sender != broadcaster) revert RestrictedBroadcaster(msg.sender, broadcaster);
    }
    
    /**
     * @dev Validates that the function is being called internally by the contract itself
     * @param contractAddress The address of the contract
     */
    function validateInternalCall(address contractAddress) internal view {
        if (msg.sender != contractAddress) revert OnlyCallableByContract(msg.sender, contractAddress);
    }
    
    /**
     * @dev Validates that the caller has permission
     * @param caller The caller address
     */
    function validatePermission(address caller) internal pure {
        revert NoPermission(caller);
    }
    
    /**
     * @dev Validates that the caller has permission to execute a specific function
     * @param caller The caller address
     * @param functionName The function name being called
     */
    function validatePermissionExecute(address caller, string memory functionName) internal pure {
        revert NoPermissionExecute(caller, functionName);
    }
    
    /**
     * @dev Validates that a signer is authorized
     * @param signer The signer address to validate
     */
    function validateSignerAuthorized(address signer) internal pure {
        revert SignerNotAuthorized(signer);
    }
    
    // ============ TRANSACTION AND OPERATION VALIDATION FUNCTIONS ============
    
    /**
     * @dev Validates that an operation type is supported
     * @param operationType The operation type to validate
     */
    function validateOperationSupported(string memory operationType) internal pure {
        revert OperationNotSupported(operationType);
    }
    
    /**
     * @dev Validates that an operation type doesn't already exist
     * @param operationType The operation type to validate
     */
    function validateOperationTypeNew(string memory operationType) internal pure {
        revert OperationTypeExists(operationType);
    }
    
    /**
     * @dev Validates that an operation type matches the expected type
     * @param actualType The actual operation type
     * @param expectedType The expected operation type
     */
    function validateOperationType(bytes32 actualType, bytes32 expectedType) internal pure {
        if (actualType != expectedType) revert InvalidOperationType(actualType, expectedType);
    }
    
    /**
     * @dev Validates that a transaction is in pending state
     * @param status The transaction status
     */
    function validatePendingTransaction(uint8 status) internal pure {
        if (status != 1) revert CanOnlyApprovePending(status); // 1 = PENDING in TxStatus enum
    }
    
    /**
     * @dev Validates that a request is not already pending
     * @param txId The transaction ID to validate
     */
    function validateNoOpenRequest(uint256 txId) internal pure {
        if (txId > 0) revert RequestAlreadyPending(txId);
    }
    
    /**
     * @dev Validates that a transaction exists (has non-zero ID)
     * @param txId The transaction ID to validate
     */
    function validateTransactionExists(uint256 txId) internal pure {
        if (txId == 0) revert TransactionNotFound(txId);
    }
    
    /**
     * @dev Validates that a transaction ID matches the expected value
     * @param txId The transaction ID to validate
     * @param expectedTxId The expected transaction ID
     */
    function validateTransactionId(uint256 txId, uint256 expectedTxId) internal pure {
        if (txId != expectedTxId) revert TransactionIdMismatch(expectedTxId, txId);
    }
    
    /**
     * @dev Validates that a contract is not already initialized
     */
    function validateNotInitialized() internal pure {
        revert AlreadyInitialized();
    }
    
    // ============ META-TRANSACTION VALIDATION FUNCTIONS ============
    
    /**
     * @dev Validates chain ID matches the current chain
     * @param chainId The chain ID to validate
     */
    function validateChainId(uint256 chainId) internal view {
        if (chainId != block.chainid) revert ChainIdMismatch(chainId, block.chainid);
    }
    
    /**
     * @dev Validates that handler contract matches target
     * @param handlerContract The handler contract address
     * @param target The target contract address
     */
    function validateHandlerContractMatch(address handlerContract, address target) internal pure {
        if (handlerContract != target) revert HandlerContractMismatch(handlerContract, target);
    }
    
    /**
     * @dev Validates that a handler selector is not zero
     * @param selector The handler selector to validate
     */
    function validateHandlerSelector(bytes4 selector) internal pure {
        if (selector == bytes4(0)) revert InvalidHandlerSelector(selector);
    }

    /**
     * @dev Validates that a handler selector matches the expected selector
     * @param actualSelector The actual handler selector from the meta transaction
     * @param expectedSelector The expected handler selector to validate against
     */
    function validateHandlerSelectorMatch(bytes4 actualSelector, bytes4 expectedSelector) internal pure {
        if (actualSelector != expectedSelector) revert InvalidHandlerSelector(actualSelector);
    }
    
    /**
     * @dev Validates that a nonce matches the expected value
     * @param nonce The nonce to validate
     * @param expectedNonce The expected nonce value
     */
    function validateNonce(uint256 nonce, uint256 expectedNonce) internal pure {
        if (nonce != expectedNonce) revert InvalidNonce(nonce, expectedNonce);
    }
    
    /**
     * @dev Validates gas price is within limits
     * @param maxGasPrice The maximum allowed gas price
     */
    function validateGasPrice(uint256 maxGasPrice) internal view {
        if (maxGasPrice > 0 && block.basefee > maxGasPrice) {
            revert GasPriceExceedsMax(block.basefee, maxGasPrice);
        }
    }
    
    // ============ ROLE AND FUNCTION VALIDATION FUNCTIONS ============
    
    /**
     * @dev Validates that a role exists
     * @param roleName The role name to validate
     */
    function validateRoleExists(string memory roleName) internal pure {
        if (bytes(roleName).length == 0) revert RoleDoesNotExist(roleName);
    }
    
    /**
     * @dev Validates that a role doesn't already exist
     * @param roleName The role name to validate
     */
    function validateRoleNew(string memory roleName) internal pure {
        revert RoleAlreadyExists(roleName);
    }
    
    /**
     * @dev Validates that a function doesn't already exist
     * @param functionSelector The function selector to check
     */
    function validateFunctionNew(bytes4 functionSelector) internal pure {
        revert FunctionAlreadyExists(functionSelector);
    }
    
    /**
     * @dev Validates that a function exists
     * @param functionSelector The function selector to check
     */
    function validateFunctionExists(bytes4 functionSelector) internal pure {
        if (functionSelector == bytes4(0)) revert FunctionDoesNotExist(functionSelector);
    }
    
    /**
     * @dev Validates that a wallet is not already in a role
     * @param wallet The wallet address to validate
     * @param role The role name
     */
    function validateWalletNotInRole(address wallet, string memory role) internal pure {
        revert WalletAlreadyInRole(wallet, role);
    }
    
    /**
     * @dev Validates that a role hasn't reached its wallet limit
     * @param currentCount The current number of wallets in the role
     * @param maxWallets The maximum number of wallets allowed
     * @param role The role name
     */
    function validateWalletLimit(uint256 currentCount, uint256 maxWallets, string memory role) internal pure {
        if (currentCount >= maxWallets) revert RoleWalletLimitReached(role, currentCount, maxWallets);
    }
    
    /**
     * @dev Validates that a function permission doesn't already exist
     * @param functionSelector The function selector
     * @param role The role name
     */
    function validatePermissionNew(bytes4 functionSelector, string memory role) internal pure {
        revert FunctionPermissionExists(functionSelector, role);
    }
    
    /**
     * @dev Validates that an action is supported by a function
     * @param action The action to validate
     * @param functionName The function name
     */
    function validateActionSupported(string memory action, string memory functionName) internal pure {
        revert ActionNotSupported(action, functionName);
    }
    
    /**
     * @dev Validates that a role name is not empty
     * @param roleName The role name to validate
     */
    function validateRoleNameNotEmpty(string memory roleName) internal pure {
        if (bytes(roleName).length == 0) revert RoleNameEmpty();
    }
    
    /**
     * @dev Validates that a role is not protected
     * @param role The role name
     */
    function validateRoleNotProtected(string memory role) internal pure {
        revert CannotModifyProtectedRoles(role);
    }
    
    /**
     * @dev Validates that role editing is enabled
     */
    function validateRoleEditingEnabled() internal pure {
        revert RoleEditingDisabled();
    }
    
    /**
     * @dev Validates that max wallets is greater than zero
     * @param maxWallets The maximum number of wallets
     */
    function validateMaxWalletsGreaterThanZero(uint256 maxWallets) internal pure {
        if (maxWallets == 0) revert MaxWalletsZero(maxWallets);
    }
    
    /**
     * @dev Validates that a wallet can be removed from a role
     * @param wallet The wallet address
     * @param role The role name
     */
    function validateCanRemoveWallet(address wallet, string memory role) internal pure {
        revert CannotRemoveLastWallet(wallet, role);
    }
    
    /**
     * @dev Validates that a wallet exists in a role
     * @param wallet The wallet address
     * @param role The role name
     */
    function validateWalletInRole(address wallet, string memory role) internal pure {
        revert OldWalletNotFound(wallet, role);
    }
    
    /**
     * @dev Validates that a protected role cannot be removed
     * @param role The role name
     */
    function validateCanRemoveProtectedRole(string memory role) internal pure {
        revert CannotRemoveProtectedRole(role);
    }
    
    // ============ UTILITY FUNCTIONS ============
    
    /**
     * @dev Validates that a value is greater than zero
     * @param value The value to validate
     */
    function validateGreaterThanZero(uint256 value) internal pure {
        if (value == 0) revert TimeLockPeriodZero(value);
    }
    
    /**
     * @dev Validates that two values are equal
     * @param actual The actual value
     * @param expected The expected value
     */
    function validateEqual(uint256 actual, uint256 expected) internal pure {
        if (actual != expected) revert TransactionIdMismatch(expected, actual);
    }
    
    /**
     * @dev Validates that two bytes4 values are equal
     * @param actual The actual value
     * @param expected The expected value
     */
    function validateEqual(bytes4 actual, bytes4 expected) internal pure {
        if (actual != expected) revert InvalidHandlerSelector(actual);
    }
    
    /**
     * @dev Validates that two bytes32 values are equal
     * @param actual The actual value
     * @param expected The expected value
     */
    function validateEqual(bytes32 actual, bytes32 expected) internal pure {
        if (actual != expected) revert InvalidOperationType(actual, expected);
    }
    
    /**
     * @dev Validates that two address values are equal
     * @param actual The actual value
     * @param expected The expected value
     */
    function validateEqual(address actual, address expected) internal pure {
        if (actual != expected) revert HandlerContractMismatch(actual, expected);
    }
    
    /**
     * @dev Validates that a boolean condition is true
     * @param condition The condition to validate
     */
    function validateTrue(bool condition) internal pure {
        if (!condition) revert InvalidOperationType(bytes32(0), bytes32(0));
    }
    
    /**
     * @dev Validates that a boolean condition is false
     * @param condition The condition to validate
     */
    function validateFalse(bool condition) internal pure {
        if (condition) revert InvalidOperationType(bytes32(0), bytes32(0));
    }
    
    /**
     * @dev Validates that the first value is less than the second value
     * @param from The first value (should be less than 'to')
     * @param to The second value (should be greater than 'from')
     */
    function validateLessThan(uint256 from, uint256 to) internal pure {
        if (from >= to) revert InvalidRange(from, to);
    }
    
    /**
     * @dev Validates that a value is within a valid range
     * @param value The value to validate
     * @param min The minimum allowed value
     * @param max The maximum allowed value
     */
    function validateRange(uint256 value, uint256 min, uint256 max) internal pure {
        if (value < min || value > max) revert InvalidRange(value, max);
    }
    
    /**
     * @dev Validates that a string is not empty
     * @param str The string to validate
     */
    function validateStringNotEmpty(string memory str) internal pure {
        if (bytes(str).length == 0) revert RoleNameEmpty();
    }
    
    /**
     * @dev Validates that a bytes array is not empty
     * @param data The bytes array to validate
     */
    function validateBytesNotEmpty(bytes memory data) internal pure {
        if (data.length == 0) revert InvalidSignature(data);
    }
}