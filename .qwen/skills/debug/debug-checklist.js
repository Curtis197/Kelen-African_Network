#!/usr/bin/env node

/**
 * Kelen Project Debug Script
 * Run this during manual review to check for common issues
 * Usage: node .qwen/skills/debug/debug-checklist.js
 */

const fs = require('fs');
const path = require('path');

const CHECKS = [];
let passed = 0;
let failed = 0;
let warnings = 0;

function check(name, fn) {
  CHECKS.push({ name, fn });
}

// Environment checks
check('Environment file exists', () => {
  return fs.existsSync('.env.local') || fs.existsSync('.env');
});

check('package.json exists', () => {
  return fs.existsSync('package.json');
});

check('node_modules installed', () => {
  return fs.existsSync('node_modules');
});

check('Next.js app directory exists', () => {
  return fs.existsSync('app') || fs.existsSync('pages');
});

check('Supabase configuration exists', () => {
  // Search for supabase files
  const supabaseFiles = [
    'lib/supabase.ts',
    'lib/supabase.js',
    'utils/supabase.ts',
    'utils/supabase.js',
    'src/lib/supabase.ts',
    'src/lib/supabase.js',
  ];
  return supabaseFiles.some(f => fs.existsSync(f));
});

// Run all checks
console.log('🔍 Running Kelen Project Debug Checks...\n');

CHECKS.forEach(({ name, fn }) => {
  try {
    const result = fn();
    if (result) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`⚠️  ${name}`);
      warnings++;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${warnings} warnings, ${failed} failed`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n❌ Some checks failed. Please review the issues above.');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  Some checks have warnings. These may not be critical but should be reviewed.');
  process.exit(0);
} else {
  console.log('\n✅ All checks passed!');
  process.exit(0);
}
