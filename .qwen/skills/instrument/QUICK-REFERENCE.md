# 🛠️ Instrument Skill - Quick Reference

> **Log everything we build. Log it on first write. Logs stay forever.**

## ⚠️ Golden Rules

### Rule #1: Log on First Implementation
**Never write code without logs. Not "we'll add logs later". Not "let's test first".**

✅ **ALWAYS:**
```typescript
export async function myAction(input) {
  console.log('[ACTION] Started with:', input)  // ← Added immediately
  // ... rest of code with logs
}
```

❌ **NEVER:**
```typescript
export async function myAction(input) {
  // Just the logic, no logs
  // "We'll debug if it breaks" - NO!
}
```

### Rule #2: Logs Stay Forever
- ❌ Don't remove logs after it works
- ✅ Logs are permanent
- ✅ Next issue? Logs already there!

### Rule #3: RLS Gets Special Treatment
**RLS is the #1 silent failure. Always log BOTH types explicitly!**

**Type 1: EXPLICIT RLS Violation (error code 42501)**
```typescript
if (error?.code === '42501') {
  console.error('[RLS] ❌ EXPLICIT RLS VIOLATION!')
  console.error('[RLS] Type: Explicit policy block')
  console.error('[RLS] Table:', tableName)
  console.error('[RLS] User:', userId)
  console.error('[RLS] Fix: Add policy in Supabase')
}
```

**Type 2: SILENT RLS Filtering (no error, no data)**
```typescript
if (!error && data?.length === 0) {
  console.warn('[RLS] ⚠️ SILENT RLS FILTERING!')
  console.warn('[RLS] Type: Silent row filtering')
  console.warn('[RLS] Table:', tableName)
  console.warn('[RLS] User:', userId)
  console.warn('[RLS] Data may exist but filtered')
}
```

## 📋 What to Log by Element Type

| Element | What to Log | Priority |
|---------|-------------|----------|
| **Server Action** | Start, input, auth, validation, DB, result, errors | 🔴 Critical |
| **Component** | Render, props, state, effects, fetch, errors | 🟡 High |
| **Supabase Query** | Table, operation, filters, result, RLS | 🔴 Critical |
| **Auth Check** | Session, user, expiry, role | 🔴 Critical |
| **Form Handler** | Raw data, validation, errors, submission | 🟡 High |
| **API Route** | Request, params, body, response | 🟡 High |
| **Middleware** | Request path, cookies, redirect | 🟢 Medium |
| **Utility** | Input, output, errors | 🟢 Medium |

## 🎯 Quick Templates

### Server Action (Copy & Adapt)
```typescript
export async function anyAction(input) {
  console.log('[ACTION] Started:', input)
  
  const user = await getUser()
  console.log('[AUTH] User:', user?.id)
  if (!user) return { error: 'Unauthorized' }
  
  console.log('[DB] Querying...')
  const { data, error } = await supabase.from(table).select('*')
  console.log('[DB] Result:', { count: data?.length, error: error?.message })
  
  if (error?.code === '42501') {
    console.error('[RLS] ❌ BLOCKING!')
  }
  
  return { data, error }
}
```

### Component (Copy & Adapt)
```typescript
function MyComponent({ id, data }) {
  console.log('[COMPONENT] Render, props:', { id, hasData: !!data })
  
  const [state, setState] = useState(null)
  
  useEffect(() => {
    console.log('[EFFECT] Fetching...')
    fetchData(id).then(result => {
      console.log('[FETCH] Result:', result)
      setState(result)
    })
  }, [id])
  
  console.log('[RENDER] State:', { loading, error, hasData: !!state })
  
  if (!state) return <Loading />
  return <MainUI data={state} />
}
```

### RLS Check (Always Include Both Types!)
```typescript
const { data, error } = await supabase.from(table).select('*')

console.log('[DB] Result:', {
  count: data?.length,
  error: error?.message,
  code: error?.code
})

// EXPLICIT RLS VIOLATION
if (error?.code === '42501') {
  console.error('[RLS] ❌ EXPLICIT RLS BLOCKING!')
  console.error('[RLS] Type: Explicit policy denial')
  console.error('[RLS] Table:', table)
  console.error('[RLS] User:', userId)
  console.error('[RLS] Fix: Add policy in Supabase')
}
// SILENT RLS FILTERING
else if (!error && data?.length === 0) {
  console.warn('[RLS] ⚠️ SILENT RLS FILTERING!')
  console.warn('[RLS] Type: Silent row filtering')
  console.warn('[RLS] Table:', table)
  console.warn('[RLS] User:', userId)
  console.warn('[RLS] Check if data exists in dashboard')
}
```

## 🚀 Usage Triggers

**Use this skill when I say:**
- "Create [component/function/feature]"
- "Implement [feature]"
- "Build [thing]"
- "Add [functionality]"
- "Update [element]"
- "Modify [code]"

**I will automatically:**
1. ✅ Write the code
2. ✅ Add comprehensive logs
3. ✅ Log all critical points
4. ✅ Log RLS explicitly
5. ✅ Logs stay permanently

## 🆘 Common Issues & What Logs Show

| Issue | What Logs Reveal |
|-------|-----------------|
| **Data not loading** | Query result, EXPLICIT RLS (42501), SILENT RLS (0 rows), auth state |
| **Form won't submit** | Validation errors, submission result |
| **Auth failing** | Session state, user details, expiry |
| **RLS EXPLICIT block** | Error code 42501, table name, user, fix instructions |
| **RLS SILENT filter** | 0 rows returned, no error, data exists check |
| **Component blank** | Props, state, effect triggers |
| **500 error** | Server action errors, stack traces |

## 💰 Why This Matters

**Time saved: ~90%**
**Tokens saved: ~90%**
**Frustration reduced: ~95%**

**Logging upfront = Debugging avoided!**

---

**Ready to build with confidence!** 🚀
