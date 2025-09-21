// Jest setup file for Guardian Workflow Analyzer tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock viem client methods
jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  http: jest.fn(),
  mainnet: { id: 1, name: 'mainnet' }
}))

// Set up global test timeout
jest.setTimeout(10000)
