import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client()
print("Available Video Models:")
for m in client.models.list():
    if 'veo' in m.name:
        print(m.name)
