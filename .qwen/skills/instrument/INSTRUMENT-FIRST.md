# 🛠️ Instrument Skill - Proactive Logging for All New Code

> **PHILOSOPHY: Log everything we build, not just when things break.**

## The Problem

When we build features, we often:
1. Write code (components, functions, server actions)
2. Test it
3. Something doesn't work
4. Spend 20+ iterations finding the issue
5. Wish we had added logs from the start

**RLS policies are the worst offender** - they silently fail, return empty data, and we waste tokens guessing why.

## The Solution

**Every time we create or modify ANY code element, we add comprehensive logs FROM THE START:**
- ✅ New function? Log inputs, outputs, errors
- ✅ New component? Log props, state, effects
- ✅ New server action? Log every step
- ✅ New Supabase query? Log results and errors
- ✅ New RLS policy change? Log the query outcome
- ✅ New auth check? Log the user state
- ✅ New form handler? Log validation, submission, response

**This is NOT reactive debugging - this is proactive instrumentation!**

## ⚠️ Core Principles

### Rule #1: Log Everything on First Write
**Never write code without logs on the first implementation.**

❌ **WRONG:**
```typescript
export async function loadProject(id: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
  
  return { data, error }
}
```

✅ **RIGHT:**
```typescript
export async function loadProject(id: string) {
  console.log('[ACTION] loadProject started, id:', id)
  
  console.log('[AUTH] Checking user authentication...')
  const user = await getUser()
  console.log('[AUTH] User authenticated:', { 
    authenticated: !!user, 
    userId: user?.id 
  })
  
  if (!user) {
    console.log('[AUTH] Unauthorized - no user session')
    return { error: 'Unauthorized' }
  }
  
  console.log('[DB] Querying projects table...')
  console.log('[DB] Query params:', { table: 'projects', id })
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
  
  console.log('[DB] Query result:', {
    success: !error,
    hasData: !!data,
    rowCount: data?.length,
    errorMessage: error?.message,
    errorCode: error?.code
  })
  
  if (error) {
    console.error('[DB] Query failed:', error)
  }
  
  if (!error && data?.length === 0) {
    console.warn('[DB] Query succeeded but returned 0 rows - possible RLS issue')
  }
  
  return { data: data?.[0], error }
}
```

### Rule #2: Logs Are NOT Optional
- Every function gets logs
- Every component gets logs
- Every query gets logs
- Every auth check gets logs
- Every form handler gets logs
- **No exceptions!**

### Rule #3: Logs Stay Forever
- **NEVER remove logs after implementation**
- Logs are permanent infrastructure
- They help with future debugging
- They document the code behavior

## 📋 Instrumentation Checklist by Element Type

### 1. Server Actions (Every Single One)

