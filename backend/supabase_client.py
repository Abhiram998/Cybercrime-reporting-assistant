import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("WARNING: SUPABASE_URL or SUPABASE_SERVICE_KEY not set in environment variables.")

supabase: Client = create_client(url, key) if url and key else None
