# 🎯 How to Use the Debug Skill

## Overview
The debug skill provides structured debugging assistance for the Kelen project during manual browser reviews or Vercel deployment testing.

## 📁 File Structure

```
.qwen/skills/debug/
├── INDEX.md                    # Main entry point
├── README.md                   # Comprehensive debug checklist
├── WORKFLOW.md                 # Interactive debug workflow
├── QUICK-REFERENCE.md          # Quick reference card
├── skill.json                  # Skill configuration
├── debug-checklist.js          # Automated diagnostic script
└── browser-console-snippet.js  # Browser console debug tool
```

## 🚀 Usage Methods

### Method 1: Natural Language
Simply describe your issue:
- "I'm seeing a white screen on /projets"
- "Debug the project creation page"
- "Why isn't data loading?"
- "Troubleshoot authentication"

### Method 2: Explicit Trigger
Type `/debug` to start the debug workflow

### Method 3: Run Diagnostic Script
```bash
node .qwen/skills/debug/debug-checklist.js
```

### Method 4: Browser Console Debug
1. Open browser DevTools (F12)
2. Copy contents of `.qwen/skills/debug/browser-console-snippet.js`
3. Paste into console
4. Share the output with me

## 🔄 Debug Workflow

### Phase 1: Report
**You**: Describe what you're seeing
- URL/route
- Environment (localhost or Vercel)
- Symptoms
- Expected behavior

### Phase 2: Diagnose
**I will**:
- Run automated checks
- Ask clarifying questions
- Review relevant code
- Check configurations

### Phase 3: Fix
**I will provide**:
- Root cause analysis
- Specific code changes
- Step-by-step instructions
- Prevention tips

### Phase 4: Verify
**You**:
- Apply the fix
- Test the solution
- Confirm it works

## 🎓 Example Debug Session

**You**: "When I visit /projets on Vercel, I see a blank page. Nothing loads."

**I will**:
1. Ask for console errors
2. Check the route handler code
3. Verify Supabase queries
4. Review authentication requirements
5. Provide specific fix

**You**: Share console output or screenshot

**I will**: Identify the issue and provide solution

## 🛠️ Available Tools

### Automated Checks Script
Runs 5 diagnostic checks:
- ✅ Environment files
- ✅ Dependencies
- ✅ App structure
- ✅ Supabase config

### Browser Console Snippet
Extracts:
- Environment variables
- Local storage contents
- Cookies
- Performance metrics
- Network errors
- Current page info

### Interactive Workflow
Guided debugging with:
- Structured questions
- Code investigation
- Targeted fixes

## 📊 Common Scenarios

### Scenario 1: Page Won't Load
**Symptoms**: White screen, 404, error page
**Debug steps**:
1. Check console for errors
2. Verify route exists
3. Check for build errors
4. Review server actions

### Scenario 2: Data Missing
**Symptoms**: Empty lists, blank sections
**Debug steps**:
1. Check Supabase connection
2. Verify RLS policies
3. Review data fetching
4. Check authentication

### Scenario 3: Form Broken
**Symptoms**: Submit does nothing, validation fails
**Debug steps**:
1. Check form schema
2. Review server action
3. Verify database constraints
4. Check network requests

### Scenario 4: Performance Issues
**Symptoms**: Slow load, laggy interactions
**Debug steps**:
1. Check network tab
2. Review component renders
3. Optimize data fetching
4. Check asset sizes

## 🔧 Quick Fixes

### Nuclear Option (when nothing works)
```bash
# Delete and reinstall
rm -rf .next node_modules
npm install
npm run build
npm run dev
```

### Environment Variables Check
```bash
# Local
cat .env.local

# Vercel
# Dashboard → Settings → Environment Variables
```

### Supabase Health Check
1. Visit Supabase dashboard
2. Check project status
3. Verify tables exist
4. Test API connection
5. Review RLS policies

## 💡 Pro Tips

1. **Always check console first** - 90% of issues show errors there
2. **Test in incognito** - Rules out cache/cookie issues
3. **Check Network tab** - See failed requests in real-time
4. **Share screenshots** - Visual issues need visual context
5. **Note recent changes** - What changed before the issue started?

## 🎯 Best Practices

### When Reporting Issues
✅ DO:
- Provide URL/route
- Share console errors
- Describe expected behavior
- Mention recent changes
- Include screenshots

❌ DON'T:
- Just say "it's broken"
- Skip the console check
- Assume I can see your screen
- Forget to mention environment

### When Testing Fixes
✅ DO:
- Hard refresh after changes
- Clear cache if needed
- Test in incognito
- Verify the specific issue
- Check for side effects

❌ DON'T:
- Assume it's fixed immediately
- Skip verification
- Ignore new issues
- Forget to rebuild (Vercel)

## 🆘 Emergency Contacts

If you're stuck:
1. Describe what you see
2. Share any error messages
3. Tell me what you tried
4. I'll guide you through it

## 📈 Success Metrics

A successful debug session:
- ✅ Issue identified
- ✅ Root cause explained
- ✅ Fix provided
- ✅ Solution verified
- ✅ Prevention tips shared

---

**Ready to debug? Just tell me what you're seeing!** 🔍