```typescript
export async function anyServerAction(input: InputType) {
  console.log('[ACTION] ========================================')
  console.log('[ACTION] anyServerAction STARTED')
  console.log('[ACTION] Input:', JSON.stringify(input, null, 2))
  console.log('[ACTION] ========================================')
  
  try {
    // Auth check
    console.log('[AUTH] Checking authentication...')
    const user = await getUser()
    console.log('[AUTH] Auth result:', {
      authenticated: !!user,
      userId: user?.id,
      email: user?.email,
      role: user?.user_metadata?.role
    })
    
    if (!user) {
      console.warn('[AUTH] ❌ Unauthorized - no user session')
      return { error: 'Unauthorized', success: false }
    }
    
    console.log('[AUTH] ✅ Authentication successful')
    
    // Validation
    console.log('[VALIDATE] Validating input...')
    const validated = schema.safeParse(input)
    console.log('[VALIDATE] Validation result:', {
      success: validated.success,
      errors: validated.success ? null : validated.error.errors
    })
    
    if (!validated.success) {
      console.warn('[VALIDATE] ❌ Validation failed')
      return { error: 'Invalid input', details: validated.error.errors }
    }
    
    console.log('[VALIDATE] ✅ Validation passed')
    
    // Database operation
    console.log('[DB] Starting database operation...')
    console.log('[DB] Table:', tableName)
    console.log('[DB] Operation:', operationType)
    console.log('[DB] Filters:', filters)
    
    const { data, error, count } = await supabase
      .from(tableName)
      [operationType](/* params */)
    
    console.log('[DB] Operation result:', {
      success: !error,
      hasData: !!data,
      rowCount: data?.length || 0,
      totalCount: count,
      errorMessage: error?.message,
      errorCode: error?.code,
      errorDetails: error?.details,
      errorHint: error?.hint
    })
    
    // Check for RLS issues
    if (error) {
      // EXPLICIT RLS VIOLATION (error code 42501)
      if (error.code === '42501') {
        console.error('[RLS] ========================================')
        console.error('[RLS] ❌ RLS POLICY VIOLATION DETECTED!')
        console.error('[RLS] ========================================')
        console.error('[RLS] Violation Type: Explicit policy block')
        console.error('[RLS] Error Code: 42501')
        console.error('[RLS] Table:', tableName)
        console.error('[RLS] Operation:', operationType)
        console.error('[RLS] User ID:', user.id)
        console.error('[RLS] Error Message:', error.message)
        if (error.details) console.error('[RLS] Details:', error.details)
        if (error.hint) console.error('[RLS] Hint:', error.hint)
        console.error('[RLS]')
        console.error('[RLS] WHAT THIS MEANS:')
        console.error('[RLS] - Supabase RLS policy EXPLICITLY denied this operation')
        console.error('[RLS] - Query was blocked, not just filtered')
        console.error('[RLS] - User does not have permission for this action')
        console.error('[RLS]')
        console.error('[RLS] HOW TO FIX:')
        console.error('[RLS] 1. Go to Supabase Dashboard')
        console.error('[RLS] 2. Authentication → Policies')
        console.error('[RLS] 3. Find table:', tableName)
        console.error('[RLS] 4. Check', operationType, 'policies for user:', user.id)
        console.error('[RLS] 5. Add/modify policy to allow this operation')
        console.error('[RLS] 6. Policy should use: auth.uid() for user checks')
        console.error('[RLS] ========================================')
      } else {
        console.error('[DB] ❌ Database error (NOT RLS):', error)
        console.error('[DB] Code:', error.code)
        console.error('[DB] Message:', error.message)
      }
      return { error: error.message, code: error.code }
    }

    // SILENT RLS (query succeeded but returned 0 rows)
    if (!error && data?.length === 0) {
      console.warn('[RLS] ========================================')
      console.warn('[RLS] ⚠️ POTENTIAL SILENT RLS FILTERING')
      console.warn('[RLS] ========================================')
      console.warn('[RLS] What happened:')
      console.warn('[RLS]   - Query SUCCEEDED (no error)')
      console.warn('[RLS]   - But returned ZERO rows')
      console.warn('[RLS]   - This could be RLS filtering, not empty table')
      console.warn('[RLS]')
      console.warn('[RLS] Possible causes:')
      console.warn('[RLS]   1. RLS policy is filtering out rows silently')
      console.warn('[RLS]   2. Table actually has no data')
      console.warn('[RLS]   3. Filters are too restrictive')
      console.warn('[RLS]   4. User permissions limit visible data')
      console.warn('[RLS]')
      console.warn('[RLS] HOW TO DIAGNOSE:')
      console.warn('[RLS] 1. Check if data exists in Supabase Table Editor')
      console.warn('[RLS] 2. If data exists but query returns 0 → RLS blocking')
      console.warn('[RLS] 3. Test with service role key (bypasses RLS) to confirm')
      console.warn('[RLS] 4. Check RLS policies in Authentication → Policies')
      console.warn('[RLS]')
      console.warn('[RLS] Table:', tableName)
      console.warn('[RLS] User ID:', user.id)
      console.warn('[RLS] Operation:', operationType)
      console.warn('[RLS] Expected rows: Unknown (verify in dashboard)')
      console.warn('[RLS] Actual rows: 0')
      console.warn('[RLS] ========================================')
    }
    
    console.log('[DB] ✅ Database operation successful')
    
    // Success
    console.log('[ACTION] ========================================')
    console.log('[ACTION] anyServerAction COMPLETED SUCCESSFULLY')
    console.log('[ACTION] Result:', { success: true, count: data?.length })
    console.log('[ACTION] ========================================')
    
    return { success: true, data }
  } catch (error) {
    console.error('[ACTION] ========================================')
    console.error('[ACTION] ❌ FATAL ERROR')
    console.error('[ACTION] Error:', error)
    console.error('[ACTION] Stack:', error.stack)
    console.error('[ACTION] Input:', input)
    console.error('[ACTION] ========================================')
    
    return { error: error.message, success: false }
  }
}
```

