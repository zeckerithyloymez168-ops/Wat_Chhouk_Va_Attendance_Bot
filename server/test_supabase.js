import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

console.log("Testing Supabase URL:", SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
  const { data: monks, error: monkErr } = await supabase.from('monks').select('*');
  if (monkErr) {
    console.error("❌ Monks Table Error:", monkErr.message);
  } else {
    console.log("✅ Monks Table Connected! Monks count:", monks.length);
  }

  const { data: attendances, error: attErr } = await supabase.from('attendances').select('*');
  if (attErr) {
    console.error("❌ Attendances Table Error:", attErr.message);
  } else {
    console.log("✅ Attendances Table Connected! Count:", attendances.length);
  }

  const { data: leaves, error: leaveErr } = await supabase.from('leave_requests').select('*');
  if (leaveErr) {
    console.error("❌ Leave Requests Table Error:", leaveErr.message);
  } else {
    console.log("✅ Leave Requests Table Connected! Count:", leaves.length);
  }
}

checkTables();
