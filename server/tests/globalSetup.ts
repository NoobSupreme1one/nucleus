import { PrismaClient } from '@prisma/client';

export default async function globalSetup() {
  console.log('Setting up test environment...');
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Initialize test database
  const prisma = new PrismaClient();
  
  try {
    // Ensure database connection
    await prisma.$connect();
    console.log('Test database connected');
    
    // Run any necessary setup
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('Test environment setup complete');
}
