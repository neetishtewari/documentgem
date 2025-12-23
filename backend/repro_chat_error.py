import requests
import json
import sys

# Adjust base URL if needed
BASE_URL = "http://localhost:8000"

def test_chat():
    print("1. Creating Session...")
    try:
        # Assuming we need auth, but for local dev with no auth middleware enforcement on this route or mock user?
        # The router uses `depends(get_current_user)`.
        # I need to know how to simulate auth or if I can bypass.
        # Check backend/app/dependencies/auth.py or similar?
        # Or just try hitting it, maybe there's a default dev user or I can grab a token.
        # For now, let's assume I need a headers.
        
        # Actually, the easiest way might be to bypass auth for debugging OR use the token from the browser?
        # Or just mock the dependency in the main app if I was running a test.
        # Since the server is running, I must hit it as a client.
        
        # Let's try to just hit it. If 401, I'll know it's auth.
        # But the user said 500. So auth passed.
        pass
    except Exception as e:
        print(e)

    # I'll rely on the server log outputs/traceback which hopefully appear in the terminal I can't see?
    # No, I can't see the running terminal.
    # But if I make a request, the response body of a 500 in FastAPI debug mode usually contains the traceback!
    
    # I need a valid session ID.
    # Ill verify if I can list sessions.
    # I need a generic token or similar.
    
    # Wait, I don't have a token.
    # The `debug_rag.py` worked because it imported the service functions directly.
    # Ideally I should write a script that imports `send_message` and runs it with a mock user.
    # That captures the traceback locally!
    pass

import asyncio
from app.routers.chat import send_message, SendMessageRequest, get_current_user
from app.services.supabase import supabase
from unittest.mock import MagicMock

async def debug_function_call():
    # Mock User
    mock_user = MagicMock()
    mock_user.id = "1b8e4635-aae7-4e9d-9543-b2ff1a1820bd" # The one from before
    
    # 1. Create a session manualy in DB for testing
    print("Creating test session in DB...")
    res = supabase.table("chat_sessions").insert({"user_id": mock_user.id, "title": "Debug Chat"}).execute()
    session_id = res.data[0]['id']
    print(f"Session ID: {session_id}")
    
    # 2. Add some history manually
    supabase.table("chat_messages").insert([
        {"session_id": session_id, "role": "user", "content": "Hello"},
        {"session_id": session_id, "role": "assistant", "content": "Hi there!"}
    ]).execute()
    
    # 3. Call send_message directly
    print("\nCalling send_message...")
    req = SendMessageRequest(content="are any of them overdue?")
    
    try:
        response = await send_message(session_id, req, mock_user)
        print("Success!")
        print(response)
    except Exception as e:
        print("\nCRASH DETECTED!")
        print("-" * 30)
        import traceback
        traceback.print_exc()
        print("-" * 30)

if __name__ == "__main__":
    asyncio.run(debug_function_call())
