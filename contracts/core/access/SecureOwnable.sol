// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

// OpenZeppelin imports
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// Contracts imports
import "../../lib/MultiPhaseSecureOperation.sol";
import "../../lib/definitions/MultiPhaseSecureOperationDefinitions.sol";
import "../../lib/definitions/SecureOwnableDefinitions.sol";
import "../../interfaces/IDefinitionContract.sol";
import "../../utils/SharedValidationLibrary.sol";
import "./interface/ISecureOwnable.sol";

/**
 * @title SecureOwnable
 * @dev An enhanced version of OpenZeppelin's Ownable contract with multi-phase security operations
 *
 * SecureOwnable extends the standard ownership model with advanced security mechanisms:
 * - Time-locked operations that require a waiting period before execution
 * - Multi-role security model with Owner, Broadcaster, and Recovery roles
 * - Meta-transaction support for delegated operations
 * - Secure multi-phase operations for critical administrative functions
 *
 * The contract implements four primary secure operation types:
 * 1. OWNERSHIP_TRANSFER - For securely transferring contract ownership
 * 2. BROADCASTER_UPDATE - For changing the broadcaster address
 * 3. RECOVERY_UPDATE - For updating the recovery address
 * 4. TIMELOCK_UPDATE - For modifying the time lock period
 *
 * Each operation follows a request -> approval workflow with appropriate time locks
 * and authorization checks. Operations can be cancelled within specific time windows.
 *
 * This contract is designed for high-security systems where immediate administrative
 * changes would pose security risks.
 */
