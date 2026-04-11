# 🛠️ Instrument Skill - Complete Overview

> **Proactive logging for all new code. Log first, build once, debug never!**

## 📁 Files in This Skill

| File | Purpose |
|------|---------|
| **INSTRUMENT-FIRST.md** | 📖 Core methodology & complete templates |
| **DATABASE-REFERENCE.md** | 🗄️ **Database schema reference** - Read when working with DB! |
| **MIGRATION-MAINTENANCE.md** | 🔄 **Migration protocol** - Update docs after every migration! |
| **EXAMPLES.md** | 📝 Real before/after scenarios |
| **QUICK-REFERENCE.md** | ⚡ Fast lookup card |
| **skill.json** | ⚙️ Configuration |
| **INDEX.md** | 📋 This file |

## 🎯 When to Use

**Trigger this skill when:**
- Creating new components
- Implementing server actions
- Building forms
- Adding database queries
- Updating auth logic
- Modifying any code
- **ANY code change, really!**

## 🚀 What Happens

### You Say:
```
"Create a project list component"
"Implement delete function"
"Build the settings page"
"Add email validation"
```

### I Do:
1. ✅ **Check DATABASE-REFERENCE.md** for correct table/column names
2. ✅ Write the code with correct table references
3. ✅ **Add comprehensive logs IMMEDIATELY** (not later!)
4. ✅ Log all critical points
5. ✅ Log RLS explicitly
6. ✅ **Logs stay forever**

## ⚠️ Core Rules

### Rule #0: Check Database Schema First!
**Before writing ANY database code:**
1. ✅ Read `DATABASE-REFERENCE.md`
2. ✅ Verify table name exists
3. ✅ Verify column names are correct
4. ✅ Check foreign key relationships
5. ✅ Use correct status values from reference

**Never guess table names!**

❌ **Wrong:**
```typescript
// Table 'projects' doesn't exist!
.from('projects')
```

✅ **Right:**
```typescript
// Check reference first
.from('user_projects')  // ✅ Exists!
```

### Rule #1: Log on First Write
**Never write code without logs. Period.**

❌ **Wrong:**
```typescript
export async function loadData() {
  const { data, error } = await supabase.from('table').select('*')
  return { data, error }
}
```

✅ **Right:**
```typescript
export async function loadData() {
  console.log('[ACTION] loadData started')
  console.log('[DB] Querying table...')
  
  const { data, error } = await supabase.from('table').select('*')
  
  console.log('[DB] Result:', {
    count: data?.length,
    error: error?.message,
    rlsBlocked: error?.code === '42501'
  })
  
  if (error?.code === '42501') {
    console.error('[RLS] ❌ BLOCKING!')
  }
  
  return { data, error }
}
```

### Rule #2: RLS is Special
**RL silently fails and wastes tokens. Always check explicitly!**

```typescript
// This pattern in EVERY database operation:
if (error?.code === '42501') {
  console.error('[RLS] ❌ ROW LEVEL SECURITY BLOCKING!')
  console.error('[RLS] Table:', tableName)
  console.error('[RLS] User:', userId)
  console.error('[RLS] Fix in Supabase → Auth → Policies')
}
```

### Rule #3: Logs Stay Forever
- ❌ Never remove after fix
- ✅ Permanent infrastructure
- ✅ Help with future bugs
- ✅ Document code behavior

## 📋 Logging Checklist by Element

### Server Actions 🔴 Critical
- [ ] Action start with input
- [ ] Authentication check
- [ ] Input validation
- [ ] Database query start
- [ ] Query parameters
- [ ] Query result
- [ ] Error details (message, code, details, hint)
- [ ] RLS violation check (code 42501)
- [ ] Empty result warning
- [ ] Success confirmation
- [ ] Error catch with stack trace

### React Components 🟡 High
- [ ] Render start with props
- [ ] Initial state
- [ ] Effect trigger
- [ ] Effect dependencies
- [ ] Fetch start
- [ ] Fetch result
- [ ] State updates
- [ ] Loading state render
- [ ] Error state render
- [ ] Empty state render
- [ ] Main UI render

### Database Queries 🔴 Critical
- [ ] Table name
- [ ] Operation type
- [ ] Filters/params
- [ ] Query execution
- [ ] Result (data count, errors)
- [ ] Error details
- [ ] RLS violation check
- [ ] Empty result warning

