# CaterCalc Pro - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Neon Database**: Set up a PostgreSQL database at [neon.tech](https://neon.tech)
3. **GitHub Repository**: Push your code to GitHub

## Database Setup

### 1. Create Neon Database

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Copy the connection string (it will look like: `postgresql://username:password@hostname/database?sslmode=require`)

### 2. Run Database Migrations

```bash
# Install dependencies
npm install

# Push schema to production database
npm run db:push
```

## Vercel Deployment

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? catercalc-pro (or your preferred name)
# - Directory? ./
# - Override settings? No
```

### 3. Set Environment Variables

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

```
DATABASE_URL=your_neon_database_connection_string
NODE_ENV=production
```

### 4. Redeploy

```bash
vercel --prod
```

## Environment Variables

| Variable       | Description                       | Required |
| -------------- | --------------------------------- | -------- |
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes      |
| `NODE_ENV`     | Environment (production)          | Yes      |

## Build Configuration

The project is configured with:

- **Frontend**: Vite build output to `dist/` directory
- **Backend**: Node.js API functions in `api/` directory
- **Database**: Neon PostgreSQL for production
- **Static Files**: Served from Vercel's CDN

## Troubleshooting

### Common Issues

1. **Database Connection Errors**

   - Verify `DATABASE_URL` is correctly set
   - Ensure database is accessible from Vercel's IP ranges

2. **Build Failures**

   - Check that all dependencies are in `package.json`
   - Verify TypeScript compilation

3. **API Routes Not Working**
   - Ensure `api/index.ts` is properly configured
   - Check Vercel function logs

### Useful Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Redeploy
vercel --prod

# Open in browser
vercel open
```

## Production Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] Build completes without errors
- [ ] API endpoints responding
- [ ] Frontend loads correctly
- [ ] Database connections working
- [ ] All features tested

## Support

If you encounter issues:

1. Check Vercel function logs
2. Verify environment variables
3. Test database connectivity
4. Review build output for errors
