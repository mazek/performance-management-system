#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔄 Starting build process...');

try {
  // Always generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('prisma generate', { stdio: 'inherit' });
  
  // Only run database operations if DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    console.log('🗄️  Database URL found, pushing schema...');
    execSync('prisma db push --accept-data-loss', { stdio: 'inherit' });
  } else {
    console.log('⚠️  DATABASE_URL not found, skipping database operations');
    console.log('   This is expected during the first build before database setup');
  }
  
  // Build Next.js application
  console.log('🏗️  Building Next.js application...');
  execSync('next build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}