### 2. React Components (Every Single One)

```typescript
interface ComponentProps {
  id: string
  data?: DataType
  onLoad?: (data: DataType) => void
}

export function AnyComponent({ id, data, onLoad }: ComponentProps) {
  console.log('[COMPONENT] ========================================')
  console.log('[COMPONENT] AnyComponent RENDER START')
  console.log('[COMPONENT] Props:', {
    id,
    hasData: !!data,
    dataType: data ? typeof data : 'undefined'
  })
  console.log('[COMPONENT] ========================================')
  
  const [state, setState] = useState<StateType>(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  console.log('[STATE] Initial state:', { state, loading, error })
  
  useEffect(() => {
    console.log('[EFFECT] ========================================')
    console.log('[EFFECT] useEffect triggered')
    console.log('[EFFECT] Dependencies changed:', { id, hasData: !!data })
    console.log('[EFFECT] ========================================')
    
    async function loadData() {
      if (data) {
        console.log('[EFFECT] Data already provided, no fetch needed')
        return
      }
      
      console.log('[FETCH] Starting data fetch...')
      console.log('[FETCH] Resource:', resourceUrl)
      console.log('[FETCH] Params:', { id })
      
      setLoading(true)
      setError(null)
      
      try {
        console.log('[FETCH] Calling fetch function...')
        const result = await fetchData(id)
        
        console.log('[FETCH] Fetch result:', {
          success: !!result,
          dataType: result ? typeof result : 'undefined',
          hasError: !!result?.error
        })
        
        if (result?.error) {
          console.error('[FETCH] ❌ Fetch returned error:', result.error)
          setError(result.error)
          return
        }
        
        console.log('[FETCH] ✅ Data fetched successfully')
        console.log('[FETCH] Data:', result)
        
        setState(result)
        onLoad?.(result)
      } catch (err) {
        console.error('[FETCH] ❌ Fetch threw exception:', err)
        console.error('[FETCH] Stack:', err.stack)
        setError(err.message)
      } finally {
        setLoading(false)
        console.log('[FETCH] Loading state set to false')
      }
    }
    
    loadData()
  }, [id, data, onLoad])
  
  console.log('[RENDER] Current state:', { loading, hasError: !!error, hasState: !!state })
  
  // Loading state
  if (loading) {
    console.log('[RENDER] Rendering: Loading state')
    return <LoadingSpinner />
  }
  
  // Error state
  if (error) {
    console.error('[RENDER] Rendering: Error state')
    console.error('[RENDER] Error:', error)
    return <ErrorDisplay message={error} />
  }
  
  // Empty state
  if (!state) {
    console.warn('[RENDER] Rendering: Empty state')
    return <EmptyState />
  }
  
  console.log('[RENDER] ========================================')
  console.log('[RENDER] ✅ Rendering main UI')
  console.log('[RENDER] ========================================')
  
  return (
    <MainUI data={state} />
  )
}
```

### 3. Supabase Queries (Every Single One)

