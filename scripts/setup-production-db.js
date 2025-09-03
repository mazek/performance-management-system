#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🗄️  Production Database Setup');
console.log('=====================================');
console.log('This script will help you set up your production database schema.');
console.log('');

rl.question('Enter your production DATABASE_URL: ', (databaseUrl) => {
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL is required');
    process.exit(1);
  }

  console.log('');
  console.log('🔄 Setting up database schema...');
  
  try {
    // Set environment variable and run prisma db push
    const env = { ...process.env, DATABASE_URL: databaseUrl };
    
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit', env });
    
    console.log('🗄️  Pushing database schema...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env });
    
    console.log('');
    console.log('✅ Database setup completed successfully!');
    console.log('');
    console.log('Your application should now work properly.');
    console.log('Try visiting your Vercel URL and creating an account.');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('- Check that the DATABASE_URL is correct');
    console.log('- Ensure the database exists and is accessible');
    console.log('- For Supabase, make sure connection pooling is enabled');
  }
  
  rl.close();
});