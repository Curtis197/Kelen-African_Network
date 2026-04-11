# Debug Workflow for Kelen Project

## ⚠️ CRITICAL RULE: INSTRUMENT FIRST, FIX LATER & KEEP LOGS FOREVER

**Before making ANY logic changes, we MUST:**
1. Add strategic console.logs
2. Run the app
3. Collect exact failure data
4. Identify root cause with certainty
5. THEN fix the real issue
6. **KEEP THE LOGS** - they're permanent infrastructure!

**Logs are NOT temporary! They stay until final release (and maybe even after).**

**This saves time, tokens, and frustration - now and in the future!**

## Usage
When you want to debug your project during manual review, use:
```
/debug
```

Or ask me to:
- "debug this page"
- "check for errors"
- "troubleshoot [specific issue]"
- "browser review"
- "add debug logs to [component/feature]"

## Debug Workflow

### Phase 0: DO NOT TOUCH CODE (Most Important!)
**STOP! Before changing any logic:**
- I will NOT modify business logic
- I will NOT change data fetching
- I will NOT alter components
- I will ONLY add diagnostic logs
- **These logs are PERMANENT - they stay forever!**

### Phase 1: Add Strategic Diagnostic Logs (Permanent!)
**I will add console.logs at every critical junction:**
**These logs will REMAIN in the code - they are infrastructure, not temporary tools!**

#### For Data Flow Issues:
```typescript
// Before data fetch
console.log('[DEBUG] Fetching data from:', endpoint)

// After data fetch
console.log('[DEBUG] Data received:', data)
console.log('[DEBUG] Data shape:', Object.keys(data))

// On error
console.error('[DEBUG] Fetch failed:', error)
```

#### For Component Render Issues:
```typescript
// Component entry
console.log('[DEBUG] Component rendering, props:', props)

// Conditional checks
console.log('[DEBUG] Condition result:', { condition, branch })

// State changes
console.log('[DEBUG] State updated:', { oldState, newState })
```

#### For Authentication Issues:
```typescript
// Session check
console.log('[DEBUG] Checking session, user:', user)

// Auth state
console.log('[DEBUG] Auth state:', { isAuthenticated, session })
```

#### For Form Submission:
```typescript
// Form submit handler
console.log('[DEBUG] Form submitted with:', formData)

// Validation
console.log('[DEBUG] Validation result:', validationResult)

// Server action call
console.log('[DEBUG] Calling server action with:', payload)

// Server action response
console.log('[DEBUG] Server action returned:', response)
```

**I will then ask you to:**
1. Save the file
2. Refresh the browser
3. Reproduce the issue
4. Copy the console output
5. Share it with me

### Phase 2: Collect Data
**You will:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear console (🚫 icon)
4. Reproduce the issue
5. Copy ALL console output
6. Share it with me

### Phase 3: Analyze Data
**I will:**
- Read the console output
- Identify the EXACT point of failure
- Determine root cause with certainty
- No more guessing!

### Phase 4: Fix the Real Issue
**Now and only now will I:**
- Make targeted fix to the real problem
- Explain what was wrong
- Show why the fix works

### Phase 5: Verify
**You will:**
1. Test the fix
2. Confirm it works
3. Report any remaining issues

### Phase 6: KEEP THE LOGS! (Critical!)
**I will NOT remove the debug logs!**
- Logs stay in the code permanently
- They're valuable for future debugging
- They document the data flow
- They help with production issues
- Only remove if explicitly requested by user

## Common Debug Scenarios

### 1. Page Won't Load
**Symptoms**: White screen, 404, or server error
**Checks**:
- Terminal for build errors
- Browser console for JS errors
- Network tab for failed requests
- Supabase connection status

### 2. Data Not Showing
**Symptoms**: Empty lists, missing projects
**Checks**:
- Supabase table permissions
- RLS (Row Level Security) policies
- Server action responses
- Authentication state

### 3. Styling Broken
**Symptoms**: Ugly layout, missing styles
**Checks**:
- Tailwind CSS loading
- Custom CSS conflicts
- Browser cache
- CSS specificity issues

### 4. Authentication Failed
**Symptoms**: Can't login, session lost
**Checks**:
- Supabase auth configuration
- Cookie/localStorage state
- Session validity
- Redirect logic

### 5. Form Submission Fails
**Symptoms**: Button clicks do nothing, errors on submit
**Checks**:
- Form validation logic
- Server action implementation
- Database constraints
- Network request status

## Quick Fixes

### Clear Cache and Rebuild
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Check Environment Variables
```bash
# On localhost
cat .env.local

# On Vercel, check Settings > Environment Variables
```

### Test Supabase Connection
Visit your Supabase dashboard and verify:
- Project is active
- Tables exist
- RLS policies are configured
- API keys are valid

## Vercel-Specific Debug

### Build Failures
1. Go to Vercel Dashboard > Your Project > Deployments
2. Click failed deployment
3. Review "Build Logs" tab
4. Look for error messages

### Runtime Errors
1. Go to Vercel Dashboard > Your Project > Logs
2. Filter by error level
3. Check timestamps correlate with your issue

### Environment Variables on Vercel
1. Go to Settings > Environment Variables
2. Verify all required vars are set
3. Check they're set for correct environment (Production/Preview/Development)
4. Redeploy after changing env vars

## Performance Debug

### Slow Page Load
- Check Network tab for large files
- Review component render count
- Check for unnecessary re-renders
- Verify image optimization

### Memory Leaks
- Use browser Memory profiler
- Check for uncleared intervals
- Verify event listener cleanup
- Review useEffect dependencies

## Need Help?
Just tell me:
- "I'm seeing [describe issue]"
- "On [page/route]"
- "It should [expected behavior]"
- "But instead [actual behavior]"

I'll guide you through the debug process! 🚀
