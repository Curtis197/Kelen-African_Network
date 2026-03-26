import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log('Testing recommendations query...');
  const res = await supabase.from('recommendations').select('*').limit(1);
  console.log('Recommendations Result:', JSON.stringify(res, null, 2));

  console.log('\nTesting users query...');
  const res2 = await supabase.from('users').select('*').limit(1);
  console.log('Users Result:', JSON.stringify(res2, null, 2));
}

test();
