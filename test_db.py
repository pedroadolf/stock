from dotenv import load_dotenv
load_dotenv('apps/web/.env')
from supabase import create_client
import os
url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(url, key)
from apps.backend.src.mcp_handlers import MCPRequestHandler
handler = MCPRequestHandler(supabase)
ports = supabase.table('portafolios').select('id, user_id').execute()
if ports.data:
    pid = ports.data[0]['id']
    uid = ports.data[0]['user_id']
    handler.get_portfolio_status(pid, uid)
