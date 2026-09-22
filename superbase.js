import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://jffvvgyvzckfsvwnqgms.supabase.co";
const supabaseKey = "sb_publishable_2tT9peZp603olZJ3Hf_nVQ_SJ91AJ89";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Expose globally so plain scripts (like script.js) can access window.supabaseClient
if (typeof window !== "undefined") {
    window.supabaseClient = supabase;
}