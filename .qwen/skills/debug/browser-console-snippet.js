/**
 * Kelen Browser Console Debug Snippet
 * 
 * Copy and paste this into your browser console (F12 → Console tab)
 * during manual review to quickly diagnose common issues.
 */

(function kelenDebug() {
  console.log('%c🔍 Kelen Debug Tools', 'font-size: 20px; font-weight: bold; color: #4F46E5;');
  console.log('='.repeat(50));

  // 1. Environment Check
  console.log('%c📋 Environment Variables:', 'font-weight: bold;');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_URL : 'Not available in browser');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : 'Not available in browser');

  // 2. Storage Check
  console.log('%c💾 Local Storage:', 'font-weight: bold;');
  const localStorageKeys = Object.keys(localStorage);
  if (localStorageKeys.length > 0) {
    localStorageKeys.forEach(key => {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        console.log(`  ${key}:`, value);
      } catch {
        console.log(`  ${key}:`, localStorage.getItem(key).substring(0, 100));
      }
    });
  } else {
    console.log('  (empty)');
  }

  // 3. Cookies Check
  console.log('%c🍪 Cookies:', 'font-weight: bold;');
  const cookies = document.cookie.split(';');
  if (cookies.length > 0 && cookies[0] !== '') {
    cookies.forEach(cookie => {
      const [name, ...valueParts] = cookie.split('=');
      console.log(`  ${name.trim()}:`, valueParts.join('=').substring(0, 50));
    });
  } else {
    console.log('  (none)');
  }

  // 4. React Check
  console.log('%c⚛️ React:', 'font-weight: bold;');
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('  React DevTools: ✅ Installed');
  } else {
    console.log('  React DevTools: ⚠️ Not detected (extension may not be loaded)');
  }

  // 5. Performance Check
  console.log('%c⚡ Performance:', 'font-weight: bold;');
  if (window.performance) {
    const perf = window.performance;
    const timing = perf.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    console.log(`  Page Load Time: ${loadTime}ms`);
    console.log(`  DOM Content Loaded: ${timing.domContentLoadedEventEnd - timing.navigationStart}ms`);
    console.log(`  DOM Complete: ${timing.domComplete - timing.navigationStart}ms`);
  }

  // 6. Network Errors
  console.log('%c🌐 Recent Network Errors:', 'font-weight: bold;');
  if (performance.getEntriesByType) {
    const resources = performance.getEntriesByType('resource');
    const errors = resources.filter(r => r.responseStatus >= 400);
    if (errors.length > 0) {
      errors.forEach(err => {
        console.log(`  ❌ ${err.name} - Status: ${err.responseStatus}`);
      });
    } else {
      console.log('  ✅ No recent network errors detected');
    }
  }

  // 7. Supabase Client Check
  console.log('%c🗄️ Supabase:', 'font-weight: bold;');
  console.log('  Check your app code for Supabase client initialization');
  console.log('  Common location: lib/supabase.ts or utils/supabase.ts');

  // 8. Current Page Info
  console.log('%c📄 Current Page:', 'font-weight: bold;');
  console.log('  URL:', window.location.href);
  console.log('  Pathname:', window.location.pathname);
  console.log('  Search:', window.location.search);
  console.log('  Hash:', window.location.hash);

  console.log('='.repeat(50));
  console.log('%c✅ Debug info collected. Share any errors with your AI assistant!', 'color: #10B981; font-weight: bold;');
  
  // Helper function to copy debug info
  window.kelenCopyDebug = async function() {
    const debugInfo = {
      url: window.location.href,
      pathname: window.location.pathname,
      localStorage: Object.fromEntries(Object.entries(localStorage)),
      cookies: document.cookie,
      timestamp: new Date().toISOString()
    };
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
      console.log('✅ Debug info copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  console.log('%c💡 Tip: Run kelenCopyDebug() to copy debug info to clipboard', 'color: #6B7280;');
})();