```typescript
async function queryProjects(userId: string) {
  console.log('[QUERY] ========================================')
  console.log('[QUERY] queryProjects STARTED')
  console.log('[QUERY] User ID:', userId)
  console.log('[QUERY] ========================================')
  
  console.log('[QUERY] Building Supabase client...')
  const supabase = createClient()
  console.log('[QUERY] ✅ Client created')
  
  console.log('[QUERY] Table:', 'projects')
  console.log('[QUERY] Operation:', 'SELECT')
  console.log('[QUERY] Filters:', { user_id: userId })
  
  console.log('[QUERY] Executing query...')
  const { data, error, count } = await supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  console.log('[QUERY] ========================================')
  console.log('[QUERY] Query result:')
  console.log('[QUERY]   Success:', !error)
  console.log('[QUERY]   Has data:', !!data)
  console.log('[QUERY]   Row count:', data?.length)
  console.log('[QUERY]   Total count:', count)
  
  // ========== RLS VIOLATION DETECTION ==========
  if (error) {
    console.error('[QUERY] ❌ ERROR:')
    console.error('[QUERY]   Message:', error.message)
    console.error('[QUERY]   Code:', error.code)
    console.error('[QUERY]   Details:', error.details)
    console.error('[QUERY]   Hint:', error.hint)
    
    // EXPLICIT RLS VIOLATION (error code 42501)
    if (error.code === '42501') {
      console.error('[RLS] ========================================')
      console.error('[RLS] ❌ RLS POLICY VIOLATION DETECTED!')
      console.error('[RLS] ========================================')
      console.error('[RLS] Violation Type: Explicit policy block')
      console.error('[RLS] Error Code: 42501')
      console.error('[RLS] Table:', 'projects')
      console.error('[RLS] Operation:', 'SELECT')
      console.error('[RLS] User ID:', userId)
      console.error('[RLS] Error Message:', error.message)
      console.error('[RLS]')
      console.error('[RLS] WHAT THIS MEANS:')
      console.error('[RLS] - Supabase RLS policy EXPLICITLY denied this operation')
      console.error('[RLS] - Query was blocked, not just filtered')
      console.error('[RLS] - User does not have permission for this action')
      console.error('[RLS]')
      console.error('[RLS] HOW TO FIX:')
      console.error('[RLS] 1. Go to Supabase Dashboard')
      console.error('[RLS] 2. Authentication → Policies')
      console.error('[RLS] 3. Find table: "projects"')
      console.error('[RLS] 4. Check SELECT policies for user:', userId)
      console.error('[RLS] 5. Add policy: "SELECT for authenticated users where user_id = auth.uid()"')
      console.error('[RLS] 6. Or check if policy is too restrictive')
      console.error('[RLS] ========================================')
    } else {
      console.error('[DB] ❌ Database error (NOT RLS):', error)
    }
  } else if (!data || data.length === 0) {
    // SILENT RLS (query succeeded but returned 0 rows - could be RLS filtering)
    console.warn('[RLS] ========================================')
    console.warn('[RLS] ⚠️ POTENTIAL SILENT RLS FILTERING')
    console.warn('[RLS] ========================================')
    console.warn('[RLS] What happened:')
    console.warn('[RLS]   - Query SUCCEEDED (no error)')
    console.warn('[RLS]   - But returned ZERO rows')
    console.warn('[RLS]   - This could be RLS filtering, not empty table')
    console.warn('[RLS]')
    console.warn('[RLS] Possible causes:')
    console.warn('[RLS]   1. RLS policy is filtering out rows silently')
    console.warn('[RLS]   2. Table actually has no data for this user')
    console.warn('[RLS]   3. Filters are too restrictive')
    console.warn('[RLS]   4. User ID mismatch')
    console.warn('[RLS]')
    console.warn('[RLS] HOW TO DIAGNOSE:')
    console.warn('[RLS] 1. Check if data exists in Supabase Table Editor')
    console.warn('[RLS] 2. If data exists but query returns 0 → RLS blocking')
    console.warn('[RLS] 3. Test with service role key (bypasses RLS) to confirm')
    console.warn('[RLS] 4. Check RLS policies in Authentication → Policies')
    console.warn('[RLS]')
    console.warn('[RLS] Table:', 'projects')
    console.warn('[RLS] User ID:', userId)
    console.warn('[RLS] Expected rows: Unknown (verify in dashboard)')
    console.warn('[RLS] Actual rows: 0')
    console.warn('[RLS] ========================================')
  } else {
    console.log('[QUERY] ✅ Query successful')
    console.log('[QUERY] Data returned:', data.length, 'rows')
    console.log('[QUERY] No RLS violations detected')
  }
  
  console.log('[QUERY] ========================================')
  
  return { data, error, count }
}
```

### 4. Authentication Checks (Every Single One)

