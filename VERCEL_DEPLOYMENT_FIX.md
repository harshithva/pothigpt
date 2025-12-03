# Vercel Deployment Fix Guide

## Issues Fixed

1. **Prisma Client Generation**: Removed fallback DATABASE_URL from build scripts
2. **Prisma Singleton Pattern**: Improved for serverless environments
3. **Error Logging**: Enhanced to capture more details in production logs

## Important: MongoDB Atlas Configuration

For your app to work on Vercel, you need to configure MongoDB Atlas properly:

### 1. Network Access (IP Whitelist)

**MongoDB Atlas requires IP whitelisting. Vercel functions use dynamic IPs.**

1. Go to MongoDB Atlas Dashboard
2. Navigate to **Network Access** (Security → Network Access)
3. Click **"Add IP Address"**
4. Click **"Allow Access from Anywhere"** (this adds `0.0.0.0/0`)
   - OR manually add: `0.0.0.0/0`
5. Click **Confirm**

⚠️ **Note**: Allowing `0.0.0.0/0` means any IP can access your database. Make sure:
- Your MongoDB user password is strong
- You're using MongoDB's authentication properly
- Consider using MongoDB Atlas VPC peering for production (advanced)

### 2. Database User Permissions

Ensure your MongoDB user has proper permissions:
- Go to **Database Access** in MongoDB Atlas
- Check your user has **"Read and write to any database"** or at least access to your database

### 3. Connection String Format

Your DATABASE_URL in Vercel should be:
```
mongodb+srv://<username>:<password>@cluster0.al1ddrw.mongodb.net/ebook-maker?retryWrites=true&w=majority&maxPoolSize=10
```

**Key parameters for serverless:**
- `retryWrites=true` - Enable retry on write operations
- `w=majority` - Write concern for durability
- `maxPoolSize=10` - Limit connection pool (important for serverless)

### 4. Environment Variables in Vercel

Make sure these are set in Vercel (Project Settings → Environment Variables):

- `DATABASE_URL` - Your MongoDB connection string
- `NEXTAUTH_SECRET` - A random secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your Vercel deployment URL (e.g., `https://pothigpt.vercel.app`)

### 5. Build Settings

The build should automatically:
1. Run `postinstall` script → generates Prisma Client
2. Run `build` script → generates Prisma Client again + builds Next.js

## Testing the Fix

After deploying:

1. Check Vercel build logs to ensure Prisma Client generated successfully
2. Check Vercel function logs for any database connection errors
3. Test signup/login endpoints

## Common Issues

### Issue: "MongoNetworkError"
**Solution**: Check IP whitelist in MongoDB Atlas

### Issue: "Authentication failed"
**Solution**: Verify username/password in DATABASE_URL

### Issue: "Prisma Client not generated"
**Solution**: Check build logs, ensure DATABASE_URL is available during build

### Issue: Connection timeout
**Solution**: Add `maxPoolSize=10` to connection string, ensure MongoDB Atlas cluster is running

## Next Steps

1. Update MongoDB Atlas Network Access (add 0.0.0.0/0)
2. Verify environment variables in Vercel
3. Redeploy your application
4. Check Vercel logs for any errors

