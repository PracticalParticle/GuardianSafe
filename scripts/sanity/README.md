# Guardian Protocol Sanity Testing Framework

This directory contains comprehensive sanity tests for the Guardian Protocol framework, designed to validate all possible workflows directly on the blockchain and return detailed reports.

## Overview

The sanity testing framework provides deep testing of all Guardian Protocol components:

1. **SecureOwnable Component** - Multi-phase security operations with timelock protection
2. **DynamicRBAC Component** - Role-based access control with dynamic role management
3. **SimpleVault Component** - Secure asset management with withdrawal controls
4. **SimpleRWA20 Component** - Token operations with mint/burn security

## Test Files

### Individual Component Tests

- `secure-ownable-sanity.js` - Tests SecureOwnable with GuardianAccountAbstraction
- `rbac-sanity.js` - Tests DynamicRBAC with GuardianAccountAbstractionWithRoles  
- `vault-sanity.js` - Tests SimpleVault custom logic
- `rwa20-sanity.js` - Tests SimpleRWA20 custom logic

### Master Test Runner

- `run-all-sanity-tests.js` - Runs all tests in sequence and generates comprehensive report

## Test Coverage

### SecureOwnable Component Tests
- ✅ Basic contract state verification
- ✅ Ownership transfer workflows (Request → Approval/Cancel)
- ✅ Broadcaster update workflows (Request → Approval/Cancel)
- ✅ Recovery update workflows (Meta-transaction)
- ✅ Timelock update workflows (Meta-transaction)
- ✅ Meta-transaction generation and verification
- ✅ Permission validation and access control
- ✅ Event logging and transaction history
- ✅ Error handling and edge cases

### DynamicRBAC Component Tests
- ✅ Basic contract state verification
- ✅ Role creation and management
- ✅ Wallet assignment to roles
- ✅ Function permission management
- ✅ Role editing controls
- ✅ Protected vs non-protected roles
- ✅ Permission validation and access control
- ✅ Meta-transaction support for role operations
- ✅ Error handling and edge cases
- ✅ Role query functions

### SimpleVault Component Tests
- ✅ Basic contract state verification
- ✅ ETH deposit and balance management
- ✅ ETH withdrawal workflows (Request → Approval/Cancel)
- ✅ Token withdrawal workflows (Request → Approval/Cancel)
- ✅ Meta-transaction support for withdrawals
- ✅ Timelock security implementation
- ✅ Permission validation and access control
- ✅ Error handling and edge cases
- ✅ Event logging and transaction history
- ✅ Integration with MultiPhaseSecureOperation

### SimpleRWA20 Component Tests
- ✅ Basic contract state verification
- ✅ ERC20 standard functionality
- ✅ Mint operations (Request → Approval/Cancel)
- ✅ Burn operations (Request → Approval/Cancel)
- ✅ Meta-transaction support for mint/burn
- ✅ Broadcaster permission validation
- ✅ Token transfer and balance management
- ✅ Error handling and edge cases
- ✅ Event logging and transaction history
- ✅ Integration with MultiPhaseSecureOperation

## Setup

### Prerequisites

1. **Environment Configuration**
   ```bash
   cp env.example .env
   # Update .env with your test wallet private keys
   ```

2. **Test Wallet Setup**
   Update the following in your `.env` file:
   ```env
   TEST_OWNER_PRIVATE_KEY=0x...
   TEST_BROADCASTER_PRIVATE_KEY=0x...
   TEST_RECOVERY_PRIVATE_KEY=0x...
   TEST_USER_PRIVATE_KEY=0x...
   TEST_ADMIN_PRIVATE_KEY=0x...
   ```

3. **Contract Addresses**
   Ensure your `.env` file has the correct contract addresses:
   ```env
   GUARDIAN_ACCOUNT_ABSTRACTION_ADDRESS=0x...
   GUARDIAN_ACCOUNT_ABSTRACTION_WITH_ROLES_ADDRESS=0x...
   SIMPLE_VAULT_ADDRESS=0x...
   SIMPLE_RWA20_ADDRESS=0x...
   ```

### Dependencies

```bash
npm install web3 dotenv
```

## Usage

### Run Individual Component Tests

```bash
# Test SecureOwnable component
node scripts/sanity/secure-ownable-sanity.js

# Test DynamicRBAC component
node scripts/sanity/rbac-sanity.js

# Test SimpleVault component
node scripts/sanity/vault-sanity.js

# Test SimpleRWA20 component
node scripts/sanity/rwa20-sanity.js
```