```typescript
async function checkAuth() {
  console.log('[AUTH] ========================================')
  console.log('[AUTH] checkAuth STARTED')
  console.log('[AUTH] ========================================')
  
  console.log('[AUTH] Getting session...')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  console.log('[AUTH] Session result:', {
    hasSession: !!session,
    sessionError: sessionError?.message
  })
  
  if (sessionError) {
    console.error('[AUTH] ❌ Session error:', sessionError)
  }
  
  if (!session) {
    console.warn('[AUTH] ❌ No active session - user not authenticated')
    return { authenticated: false, user: null }
  }
  
  console.log('[AUTH] ✅ Session exists')
  console.log('[AUTH] Session details:', {
    userId: session.user.id,
    email: session.user.email,
    expiresAt: new Date(session.expires_at * 1000).toISOString(),
    isExpired: Date.now() > session.expires_at * 1000
  })
  
  console.log('[AUTH] Getting user details...')
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  console.log('[AUTH] User result:', {
    hasUser: !!user,
    userId: user?.id,
    error: userError?.message
  })
  
  if (userError) {
    console.error('[AUTH] ❌ User error:', userError)
  }
  
  if (!user) {
    console.warn('[AUTH] ❌ Session exists but no user - possible token issue')
    return { authenticated: false, user: null }
  }
  
  console.log('[AUTH] ✅ User authenticated')
  console.log('[AUTH] User details:', {
    id: user.id,
    email: user.email,
    createdAt: user.created_at,
    lastSignIn: user.last_sign_in_at,
    role: user.user_metadata?.role,
    provider: user.app_metadata?.provider
  })
  
  console.log('[AUTH] ========================================')
  
  return { authenticated: true, user }
}
```

### 5. Form Handlers (Every Single One)

```typescript
async function handleFormSubmit(formData: FormData) {
  console.log('[FORM] ========================================')
  console.log('[FORM] handleFormSubmit STARTED')
  console.log('[FORM] ========================================')
  
  console.log('[FORM] Raw form data:')
  for (const [key, value] of formData.entries()) {
    console.log(`[FORM]   ${key}:`, value)
  }
  
  // Validation
  console.log('[FORM] Step 1: Validation...')
  console.log('[FORM] Schema:', schemaName)
  
  const rawData = Object.fromEntries(formData)
  const validated = schema.safeParse(rawData)
  
  console.log('[FORM] Validation result:', {
    success: validated.success,
    errorCount: validated.success ? 0 : validated.error.errors.length
  })
  
  if (!validated.success) {
    console.error('[FORM] ❌ Validation FAILED:')
    validated.error.errors.forEach((err, i) => {
      console.error(`[FORM]   Error ${i + 1}:`, {
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      })
    })
    return { success: false, error: 'Validation failed', details: validated.error.errors }
  }
  
  console.log('[FORM] ✅ Validation PASSED')
  console.log('[FORM] Validated data:', validated.data)
  
  // Server action call
  console.log('[FORM] Step 2: Calling server action...')
  console.log('[FORM] Action:', actionName)
  console.log('[FORM] Payload:', validated.data)
  
  try {
    const result = await serverAction(validated.data)
    
    console.log('[FORM] Server action result:', {
      success: !!result?.success,
      error: result?.error,
      data: result?.data
    })
    
    if (result?.error) {
      console.error('[FORM] ❌ Server action returned error:', result.error)
      return { success: false, error: result.error }
    }
    
    console.log('[FORM] ✅ Form submission SUCCESS')
    console.log('[FORM] ========================================')
    
    return { success: true, data: result.data }
  } catch (error) {
    console.error('[FORM] ❌ Server action threw exception:', error)
    console.error('[FORM] Stack:', error.stack)
    console.error('[FORM] ========================================')
    return { success: false, error: error.message }
  }
}
```

### 6. RLS Policy Checks (CRITICAL - Always Log!)

