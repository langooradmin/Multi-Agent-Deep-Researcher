import os
import json
from typing import List, Dict, Any, Optional
from duckduckgo_search import DDGS
import google.generativeai as genai
from openai import OpenAI
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_core.messages import HumanMessage
from app.prompts import (
    RETRIEVER_QUERY_PROMPT,
    ANALYSIS_PROMPT,
    INSIGHT_PROMPT,
    REPORT_PROMPT
)

def get_llm_client(
    gemini_key: Optional[str] = None, 
    openai_key: Optional[str] = None,
    huggingface_key: Optional[str] = None
):
    # Try arguments first, then environment variables
    hf_key = huggingface_key or os.getenv("HUGGINGFACEHUB_API_TOKEN") or os.getenv("HF_TOKEN")
    g_key = gemini_key or os.getenv("GEMINI_API_KEY")
    o_key = openai_key or os.getenv("OPENAI_API_KEY")
    
    if hf_key:
        return "huggingface", hf_key
    elif g_key:
        genai.configure(api_key=g_key)
        return "gemini", g_key
    elif o_key:
        return "openai", o_key
    return None, None

def call_llm(prompt: str, client_type: str, api_key: str) -> str:
    if client_type == "huggingface":
        # Ensure token is set in environment for huggingface-hub and langchain
        os.environ["HUGGINGFACEHUB_API_TOKEN"] = api_key
        hug = HuggingFaceEndpoint(
            repo_id="meta-llama/Llama-3.1-8B-Instruct",
            task="text-generation",
            huggingfacehub_api_token=api_key,
            temperature=0.7,
            max_new_tokens=1024,
        )
        model = ChatHuggingFace(llm=hug)
        messages = [HumanMessage(content=prompt)]
        response = model.invoke(messages)
        return str(response.content)
    elif client_type == "gemini":
        # Using Gemini 1.5 Flash for fast response
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text
    elif client_type == "openai":
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    else:
        raise ValueError("Unsupported client type")

def search_web(query: str, max_results: int = 4) -> List[Dict[str, str]]:
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            return [
                {
                    "title": r.get("title", ""),
                    "url": r.get("href", ""),
                    "snippet": r.get("body", "")
                }
                for r in results if r.get("href")
            ]
    except Exception as e:
        print(f"Error searching DuckDuckGo for query '{query}': {e}")
        return []

# Agent 1: Retriever
def run_retriever(query: str, client_type: Optional[str], api_key: Optional[str]) -> Dict[str, Any]:
    if not client_type or not api_key:
        # Fallback to direct search query if no LLM config is provided
        search_queries = [query]
    else:
        prompt = RETRIEVER_QUERY_PROMPT.format(query=query)
        llm_output = call_llm(prompt, client_type, api_key)
        search_queries = [q.strip() for q in llm_output.strip().split("\n") if q.strip()]
        # Fallback if parsing failed
        if not search_queries:
            search_queries = [query]
    
    all_sources = []
    seen_urls = set()
    
    for q in search_queries[:3]: # Limit to top 3 search queries
        results = search_web(q, max_results=3)
        for r in results:
            if r["url"] not in seen_urls:
                seen_urls.add(r["url"])
                all_sources.append(r)
                
    # Return formatted source text
    sources_summary = ""
    for idx, src in enumerate(all_sources, 1):
        sources_summary += f"[{idx}] {src['title']}\nURL: {src['url']}\nSnippet: {src['snippet']}\n\n"
        
    return {
        "sources": all_sources,
        "sources_summary": sources_summary,
        "queries_used": search_queries[:3]
    }

# Agent 2: Analysis
def run_analysis(query: str, sources_summary: str, client_type: str, api_key: str) -> str:
    prompt = ANALYSIS_PROMPT.format(query=query, search_results=sources_summary)
    return call_llm(prompt, client_type, api_key)

# Agent 3: Insight
def run_insight(query: str, analysis_output: str, client_type: str, api_key: str) -> str:
    prompt = INSIGHT_PROMPT.format(query=query, analysis_output=analysis_output)
    return call_llm(prompt, client_type, api_key)

# Agent 4: Report Builder
def run_report(query: str, analysis_output: str, insight_output: str, client_type: str, api_key: str) -> str:
    prompt = REPORT_PROMPT.format(
        query=query,
        analysis_output=analysis_output,
        insight_output=insight_output
    )
    return call_llm(prompt, client_type, api_key)
