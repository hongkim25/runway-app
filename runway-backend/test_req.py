import requests
import time
import base64

# Base64 1x1 pixel JPEG
b64_img = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="

start = time.time()
try:
    print("Sending request...")
    res = requests.post("http://localhost:8000/api/generate-runway", json={
        "goal": "Graduation",
        "target_date": "2026-04-30",
        "designer": "Dior",
        "color": "Black",
        "vibe": "Minimalist",
        "inspiration_image_base64": b64_img
    }, timeout=120)
    print(f"Status Code: {res.status_code}")
    print(f"Time Taken: {time.time() - start:.2f}s")
    if res.status_code != 200:
        print("Response:", res.text)
    else:
        print("Success! Keys:", res.json().keys())
except Exception as e:
    print(f"Fail: {e}")
