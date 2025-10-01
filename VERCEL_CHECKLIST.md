# Vercel Deployment Checklist

## Pre-Deployment Setup

### 1. Database Setup

- [ ] Create Neon PostgreSQL database
- [ ] Get connection string from Neon dashboard
- [ ] Test database connection locally
- [ ] Run database migrations: `npm run db:push`

### 2. Environment Variables

- [ ] Set `DATABASE_URL` in Vercel dashboard
- [ ] Set `NODE_ENV=production` in Vercel dashboard
- [ ] Verify all required environment variables are set

### 3. Code Preparation

- [ ] All changes committed to git
- [ ] Build passes locally: `npm run build`
- [ ] No TypeScript errors: `npm run check`
- [ ] Linting passes: `npm run lint`

## Vercel Deployment Steps

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
# First deployment
vercel

# Production deployment
vercel --prod
```

### 4. Configure Project

- [ ] Project name: `catercalc-pro` (or your preference)
- [ ] Framework: `Other`
- [ ] Root directory: `./`
- [ ] Build command: `npm run vercel-build`
- [ ] Output directory: `dist`

## Post-Deployment Verification

### 1. Basic Functionality

- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] Dark mode theme applied
- [ ] All pages accessible

### 2. API Endpoints

- [ ] `/api/events` returns data
- [ ] `/api/menus` returns data
- [ ] `/api/recipes` returns data
- [ ] `/api/ingredients` returns data

### 3. Database Operations

- [ ] Can create new events
- [ ] Can create new recipes
- [ ] Can create new menus
- [ ] Data persists between page refreshes

### 4. Performance

- [ ] Page load times are acceptable
- [ ] No console errors
- [ ] Mobile responsive design works

## Troubleshooting

### Common Issues

1. **Build Failures**

   - Check Vercel build logs
   - Verify all dependencies in package.json
   - Ensure TypeScript compilation passes

2. **Database Connection Issues**

   - Verify DATABASE_URL is correct
   - Check Neon database is accessible
   - Ensure database migrations have run

3. **API Routes Not Working**

   - Check Vercel function logs
   - Verify api/index.ts is properly configured
   - Test API endpoints individually

4. **Frontend Not Loading**
   - Check build output directory
   - Verify static file serving
   - Check for JavaScript errors

### Useful Commands

```bash
# Check deployment status
vercel ls

# View function logs
vercel logs

# Redeploy
vercel --prod

# Open in browser
vercel open

# Check environment variables
vercel env ls
```

## Production URLs

After successful deployment, your app will be available at:

- **Production**: `https://your-project-name.vercel.app`
- **Preview**: `https://your-project-name-git-branch.vercel.app`

## Next Steps

1. Set up custom domain (optional)
2. Configure monitoring and analytics
3. Set up CI/CD for automatic deployments
4. Configure backup strategies for database
5. Set up error tracking (Sentry, etc.)

## Support

If you encounter issues:

1. Check Vercel dashboard for logs
2. Review this checklist
3. Test locally first
4. Check GitHub issues or create new one
