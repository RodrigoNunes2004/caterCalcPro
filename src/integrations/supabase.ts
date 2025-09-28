import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Supabase project credentials
const supabaseUrl = "https://pwesvwezjkldlkhzsqfz.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3ZXN2d2V6amtsZGxraHpzcWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MTgzNzMsImV4cCI6MjA3NDA5NDM3M30.2yxATbYYcooZfJz2EvyytZFXaz_sF4CJ46JcLCYKb5M";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
