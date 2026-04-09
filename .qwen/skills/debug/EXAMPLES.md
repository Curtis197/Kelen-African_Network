# 📝 Debug Session Examples

## Example 1: Data Not Loading

### ❌ OLD WAY (What We Used to Do)

**You:** "Projects page is empty even though I created projects"

**Me (guessing):** "Maybe it's the Supabase query..."
*Changes query logic*

**You:** "Still empty"

**Me (guessing again):** "Maybe it's RLS policies..."
*Changes RLS policies*

**You:** "Still empty"

**Me (guessing again):** "Maybe it's the server action..."
*Refactors server action*

**You:** "Still empty"

*10 iterations later...*

**Me:** "Oh, maybe the route param is wrong?"
*Checks route*

**You:** "Yeah the ID is undefined"

**Total: 15 iterations, 40,000 tokens wasted** 😭

---

### ✅ NEW WAY (Instrumentation-First)

**You:** "Projects page is empty even though I created projects"

**Me:** "Adding diagnostic logs to find the exact issue..."

*Adds console.logs to server action:*
```typescript
export async function getProject(id: string) {
  console.log('[ACTION] getProject called with id:', id)
  
  const user = await getUser()
  console.log('[ACTION] User:', user?.id)
  
  if (!user) {
    console.log('[ACTION] No user - unauthorized')
    return { error: 'Unauthorized' }
  }
  
  console.log('[ACTION] Querying Supabase for project:', id)
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
  
  console.log('[ACTION] Query result:', {
    hasData: !!data,
    dataCount: data?.length,
    hasError: !!error,
    errorMessage: error?.message
  })
  
  if (error) {
    console.error('[ACTION] Supabase error:', error)
    return { error: error.message }
  }
  
  console.log('[ACTION] Returning project:', data?.[0]?.id)
  return { data: data?.[0] }
}
```

**Me:** "Now refresh the page and share the console output"

**You:** 
```
[ACTION] getProject called with id: undefined
[ACTION] User: user-123
[ACTION] Querying Supabase for project: undefined
[ACTION] Query result: { hasData: false, dataCount: 0, hasError: false }
```

**Me:** "Found it! The `id` parameter is `undefined`. The issue is in the route - it's not extracting the ID from the URL params correctly. Fixing now..."

*Makes ONE targeted fix to extract params properly*

**You:** "Works! Seeing the project now"

**Total: 2 iterations, 4,000 tokens** 😊

---

## Example 2: Form Not Submitting

### ❌ OLD WAY

**You:** "Can't create a new project, submit button does nothing"

**Me (guessing):** "Maybe form validation is failing..."
*Changes validation schema*

**You:** "Still doesn't work"

**Me (guessing):** "Maybe the server action isn't being called..."
*Changes form submission handler*

**You:** "Still broken"

**Me (guessing):** "Maybe there's a type error..."
*Adds error handling*

*8 iterations later...*

**Me:** "Can you check console for errors?"

**You:** "There's a 500 error from the server action"

**Me:** "Oh, the database constraint is failing. Why didn't you say so?"

**Total: 12 iterations, 35,000 tokens** 😭

---

### ✅ NEW WAY

**You:** "Can't create a new project, submit button does nothing"

**Me:** "Adding diagnostic logs..."

*Adds console.logs to form handler:*
```typescript
async function handleSubmit(formData: FormData) {
  console.log('[FORM] Submit started')
  console.log('[FORM] Form data:', Object.fromEntries(formData))
  
  const validated = projectSchema.safeParse(formData)
  console.log('[FORM] Validation:', {
    success: validated.success,
    errors: validated.success ? null : validated.error.errors
  })
  
  if (!validated.success) {
    return { error: 'Validation failed', details: validated.error.errors }
  }
  
  console.log('[FORM] Calling server action...')
  try {
    const result = await createProject(validated.data)
    console.log('[FORM] Server action result:', result)
    return result
  } catch (error) {
    console.error('[FORM] Server action failed:', error)
    return { error: error.message }
  }
}
```