### Authentication 🔴 Critical
- [ ] Session check start
- [ ] Session result
- [ ] Session error
- [ ] Session details (userId, expiry, email)
- [ ] User check
- [ ] User details
- [ ] User error
- [ ] Auth final result

### Form Handlers 🟡 High
- [ ] Submit start
- [ ] Raw form data
- [ ] Validation start
- [ ] Validation result
- [ ] Validation errors (field, message)
- [ ] Server action call
- [ ] Server action result
- [ ] Success/failure

## 🎯 RLS Troubleshooting Guide

### The Problem
RLS (Row Level Security) is the **#1 cause of silent failures**:
- Query returns empty (no error thrown)
- Data exists but you can't see it
- Wastes 30,000+ tokens guessing

### The Solution
**Every query gets RLS logging:**

```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('user_id', userId)

// ALWAYS log these:
console.log('[DB] Query result:', {
  hasData: !!data,
  rowCount: data?.length,
  hasError: !!error,
  errorMessage: error?.message,
  errorCode: error?.code  // ← 42501 = RLS!
})

// RLS detection:
if (error?.code === '42501') {
  console.error('[RLS] ❌ ROW LEVEL SECURITY BLOCKING!')
}

// Silent RLS (no error but no data):
if (!error && data?.length === 0) {
  console.warn('[RLS] ⚠️ Possible RLS filtering - 0 rows')
}
```

### How to Fix RLS
1. Go to Supabase Dashboard
2. Authentication → Policies
3. Find the table
4. Add policy: `SELECT/INSERT/UPDATE/DELETE for authenticated users where user_id = auth.uid()`
5. Test again

## 💰 Token Economics

### Before (No Proactive Logging)
```
Build feature → Test → Broken
→ Debug (add logs) → 15 iterations → 35,000 tokens
→ Fix → New issue → 20 iterations → 40,000 tokens
→ Total: 75,000 tokens, 1 hour
```

### After (Proactive Logging)
```
Build with logs → Test → Console shows issue
→ Fix immediately → 3,000 tokens
→ New issue → Logs already there → 2,000 tokens
→ Total: 5,000 tokens, 5 minutes
```

**Savings: 93% tokens, 92% time!** 🎉

## 🔧 Complete Template Library

All templates available in `INSTRUMENT-FIRST.md`:
- Server Action Template (complete)
- React Component Template (complete)
- Supabase Query Template (complete)
- Auth Check Template (complete)
- Form Handler Template (complete)
- RLS Check Template (complete)

## 🚀 Usage Examples

### Example 1: New Feature
**You:** "Create a notification system"

**I will:**
1. Create components with logs
2. Create server actions with logs
3. Create DB queries with logs
4. Log all RLS checks
5. **Everything logged from start!**

### Example 2: Update Existing
**You:** "Update the project deletion logic"

**I will:**
1. Update the code
2. **Add logs if not already there**
3. Ensure RLS is logged
4. Logs stay permanently

### Example 3: Quick Fix
**You:** "Add a helper function to format dates"

**I will:**
```typescript
export function formatDate(date: Date): string {
  console.log('[UTIL] formatDate called with:', date)
  
  const formatted = new Intl.DateTimeFormat('en-US').format(date)
  
  console.log('[UTIL] Result:', formatted)
  
  return formatted
}
```

**Even simple functions get logged!**

## ✅ Quality Checklist

Before I deliver any code, I verify:
- [ ] All functions have entry/exit logs
- [ ] All components have render logs
- [ ] All queries have result logs
- [ ] All auth checks have status logs
- [ ] RLS is explicitly checked
- [ ] Errors are logged with details
- [ ] Logs use structured format ([CONTEXT])
- [ ] Logs will stay permanently

## 📝 Remember

**🎯 The goal is NOT to debug faster.**
**🎯 The goal is to NEVER debug blind!**

With proactive logging:
- ✅ Issues reveal themselves immediately
- ✅ Console tells you what's wrong
- ✅ No guessing, no iterations
- ✅ First fix is the right fix

**This is how we manage time and energy efficiently!** 💪

---

**Ready to build with confidence!** 🚀
