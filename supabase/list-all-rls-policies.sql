-- ============================================
-- LIST ALL RLS POLICIES IN DATABASE
-- ============================================
-- Run this in Supabase SQL Editor to see every RLS policy
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- ============================================
-- ALTERNATIVE: More readable format
-- ============================================

SELECT 
  tablename AS "Table",
  policyname AS "Policy Name",
  cmd AS "Command",
  roles AS "Roles",
  qual AS "USING Clause",
  with_check AS "WITH CHECK Clause"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- ============================================
-- CHECK WHICH TABLES HAVE RLS ENABLED
-- ============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;


-- ============================================
-- CHECK RLS STATUS + POLICIES TOGETHER
-- ============================================

SELECT 
  t.tablename AS "Table",
  t.rowsecurity AS "RLS Enabled",
  p.policyname AS "Policy",
  p.cmd AS "Command",
  p.roles AS "Roles",
  p.qual AS "USING"
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
ORDER BY t.tablename, p.policyname;
