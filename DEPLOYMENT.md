# Deployment Guide

## Vercel Deployment Setup

### 1. Database Setup (Required)

Since this application uses a database, you need to set up a PostgreSQL database for production.

**Options:**
- **Vercel Postgres** (Recommended): Add from the Vercel dashboard
- **Supabase**: Free PostgreSQL hosting
- **Railway**: PostgreSQL hosting
- **Neon**: Serverless PostgreSQL

#### Using Vercel Postgres (Recommended):
1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Click "Add Database" → "Postgres"
4. This will automatically add the `DATABASE_URL` environment variable

### 2. Environment Variables

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

### 4. Initial Setup

After first deployment:
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