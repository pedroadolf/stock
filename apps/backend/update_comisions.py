import os
from supabase import create_client

url = "http://antigravity-supabase-0dee18-193-43-134-161.traefik.me"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3ODAwODIzNDksImV4cCI6MTg5MzQ1NjAwMH0.1RbXdvrUo4QF1S5bsWRyUbd-BgHErdTXPZzVXw1lnkU"
supabase = create_client(url, key)

res = supabase.table("instrumentos_metadata").select("ticker, comision").execute()
print("Current DB state:")
for r in res.data:
    print(f"{r['ticker']}: {r.get('comision')}")

updates = [
    {"ticker": "VXUS", "comision": "0.07%"},
    {"ticker": "AVUV", "comision": "0.25%"},
    {"ticker": "SMH", "comision": "0.35%"},
    {"ticker": "VTG", "comision": "0.10%"},
    {"ticker": "FHLC", "comision": "0.08%"},
    {"ticker": "ICLN", "comision": "0.41%"}
]

print("\nUpdating...")
for u in updates:
    supabase.table("instrumentos_metadata").update({"comision": u["comision"]}).eq("ticker", u["ticker"]).execute()
    print(f"Updated {u['ticker']} to {u['comision']}")
    
print("Done!")
