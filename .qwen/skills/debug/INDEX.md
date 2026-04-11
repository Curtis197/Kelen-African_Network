# 🔍 Kelen Project Debug Skill

> **GOLDEN RULE: Instrument first, fix second. Never guess—measure.**

## Core Philosophy

**❌ WRONG Approach (What we used to do):**
1. See error
2. Guess what's wrong
3. Change code
4. Test
5. Repeat 20 times wasting tokens

**✅ RIGHT Approach (What we'll do now):**
1. See error
2. **Add strategic console.logs to find EXACT failure point**
3. Run and collect data
4. Identify root cause with certainty
5. Fix once, correctly

## Quick Start

**To use this skill, simply type `/debug` or describe the issue you're seeing.**

**I will FIRST add diagnostic logs, NOT touch any logic code.**

## Available Debug Tools

### 📋 Files in This Skill
- [`INSTRUMENTATION-FIRST.md`](./INSTRUMENTATION-FIRST.md) - **READ THIS FIRST** - Core debugging methodology
- [`PERMANENT-LOGS.md`](./PERMANENT-LOGS.md) - **IMPORTANT** - Why logs stay forever
- [`EXAMPLES.md`](./EXAMPLES.md) - Real before/after scenarios
- [`SUMMARY.md`](./SUMMARY.md) - Complete overview
- [`INDEX.md`](./INDEX.md) - Quick entry point
- [`WORKFLOW.md`](./WORKFLOW.md) - Step-by-step debug process
- [`QUICK-REFERENCE.md`](./QUICK-REFERENCE.md) - Fast lookup card
- [`README.md`](./README.md) - Comprehensive checklist
- [`HOW-TO-USE.md`](./HOW-TO-USE.md) - User manual
- [`skill.json`](./skill.json) - Configuration
- [`debug-checklist.js`](./debug-checklist.js) - Automated diagnostics
- [`browser-console-snippet.js`](./browser-console-snippet.js) - Browser tool

### 🎯 When to Use
- Manual browser testing on localhost
- Vercel deployment issues
- Unexpected errors or blank screens
- Authentication problems
- Data not loading
- Styling issues
- Performance problems

### 🚀 How It Works

1. **You describe the issue** - Tell me what you're seeing
2. **I diagnose** - Run checks and investigate code
3. **I fix** - Provide specific solutions
4. **You verify** - Test the fix

### 📝 Example Commands
```
/debug
"I'm seeing a white screen on /projets"
"Debug the project creation wizard"
"Check why data isn't loading"
"Troubleshoot authentication"
"Why is this page so slow?"
```

### 🔧 Quick Diagnostic Script

Run automated checks:
```bash
node .qwen/skills/debug/debug-checklist.js
```

### 🌐 Browser Debug Shortcuts
- **F12** - Open DevTools
- **Ctrl+Shift+C** - Select elements
- **Ctrl+Shift+J** - Console tab
- **Ctrl+Shift+N** - Incognito window
- **Ctrl+F5** - Hard refresh

### 📊 Common Issue Categories

| Category | Symptoms | Quick Check |
|----------|----------|-------------|
| **Environment** | App won't start | `.env.local` exists? |
| **Database** | No data showing | Supabase connected? |
| **Auth** | Can't login | Session active? |
| **Routing** | 404 errors | Page file exists? |
| **Styling** | Broken layout | CSS loading? |
| **Performance** | Slow load | Large assets? |

## Need Immediate Help?

Just describe what you're seeing and I'll start debugging! 

**Example**: "When I visit `/projets` on Vercel, I see a blank page. The console shows [error message]."