```typescript
// Whenever working with RLS-sensitive operations
async function checkRLS(table: string, operation: string, userId: string) {
  console.log('[RLS] ========================================')
  console.log('[RLS] RLS CHECK STARTED')
  console.log('[RLS] Table:', table)
  console.log('[RLS] Operation:', operation)
  console.log('[RLS] User ID:', userId)
  console.log('[RLS] ========================================')
  
  console.log('[RLS] Testing query...')
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .limit(1)
  
  console.log('[RLS] Test result:', {
    allowed: !error,
    hasData: !!data,
    rowCount: data?.length,
    errorMessage: error?.message,
    errorCode: error?.code
  })
  
  // EXPLICIT RLS VIOLATION
  if (error?.code === '42501') {
    console.error('[RLS] ========================================')
    console.error('[RLS] ❌ RLS POLICY EXPLICITLY BLOCKING!')
    console.error('[RLS] ========================================')
    console.error('[RLS] Violation Type: Explicit policy denial')
    console.error('[RLS] Error Code: 42501')
    console.error('[RLS] Table:', table)
    console.error('[RLS] Operation:', operation)
    console.error('[RLS] User ID:', userId)
    console.error('[RLS] Error:', error.message)
    if (error.details) console.error('[RLS] Details:', error.details)
    if (error.hint) console.error('[RLS] Hint:', error.hint)
    console.error('[RLS]')
    console.error('[RLS] WHAT THIS MEANS:')
    console.error('[RLS] - RLS policy EXPLICITLY denied this operation')
    console.error('[RLS] - User does not have required permission')
    console.error('[RLS] - Policy rule is blocking access')
    console.error('[RLS]')
    console.error('[RLS] HOW TO FIX:')
    console.error('[RLS] 1. Supabase Dashboard → Authentication → Policies')
    console.error('[RLS] 2. Find table:', table)
    console.error('[RLS] 3. Check', operation, 'policies')
    console.error('[RLS] 4. Add policy: "' + operation.toUpperCase() + ' for authenticated users where user_id = auth.uid()"')
    console.error('[RLS] 5. Or modify existing policy to include this user')
    console.error('[RLS] 6. Test policy in SQL Editor with same user')
    console.error('[RLS] ========================================')
    
    return { allowed: false, error, violationType: 'EXPLICIT' }
  }
  
  if (error) {
    console.error('[DB] ❌ Database error (NOT RLS):', error)
    return { allowed: false, error, violationType: 'DATABASE_ERROR' }
  }
  
  // SILENT RLS FILTERING
  if (!error && data?.length === 0) {
    console.warn('[RLS] ========================================')
    console.warn('[RLS] ⚠️ POTENTIAL SILENT RLS FILTERING')
    console.warn('[RLS] ========================================')
    console.warn('[RLS] What happened:')
    console.warn('[RLS]   - Query SUCCEEDED (no error thrown)')
    console.warn('[RLS]   - But returned ZERO rows')
    console.warn('[RLS]   - Data may exist but is filtered by RLS')
    console.warn('[RLS]')
    console.warn('[RLS] Possible causes:')
    console.warn('[RLS]   1. RLS policy silently filtering out rows')
    console.warn('[RLS]   2. No data exists for this user/table')
    console.warn('[RLS]   3. Policy conditions too restrictive')
    console.warn('[RLS]   4. User ID mismatch in policy')
    console.warn('[RLS]')
    console.warn('[RLS] HOW TO DIAGNOSE:')
    console.warn('[RLS] 1. Check Supabase Table Editor for existing data')
    console.warn('[RLS] 2. If data exists → RLS is filtering silently')
    console.warn('[RLS] 3. Test with service role key (bypasses RLS)')
    console.warn('[RLS] 4. Compare results to confirm RLS filtering')
    console.warn('[RLS] 5. Check/modify RLS policies')
    console.warn('[RLS]')
    console.warn('[RLS] Table:', table)
    console.warn('[RLS] User ID:', userId)
    console.warn('[RLS] Expected rows: Unknown (verify in dashboard)')
    console.warn('[RLS] Actual rows: 0')
    console.warn('[RLS] Violation Type: SILENT_FILTERING')
    console.warn('[RLS] ========================================')
    
    return { allowed: true, data, violationType: 'SILENT_FILTERING', rowCount: 0 }
  }
  
  console.log('[RLS] ✅ RLS allows this operation')
  console.log('[RLS] Data returned:', data?.length, 'rows')
  console.log('[RLS] ========================================')
  
  return { allowed: true, data, violationType: 'NONE', rowCount: data?.length || 0 }
}
```
```

## 🎯 Special RLS Troubleshooting

RLS is the #1 source of silent failures. **Two types of RLS violations:**

### Type 1: EXPLICIT RLS Violation (Error Code 42501)
**Query fails with error - RLS explicitly blocks**

```typescript
const { data, error } = await supabase
  .from('table')
  .select('*')

console.log('[DB] Query result:', {
  hasData: !!data,
  rowCount: data?.length,
  hasError: !!error,
  errorMessage: error?.message,
  errorCode: error?.code  // ← 42501 = EXPLICIT RLS!
})

if (error?.code === '42501') {
  console.error('[RLS] ❌ EXPLICIT RLS VIOLATION!')
  console.error('[RLS] Type: Policy explicitly blocked query')
  console.error('[RLS] Code: 42501')
  console.error('[RLS] Table:', 'table_name')
  console.error('[RLS] User:', userId)
  console.error('[RLS] Message:', error.message)
  console.error('[RLS] Fix: Add/modify policy in Supabase dashboard')
}
```

### Type 2: SILENT RLS Filtering (No Error, No Data)
**Query succeeds but returns 0 rows - RLS silently filters**

```typescript
const { data, error } = await supabase
  .from('table')
  .select('*')

