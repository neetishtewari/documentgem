import sys
import os

# Ensure we are in backend dir
sys.path.append(os.getcwd())

try:
    print("Attempting to import app.main...")
    from app.main import app
    print("Import SUCCESS!")
except Exception as e:
    print("Import FAILED!")
    print(e)
    import traceback
    traceback.print_exc()
