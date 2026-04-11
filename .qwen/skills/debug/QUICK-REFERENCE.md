# 🔍 Debug Quick Reference Card

## ⚠️ GOLDEN RULES

### Rule #1: Instrument First, Fix Second!
**I will NOT change any logic code until we:**
1. Add strategic console.logs
2. Run the app
3. Collect exact error data
4. Identify the real problem

### Rule #2: Logs Are Permanent!
**Debug logs STAY in the code forever:**
- ❌ I will NOT remove logs after fixing
- ✅ Logs are permanent infrastructure
- ✅ They help with future bugs
- ✅ Only removed at final release (maybe)

## Activation
- Type: `/debug`
- Or say: "debug this", "check for errors", "troubleshoot"

## During Browser Review

### Step 1: Open DevTools
- Press **F12** or **Ctrl+Shift+I**
- Go to **Console** tab

### Step 2: Describe Issue
Tell me:
- What page? (URL)
- What's wrong? (describe)
- What expected? (behavior)

### Step 3: I Add Logs (NO CODE CHANGES!)
I will add diagnostic console.logs to find the exact issue
**These logs will stay permanently in the code!**

### Step 4: Run & Collect Output
- Reproduce the issue
- Copy ALL console output
- Share it with me

### Step 5: I Fix the Real Issue
One targeted fix based on actual data

### Step 6: Logs Stay Forever!
- I will NOT remove the debug logs
- They're valuable for future debugging
- They document how the code works

## Common Issues & Fixes

| Issue | Quick Fix |
|-------|-----------|
| **Blank page** | Check console for errors, verify env vars |
| **No data** | Check Supabase connection, verify auth |
| **404 error** | Verify route exists in `app/` directory |
| **Styling broken** | Hard refresh (Ctrl+F5), check CSS |
| **Can't login** | Check Supabase auth, clear cookies |
| **Form won't submit** | Check validation, review server action |

## Quick Commands

```bash
# Run diagnostic checks
node .qwen/skills/debug/debug-checklist.js

# Clean rebuild
rm -rf .next node_modules && npm install && npm run build

# Check TypeScript
npx tsc --noEmit

# Lint code
npm run lint
```

## Vercel Debug

1. **Build fails**: Check Deployment → Build Logs
2. **Runtime errors**: Check Logs tab in dashboard
3. **Env vars**: Settings → Environment Variables
4. **Rollback**: Deployments → Click previous working deploy

## Need Help?
Just describe what you see! Examples:
- "White screen on /projets/nouveau"
- "Budget not showing on dashboard"
- "Can't create new project"
- "Page loads super slow"

I'll guide you through it! 🚀
