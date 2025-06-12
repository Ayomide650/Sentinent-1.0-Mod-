const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vapfjjftxthhdygctlaq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcGZqamZ0eHRoaGR5Z2N0bGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDI3NjUsImV4cCI6MjA2NTMxODc2NX0.6p9CwXnyJA2Qjas52wwA9ObD--be5V48udlkpgwSdY4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