### Run All Tests

```bash
# Run complete test suite
node scripts/sanity/run-all-sanity-tests.js
```

## Test Reports

All tests generate detailed JSON reports saved to `scripts/sanity/reports/`:

- `secure-ownable-sanity-report.json`
- `rbac-sanity-report.json`
- `vault-sanity-report.json`
- `rwa20-sanity-report.json`
- `master-sanity-report.json`

### Report Structure

```json
{
  "testSuite": "Component Sanity Test",
  "contract": "ContractName",
  "contractAddress": "0x...",
  "timestamp": "2025-01-21T...",
  "summary": {
    "totalTests": 50,
    "passedTests": 48,
    "failedTests": 2,
    "successRate": "96.00%"
  },
  "details": [
    {
      "test": "Test description",
      "status": "PASSED|FAILED",
      "error": "Error message if failed"
    }
  ]
}
```

## Test Workflows

### Multi-Phase Operations

All tests validate the complete multi-phase operation workflow:

1. **Request Phase** - Create operation request with timelock
2. **Pending Phase** - Verify transaction is pending
3. **Approval Phase** - Approve after timelock expires
4. **Execution Phase** - Execute the operation
5. **Cancellation Phase** - Test cancellation before approval

### Meta-Transaction Testing

Tests validate meta-transaction functionality:

1. **Generation** - Create unsigned meta-transactions
2. **Signing** - Verify signature requirements
3. **Execution** - Test meta-transaction execution
4. **Validation** - Verify permission and signature validation

### Permission Testing

Tests validate access control:

1. **Role-based Access** - Test role permissions
2. **Function Permissions** - Verify function-level access
3. **Unauthorized Access** - Test rejection of unauthorized calls
4. **Protected Operations** - Verify protected role restrictions

## Security Considerations

### Test Wallet Security

⚠️ **IMPORTANT**: The test wallets in `env.example` are placeholder values. Replace them with your own test wallet private keys before running tests.

### Network Configuration

Tests can run against:
- Local development network (localhost:8545)
- Remote development network (configured via REMOTE_HOST)

### Gas Management

Tests automatically estimate gas and use current gas prices. Ensure test wallets have sufficient ETH for gas fees.

## Troubleshooting

### Common Issues

1. **"No permission" errors**
   - Verify wallet addresses match contract configuration
   - Check role assignments in contracts

2. **"Insufficient balance" errors**
   - Ensure test wallets have sufficient ETH/tokens
   - Check contract balances for withdrawal tests

3. **"Transaction failed" errors**
   - Verify contract addresses are correct
   - Check network connectivity
   - Ensure contracts are properly deployed

4. **"Invalid signature" errors**
   - Verify private keys are correct
   - Check meta-transaction parameters

### Debug Mode

Enable detailed logging by modifying test files:

```javascript
// Add to test constructor
this.debug = true;

// Add debug logging
if (this.debug) {
    console.log('Debug:', details);
}
```

## Contributing

### Adding New Tests

1. Create new test file following existing patterns
2. Implement comprehensive test coverage
3. Add to master test runner
4. Update this README

### Test Standards

- **Comprehensive Coverage** - Test all possible workflows
- **Error Handling** - Test both success and failure cases
- **Edge Cases** - Test boundary conditions and invalid inputs
- **Documentation** - Clear test descriptions and expected outcomes
- **Reporting** - Detailed test results and failure analysis

## Framework Architecture

### Test Structure

```
scripts/sanity/
├── README.md                           # This file
├── run-all-sanity-tests.js            # Master test runner
├── secure-ownable-sanity.js           # SecureOwnable tests
├── rbac-sanity.js                     # DynamicRBAC tests
├── vault-sanity.js                    # SimpleVault tests
├── rwa20-sanity.js                    # SimpleRWA20 tests
└── reports/                           # Test reports directory
    ├── secure-ownable-sanity-report.json
    ├── rbac-sanity-report.json
    ├── vault-sanity-report.json
    ├── rwa20-sanity-report.json
    └── master-sanity-report.json
```

### Test Classes

All test classes follow a consistent pattern:

- **Constructor** - Initialize Web3, contracts, and test wallets
- **runAllTests()** - Main test execution method
- **Individual Test Methods** - Specific test implementations
- **assertTest()** - Assertion helper with reporting
- **generateReport()** - Generate detailed test reports

This framework provides comprehensive validation of the Guardian Protocol, ensuring all components work correctly in real blockchain environments.
