require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function test(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  const text = await res.text();
  console.log(`${table} STATUS:`, res.status);
  console.log(`${table} BODY:`, text);
}

async function run() {
  await test('recommendations');
  await test('users');
  await test('signals');
  await test('reviews');
}

run();
