import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kzzoipibxwszdbtgvvlr.supabase.co'

const supabaseKey = 'sb_publishable_03Rdi_rGllwoTrv2wq0L-A_wMCTcCTL'

export const supabase = createClient(supabaseUrl, supabaseKey)