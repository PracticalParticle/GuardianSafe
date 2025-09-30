require('dotenv').config();
const { createTestClient, http } = require('viem');

// Get RPC URL from environment or default to localhost
const RPC_URL = process.env.RPC_URL || process.env.REMOTE_HOST 
  ? `http://${process.env.REMOTE_HOST}:${process.env.REMOTE_PORT || 8545}`
  : 'http://127.0.0.1:8545';

const testClient = createTestClient({
    mode: 'anvil',
    transport: http(RPC_URL)
});

const advanceTimeAndBlock = async (time) => {
    await advanceTime(time);
    await advanceBlock();
    
    return testClient.getBlock(); // Viem's way to get latest block
};

const advanceTime = async (time) => {
    await testClient.increaseTime({ seconds: BigInt(time) });
};

const advanceBlock = async () => {
    await testClient.mine({ blocks: 1 });
    const block = await testClient.getBlock();
    return block.hash;
};

module.exports = {
    advanceTime,
    advanceBlock,
    advanceTimeAndBlock,
    testClient,
    RPC_URL
};