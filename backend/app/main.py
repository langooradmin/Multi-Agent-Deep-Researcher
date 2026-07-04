import json
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

# Load env variables from a .env file if it exists
load_dotenv()

from app.services import (
    get_llm_client,
    run_retriever,
    run_analysis,
    run_insight,
    run_report
)

app = FastAPI(title="Multi-Agent AI Deep Researcher API")

# Enable CORS for the local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In a production app restrict this, but perfect for a hackathon MVP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResearchRequest(BaseModel):
    query: str
    gemini_key: Optional[str] = None
    openai_key: Optional[str] = None
    huggingface_key: Optional[str] = None

@app.post("/api/run-research")
async def run_research_endpoint(request: ResearchRequest):
    async def event_generator():
        query = request.query
        gemini_key = request.gemini_key
        openai_key = request.openai_key
        huggingface_key = request.huggingface_key
        
        # 1. Initialize client
        client_type, api_key = get_llm_client(gemini_key, openai_key, huggingface_key)
        
        # Start Retriever
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'Retriever Agent'})}\n\n"
        await asyncio.sleep(0.5) # Short sleep to make the transition clear in UI
        
        try:
            # We run the retriever step
            # Note: duckduckgo_search is synchronous, so we run it in an executor to avoid blocking the event loop
            loop = asyncio.get_running_loop()
            retriever_res = await loop.run_in_executor(
                None, run_retriever, query, client_type, api_key
            )
            sources = retriever_res["sources"]
            sources_summary = retriever_res["sources_summary"]
            queries = retriever_res["queries_used"]
            
            yield f"data: {json.dumps({
                'event': 'agent_done', 
                'agent': 'Retriever Agent', 
                'output': f'Retrieved {len(sources)} sources using search queries:\n' + '\n'.join([f'- \"{q}\"' for q in queries])
            })}\n\n"
            await asyncio.sleep(0.5)
        except Exception as e:
            yield f"data: {json.dumps({'event': 'agent_error', 'agent': 'Retriever Agent', 'error': str(e)})}\n\n"
            return

        if not client_type or not api_key:
            yield f"data: {json.dumps({'event': 'error', 'message': 'No AI API Key provided. Please configure GEMINI_API_KEY or OPENAI_API_KEY.'})}\n\n"
            return

        # 2. Analysis Agent
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'Analysis Agent'})}\n\n"
        await asyncio.sleep(0.5)
        try:
            loop = asyncio.get_running_loop()
            analysis_output = await loop.run_in_executor(
                None, run_analysis, query, sources_summary, client_type, api_key
            )
            yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'Analysis Agent', 'output': analysis_output})}\n\n"
            await asyncio.sleep(0.5)
        except Exception as e:
            yield f"data: {json.dumps({'event': 'agent_error', 'agent': 'Analysis Agent', 'error': str(e)})}\n\n"
            return

        # 3. Insight Agent
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'Insight Agent'})}\n\n"
        await asyncio.sleep(0.5)
        try:
            loop = asyncio.get_running_loop()
            insight_output = await loop.run_in_executor(
                None, run_insight, query, analysis_output, client_type, api_key
            )
            yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'Insight Agent', 'output': insight_output})}\n\n"
            await asyncio.sleep(0.5)
        except Exception as e:
            yield f"data: {json.dumps({'event': 'agent_error', 'agent': 'Insight Agent', 'error': str(e)})}\n\n"
            return

        # 4. Report Builder Agent
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'Report Builder Agent'})}\n\n"
        await asyncio.sleep(0.5)
        try:
            loop = asyncio.get_running_loop()
            report_output = await loop.run_in_executor(
                None, run_report, query, analysis_output, insight_output, client_type, api_key
            )
            yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'Report Builder Agent', 'output': 'Final report compiled successfully.'})}\n\n"
            await asyncio.sleep(0.5)
        except Exception as e:
            yield f"data: {json.dumps({'event': 'agent_error', 'agent': 'Report Builder Agent', 'error': str(e)})}\n\n"
            return

        # Complete response
        yield f"data: {json.dumps({'event': 'complete', 'report': report_output, 'sources': sources})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/health")
def health():
    return {"status": "ok"}
