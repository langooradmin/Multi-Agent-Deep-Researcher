# Multi-Agent AI Deep Researcher

This project is a small research assistant app with a Next.js frontend and a FastAPI backend. It simulates a team of AI agents that work together to:

- retrieve web sources
- analyze the findings
- generate insights
- build a final report

## Project Structure

- frontend: Next.js UI for entering research prompts and viewing results
- backend: FastAPI service that runs the research pipeline and streams progress updates

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- At least one AI provider API key:
  - HUGGINGFACE_API_KEY

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a .env file inside the backend folder with one of the supported keys:

```env
HUGGINGFACEHUB_API_TOKEN=your-key-here
```

Start the API server:

```bash
uvicorn app.main:app --reload
```

The backend will run at http://localhost:8000.

## Frontend Setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## How It Works

1. Enter a research question in the UI.
2. The frontend sends the prompt to the FastAPI backend.
3. The backend runs the agent pipeline and streams updates back to the UI.
4. The final report and source list are displayed in the browser.

## Notes

- The UI can also accept API keys directly in the form, but the backend still needs a valid provider configuration.
- If you are running locally, make sure both the backend and frontend servers are active at the same time.
