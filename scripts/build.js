#!/usr/bin/env node

const { execSync, spawn } = require('child_process');

console.log('🔄 Starting build process...');

// Function to run command with timeout
function execWithTimeout(command, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, { stdio: 'inherit' });
    
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Command timed out after ${timeoutMs}ms: ${command}`));
    }, timeoutMs);
    
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${command}`));
      }
    });
    
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function build() {
  try {
    // Always generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('prisma generate', { stdio: 'inherit' });
    
    // Only run database operations if DATABASE_URL is set
    if (process.env.DATABASE_URL) {
      console.log('🗄️  Database URL found, pushing schema...');
      try {
        await execWithTimeout('prisma db push --accept-data-loss --skip-generate', 60000);
        console.log('✅ Database schema pushed successfully');
      } catch (dbError) {
        console.log('⚠️  Database push failed or timed out, continuing with build...');
        console.log('   The app will still work, but you may need to run migrations manually');
        console.log(`   Error: ${dbError.message}`);
      }
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
}

build();