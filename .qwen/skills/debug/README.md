# Debug Skill for Kelen Project

## Overview
This skill helps debug the Kelen web application during manual browser reviews or Vercel deployments.

## Quick Debug Checklist

### 1. Environment Setup
- [ ] Check `.env.local` exists and has all required variables
- [ ] Verify Supabase credentials are correct
- [ ] Confirm `NEXT_PUBLIC_*` variables are exposed correctly

### 2. Development Server
- [ ] Run `npm run dev` and check for compilation errors
- [ ] Verify server starts on correct port
- [ ] Check terminal for hot-reload issues

### 3. Browser Console
- [ ] Open DevTools (F12) → Console tab
- [ ] Check for JavaScript errors (red text)
- [ ] Check for warnings (yellow text)
- [ ] Look for failed network requests in Network tab

### 4. Common Issues

#### Supabase Connection
```javascript
// Test in browser console
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

#### Authentication Issues
- Check if user session exists in localStorage
- Verify Supabase auth cookies are set
- Check network tab for failed auth requests

#### Routing Issues
- Check `app/` or `pages/` directory structure
- Verify route handlers exist
- Check for missing `layout.tsx` or `page.tsx` files

#### Styling Problems
- Clear browser cache (Ctrl+Shift+Delete)
- Check if Tailwind CSS is loading
- Verify custom CSS isn't overriding unexpectedly

### 5. Vercel Deployment Debug
- [ ] Check Vercel dashboard for build logs
- [ ] Verify environment variables are set in Vercel
- [ ] Review deployment logs for errors
- [ ] Test on incognito browser to rule out cache issues

### 6. Performance Debug
- [ ] Use browser Performance tab to identify slow loads
- [ ] Check Network tab for large assets
- [ ] Monitor React DevTools for unnecessary re-renders
- [ ] Check for memory leaks in long sessions

### 7. Data Flow Debug
- [ ] Check Supabase queries in server actions
- [ ] Verify data fetching in components
- [ ] Check prop drilling vs state management
- [ ] Review API routes for errors

## Debug Commands

```bash
# Clean install
rm -rf node_modules .next && npm install

# Build locally to catch production issues
npm run build

# Lint for code issues
npm run lint

# Check for TypeScript errors
npx tsc --noEmit
```

## Browser Console Snippets

```javascript
// Check React version
console.log('React version:', React.version)

// Check if Supabase client is initialized
// (depends on your implementation)

// Check localStorage
console.log('localStorage:', localStorage)

// Check cookies
console.log('Cookies:', document.cookie)
```

## Reporting Issues
When reporting a bug, include:
1. Screenshot of the issue
2. Browser console errors
3. Network tab (failed requests)
4. Steps to reproduce
5. Expected vs actual behavior
