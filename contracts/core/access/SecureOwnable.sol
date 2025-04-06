// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.0;

// OpenZeppelin imports
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

// Contracts imports
import "../../lib/MultiPhaseSecureOperation.sol";
import "./ISecureOwnable.sol";

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
abstract contract SecureOwnable is Ownable, ERC165, ISecureOwnable {
    using MultiPhaseSecureOperation for MultiPhaseSecureOperation.SecureOperationState;

    // Define operation type constants
    bytes32 public constant OWNERSHIP_TRANSFER = keccak256("OWNERSHIP_TRANSFER");
    bytes32 public constant BROADCASTER_UPDATE = keccak256("BROADCASTER_UPDATE");
    bytes32 public constant RECOVERY_UPDATE = keccak256("RECOVERY_UPDATE");
    bytes32 public constant TIMELOCK_UPDATE = keccak256("TIMELOCK_UPDATE");

    uint256 private _timeLockPeriodInMinutes;
    address private _recoveryAddress;
    address private _broadcaster;  

    MultiPhaseSecureOperation.SecureOperationState private _secureState;

    // Function selector constants
    bytes4 private constant TRANSFER_OWNERSHIP_SELECTOR = bytes4(keccak256("executeTransferOwnership(address)"));
    bytes4 private constant UPDATE_BROADCASTER_SELECTOR = bytes4(keccak256("executeBroadcasterUpdate(address)"));
    bytes4 private constant UPDATE_RECOVERY_SELECTOR = bytes4(keccak256("executeRecoveryUpdate(address)"));
    bytes4 private constant UPDATE_TIMELOCK_SELECTOR = bytes4(keccak256("executeTimeLockUpdate(uint256)"));

    // Meta-transaction function selectors
    bytes4 private constant TRANSFER_OWNERSHIP_META_SELECTOR = bytes4(keccak256("transferOwnershipApprovalWithMetaTx((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))"));
    bytes4 private constant TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR = bytes4(keccak256("transferOwnershipCancellationWithMetaTx((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))"));
    bytes4 private constant UPDATE_BROADCASTER_META_SELECTOR = bytes4(keccak256("updateBroadcasterApprovalWithMetaTx((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))"));
    bytes4 private constant UPDATE_BROADCASTER_CANCEL_META_SELECTOR = bytes4(keccak256("updateBroadcasterCancellationWithMetaTx((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))"));
    bytes4 private constant UPDATE_RECOVERY_META_SELECTOR = bytes4(keccak256("updateRecoveryRequestAndApprove((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))"));
    bytes4 private constant UPDATE_TIMELOCK_META_SELECTOR = bytes4(keccak256("updateTimeLockRequestAndApprove((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))"));

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

    modifier onlyOwnerOrRecovery() {
        require(msg.sender == owner() || msg.sender == _recoveryAddress, "Restricted to owner or recovery");
        _;
    }
    
    modifier onlyRecovery() {
        require(msg.sender == _recoveryAddress, "Restricted to recovery owner");
        _;
    }

    modifier onlyBroadcaster() {
        require(msg.sender == _broadcaster, "Restricted to Broadcaster");
        _;
    }

    /**
     * @notice Constructor to initialize SecureOwnable state
     * @param initialOwner The initial owner address
     * @param broadcaster The broadcaster address
     * @param recovery The recovery address
     * @param timeLockPeriodInMinutes The timelock period in minutes
     */
    constructor(
        address initialOwner,
        address broadcaster,
        address recovery,
        uint256 timeLockPeriodInMinutes    
    ) {       
        _timeLockPeriodInMinutes = timeLockPeriodInMinutes;
        _recoveryAddress = recovery;
        _broadcaster = broadcaster;

        _secureState.initialize( initialOwner, broadcaster, recovery, timeLockPeriodInMinutes);
            
        // Initialize operation types and their names
        _secureState.addOperationType(MultiPhaseSecureOperation.ReadableOperationType({
            operationType: OWNERSHIP_TRANSFER,
            name: "OWNERSHIP_TRANSFER"
        }));
        
        _secureState.addOperationType(MultiPhaseSecureOperation.ReadableOperationType({
            operationType: BROADCASTER_UPDATE,
            name: "BROADCASTER_UPDATE"
        }));
        
        _secureState.addOperationType(MultiPhaseSecureOperation.ReadableOperationType({
            operationType: RECOVERY_UPDATE,
            name: "RECOVERY_UPDATE"
        }));
        
        _secureState.addOperationType(MultiPhaseSecureOperation.ReadableOperationType({
            operationType: TIMELOCK_UPDATE,
            name: "TIMELOCK_UPDATE"
        }));
        
        _transferOwnership(initialOwner);

        // Add meta-transaction function selector permissions for broadcaster
        _secureState.addRoleForFunction(TRANSFER_OWNERSHIP_META_SELECTOR, MultiPhaseSecureOperation.BROADCASTER_ROLE);
        _secureState.addRoleForFunction(TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR, MultiPhaseSecureOperation.BROADCASTER_ROLE);
        _secureState.addRoleForFunction(UPDATE_BROADCASTER_META_SELECTOR, MultiPhaseSecureOperation.BROADCASTER_ROLE);
        _secureState.addRoleForFunction(UPDATE_BROADCASTER_CANCEL_META_SELECTOR, MultiPhaseSecureOperation.BROADCASTER_ROLE);
        _secureState.addRoleForFunction(UPDATE_RECOVERY_META_SELECTOR, MultiPhaseSecureOperation.BROADCASTER_ROLE);
        _secureState.addRoleForFunction(UPDATE_TIMELOCK_META_SELECTOR, MultiPhaseSecureOperation.BROADCASTER_ROLE);
    }

    // Ownership Management
    /**
     * @dev Requests a transfer of ownership
     * @return The transaction record
     */
    function transferOwnershipRequest() public onlyRecovery returns (MultiPhaseSecureOperation.TxRecord memory) {
        require(!_hasOpenOwnershipRequest, "Request is already pending");
        bytes memory executionOptions = MultiPhaseSecureOperation.createStandardExecutionOptions(
            TRANSFER_OWNERSHIP_SELECTOR,
            abi.encode(_recoveryAddress)
        );

        MultiPhaseSecureOperation.TxRecord memory txRecord = _secureState.txRequest(
            msg.sender,
            address(this),
            0, // no value
            0, // no gas limit
            OWNERSHIP_TRANSFER,
            MultiPhaseSecureOperation.ExecutionType.STANDARD,
            executionOptions
        );

        _hasOpenOwnershipRequest = true;
        addOperation(txRecord);
        emit OwnershipTransferRequest(owner(), _recoveryAddress);
        return txRecord;
    }

    /**
     * @dev Updates the broadcaster address
     * @param txId The transaction ID
     * @return The updated transaction record
     */
    function transferOwnershipDelayedApproval(uint256 txId) public onlyOwnerOrRecovery returns (MultiPhaseSecureOperation.TxRecord memory) {
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txDelayedApproval(txId);
        _validateOperationType(updatedRecord.params.operationType, OWNERSHIP_TRANSFER);
        _hasOpenOwnershipRequest = false;
        finalizeOperation(updatedRecord);
        return updatedRecord;
    }

    /**
     * @dev Updates the broadcaster address
     * @param metaTx The meta-transaction
     * @return The updated transaction record
     */
    function transferOwnershipApprovalWithMetaTx(MultiPhaseSecureOperation.MetaTransaction memory metaTx) public onlyBroadcaster returns (MultiPhaseSecureOperation.TxRecord memory) {
        _secureState.checkPermission(TRANSFER_OWNERSHIP_META_SELECTOR);
        require(metaTx.params.handlerSelector == TRANSFER_OWNERSHIP_META_SELECTOR, "Invalid handler selector");
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txApprovalWithMetaTx(metaTx);
        _validateOperationType(updatedRecord.params.operationType, OWNERSHIP_TRANSFER);
        _hasOpenOwnershipRequest = false;
        finalizeOperation(updatedRecord);
        return updatedRecord;
    }

    /**
     * @dev Updates the broadcaster address
     * @param txId The transaction ID
     * @return The updated transaction record
     */
    function transferOwnershipCancellation(uint256 txId) public onlyRecovery returns (MultiPhaseSecureOperation.TxRecord memory) {
        MultiPhaseSecureOperation.TxRecord memory txRecord = _secureState.getTxRecord(txId);
        require(block.timestamp >= txRecord.releaseTime - (_timeLockPeriodInMinutes * 1 minutes) + 1 hours, "Cannot cancel within first hour");
        
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txCancellation(txId);
        _validateOperationType(updatedRecord.params.operationType, OWNERSHIP_TRANSFER);
        _hasOpenOwnershipRequest = false;
        finalizeOperation(updatedRecord);
        emit OwnershipTransferCancelled(txId);
        return updatedRecord;
    }

    /**
     * @dev Updates the broadcaster address
     * @param metaTx The meta-transaction
     * @return The updated transaction record
     */
    function transferOwnershipCancellationWithMetaTx(MultiPhaseSecureOperation.MetaTransaction memory metaTx) public onlyBroadcaster returns (MultiPhaseSecureOperation.TxRecord memory) {
        _secureState.checkPermission(TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR);
        require(metaTx.params.handlerSelector == TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR, "Invalid handler selector");
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txCancellationWithMetaTx(metaTx);
        _validateOperationType(updatedRecord.params.operationType, OWNERSHIP_TRANSFER);
        _hasOpenOwnershipRequest = false;
        finalizeOperation(updatedRecord);
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
        require(!_hasOpenBroadcasterRequest, "Request is already pending");
        _validateNotZeroAddress(newBroadcaster);
        require(newBroadcaster != _broadcaster, "New broadcaster must be different");
        
        bytes memory executionOptions = MultiPhaseSecureOperation.createStandardExecutionOptions(
            UPDATE_BROADCASTER_SELECTOR,
            abi.encode(newBroadcaster)
        );

        MultiPhaseSecureOperation.TxRecord memory txRecord = _secureState.txRequest(
            msg.sender,
            address(this),
            0, // no value
            0, // no gas limit
            BROADCASTER_UPDATE,
            MultiPhaseSecureOperation.ExecutionType.STANDARD,
            executionOptions
        );

        _hasOpenBroadcasterRequest = true;
        addOperation(txRecord);
        emit BroadcasterUpdateRequest(_broadcaster, newBroadcaster);
        return txRecord;
    }

    /**
     * @dev Updates the broadcaster address
     * @param txId The transaction ID
     * @return The updated transaction record
     */
    function updateBroadcasterDelayedApproval(uint256 txId) public onlyOwner returns (MultiPhaseSecureOperation.TxRecord memory) {
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txDelayedApproval(txId);
        _validateOperationType(updatedRecord.params.operationType, BROADCASTER_UPDATE);
        _hasOpenBroadcasterRequest = false;
        finalizeOperation(updatedRecord);
        return updatedRecord;
    }

    /**
     * @dev Updates the broadcaster address
     * @param metaTx The meta-transaction
     * @return The updated transaction record
     */
    function updateBroadcasterApprovalWithMetaTx(MultiPhaseSecureOperation.MetaTransaction memory metaTx) public onlyBroadcaster returns (MultiPhaseSecureOperation.TxRecord memory) {
        _secureState.checkPermission(UPDATE_BROADCASTER_META_SELECTOR);
        require(metaTx.params.handlerSelector == UPDATE_BROADCASTER_META_SELECTOR, "Invalid handler selector");
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txApprovalWithMetaTx(metaTx);
        _validateOperationType(updatedRecord.params.operationType, BROADCASTER_UPDATE);
        _hasOpenBroadcasterRequest = false;
        finalizeOperation(updatedRecord);
        return updatedRecord;
    }

    /**
     * @dev Updates the broadcaster address
     * @param txId The transaction ID
     * @return The updated transaction record
     */
    function updateBroadcasterCancellation(uint256 txId) public onlyOwner returns (MultiPhaseSecureOperation.TxRecord memory) {
        MultiPhaseSecureOperation.TxRecord memory txRecord = _secureState.getTxRecord(txId);
        require(block.timestamp >= txRecord.releaseTime - (_timeLockPeriodInMinutes * 1 minutes) + 1 hours, "Cannot cancel within first hour");
        
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txCancellation(txId);
        _validateOperationType(updatedRecord.params.operationType, BROADCASTER_UPDATE);
        _hasOpenBroadcasterRequest = false;
        finalizeOperation(updatedRecord);
        emit BroadcasterUpdateCancelled(txId);
        return updatedRecord;
    }

    /**
     * @dev Updates the broadcaster address
     * @param metaTx The meta-transaction
     * @return The updated transaction record
     */
    function updateBroadcasterCancellationWithMetaTx(MultiPhaseSecureOperation.MetaTransaction memory metaTx) public onlyBroadcaster returns (MultiPhaseSecureOperation.TxRecord memory) {
        _secureState.checkPermission(UPDATE_BROADCASTER_CANCEL_META_SELECTOR);
        require(metaTx.params.handlerSelector == UPDATE_BROADCASTER_CANCEL_META_SELECTOR, "Invalid handler selector");
        MultiPhaseSecureOperation.TxRecord memory updatedRecord = _secureState.txCancellationWithMetaTx(metaTx);
        _validateOperationType(updatedRecord.params.operationType, BROADCASTER_UPDATE);
        _hasOpenBroadcasterRequest = false;
        finalizeOperation(updatedRecord);
        emit BroadcasterUpdateCancelled(updatedRecord.txId);
        return updatedRecord;
    }

    // Recovery Management
    /**
     * @dev Updates the recovery address
     * @param newRecoveryAddress The new recovery address
     * @return The execution options
     */
    function updateRecoveryExecutionOptions(
        address newRecoveryAddress
    ) public view returns (bytes memory) {
        _validateNotZeroAddress(newRecoveryAddress);
        require(newRecoveryAddress != _recoveryAddress, "New recovery must be different");

        return MultiPhaseSecureOperation.createStandardExecutionOptions(
            UPDATE_RECOVERY_SELECTOR,
            abi.encode(newRecoveryAddress)
        );
    }

    /**
     * @dev Updates the recovery address
     * @param metaTx The meta-transaction
     * @return The execution options
     */
    function updateRecoveryRequestAndApprove(
        MultiPhaseSecureOperation.MetaTransaction memory metaTx
    ) public onlyBroadcaster returns (MultiPhaseSecureOperation.TxRecord memory) {
        _secureState.checkPermission(UPDATE_RECOVERY_META_SELECTOR);

        return _requestAndApprove(metaTx);
    }

    // TimeLock Management
    /**
     * @dev Updates the time lock period
     * @param newTimeLockPeriodInMinutes The new time lock period in minutes
     * @return The execution options
     */
    function updateTimeLockExecutionOptions(
        uint256 newTimeLockPeriodInMinutes
    ) public view returns (bytes memory) {
        require(newTimeLockPeriodInMinutes > 0, "Invalid timelock period");
        require(newTimeLockPeriodInMinutes != _timeLockPeriodInMinutes, "New timelock must be different");

        return MultiPhaseSecureOperation.createStandardExecutionOptions(
            UPDATE_TIMELOCK_SELECTOR,
            abi.encode(newTimeLockPeriodInMinutes)
        );
    }

    /**
     * @dev Updates the time lock period
     * @param metaTx The meta-transaction
     * @return The execution options
     */
    function updateTimeLockRequestAndApprove(
        MultiPhaseSecureOperation.MetaTransaction memory metaTx
    ) public onlyBroadcaster returns (MultiPhaseSecureOperation.TxRecord memory) {
        _secureState.checkPermission(UPDATE_TIMELOCK_META_SELECTOR);

        return _requestAndApprove(metaTx);
    }

    // Getters
    /**
     * @dev Gets the complete operation history with no filters
     * @return The complete operation history
     */
    function getOperationHistory() public view override returns (MultiPhaseSecureOperation.TxRecord[] memory) {
        uint256 totalTransactions = _secureState.getCurrentTxId();
        MultiPhaseSecureOperation.TxRecord[] memory history = new MultiPhaseSecureOperation.TxRecord[](totalTransactions);
        
        for (uint256 i = 0; i < totalTransactions; i++) {
            history[i] = _secureState.getTxRecord(i+1);
        }
        
        return history;
    }

    /**
     * @dev Gets an operation
     * @param txId The transaction ID
     * @return The operation
     */
    function getOperation(uint256 txId) public view override returns (MultiPhaseSecureOperation.TxRecord memory) {
        return _secureState.getTxRecord(txId);
    }

    /**
     * @dev Adds an operation
     * @param txRecord The transaction record
     */
    function addOperation(MultiPhaseSecureOperation.TxRecord memory txRecord) internal virtual {
    }

    /**
     * @dev Finalizes an operation
     * @param opData The operation data
     */
    function finalizeOperation(MultiPhaseSecureOperation.TxRecord memory opData) internal virtual {
    }

    /**
     * @dev Creates meta-transaction parameters with specified values
     * @param handlerContract The contract that will handle the meta-transaction
     * @param handlerSelector The function selector for the handler
     * @param deadline The timestamp after which the meta-transaction expires
     * @param maxGasPrice The maximum gas price allowed for execution
     * @param signer The address that will sign the meta-transaction
     * @return The formatted meta-transaction parameters
     */
    function createMetaTxParams(
        address handlerContract,
        bytes4 handlerSelector,
        uint256 deadline,
        uint256 maxGasPrice,
        address signer
    ) public view returns (MultiPhaseSecureOperation.MetaTxParams memory) {
        return _secureState.createMetaTxParams(
            handlerContract,
            handlerSelector,
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
     * @dev Returns the broadcaster address
     * @return The broadcaster address
     */
    function getBroadcaster() public view virtual override returns (address) {
        return _broadcaster;
    }

    /**
     * @dev Returns the recovery address
     * @return The recovery address
     */
    function getRecoveryAddress() public view virtual override returns (address) {
        return _recoveryAddress;
    }

    /**
     * @dev Returns the time lock period
     * @return The time lock period in minutes
     */
    function getTimeLockPeriodInMinutes() public view virtual override returns (uint256) {
        return _timeLockPeriodInMinutes;
    }

    /**
     * @dev Returns the supported operation types
     * @return The supported operation types
     */
    function getSupportedOperationTypes() public view override returns (MultiPhaseSecureOperation.ReadableOperationType[] memory) {
        return _secureState.getSupportedOperationTypes();
    }

    /**
     * @dev Checks if an operation type is supported
     * @param operationType The operation type to check
     * @return bool True if the operation type is supported
     */
    function isOperationTypeSupported(bytes32 operationType) public view override returns (bool) {
        return _secureState.isOperationTypeSupported(operationType);
    }

    /**
     * @dev External function that can only be called by the contract itself to execute ownership transfer
     * @param newOwner The new owner address
     */
    function executeTransferOwnership(address newOwner) external {
        _validateInternal();
        _transferOwnership(newOwner);
    }

    /**
     * @dev External function that can only be called by the contract itself to execute broadcaster update
     * @param newBroadcaster The new broadcaster address
     */
    function executeBroadcasterUpdate(address newBroadcaster) external {
        _validateInternal();
        _updateBroadcaster(newBroadcaster);
    }

    /**
     * @dev External function that can only be called by the contract itself to execute recovery update
     * @param newRecoveryAddress The new recovery address
     */
    function executeRecoveryUpdate(address newRecoveryAddress) external {
        _validateInternal();
        _updateRecoveryAddress(newRecoveryAddress);
    }

    /**
     * @dev External function that can only be called by the contract itself to execute timelock update
     * @param newTimeLockPeriodInMinutes The new timelock period in minutes
     */
    function executeTimeLockUpdate(uint256 newTimeLockPeriodInMinutes) external {
        _validateInternal();
        _updateTimeLockPeriod(newTimeLockPeriodInMinutes);
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
        addOperation(txRecord);
        finalizeOperation(txRecord);
        return txRecord;
    }

    // Ownership overrides
    /**
     * @dev Returns the owner of the contract
     * @return The owner of the contract
     */
    function owner() public view virtual override(Ownable, ISecureOwnable) returns (address) {
        return super.owner();
    }

    /**
     * @dev Checks if the owner is valid
     */
    function _checkOwner() internal view virtual override {
        super._checkOwner();
    }

    /**
     * @dev Renounces ownership of the contract
     */
    function renounceOwnership() public virtual override onlyOwner {
        revert("Ownership renouncement disabled");
    }

    /**
     * @dev Transfers ownership of the contract
     * @param newOwner The new owner of the contract
     */
    function transferOwnership(address newOwner) public virtual override onlyOwner {
        revert("Direct ownership transfer disabled");
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
    function _transferOwnership(address newOwner) internal virtual override {
        address oldOwner = owner();
        super._transferOwnership(newOwner);
        if (_secureState.isRoleExist(MultiPhaseSecureOperation.OWNER_ROLE)) {
            _secureState.updateRole(MultiPhaseSecureOperation.OWNER_ROLE, newOwner);
        } 
        emit OwnershipTransferUpdated(oldOwner, owner());
    }

    /**
     * @dev Updates the broadcaster address
     * @param newBroadcaster The new broadcaster address
     */
    function _updateBroadcaster(address newBroadcaster) internal virtual {
        address oldBroadcaster = _broadcaster;
        _broadcaster = newBroadcaster;
        _secureState.updateRole(MultiPhaseSecureOperation.BROADCASTER_ROLE, newBroadcaster);
        emit BroadcasterUpdated(oldBroadcaster, newBroadcaster);
    }

    /**
     * @dev Updates the recovery address
     * @param newRecoveryAddress The new recovery address
     */
    function _updateRecoveryAddress(address newRecoveryAddress) internal virtual {
        address oldRecovery = _recoveryAddress;
        _recoveryAddress = newRecoveryAddress;
        _secureState.updateRole(MultiPhaseSecureOperation.RECOVERY_ROLE, newRecoveryAddress);
        emit RecoveryAddressUpdated(oldRecovery, newRecoveryAddress);
    }

    /**
     * @dev Updates the time lock period
     * @param newTimeLockPeriodInMinutes The new time lock period in minutes
     */
    function _updateTimeLockPeriod(uint256 newTimeLockPeriodInMinutes) internal virtual {
        uint256 oldPeriod = _timeLockPeriodInMinutes;
        _timeLockPeriodInMinutes = newTimeLockPeriodInMinutes;
        _secureState.updateTimeLockPeriod(newTimeLockPeriodInMinutes);
        emit TimeLockPeriodUpdated(oldPeriod, newTimeLockPeriodInMinutes);
    }

    /**
     * @dev Validates that the function is being called internally by the contract itself
     */
    function _validateInternal() internal view {
        require(msg.sender == address(this), "Only callable by contract itself");
    }

    /**
     * @dev Validates that an address is not the zero address
     * @param addr The address to validate
     */
    function _validateNotZeroAddress(address addr) internal pure {
        require(addr != address(0), "Invalid address");
    }

    /**
     * @dev Validates that the operation type matches the expected type
     * @param actualType The actual operation type from the record
     * @param expectedType The expected operation type to validate against
     */
    function _validateOperationType(bytes32 actualType, bytes32 expectedType) internal pure {
        require(actualType == expectedType, "Invalid operation type");
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(ISecureOwnable).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}