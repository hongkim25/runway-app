import os
import time
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client()

print("Testing veo-3.1-fast-generate-preview for 5 seconds...")
start = time.time()
try:
    operation = client.models.generate_videos(
        model='veo-3.1-fast-generate-preview',
        prompt='A fashion model walking down a runway',
    )
    print(f"Initial operation requested in {time.time() - start:.2f}s")
    
    # Wait for completion
    while not operation.done:
        print(".", end="", flush=True)
        time.sleep(5)
        operation = client.operations.get(operation.name)
        
    print(f"\nDone! Total time: {time.time() - start:.2f}s")
except Exception as e:
    import traceback
    traceback.print_exc()
