# Deployment Guide

## Vercel Deployment Setup

⚠️ **IMPORTANT**: You must set up the database and environment variables BEFORE deploying, or the build will fail.

### 1. Database Setup (Required First)

Since this application uses a database, you need to set up a PostgreSQL database for production.

**Recommended: Vercel Postgres**
1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab  
3. Click "Create Database" → "Postgres"
4. Choose your plan (Hobby is fine for testing)
5. This will automatically add the `DATABASE_URL` environment variable

**Alternative Options:**
- **Supabase**: Free PostgreSQL hosting with generous limits
- **Railway**: PostgreSQL hosting  
- **Neon**: Serverless PostgreSQL

### 2. Environment Variables (Required Before Build)

Set these environment variables in your Vercel project settings:

```env
# Database (automatically set if using Vercel Postgres)
DATABASE_URL="postgresql://..."

# Security (IMPORTANT: Use strong, unique secrets!)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
SESSION_SECRET="your-super-secret-session-key-change-in-production"

# Email Configuration (optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@performancesystem.com

# Application URL (set to your Vercel domain)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. Deploy

1. Connect your GitHub repository to Vercel
2. Vercel will automatically deploy when you push to main branch
3. The build process will:
   - Install dependencies
   - Generate Prisma client (`postinstall` script)
   - Push database schema (`prisma db push`)
   - Build the Next.js application

### 4. Step-by-Step Deployment Process

**Before deploying, follow these steps in order:**

1. **Connect Repository to Vercel**
   - Go to Vercel dashboard
   - Import your GitHub repository
   - **DO NOT deploy yet** - pause the initial build

2. **Set Up Database**
   - In Vercel project → Storage tab → Create Postgres database
   - Note: This adds `DATABASE_URL` automatically

3. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add the required variables listed above
   - Make sure `DATABASE_URL` is set (should be automatic if using Vercel Postgres)

4. **Deploy**
   - Go to Deployments tab
   - Click "Redeploy" or push new commit
   - Build should now succeed

### 5. Initial Setup

After successful deployment:
1. Access your application URL
2. The first user to register will be assigned admin role
3. Use the admin panel to manage users and review periods

## Local Development

For local development, you can continue using SQLite:

```env
DATABASE_URL="file:./dev.db"
```

Run development commands:
```bash
npm install
npx prisma db push
npm run seed  # Optional: add test data
npm run dev
```

## Troubleshooting

**Build fails with Prisma errors:**
- Ensure `DATABASE_URL` is set in Vercel environment variables
- Check that the database is accessible from Vercel
- Verify the PostgreSQL connection string format

**Database connection issues:**
- Make sure your database accepts connections from Vercel IPs
- For external databases, ensure SSL is properly configured
- Check firewall settings if using self-hosted database

**Environment variables not working:**
- Redeploy after setting environment variables
- Check variable names match exactly (case-sensitive)
- Ensure no trailing spaces in values