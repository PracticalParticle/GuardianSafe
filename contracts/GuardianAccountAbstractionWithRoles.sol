// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

import "./core/access/DynamicRBAC.sol";

/**
 * @title GuardianAccountAbstractionWithRoles
 * @dev A basic implementation of account abstraction with dynamic role-based access control using DynamicRBAC
 */
contract GuardianAccountAbstractionWithRoles is DynamicRBAC {
    /**
     * @notice Initializer to initialize GuardianAccountAbstractionWithRoles
     * @param initialOwner The initial owner address
     * @param broadcaster The broadcaster address
     * @param recovery The recovery address
     * @param timeLockPeriodInMinutes The timelock period in minutes
     */
    function initialize(
        address initialOwner,
        address broadcaster,
        address recovery,
        uint256 timeLockPeriodInMinutes      
    ) public virtual override initializer {
        super.initialize(
            initialOwner,
            broadcaster,
            recovery,
            timeLockPeriodInMinutes      
        );
        // add your initialization logic here
    }

    // add your implementation here
}
