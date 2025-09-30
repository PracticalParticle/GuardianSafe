/**
 * Simple connection test for workflow framework
 * Verifies that the contract is accessible and workflow functions work
 */

const BaseWorkflowTest = require('./base-workflow-test');

class ConnectionTest extends BaseWorkflowTest {
    constructor() {
        super('Connection Test');
    }
    
    async testConnection() {
        console.log('🔌 Testing workflow framework connection...');
        
        try {
            // Test 1: Initialize roles
            console.log('\n1. Testing role initialization...');
            await this.initializeRoles();
            console.log('✅ Roles initialized successfully');
            
            // Test 2: Get all workflows
            console.log('\n2. Testing getAllWorkflows()...');
            const workflows = await this.getAllWorkflows();
            console.log(`✅ Retrieved ${workflows.length} workflows`);
            
            // Test 3: Get specific workflow
            console.log('\n3. Testing getWorkflowForOperation()...');
            const ownershipType = this.getOperationTypeHash('OWNERSHIP_TRANSFER');
            const ownershipWorkflow = await this.getWorkflowForOperation(ownershipType);
            console.log(`✅ Retrieved OWNERSHIP_TRANSFER workflow with ${ownershipWorkflow.paths.length} paths`);
            
            // Test 4: Get workflow paths
            console.log('\n4. Testing getWorkflowPaths()...');
            const paths = await this.getWorkflowPaths(ownershipType);
            console.log(`✅ Retrieved ${paths.length} workflow paths`);
            
            // Test 5: Analyze workflow structure
            console.log('\n5. Testing workflow analysis...');
            const analysis = this.analyzeWorkflowStructure(ownershipWorkflow);
            console.log(`✅ Workflow analysis completed:`);
            console.log(`   - Total Paths: ${analysis.totalPaths}`);
            console.log(`   - Total Steps: ${analysis.totalSteps}`);
            console.log(`   - Roles Used: ${Array.from(analysis.roles).join(', ')}`);
            console.log(`   - Has Off-Chain Phase: ${analysis.hasOffChainPhase}`);
            console.log(`   - Has On-Chain Phase: ${analysis.hasOnChainPhase}`);
            
            // Test 6: Test programmatic analysis
            console.log('\n6. Testing programmatic analysis...');
            const availableActions = this.findNextAvailableActions(ownershipWorkflow, 'RECOVERY', 0);
            console.log(`✅ Found ${availableActions.length} paths with available actions for RECOVERY role`);
            
            console.log('\n🎉 All connection tests passed!');
            console.log('✅ Workflow framework is ready for comprehensive testing');
            
            return true;
            
        } catch (error) {
            console.error('\n❌ Connection test failed:', error.message);
            console.error('Stack trace:', error.stack);
            return false;
        }
    }
}

// Run connection test if this file is executed directly
if (require.main === module) {
    const test = new ConnectionTest();
    test.testConnection().then(success => {
        if (success) {
            console.log('\n✅ Connection test completed successfully');
            process.exit(0);
        } else {
            console.log('\n❌ Connection test failed');
            process.exit(1);
        }
    }).catch(error => {
        console.error('❌ Connection test error:', error.message);
        process.exit(1);
    });
}

module.exports = ConnectionTest;