*Adds logs to server action:*
```typescript
export async function createProject(input: ProjectInput) {
  console.log('[ACTION] createProject started')
  console.log('[ACTION] Input:', input)
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert(input)
      .select()
    
    console.log('[ACTION] DB result:', {
      success: !!data,
      error: error?.message
    })
    
    return { data, error }
  } catch (error) {
    console.error('[ACTION] Fatal error:', error)
    throw error
  }
}
```

**Me:** "Try submitting again and share the console output"

**You:**
```
[FORM] Submit started
[FORM] Form data: { title: "My Project", budget: "50000" }
[FORM] Validation: { success: true, errors: null }
[FORM] Calling server action...
[ACTION] createProject started
[ACTION] Input: { title: "My Project", budget: "50000" }
[ACTION] DB result: { success: false, error: "null value in column 'currency' violates not-null constraint" }
```

**Me:** "Perfect! Found it. The `currency` field is required but not being sent. The form is missing the currency selector. Fixing now..."

*Makes ONE targeted fix to add currency field*

**You:** "Works! Project created successfully"

**Total: 2 iterations, 5,000 tokens** 😊

---

## Example 3: Authentication Issue

### ❌ OLD WAY

**You:** "Getting logged out randomly"

**Me:** "Maybe session timeout..."
*Changes session config*

**You:** "Still happening"

**Me:** "Maybe cookies..."
*Changes cookie settings*

**You:** "Still happening"

*6 iterations later...*

**Total: 25,000 tokens** 😭

---

### ✅ NEW WAY

**You:** "Getting logged out randomly"

**Me:** "Adding auth state logging..."

*Adds console.logs:*
```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('[AUTH] Event:', event)
      console.log('[AUTH] Session:', {
        exists: !!session,
        expiresAt: session?.expires_at,
        user: session?.user?.id
      })
      
      if (!session) {
        console.log('[AUTH] No session - checking why...')
      }
    }
  )
  
  return () => subscription.unsubscribe()
}, [])
```

**You:** "Here's what I see when it logs out:"
```
[AUTH] Event: SIGNED_IN
[AUTH] Session: { exists: true, expiresAt: 1234567890, user: 'user-123' }

[AUTH] Event: SIGNED_OUT
[AUTH] Session: { exists: false }
```

**Me:** "Interesting! It's a SIGNED_OUT event, not session expiry. This means something is explicitly calling signOut. Let me add more logging to find what..."

*Adds more targeted logs*

**You:** "Now I see: `[AUTH] SIGNED_OUT triggered by: window refresh`"

**Me:** "Ah! It's happening on window refresh. The auth state isn't persisting properly. Fixing the session persistence now..."

**Total: 3 iterations, 6,000 tokens** 😊

---

## The Pattern

### Every Debug Session Follows This Flow:

```
1. You report issue
   ↓
2. I add diagnostic logs (NO LOGIC CHANGES!)
   ↓
3. You run and collect console output
   ↓
4. I analyze data and identify root cause
   ↓
5. I make ONE targeted fix
   ↓
6. You verify it works
   ↓
DONE! ✅
```

### Token Comparison:

| Scenario | Old Way | New Way | Savings |
|----------|---------|---------|---------|
| Data not loading | 40,000 | 4,000 | 90% |
| Form broken | 35,000 | 5,000 | 86% |
| Auth issues | 25,000 | 6,000 | 76% |
| **Average** | **33,000** | **5,000** | **85%** |

---

## Your Debug Request Template

When reporting an issue, use this format:

```
**Issue:** [What's happening]
**Page:** [URL/route]
**Expected:** [What should happen]
**Environment:** [localhost / Vercel]
**Recent changes:** [What changed before this started]
```

**Example:**
```
**Issue:** Projects list is empty
**Page:** /projets
**Expected:** See my 3 created projects
**Environment:** Vercel production
**Recent changes:** Deployed new RLS policies yesterday
```

This gives me context to add the RIGHT diagnostic logs in the RIGHT places.

---

## Remember

**💡 The goal is NOT to fix the issue quickly.**
**💡 The goal is to UNDERSTAND the issue completely before fixing.**

Once we understand the exact problem through instrumentation:
- ✅ Fix is obvious
- ✅ Fix is correct
- ✅ Fix doesn't break other things
- ✅ We learn what went wrong

**This is why instrumentation-first saves time and tokens.** 🚀
