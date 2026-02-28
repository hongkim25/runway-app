import os
import base64
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from google import genai
from google.genai import types

# Load environment variables (e.g. GEMINI_API_KEY)
load_dotenv()

app = FastAPI()

# Enable CORS for local Next.js frontend (typically http://localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema
class RunwayRequest(BaseModel):
    goal: str
    designer: str
    color: str
    vibe: str
    target_date: str
    inspiration_image_base64: str

# Schema for the JSON array of 4 objects
class RoadmapStage(BaseModel):
    target_percentage: int
    milestone_task: str
    clothing_item: str

# Final response schema
class RunwayResponse(BaseModel):
    roadmap: list[RoadmapStage]
    images: list[str]

# Initialize GenAI Client
client = genai.Client()

@app.post("/api/generate-runway", response_model=RunwayResponse)
async def generate_runway(request: RunwayRequest):
    try:
        # 1. Parse Image Base64 (strip potential data URL prefix)
        b64_data = request.inspiration_image_base64
        if "," in b64_data:
            b64_data = b64_data.split(",")[1]
            
        try:
            image_bytes = base64.b64decode(b64_data)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image base64: {str(e)}")
            
        # Step 2: The Creative Director (Gemini 2.5 Flash for Max Speed)
        system_instruction = (
            f"You are both a strict life coach and a luxury fashion creative director. "
            f"Rule 1 (The Grind): Look at the user's goal: {request.goal}, targeting {request.target_date}. Break this long, difficult mission down into 4 sequential, highly motivating, actionable milestones (milestone_task). "
            f"Rule 2 (The Reward): Look at the designer: {request.designer}, the color palette: {request.color}, and the aesthetic vibe: {request.vibe}. "
            f"CRITICAL MULTIMODAL INSTRUCTION: The user has uploaded an inspiration image. You MUST actively analyze this image and incorporate its textures, shapes, silhouettes, or thematic concepts into your 4-piece high-fashion outfit design. "
            f"Rule 3 (The Mapping): Map one luxury clothing item (clothing_item) to each milestone as a visual reward for completing that stage of the journey. DO NOT make the clothing thematic to the goal. A tech job goal should still yield runway-ready luxury fashion, not office wear. "
            f"CRITICAL: You MUST generate 4 COMPLETELY DISTINCT clothing items (e.g., 1 pair of shoes, 1 pair of pants/skirt, 1 shirt/jacket, 1 accessory/bag). NEVER output duplicate item types like two pairs of trousers. "
            "Return the 4 stages as a JSON array containing target_percentage (25, 50, 75, 100), milestone_task, and clothing_item."
        )
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                system_instruction
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=list[RoadmapStage],
                temperature=0.7
            )
        )
        
        # Parse the JSON response
        try:
            roadmap_data = json.loads(response.text)
            stages = [RoadmapStage(**stage) for stage in roadmap_data]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to parse Roadmap JSON: {str(e)}")

        # Enforce exactly 4 stages if needed, or just iterate through what was generated
        
        # Step 3: The Virtual Artist (Nano Banana 2 / Image model)
        # Run all 4 image generation calls in parallel using asyncio to dramatically speed up response time
        import asyncio
        
        async def generate_stage_image(stage_item: str) -> str:
            image_prompt = (
                f"High-end luxury product photography. A {stage_item} "
                f"in the style of {request.designer} and {request.color}. "
                "Minimalist studio lighting, 4k, white background, high fashion editorial style."
            )
            try:
                # To run the synchronous SDK call without blocking the async event loop:
                loop = asyncio.get_event_loop()
                def make_call():
                    return client.models.generate_content(
                        model='gemini-2.5-flash-image',
                        contents=image_prompt
                    )
                
                img_response = await loop.run_in_executor(None, make_call)
                
                # Convert response back to Base64
                parts = img_response.candidates[0].content.parts
                images = [p for p in parts if getattr(p, 'inline_data', None)]
                
                if images:
                    img_bytes = images[0].inline_data.data
                    img_b64 = base64.b64encode(img_bytes).decode('utf-8')
                    return f"data:image/jpeg;base64,{img_b64}"
            except Exception as e:
                print(f"Image generation failed for {stage_item}: {e}")
                
            return "" # Fallback if no image returned or if errored
            
        # Execute all 4 queries concurrently
        generate_tasks = [generate_stage_image(stage.clothing_item) for stage in stages]
        generated_images_b64 = await asyncio.gather(*generate_tasks)
                
        # Step 4: The Final Payload
        return RunwayResponse(
            roadmap=stages,
            images=generated_images_b64
        )
        
    except HTTPException as http_e:
        raise http_e
    except Exception as e:
        import traceback
        traceback.print_exc() # This will print the exact python crash to your terminal
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Start the local server
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
