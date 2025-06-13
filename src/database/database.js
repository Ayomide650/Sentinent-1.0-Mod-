const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.DATABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL) {
  throw new Error('supabaseUrl is required. Set DATABASE_URL in your environment variables.');
}
if (!SUPABASE_KEY) {
  throw new Error('supabaseKey is required. Set SUPABASE_KEY in your environment variables.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
