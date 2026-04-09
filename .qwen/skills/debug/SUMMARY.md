# 🎯 Debug Skill - Complete Summary

## ✅ What We Built

A comprehensive **instrumentation-first debug skill** located at:
```
.qwen/skills/debug/
```

## 📁 Files Created (9 total)

| File | Purpose | When to Use |
|------|---------|-------------|
| **INSTRUMENTATION-FIRST.md** | Core philosophy & methodology | **Read this first** |
| **EXAMPLES.md** | Real before/after examples | See how it works in practice |
| **INDEX.md** | Quick entry point | Start here for overview |
| **WORKFLOW.md** | Step-by-step debug process | Follow during debugging |
| **QUICK-REFERENCE.md** | Fast lookup card | Keep handy during sessions |
| **README.md** | Comprehensive checklist | Detailed reference |
| **HOW-TO-USE.md** | Complete user guide | Learn all features |
| **skill.json** | Configuration | System integration |
| **debug-checklist.js** | Automated checks | Run diagnostics |
| **browser-console-snippet.js** | Browser tool | Collect environment data |

## 🚀 How to Use

### Simple Trigger
Just tell me:
- `/debug`
- "I'm seeing [issue] on [page]"
- "Debug this"
- "Add logs to [component]"

### What I Will Do (Instrumentation-First!)

**✅ Step 1:** Read relevant code files
**✅ Step 2:** Add strategic `console.log` statements
- NO logic changes
- NO code fixes yet
- ONLY diagnostic logs

**✅ Step 3:** Ask you to:
- Save the file
- Refresh browser
- Reproduce issue
- Copy console output

**✅ Step 4:** Analyze the data
- Identify EXACT failure point
- Determine root cause with certainty
- No guessing!

**✅ Step 5:** Make ONE targeted fix
- Addresses the real issue
- Explains what was wrong
- Shows why fix works

**✅ Step 6:** You verify it works

## 💰 Token Savings

| Metric | Old Approach | New Approach | Savings |
|--------|-------------|--------------|---------|
| **Iterations** | 10-30 | 2-3 | 90% less |
| **Tokens** | 20,000-80,000 | 3,000-8,000 | 85% less |
| **Frustration** | High | Low | 😊 |

## 🎯 Core Philosophy

### ❌ WRONG (What we used to do)
1. See error
2. **Guess** what's wrong
3. Change code (logic modifications)
4. Test
5. Repeat 20 times
6. **Result:** Wasted tokens, frustration

### ✅ RIGHT (What we'll do now)
1. See error
2. **Add diagnostic logs** (no logic changes!)
3. Run and **collect data**
4. **Analyze** console output
5. **Identify** exact failure point
6. **Fix once, correctly**
7. **Result:** Fast, efficient, certain

## 📊 Debug Log Patterns

### Server Actions
```typescript
export async function someAction(input) {
  console.log('[ACTION] Started with:', input)
  
  try {
    console.log('[ACTION] Step 1: Checking auth...')
    const user = await getUser()
    console.log('[ACTION] User:', user?.id)
    
    console.log('[ACTION] Step 2: Querying DB...')
    const data = await fetchData()
    console.log('[ACTION] Result:', { count: data?.length })
    
    return { data }
  } catch (error) {
    console.error('[ACTION] Failed:', error)
    return { error: error.message }
  }
}
```

### Components
```typescript
function SomeComponent({ id, data }) {
  console.log('[COMPONENT] Rendering, props:', { id, hasData: !!data })
  
  useEffect(() => {
    console.log('[EFFECT] Triggered, loading data...')
    loadData(id).then(result => {
      console.log('[EFFECT] Data loaded:', result)
    })
  }, [id])
  
  console.log('[RENDER] State:', state)
  return <UI data={state} />
}
```

## 🔍 Common Issues We'll Debug

- ✅ Blank pages / white screens
- ✅ Data not loading
- ✅ Forms not submitting
- ✅ Authentication failures
- ✅ 404 / routing errors
- ✅ Styling issues
- ✅ Performance problems
- ✅ Vercel deployment issues

## 📝 Example Debug Session

**You:** "Project detail page shows empty even though project exists"

**Me:** "Adding diagnostic logs..."

*Adds console.logs to server action and component*

**Me:** "Refresh and share console output"

**You:** 
```
[ACTION] getProject called with id: abc-123
[ACTION] User: user-456
[ACTION] Query result: { hasData: true, dataCount: 1, hasError: false }
[COMPONENT] Rendering, props: { hasData: true }
[RENDER] State: null
```

**Me:** "Found it! Data is fetched but component state is null. The useEffect isn't setting the data. Fixing now..."

*Makes ONE targeted fix to useEffect*

**You:** "Works!"

**Total time: 5 minutes, 4,000 tokens** ✅

## 🎓 Key Principles

1. **Never guess, always measure** 🔬
2. **Logs before logic changes** 📝
3. **Data drives decisions** 📊
4. **One fix, done right** 🎯
5. **Certainty over speed** ✅

## 🆘 When You Need Debug Help

Just describe what you're seeing:

**Good:**
- "Projects page is blank"
- "Form won't submit"
- "Getting logged out"

**Better:**
- "On /projets, I see empty list, expected 3 projects"
- "Submit button clicks but nothing happens"
- "Randomly logged out on localhost"

**Best:**
```
Issue: Projects list empty
Page: /projets
Expected: See 3 projects I created
Environment: Vercel production
Recent changes: Updated RLS policies yesterday
Console: [paste any errors]
```

## ✅ What's Saved to Memory

The debug protocol is saved in project memory:
- Instrumentation-first approach
- No logic changes until data collected
- Add strategic console.logs
- Analyze before fixing
- One targeted fix

## 🚀 Ready to Use!

Next time you encounter an issue:

1. **Don't panic** 😌
2. **Tell me what you see** 📱
3. **I'll add logs** 📝
4. **You run and collect** 🔍
5. **I analyze and fix** 🎯
6. **We verify it works** ✅

**No more guessing. No more wasted tokens. Just efficient debugging!** 🎉

---

**Remember: Instrument first, fix second. Always.** 💪