console.log('[DB] Query result:', {
  hasData: !!data,
  rowCount: data?.length,
  hasError: !!error
})

// SILENT RLS - no error but no data
if (!error && data?.length === 0) {
  console.warn('[RLS] ⚠️ SILENT RLS FILTERING!')
  console.warn('[RLS] Type: Policy silently filtered rows')
  console.warn('[RLS] Query succeeded but returned 0 rows')
  console.warn('[RLS] Table:', 'table_name')
  console.warn('[RLS] User:', userId)
  console.warn('[RLS] Data may exist but is filtered')
  console.warn('[RLS] Check: Supabase Table Editor for existing data')
  console.warn('[RLS] Test: Use service role key to bypass RLS')
}
```

### Complete RLS Detection Pattern (Use in ALL queries!)

```typescript
const { data, error } = await supabase
  .from(tableName)
  .select('*')

console.log('[DB] Query result:', {
  hasData: !!data,
  rowCount: data?.length,
  hasError: !!error,
  errorMessage: error?.message,
  errorCode: error?.code
})

// EXPLICIT RLS VIOLATION
if (error?.code === '42501') {
  console.error('[RLS] ❌ EXPLICIT RLS BLOCKING!')
  console.error('[RLS] Violation Type: Explicit policy denial')
  console.error('[RLS] Table:', tableName)
  console.error('[RLS] User:', userId)
  console.error('[RLS] Fix in Supabase → Auth → Policies')
}
// SILENT RLS FILTERING
else if (!error && data?.length === 0) {
  console.warn('[RLS] ⚠️ SILENT RLS FILTERING!')
  console.warn('[RLS] Violation Type: Silent row filtering')
  console.warn('[RLS] Table:', tableName)
  console.warn('[RLS] User:', userId)
  console.warn('[RLS] Check if data exists in dashboard')
}
// SUCCESS
else {
  console.log('[DB] ✅ Query successful,', data?.length, 'rows')
}
```

## 📝 When to Add Logs

**EVERY TIME we:**

| Element | What to Log |
|---------|-------------|
| **Server Action** | Start, input, auth, validation, DB query, result, errors |
| **Component** | Render, props, state, effects, fetch, loading, errors |
| **Supabase Query** | Table, operation, filters, result, errors, RLS violations |
| **Auth Check** | Session, user, expiry, role, provider |
| **Form Handler** | Raw data, validation, errors, submission, result |
| **API Route** | Request, params, body, response, errors |
| **Middleware** | Request path, cookies, redirect, errors |
| **Utility Function** | Input, processing, output, errors |

## 🚀 Usage

When asking me to build/implement anything:

**You say:**
- "Create a new project list component"
- "Add a server action to delete projects"
- "Implement project creation form"
- "Update the auth check"

**I will:**
1. ✅ Write the code
2. ✅ Add comprehensive logs EVERYWHERE
3. ✅ Log all inputs, outputs, errors
4. ✅ Log RLS checks explicitly
5. ✅ Log all database operations
6. ✅ **Logs stay permanently!**

## 💰 Time & Token Savings

### Without Proactive Logging:
```
Build feature → Test → Something fails
→ Debug (add logs) → 20 iterations → 40,000 tokens
→ Fix → New issue → Debug again → 30,000 tokens
→ Total: 70,000+ tokens, hours of frustration
```

### With Proactive Logging:
```
Build feature with logs → Test → Console shows exact issue
→ Fix immediately → 3,000 tokens
→ Next issue? Logs already there → 2,000 tokens
→ Total: 5,000 tokens, minutes of work
```

**Savings: 93% less tokens, 95% less time!** 🎉

## ✅ Commitment

**From now on, whenever we implement/build/update:**

1. ✅ **Add logs on first write** - never ship unlogged code
2. ✅ **Log everything** - inputs, outputs, decisions, errors
3. ✅ **RLS is special** - always check and log RLS explicitly
4. ✅ **Logs stay forever** - permanent infrastructure
5. ✅ **No exceptions** - every single element gets logged

**This is how we manage time and energy efficiently!** 🚀

---

**Remember: It's easier to log upfront than to debug blind later!** 💪
