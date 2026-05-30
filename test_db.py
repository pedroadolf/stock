from dotenv import load_dotenv
load_dotenv('apps/web/.env')
from supabase import create_client
import os
import traceback

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(url, key)

from apps.backend.src.mcp_handlers import MCPRequestHandler

handler = MCPRequestHandler(supabase)
ports = supabase.table('portafolios').select('id, user_id').execute()
if ports.data:
    pid = ports.data[0]['id']
    uid = ports.data[0]['user_id']
    print(f"Testing port {pid} for user {uid}")
    
    # Run the logic directly without the try-catch to get traceback
    # ... actually let's just patch the handler's try-catch temporarily in Python
    original_get = handler.get_portfolio_status
    
    try:
        handler.get_portfolio_status(pid, uid)
    except Exception as e:
        traceback.print_exc()
        
    # Wait, the method itself has a try-except! So we need to print the traceback INSIDE the method or monkeypatch it.
    
