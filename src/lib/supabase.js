import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://iohltonvumgllknokthn.supabase.co"
const supabaseKey = "sb_publishable_JhLwAueKymr-ZyecrLY0jw_QRjWBYxb"

export const supabase = createClient(supabaseUrl, supabaseKey)