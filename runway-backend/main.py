import os
import base64
import json
import uuid
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

# Final response schema for generation
class RunwayResponse(BaseModel):
    campaign_id: str

# Schema for campaign storage and retrieval
class CampaignData(BaseModel):
    roadmap: list[RoadmapStage]
    images: list[str]

# Ensure campaigns directory exists
os.makedirs("campaigns", exist_ok=True)

# Initialize GenAI Client
client = genai.Client()

@app.post("/api/generate-runway", response_model=RunwayResponse)
async def generate_runway(request: RunwayRequest):
    try:
        # 1. Parse Image Base64 (parse mime type and strip data URL prefix)
        b64_data = request.inspiration_image_base64
        mime_type = "image/jpeg" # fallback
        if "data:" in b64_data and ";" in b64_data:
            mime_type = b64_data.split(";")[0].split(":")[1]
            b64_data = b64_data.split(",")[1]
        elif "," in b64_data:
            b64_data = b64_data.split(",")[1]
            
        try:
            image_bytes = base64.b64decode(b64_data)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image base64: {str(e)}")
            
        # Step 2: The Creative Director (Gemini 2.5 Flash for Max Speed)
        system_instruction = (
            f"You are both a strict life coach and a luxury fashion creative director. "
            f"Rule 1 (The Grind): Look at the user's goal: {request.goal}, targeting {request.target_date}. Break this long, difficult mission down into 4 sequential, highly motivating, actionable milestones (milestone_task). "
            f"CRITICAL: Do NOT mention any specific dates, years, or timeframes in the milestone_task text. It must be timeless advice. "
            f"Rule 2 (The Reward): The aesthetic vibe is {request.vibe} and the color palette is {request.color}. "
            f"CRITICAL MULTIMODAL INSTRUCTION: The user has uploaded an inspiration image. You MUST actively analyze this image and incorporate its textures, shapes, silhouettes, or thematic concepts into your 4-piece high-fashion outfit design. "
            f"Rule 3 (The Mapping): Map one luxury clothing item (clothing_item) to each milestone as a visual reward for completing that stage of the journey. DO NOT make the clothing thematic to the goal. A tech job goal should still yield runway-ready luxury fashion, not office wear. "
            f"CRITICAL: Do NOT mention the specific brand '{request.designer}' in your output text. Describe the style, but omit the brand name to avoid copyright issues. "
            f"CRITICAL: You MUST generate 4 COMPLETELY DISTINCT clothing items (e.g., 1 pair of shoes, 1 pair of pants/skirt, 1 shirt/jacket, 1 accessory/bag). NEVER output duplicate item types like two pairs of trousers. "
            "Return the 4 stages as a JSON array containing target_percentage (25, 50, 75, 100), milestone_task, and clothing_item."
        )
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
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
            # Check for safety blocks or empty responses before calling .text
            if not response.candidates or not response.candidates[0].content.parts:
                raise ValueError(f"Gemini returned no content. Possible safety block: {response.candidates[0].finish_reason if response.candidates else 'Unknown'}")
                
            roadmap_data = json.loads(response.text)
            stages = [RoadmapStage(**stage) for stage in roadmap_data]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to parse Roadmap JSON. Was the prompt blocked?: {str(e)}")

        # Enforce exactly 4 stages if needed, or just iterate through what was generated
        
        # Step 3: The Virtual Artist (Nano Banana 2 / Image model)
        # Run all 4 image generation calls in parallel using asyncio to dramatically speed up response time
        import asyncio
        
        async def generate_stage_image(stage_idx: int, stage_item: str) -> str:
            image_prompt = (
                f"A high-end, isolated editorial product photograph of EXACTLY ONE clothing item: {stage_item}. "
                f"The aesthetic style is inspired by '{request.vibe}' and the color palette is {request.color}. "
                "CRITICAL INSTRUCTION: This must be a FLAT LAY or floating item on a PURE, STARK WHITE (#FFFFFF) background. "
                "DO NOT include any people, models, faces, bodies, or mannequins. "
                "DO NOT include any backgrounds, shadows, or props. ONLY the isolated item of clothing itself on pure white."
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
        generate_tasks = [generate_stage_image(idx, stage.clothing_item) for idx, stage in enumerate(stages)]
        generated_images_b64 = await asyncio.gather(*generate_tasks)
                
        # Step 4: The Final Payload - Save to Disk instead of hitting 5MB browser localStorage limits
        campaign_id = str(uuid.uuid4())
        
        # We need to extract the dicts from Pydantic models so json.dump works nicely
        campaign_data = {
            "roadmap": [s.model_dump() if hasattr(s, 'model_dump') else s.dict() for s in stages],
            "images": generated_images_b64,
            "vibe": request.vibe,
            "color": request.color,
            "designer": request.designer
        }
        
        with open(f"campaigns/{campaign_id}.json", "w") as f:
            json.dump(campaign_data, f)
                
        # Return just the pointer ID to the frontend
        return RunwayResponse(campaign_id=campaign_id)
        
    except HTTPException as http_e:
        raise http_e
    except Exception as e:
        import traceback
        traceback.print_exc() # This will print the exact python crash to your terminal
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-final-look")
async def generate_final_look(req: dict):
    campaign_id = req.get("campaign_id")
    file_path = f"campaigns/{campaign_id}.json"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    with open(file_path, "r") as f:
        data = json.load(f)
        
    vibe = data.get("vibe", "High Fashion")
    color = data.get("color", "Monochrome")
    items = [stage["clothing_item"] for stage in data.get("roadmap", [])]
    items_str = ", ".join(items)
    
    image_prompt = (
        f"A high-end, full-body editorial fashion photograph of a single runway model wearing a cohesive outfit. "
        f"The outfit MUST flawlessly incorporate these 4 specific items together: {items_str}. "
        f"The aesthetic style is inspired by '{vibe}' and the color palette is {color}. "
        "High-end studio lighting, cinematic, photorealistic, confident pose on a runway. Do NOT include logos. Just the model in the clothing."
    )
    
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        def make_call():
            return client.models.generate_content(
                model='gemini-2.5-flash-image',
                contents=image_prompt
            )
        img_response = await loop.run_in_executor(None, make_call)
        parts = img_response.candidates[0].content.parts
        images = [p for p in parts if getattr(p, 'inline_data', None)]
        if images:
             img_bytes = images[0].inline_data.data
             img_b64 = base64.b64encode(img_bytes).decode('utf-8')
             return {"image": f"data:image/jpeg;base64,{img_b64}"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate final look: {str(e)}")
        
    return {"image": ""}

@app.get("/api/campaign/{campaign_id}")
async def get_campaign(campaign_id: str):
    file_path = f"campaigns/{campaign_id}.json"
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Campaign not found")

if __name__ == "__main__":
    import uvicorn
    # Start the local server
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
