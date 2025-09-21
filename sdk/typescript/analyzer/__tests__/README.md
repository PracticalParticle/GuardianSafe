# Guardian Workflow Analyzer Testing Guide

This directory contains comprehensive tests for the Guardian Workflow Analyzer, including unit tests, integration tests, and deployment scripts.

## 🧪 **Test Structure**

```
__tests__/
├── README.md                           # This guide
├── jest.config.js                      # Jest configuration
├── jest.setup.js                       # Jest setup file
├── run-tests.js                        # Test runner script
├── WorkflowValidator.test.ts            # Unit tests for WorkflowValidator
├── ContractDefinitionAnalyzer.test.ts  # Unit tests for ContractDefinitionAnalyzer
├── WorkflowAnalyzer.test.ts            # Unit tests for WorkflowAnalyzer
└── integration.test.ts                 # Integration tests with deployed contracts
```

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
npm install
```

### **2. Run Unit Tests**
```bash
npm run test:analyzer:unit
```

### **3. Deploy Contracts & Run Integration Tests**
```bash
npm run deploy:and:test
```

## 📋 **Available Test Commands**

| Command | Description |
|---------|-------------|
| `npm run test:analyzer` | Run all analyzer tests |
| `npm run test:analyzer:unit` | Run only unit tests |
| `npm run test:analyzer:integration` | Run only integration tests |
| `npm run test:analyzer:coverage` | Run tests with coverage report |
| `npm run deploy:definitions` | Deploy definition libraries to remote_ganache |
| `npm run deploy:and:test` | Deploy contracts and run all tests |

## 🔬 **Unit Tests**

### **WorkflowValidator.test.ts**
Tests the workflow validation logic:
- ✅ Valid workflow validation
- ✅ Invalid workflow structure detection
- ✅ State transition validation
- ✅ Protocol-specific validation (SecureOwnable, MultiPhase, DynamicRBAC)
- ✅ Workflow classification
- ✅ Edge cases and error handling

### **ContractDefinitionAnalyzer.test.ts**
Tests the contract analysis engine:
- ✅ SecureOwnable contract analysis
- ✅ MultiPhaseSecureOperation contract analysis
- ✅ DynamicRBAC contract analysis
- ✅ Generic contract analysis
- ✅ Definition type detection
- ✅ Compliance score calculation
- ✅ Workflow generation

### **WorkflowAnalyzer.test.ts**
Tests the main analyzer orchestrator:
- ✅ Complete contract analysis workflow
- ✅ Workflow validation and classification
- ✅ Protocol compliance checking
- ✅ Workflow statistics analysis
- ✅ Broken workflow detection
- ✅ Batch analysis capabilities

## 🌐 **Integration Tests**

### **integration.test.ts**
Tests the analyzer with real deployed contracts:
- ✅ Analysis of deployed MultiPhaseSecureOperationDefinitions
- ✅ Analysis of deployed SecureOwnableDefinitions
- ✅ Analysis of deployed DynamicRBACDefinitions
- ✅ Protocol compliance validation
- ✅ Workflow generation from deployed contracts
- ✅ Statistics analysis
- ✅ Broken workflow detection

## 🚀 **Deployment & Testing Workflow**

### **Step 1: Deploy Contracts**
```bash
npm run deploy:definitions
```

This will:
- Deploy all definition libraries to remote_ganache
- Test the deployed contracts
- Display contract addresses and statistics

### **Step 2: Update Integration Tests**
The deployment script automatically updates the integration test file with the deployed contract addresses.

### **Step 3: Run Integration Tests**
```bash
npm run test:analyzer:integration
```

### **Step 4: Generate Coverage Report**
```bash
npm run test:analyzer:coverage
```

## 📊 **Test Coverage**

The tests provide comprehensive coverage of:
- **Function Coverage**: All public methods tested
- **Branch Coverage**: All conditional paths tested
- **Edge Cases**: Error conditions and boundary cases
- **Integration**: Real contract interaction testing
- **Protocol Compliance**: Guardian protocol validation

## 🔧 **Configuration**

### **Jest Configuration** (`jest.config.js`)
- TypeScript support with ts-jest
- Coverage reporting
- Test timeout configuration
- Module path mapping

### **Jest Setup** (`jest.setup.js`)
- Console mocking for cleaner test output
- Viem client mocking
- Global test configuration

## 🐛 **Debugging Tests**

### **Run Individual Test Files**
```bash
# Run specific test file
npx jest WorkflowValidator.test.ts

# Run with verbose output
npx jest WorkflowValidator.test.ts --verbose

# Run with coverage
npx jest WorkflowValidator.test.ts --coverage
```

### **Debug Integration Tests**
```bash
# Check deployed contracts
truffle console --network remote_ganache

# Verify contract addresses
# Update integration.test.ts with correct addresses
```

## 📝 **Writing New Tests**

### **Test Structure**
```typescript
describe('ComponentName', () => {
  let component: ComponentType

  beforeEach(() => {
    component = new ComponentType()
  })

  describe('methodName', () => {
    it('should handle valid input', () => {
      // Arrange
      const input = validInput
      
      // Act
      const result = component.methodName(input)
      
      // Assert
      expect(result).toBe(expectedResult)
    })

    it('should handle invalid input', () => {
      // Test error cases
    })
  })
})
```

### **Mocking Guidelines**
- Mock external dependencies (viem client, network calls)
- Use realistic test data
- Test both success and failure scenarios
- Include edge cases and boundary conditions

## 🎯 **Test Data**

### **Contract Addresses**
Integration tests use deployed contract addresses:
- MultiPhaseSecureOperationDefinitions
- SecureOwnableDefinitions  
- DynamicRBACDefinitions

### **Test Workflows**
Sample workflows for testing:
- Ownership Transfer (HYBRID)
- System Operation (HYBRID)
- Role Editing Toggle (META_TX_ONLY)

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Tests failing with network errors**
   - Check remote_ganache connection
   - Verify contract deployment
   - Update contract addresses in integration tests

2. **Jest not found**
   - Run `npm install` to install dependencies
   - Check Jest configuration

3. **TypeScript errors**
   - Ensure ts-jest is installed
   - Check TypeScript configuration

4. **Coverage report not generating**
   - Check Jest configuration
   - Ensure test files are properly structured

### **Getting Help**
- Check test output for specific error messages
- Review Jest configuration
- Verify contract deployment status
- Check network connectivity to remote_ganache

## 📈 **Performance Testing**

The tests include performance considerations:
- Test execution time monitoring
- Memory usage validation
- Network call optimization
- Large dataset handling

## 🔒 **Security Testing**

Security-focused tests include:
- Input validation testing
- Error handling verification
- Protocol compliance validation
- Access control testing

## 🎉 **Success Criteria**

Tests pass when:
- ✅ All unit tests pass
- ✅ Integration tests pass with deployed contracts
- ✅ Coverage report shows >90% coverage
- ✅ No broken workflows detected
- ✅ Protocol compliance validated
- ✅ SDK functionality confirmed

---

**Happy Testing! 🧪✨**
