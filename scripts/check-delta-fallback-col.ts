import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
s.from("brief_sends").select("delta_fallback").limit(1).then(({ data, error }) => {
  if (error) console.log("delta_fallback column: MISSING —", error.message);
  else console.log("delta_fallback column: EXISTS, sample:", JSON.stringify(data));
});
