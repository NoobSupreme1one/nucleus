export default async function globalTeardown() {
  console.log('Tearing down test environment...');
  
  // Clean up any global resources
  // Database cleanup is handled in individual tests
  
  console.log('Test environment teardown complete');
}
