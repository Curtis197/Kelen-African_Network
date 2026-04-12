# 🤖 Agent Instructions - MANDATORY

> These rules apply to EVERY interaction. No exceptions.

---

## 🎯 CORE RULES (Always Follow)

### Rule 1: INSTRUMENT EVERYTHING
**When: Creating, implementing, building, adding, updating, modifying ANY code**

- ✅ Add comprehensive `console.log` on FIRST WRITE
- ✅ Log all inputs, outputs, errors, decisions
- ✅ NEVER write unlogged code
- ✅ Logs stay FOREVER (never remove after fix)
- ✅ This is permanent infrastructure, not temporary debugging

**Trigger words:** create, implement, build, add, update, modify, new, fix

### Rule 2: CHECK DATABASE REFERENCE FIRST
**When: Writing ANY database code**

- ✅ Read `.qwen/skills/instrument/DATABASE-REFERENCE.md` BEFORE writing queries
- ✅ NEVER guess table names
- ✅ Verify table/column names from reference
- ✅ Key tables: `user_projects` (NOT `projects`), `pro_projects`, `professionals`, `project_logs`

### Rule 3: RLS GETS SPECIAL TREATMENT
**When: Writing ANY Supabase query**

- ✅ Log error code `42501` explicitly (EXPLICIT RLS violation)
- ✅ Log `0 rows with no error` (SILENT RLS filtering)
- ✅ Both types get detailed logging with table, user, fix instructions
- ✅ Never assume 0 rows = empty table

### Rule 4: DEBUG WITH DATA, NOT GUESSES
**When: Something is broken**

- ✅ ADD LOGS FIRST (don't change logic yet)
- ✅ Ask user to run and share console output
- ✅ Analyze data to find EXACT failure point
- ✅ THEN make one targeted fix
- ❌ NEVER guess and change code blindly

### Rule 5: UPDATE DOCS AFTER MIGRATIONS
**When: Running database migration**

- ✅ Update `supabase/database-scheme.sql` immediately
- ✅ Update `.qwen/skills/instrument/DATABASE-REFERENCE.md` immediately
- ✅ If RLS changed: Export policies → update `supabase/RLS-list.md`
- ✅ Review `supabase/RLS-audit-findings.md` for new issues
- ✅ Actual DB = source of truth, files = documentation

---

## 📋 PROJECT TABLES (Know This)

| Table | Purpose | Example |
|-------|---------|---------|
| `user_projects` | Client's project (client on platform) | "Building my house" |
| `pro_projects` | Pro managing client work (client may NOT be on platform) | "Villa for Jean" (private, NOT portfolio) |
| `professional_realizations` | FINISHED work on PUBLIC portfolio | "Completed villa 2024" (what visitors see) |

**Flow:** `pro_projects` completed → `professional_realizations` created → displayed on portfolio

---

## 🔧 LOGGING TEMPLATES (Use These)

### Server Action
```typescript
export async function anyAction(input) {
  console.log('[ACTION] Started:', input)
  
  const user = await getUser()
  console.log('[AUTH] User:', user?.id)
  if (!user) return { error: 'Unauthorized' }
  
  const { data, error } = await supabase.from(table).select('*')
  console.log('[DB] Result:', { count: data?.length, error: error?.message, code: error?.code })
  
  if (error?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING!')
    console.error('[RLS] Table:', table)
  }
  if (!error && data?.length === 0) {
    console.warn('[RLS] ⚠️ SILENT RLS FILTERING!')
  }
  
  return { data, error }
}
```

### Component
```typescript
function MyComponent({ id, data }) {
  console.log('[COMPONENT] Render, props:', { id, hasData: !!data })
  
  useEffect(() => {
    console.log('[EFFECT] Fetching...')
    fetchData(id).then(r => console.log('[FETCH] Result:', r))
  }, [id])
  
  console.log('[RENDER] State:', { loading, error, hasData: !!state })
  return <UI />
}
```

---

## 📁 SKILL FILES (Reference When Needed)

- `.qwen/skills/debug/` - Debug workflow (instrument-first)
- `.qwen/skills/instrument/` - Proactive logging (build with logs)
- `.qwen/skills/instrument/DATABASE-REFERENCE.md` - DB schema reference
- `.qwen/skills/instrument/MIGRATION-MAINTENANCE.md` - Migration doc protocol
- `supabase/database-scheme.sql` - Full schema
- `supabase/RLS-list.md` - Current RLS policies
- `supabase/RLS-audit-findings.md` - RLS issues

---

## ⚠️ REMEMBER

1. **Logs = Permanent** - Never remove after fix
2. **Check DB reference** - Never guess table names
3. **Data over guesses** - Console output > assumptions
4. **Docs stay current** - Migration = immediate doc updates
5. **Actual DB = Truth** - Files must match database

---

**These instructions are MANDATORY. Follow them every time.** 🚀
