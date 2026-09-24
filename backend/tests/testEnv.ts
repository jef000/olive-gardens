/**
 * Test bootstrap (loaded with --require before any test file).
 *
 * Without a running Redis, the real client queues commands forever and the test
 * process hangs. Local test runs therefore use the in-memory store; CI sets
 * RUN_INTEGRATION_TESTS=1 with a Redis service and gets the real adapter.
 */
if (!process.env.RUN_INTEGRATION_TESTS) {
  process.env.REDIS_MODE = 'memory';
}
