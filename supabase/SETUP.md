# Supabase setup — jaffar-demo

**Project ref:** `kigordfjtbjsxlrdvafc`  
**Project URL:** `https://kigordfjtbjsxlrdvafc.supabase.co`  
**Dashboard:** https://supabase.com/dashboard/project/kigordfjtbjsxlrdvafc

## 1. Séma futtatása (SQL Editor)

1. Nyisd meg: https://supabase.com/dashboard/project/kigordfjtbjsxlrdvafc/sql/new  
2. Másold be a teljes `schema.sql` tartalmát  
3. **Run** (Ctrl+Enter)

## 2. API kulcsok

Settings → API: https://supabase.com/dashboard/project/kigordfjtbjsxlrdvafc/settings/api

Másold ki (NE commitold a repóba):
- **Project URL** → `SUPABASE_URL`
- **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Ellenőrzés

Table Editor: https://supabase.com/dashboard/project/kigordfjtbjsxlrdvafc/editor  

Látnod kell: `conversations`, `messages`, `leads`
