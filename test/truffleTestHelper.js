import { createTestClient, http } from 'viem'
const testClient = createTestClient({
    mode: 'anvil',
    transport: http('http://127.0.0.1:8545')
})

const advanceTimeAndBlock = async (time) => {
    await advanceTime(time);
    await advanceBlock();
    
    return testClient.getBlock(); // Viem's way to get latest block
}

const advanceTime = async (time) => {
    await testClient.increaseTime({ seconds: BigInt(time) });
}

const advanceBlock = async () => {
    await testClient.mine({ blocks: 1 });
    const block = await testClient.getBlock();
    return block.hash;
}

module.exports = {
    advanceTime,
    advanceBlock,
    advanceTimeAndBlock
}