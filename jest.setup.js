/**
 * Jest Setup File
 * Cleans up async operations and open handles after tests
 */

// Increase timeout for cleanup
jest.setTimeout(10000);

// Clean up timers and intervals
afterEach(() => {
    jest.clearAllTimers();
});

// Global cleanup after all tests
afterAll(() => {
    jest.restoreAllMocks();
});