abstract contract SecureOwnable is Initializable, ERC165Upgradeable, ISecureOwnable {
    using MultiPhaseSecureOperation for MultiPhaseSecureOperation.SecureOperationState;
    using SharedValidationLibrary for *;

    MultiPhaseSecureOperation.SecureOperationState private _secureState;


    // Request flags
    bool private _hasOpenOwnershipRequest;
    bool private _hasOpenBroadcasterRequest;

    event OwnershipTransferRequest(address currentOwner, address newOwner);
    event OwnershipTransferCancelled(uint256 txId);
    event OwnershipTransferUpdated(address oldOwner, address newOwner);
    event BroadcasterUpdateRequest(address currentBroadcaster, address newBroadcaster);
    event BroadcasterUpdateCancelled(uint256 txId);
    event BroadcasterUpdated(address oldBroadcaster, address newBroadcaster);
    event RecoveryAddressUpdated(address oldRecovery, address newRecovery);
    event TimeLockPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);

    modifier onlyOwner() {
        SharedValidationLibrary.validateOwner(owner());
        _;
    }

    modifier onlyOwnerOrRecovery() {
        SharedValidationLibrary.validateOwnerOrRecovery(owner(), getRecovery());
        _;
    }
    
    modifier onlyRecovery() {
        SharedValidationLibrary.validateRecovery(getRecovery());
        _;
    }

    modifier onlyBroadcaster() {
        SharedValidationLibrary.validateBroadcaster(getBroadcaster());
        _;
    }

    /**
     * @notice Initializer to initialize SecureOwnable state
     * @param initialOwner The initial owner address
     * @param broadcaster The broadcaster address
     * @param recovery The recovery address
     * @param timeLockPeriodSec The timelock period in seconds
     * @param eventForwarder The event forwarder address 
     */
    function initialize(
        address initialOwner,
        address broadcaster,
        address recovery,
        uint256 timeLockPeriodSec,    
        address eventForwarder
    ) public virtual onlyInitializing {
        __ERC165_init();
        
        _secureState.initialize(initialOwner, broadcaster, recovery, timeLockPeriodSec);
        
        // Load definitions directly from MultiPhaseSecureOperation library
        IDefinitionContract.RolePermission memory multiPhasePermissions = MultiPhaseSecureOperationDefinitions.getRolePermissions();
        MultiPhaseSecureOperation.loadDefinitionContract(
            _secureState,
            MultiPhaseSecureOperationDefinitions.getOperationTypes(),
            MultiPhaseSecureOperationDefinitions.getFunctionSchemas(),
            multiPhasePermissions.roleHashes,
            multiPhasePermissions.functionPermissions
        );
        
        IDefinitionContract.RolePermission memory secureOwnablePermissions = SecureOwnableDefinitions.getRolePermissions();
        MultiPhaseSecureOperation.loadDefinitionContract(
            _secureState,
            SecureOwnableDefinitions.getOperationTypes(),
            SecureOwnableDefinitions.getFunctionSchemas(),
            secureOwnablePermissions.roleHashes,
            secureOwnablePermissions.functionPermissions
        );

        _secureState.setEventForwarder(eventForwarder);
    }

    // Ownership Management
    /**
     * @dev Requests a transfer of ownership
     * @return The transaction record
     */
    function transferOwnershipRequest() public onlyRecovery returns (MultiPhaseSecureOperation.TxRecord memory) {
        if (_hasOpenOwnershipRequest) revert SharedValidationLibrary.RequestAlreadyPending(0);
        bytes memory executionOptions = MultiPhaseSecureOperation.createStandardExecutionOptions(
            SecureOwnableDefinitions.TRANSFER_OWNERSHIP_SELECTOR,
            abi.encode(getRecovery())
        );

        MultiPhaseSecureOperation.TxRecord memory txRecord = _secureState.txRequest(
            msg.sender,
            address(this),
            0, // no value
            0, // no gas limit
            SecureOwnableDefinitions.OWNERSHIP_TRANSFER,
            MultiPhaseSecureOperation.ExecutionType.STANDARD,
            executionOptions
        );

        _hasOpenOwnershipRequest = true;
        emit OwnershipTransferRequest(owner(), getRecovery());
        return txRecord;
    }

    /**
     * @dev Approves a pending ownership transfer transaction after the release time
     * @param txId The transaction ID
     * @return The updated transaction record
     */
    function transferOwnershipDelayedApproval(uint256 txId) public onlyOwnerOrRecovery returns (MultiPhaseSecureOperation.TxRecord memory) {
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txDelayedApproval(txId);
        SharedValidationLibrary.validateOperationType(updatedRecord.params.operationType, SecureOwnableDefinitions.OWNERSHIP_TRANSFER);
        _hasOpenOwnershipRequest = false;
        return updatedRecord;
    }

    /**
     * @dev Approves a pending ownership transfer transaction using a meta-transaction
     * @param metaTx The meta-transaction
     * @return The updated transaction record
     */
    function transferOwnershipApprovalWithMetaTx(MultiPhaseSecureOperation.MetaTransaction memory metaTx) public onlyBroadcaster returns (MultiPhaseSecureOperation.TxRecord memory) {
        _secureState.checkPermission(SecureOwnableDefinitions.TRANSFER_OWNERSHIP_APPROVE_META_SELECTOR);
        SharedValidationLibrary.validateHandlerSelectorMatch(metaTx.params.handlerSelector, SecureOwnableDefinitions.TRANSFER_OWNERSHIP_APPROVE_META_SELECTOR);
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txApprovalWithMetaTx(metaTx);
        SharedValidationLibrary.validateOperationType(updatedRecord.params.operationType, SecureOwnableDefinitions.OWNERSHIP_TRANSFER);
        _hasOpenOwnershipRequest = false;
        return updatedRecord;
    }

    /**
     * @dev Cancels a pending ownership transfer transaction
     * @param txId The transaction ID
     * @return The updated transaction record
     */
    function transferOwnershipCancellation(uint256 txId) public onlyRecovery returns (MultiPhaseSecureOperation.TxRecord memory) {
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txCancellation(txId);
        SharedValidationLibrary.validateOperationType(updatedRecord.params.operationType, SecureOwnableDefinitions.OWNERSHIP_TRANSFER);
        _hasOpenOwnershipRequest = false;
        emit OwnershipTransferCancelled(txId);
        return updatedRecord;
    }

    /**
     * @dev Cancels a pending ownership transfer transaction using a meta-transaction
     * @param metaTx The meta-transaction
     * @return The updated transaction record
     */
    function transferOwnershipCancellationWithMetaTx(MultiPhaseSecureOperation.MetaTransaction memory metaTx) public onlyBroadcaster returns (MultiPhaseSecureOperation.TxRecord memory) {
        _secureState.checkPermission(SecureOwnableDefinitions.TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR);
        SharedValidationLibrary.validateHandlerSelectorMatch(metaTx.params.handlerSelector, SecureOwnableDefinitions.TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR);
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txCancellationWithMetaTx(metaTx);
        SharedValidationLibrary.validateOperationType(updatedRecord.params.operationType, SecureOwnableDefinitions.OWNERSHIP_TRANSFER);
        _hasOpenOwnershipRequest = false;
        emit OwnershipTransferCancelled(updatedRecord.txId);
        return updatedRecord;
    }

    // Broadcaster Management
    /**
     * @dev Updates the broadcaster address
     * @param newBroadcaster The new broadcaster address
     * @return The execution options
     */
    function updateBroadcasterRequest(address newBroadcaster) public onlyOwner returns (MultiPhaseSecureOperation.TxRecord memory) {
        if (_hasOpenBroadcasterRequest) revert SharedValidationLibrary.RequestAlreadyPending(0);
        SharedValidationLibrary.validateAddressUpdate(newBroadcaster, getBroadcaster());
        
        bytes memory executionOptions = MultiPhaseSecureOperation.createStandardExecutionOptions(
            SecureOwnableDefinitions.UPDATE_BROADCASTER_SELECTOR,
            abi.encode(newBroadcaster)
        );

        MultiPhaseSecureOperation.TxRecord memory txRecord = _secureState.txRequest(
            msg.sender,
            address(this),
            0, // no value
            0, // no gas limit
            SecureOwnableDefinitions.BROADCASTER_UPDATE,
            MultiPhaseSecureOperation.ExecutionType.STANDARD,
            executionOptions
        );

        _hasOpenBroadcasterRequest = true;
        emit BroadcasterUpdateRequest(getBroadcaster(), newBroadcaster);
        return txRecord;
    }

    /**
     * @dev Approves a pending broadcaster update transaction after the release time
     * @param txId The transaction ID
     * @return The updated transaction record
     */
    function updateBroadcasterDelayedApproval(uint256 txId) public onlyOwner returns (MultiPhaseSecureOperation.TxRecord memory) {
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txDelayedApproval(txId);
        SharedValidationLibrary.validateOperationType(updatedRecord.params.operationType, SecureOwnableDefinitions.BROADCASTER_UPDATE);
        _hasOpenBroadcasterRequest = false;
        return updatedRecord;
    }

    /**
     * @dev Approves a pending broadcaster update transaction using a meta-transaction
     * @param metaTx The meta-transaction
     * @return The updated transaction record
     */
    function updateBroadcasterApprovalWithMetaTx(MultiPhaseSecureOperation.MetaTransaction memory metaTx) public onlyBroadcaster returns (MultiPhaseSecureOperation.TxRecord memory) {
        _secureState.checkPermission(SecureOwnableDefinitions.UPDATE_BROADCASTER_APPROVE_META_SELECTOR);
        SharedValidationLibrary.validateHandlerSelectorMatch(metaTx.params.handlerSelector, SecureOwnableDefinitions.UPDATE_BROADCASTER_APPROVE_META_SELECTOR);
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txApprovalWithMetaTx(metaTx);
        SharedValidationLibrary.validateOperationType(updatedRecord.params.operationType, SecureOwnableDefinitions.BROADCASTER_UPDATE);
        _hasOpenBroadcasterRequest = false;
        return updatedRecord;
    }

    /**
     * @dev Cancels a pending broadcaster update transaction
     * @param txId The transaction ID
     * @return The updated transaction record
     */
    function updateBroadcasterCancellation(uint256 txId) public onlyOwner returns (MultiPhaseSecureOperation.TxRecord memory) {
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txCancellation(txId);
        SharedValidationLibrary.validateOperationType(updatedRecord.params.operationType, SecureOwnableDefinitions.BROADCASTER_UPDATE);
        _hasOpenBroadcasterRequest = false;
        emit BroadcasterUpdateCancelled(txId);
        return updatedRecord;
    }

    /**
     * @dev Cancels a pending broadcaster update transaction using a meta-transaction
     * @param metaTx The meta-transaction
     * @return The updated transaction record
     */
    function updateBroadcasterCancellationWithMetaTx(MultiPhaseSecureOperation.MetaTransaction memory metaTx) public onlyBroadcaster returns (MultiPhaseSecureOperation.TxRecord memory) {
        _secureState.checkPermission(SecureOwnableDefinitions.UPDATE_BROADCASTER_CANCEL_META_SELECTOR);
        SharedValidationLibrary.validateHandlerSelectorMatch(metaTx.params.handlerSelector, SecureOwnableDefinitions.UPDATE_BROADCASTER_CANCEL_META_SELECTOR);
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txCancellationWithMetaTx(metaTx);
        SharedValidationLibrary.validateOperationType(updatedRecord.params.operationType, SecureOwnableDefinitions.BROADCASTER_UPDATE);
        _hasOpenBroadcasterRequest = false;
        emit BroadcasterUpdateCancelled(updatedRecord.txId);
        return updatedRecord;
    }

    // Recovery Management
    /**
     * @dev Creates execution options for updating the recovery address
     * @param newRecoveryAddress The new recovery address
     * @return The execution options
     */
    function updateRecoveryExecutionOptions(
        address newRecoveryAddress
    ) public view returns (bytes memory) {
        SharedValidationLibrary.validateAddressUpdate(newRecoveryAddress, getRecovery());
        return MultiPhaseSecureOperation.createStandardExecutionOptions(
            SecureOwnableDefinitions.UPDATE_RECOVERY_SELECTOR,
            abi.encode(newRecoveryAddress)
        );
    }

    /**
     * @dev Requests and approves a recovery address update using a meta-transaction
     * @param metaTx The meta-transaction
     * @return The transaction record
     */
    function updateRecoveryRequestAndApprove(
        MultiPhaseSecureOperation.MetaTransaction memory metaTx
    ) public onlyBroadcaster returns (MultiPhaseSecureOperation.TxRecord memory) {
        _secureState.checkPermission(SecureOwnableDefinitions.UPDATE_RECOVERY_META_SELECTOR);
        return _requestAndApprove(metaTx);
    }

    // TimeLock Management
    /**
     * @dev Creates execution options for updating the time lock period
     * @param newTimeLockPeriodSec The new time lock period in seconds
     * @return The execution options
     */
    function updateTimeLockExecutionOptions(
        uint256 newTimeLockPeriodSec
    ) public view returns (bytes memory) {
        SharedValidationLibrary.validateTimeLockUpdate(newTimeLockPeriodSec, getTimeLockPeriodSec());
        return MultiPhaseSecureOperation.createStandardExecutionOptions(
            SecureOwnableDefinitions.UPDATE_TIMELOCK_SELECTOR,
            abi.encode(newTimeLockPeriodSec)
        );
    }

    /**
     * @dev Requests and approves a time lock period update using a meta-transaction
     * @param metaTx The meta-transaction
     * @return The transaction record
     */
    function updateTimeLockRequestAndApprove(
        MultiPhaseSecureOperation.MetaTransaction memory metaTx
    ) public onlyBroadcaster returns (MultiPhaseSecureOperation.TxRecord memory) {
        _secureState.checkPermission(SecureOwnableDefinitions.UPDATE_TIMELOCK_META_SELECTOR);
        return _requestAndApprove(metaTx);
    }

    // Getters
    /**
     * @dev Gets transaction history within a specified range
     * @param fromTxId The starting transaction ID (inclusive)
     * @param toTxId The ending transaction ID (inclusive)
     * @return The transaction history within the specified range
     */
    function getTransactionHistory(uint256 fromTxId, uint256 toTxId) public view returns (MultiPhaseSecureOperation.TxRecord[] memory) {    
        // Validate the range
        fromTxId = fromTxId > 0 ? fromTxId : 1;
        toTxId = toTxId > _secureState.txCounter ? _secureState.txCounter : toTxId;
        
        // Validate that fromTxId is less than toTxId
        SharedValidationLibrary.validateLessThan(fromTxId, toTxId);

        uint256 rangeSize = toTxId - fromTxId + 1;
        MultiPhaseSecureOperation.TxRecord[] memory history = new MultiPhaseSecureOperation.TxRecord[](rangeSize);
        
        for (uint256 i = 0; i < rangeSize; i++) {
            history[i] = _secureState.getTxRecord(fromTxId + i);
        }
        
        return history;
    }

    /**
     * @dev Gets a transaction
     * @param txId The transaction ID
     * @return The transaction record
     */
    function getTransaction(uint256 txId) public view returns (MultiPhaseSecureOperation.TxRecord memory) {
        return _secureState.getTxRecord(txId);
    }

    /**
     * @dev Gets all pending transaction IDs
     * @return Array of pending transaction IDs
     */
    function getPendingTransactions() public view returns (uint256[] memory) {
        return _secureState.getPendingTransactionsList();
    }

    /**
     * @dev Creates meta-transaction parameters with specified values
     * @param handlerContract The contract that will handle the meta-transaction
     * @param handlerSelector The function selector for the handler
     * @param action The transaction action type
     * @param deadline The timestamp after which the meta-transaction expires
     * @param maxGasPrice The maximum gas price allowed for execution
     * @param signer The address that will sign the meta-transaction
     * @return The formatted meta-transaction parameters
     */
    function createMetaTxParams(
        address handlerContract,
        bytes4 handlerSelector,
        MultiPhaseSecureOperation.TxAction action,
        uint256 deadline,
        uint256 maxGasPrice,
        address signer
    ) public view returns (MultiPhaseSecureOperation.MetaTxParams memory) {
        return _secureState.createMetaTxParams(
            handlerContract,
            handlerSelector,
            action,
            block.timestamp + (deadline * 1 hours),
            maxGasPrice,
            signer
        );
    }

    /**
     * @dev Generates an unsigned meta-transaction for a new operation
     * @param requester The address requesting the operation
     * @param target The target contract address
     * @param value The ETH value to send
     * @param gasLimit The gas limit for execution
     * @param operationType The type of operation
     * @param executionType The type of execution (STANDARD or RAW)
     * @param executionOptions The encoded execution options
     * @param metaTxParams The meta-transaction parameters
     * @return The unsigned meta-transaction
     */
    function generateUnsignedMetaTransactionForNew(
        address requester,
        address target,
        uint256 value,
        uint256 gasLimit,
        bytes32 operationType,
        MultiPhaseSecureOperation.ExecutionType executionType,
        bytes memory executionOptions,
        MultiPhaseSecureOperation.MetaTxParams memory metaTxParams
    ) public view returns (MultiPhaseSecureOperation.MetaTransaction memory) {
        MultiPhaseSecureOperation.TxParams memory txParams = MultiPhaseSecureOperation.TxParams({
            requester: requester,
            target: target,
            value: value,
            gasLimit: gasLimit,
            operationType: operationType,
            executionType: executionType,
            executionOptions: executionOptions
        });

        return _secureState.generateUnsignedForNewMetaTx(txParams, metaTxParams);
    }

    /**
     * @dev Generates an unsigned meta-transaction for an existing transaction
     * @param txId The ID of the existing transaction
     * @param metaTxParams The meta-transaction parameters
     * @return The unsigned meta-transaction
     */
    function generateUnsignedMetaTransactionForExisting(
        uint256 txId,
        MultiPhaseSecureOperation.MetaTxParams memory metaTxParams
    ) public view returns (MultiPhaseSecureOperation.MetaTransaction memory) {
        return _secureState.generateUnsignedForExistingMetaTx(txId, metaTxParams);
    }

    /**
     * @dev Checks if an operation type is supported
     * @param operationType The operation type to check
     * @return bool True if the operation type is supported
     */
    function isOperationTypeSupported(bytes32 operationType) public view returns (bool) {
        return _secureState.isOperationTypeSupported(operationType);
    }

    /**
     * @dev External function that can only be called by the contract itself to execute ownership transfer
     * @param newOwner The new owner address
     */
    function executeTransferOwnership(address newOwner) external {
        SharedValidationLibrary.validateInternalCall(address(this));
        _transferOwnership(newOwner);
    }

    /**
     * @dev External function that can only be called by the contract itself to execute broadcaster update
     * @param newBroadcaster The new broadcaster address
     */
    function executeBroadcasterUpdate(address newBroadcaster) external {
        SharedValidationLibrary.validateInternalCall(address(this));
        _updateBroadcaster(newBroadcaster);
    }

    /**
     * @dev External function that can only be called by the contract itself to execute recovery update
     * @param newRecoveryAddress The new recovery address
     */
    function executeRecoveryUpdate(address newRecoveryAddress) external {
        SharedValidationLibrary.validateInternalCall(address(this));
        _updateRecoveryAddress(newRecoveryAddress);
    }

    /**
     * @dev External function that can only be called by the contract itself to execute timelock update
     * @param newTimeLockPeriodSec The new timelock period in seconds
     */
    function executeTimeLockUpdate(uint256 newTimeLockPeriodSec) external {
        SharedValidationLibrary.validateInternalCall(address(this));
        _updateTimeLockPeriod(newTimeLockPeriodSec);
    }

    // Internal functions
    /**
     * @dev Requests and approves a meta-transaction
     * @param metaTx The meta-transaction
     * @return The transaction record
     */
    function _requestAndApprove(
        MultiPhaseSecureOperation.MetaTransaction memory metaTx
    ) internal returns (MultiPhaseSecureOperation.TxRecord memory) {
        MultiPhaseSecureOperation.TxRecord memory txRecord = _secureState.requestAndApprove(metaTx);
        return txRecord;
    }

    // Ownership management
    /**
     * @dev Returns the owner of the contract
     * @return The owner of the contract
     */
    function owner() public view virtual override returns (address) {
        return _secureState.getAuthorizedWalletAt(MultiPhaseSecureOperation.OWNER_ROLE, 0);
    }

    /**
     * @dev Returns the broadcaster address
     * @return The broadcaster address
     */
    function getBroadcaster() public view virtual override returns (address) {
        return _secureState.getAuthorizedWalletAt(MultiPhaseSecureOperation.BROADCASTER_ROLE, 0);
    }

    /**
     * @dev Returns the recovery address
     * @return The recovery address
     */
    function getRecovery() public view virtual override returns (address) {
        return _secureState.getAuthorizedWalletAt(MultiPhaseSecureOperation.RECOVERY_ROLE, 0);
    }

    /**
     * @dev Returns if a wallet is authorized for a role
     * @param roleHash The hash of the role to check
     * @param wallet The wallet address to check
     * @return True if the wallet is authorized for the role, false otherwise
     */
    function hasRole(bytes32 roleHash, address wallet) public view returns (bool) {
        return _secureState.hasRole(roleHash, wallet);
    }

    /**
     * @dev Returns if an action is supported by a function
     * @param functionSelector The function selector to check
     * @param action The action to check
     * @return True if the action is supported by the function, false otherwise
     */
    function isActionSupportedByFunction(bytes4 functionSelector, MultiPhaseSecureOperation.TxAction action) public view returns (bool) {
        return _secureState.isActionSupportedByFunction(functionSelector, action);
    }

    /**
     * @dev Returns the time lock period
     * @return The time lock period in seconds
     */
    function getTimeLockPeriodSec() public view virtual returns (uint256) {
        return _secureState.timeLockPeriodSec;
    }

    /**
     * @dev Returns the supported operation types
     * @return The supported operation types
     */
    function getSupportedOperationTypes() public view override returns (bytes32[] memory) {
        return _secureState.getSupportedOperationTypesList();
    }

    /**
     * @dev Returns the supported roles list
     * @return The supported roles list
     */
    function getSupportedRoles() public view returns (bytes32[] memory) {
        return _secureState.getSupportedRolesList();
    }

    /**
     * @dev Returns the supported functions list
     * @return The supported functions list
     */
    function getSupportedFunctions() public view returns (bytes4[] memory) {
        return _secureState.getSupportedFunctionsList();
    }

    /**
     * @dev Gets the current nonce for a specific signer
     * @param signer The address of the signer
     * @return The current nonce for the signer
     */
    function getSignerNonce(address signer) public view returns (uint256) {
        return _secureState.getSignerNonce(signer);
    }

    /**
     * @dev Gets the function permissions for a specific role
     * @param roleHash The hash of the role to get permissions for
     * @return The function permissions array for the role
     */
    function getRolePermission(bytes32 roleHash) public view returns (MultiPhaseSecureOperation.FunctionPermission[] memory) {
        MultiPhaseSecureOperation.Role storage role = _secureState.getRole(roleHash);
        return role.functionPermissions;
    }

    /**
     * @dev Internal function to get the secure state
     * @return secureState The secure state
     */
    function _getSecureState() internal view returns (MultiPhaseSecureOperation.SecureOperationState storage) {
        return _secureState;
    }

    /**
     * @dev Transfers ownership of the contract
     * @param newOwner The new owner of the contract
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = owner();
        _secureState.updateAuthorizedWalletInRole(MultiPhaseSecureOperation.OWNER_ROLE, newOwner, oldOwner);
        emit OwnershipTransferUpdated(oldOwner, newOwner);
    }

    /**
     * @dev Updates the broadcaster address
     * @param newBroadcaster The new broadcaster address
     */
    function _updateBroadcaster(address newBroadcaster) internal virtual {
        address oldBroadcaster = getBroadcaster();
        _secureState.updateAuthorizedWalletInRole(MultiPhaseSecureOperation.BROADCASTER_ROLE, newBroadcaster, oldBroadcaster);
        emit BroadcasterUpdated(oldBroadcaster, newBroadcaster);
    }

    /**
     * @dev Updates the recovery address
     * @param newRecoveryAddress The new recovery address
     */
    function _updateRecoveryAddress(address newRecoveryAddress) internal virtual {
        address oldRecovery = getRecovery();
        _secureState.updateAuthorizedWalletInRole(MultiPhaseSecureOperation.RECOVERY_ROLE, newRecoveryAddress, oldRecovery);
        emit RecoveryAddressUpdated(oldRecovery, newRecoveryAddress);
    }

    /**
     * @dev Updates the time lock period
     * @param newTimeLockPeriodSec The new time lock period in seconds
     */
    function _updateTimeLockPeriod(uint256 newTimeLockPeriodSec) internal virtual {
        uint256 oldPeriod = getTimeLockPeriodSec();
        _secureState.updateTimeLockPeriod(newTimeLockPeriodSec);
        emit TimeLockPeriodUpdated(oldPeriod, newTimeLockPeriodSec);
    }

    /**
     * @dev Returns whether the contract is initialized
     * @return bool True if the contract is initialized, false otherwise
     * 
     * This function checks both:
     * 1. The Initializable contract state (from OpenZeppelin)
     * 2. The _secureState.initialized flag (from our custom library)
     * 
     * Both conditions must be true for the contract to be considered fully initialized.
     */
    function initialized() public view virtual returns (bool) {
        return _getInitializedVersion() != type(uint8).max && _secureState.initialized;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165Upgradeable) returns (bool) {
        return
            interfaceId == type(ISecureOwnable).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}