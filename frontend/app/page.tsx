"use client";

import React, { useState } from "react";
import AgentCard, { Agent } from "../components/AgentCard";
import ReportViewer from "../components/ReportViewer";

const INITIAL_AGENTS: Agent[] = [
  {
    name: "Retriever Agent",
    role: "Web Search & Source Collector",
    status: "pending",
    output: "",
  },
  {
    name: "Analysis Agent",
    role: "Fact Synthesis & Contradiction Resolver",
    status: "pending",
    output: "",
  },
  {
    name: "Insight Agent",
    role: "Trend Extractor & Strategist",
    status: "pending",
    output: "",
  },
  {
    name: "Report Builder Agent",
    role: "Markdown Report Editor",
    status: "pending",
    output: "",
  },
];

const SUGGESTED_PROMPTS = [
  "How are AI agents changing fintech customer support?",
  "What are the risks and benefits of AI copilots in healthcare?",
  "What are the latest trends in AI-powered developer tools?",
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [huggingfaceKey, setHuggingfaceKey] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [report, setReport] = useState("");
  const [sources, setSources] = useState<Array<{ title: string; url: string; snippet: string }>>([]);

  const handleRunResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Reset states
    setStatus("running");
    setErrorMsg("");
    setReport("");
    setSources([]);
    setAgents(INITIAL_AGENTS.map((a) => ({ ...a, status: "pending", output: "" })));

    try {
      const response = await fetch("http://localhost:8000/api/run-research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          gemini_key: geminiKey || undefined,
          openai_key: openaiKey || undefined,
          huggingface_key: huggingfaceKey || undefined,
        }),
      });
      // ... (omitting lines between 76 and 177 for context match)
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);

              if (data.event === "agent_start") {
                setAgents((prev) =>
                  prev.map((a) =>
                    a.name === data.agent ? { ...a, status: "running" } : a
                  )
                );
              } else if (data.event === "agent_done") {
                setAgents((prev) =>
                  prev.map((a) =>
                    a.name === data.agent ? { ...a, status: "done", output: data.output } : a
                  )
                );
              } else if (data.event === "agent_error") {
                setAgents((prev) =>
                  prev.map((a) =>
                    a.name === data.agent ? { ...a, status: "error", error: data.error } : a
                  )
                );
                setStatus("error");
                setErrorMsg(`Error in ${data.agent}: ${data.error}`);
              } else if (data.event === "error") {
                setStatus("error");
                setErrorMsg(data.message);
              } else if (data.event === "complete") {
                setReport(data.report);
                setSources(data.sources);
                setStatus("done");
              }
            } catch (err) {
              console.error("Error parsing JSON chunk:", err);
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "An unexpected connection error occurred.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-blue-950/45 border border-blue-900/60 mb-4 animate-fade-in">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>

          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-50 via-slate-200 to-blue-400 bg-clip-text text-transparent">
            Multi-Agent AI Deep Researcher
          </h1>
          <p className="text-slate-400 mt-3 text-sm md:text-base max-w-xl mx-auto font-medium">
            Simulate a dedicated team of AI agents executing search, synthesis, and analysis to build a detailed report.
          </p>
        </div>


        {/* Prompt Input Form */}
        <form onSubmit={handleRunResearch} className="mb-8">
          <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 backdrop-blur-md focus-within:border-blue-500/80 transition-all">
            <textarea
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to research? (e.g. Current trends in Rust for embedded systems...)"
              className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-slate-200 placeholder-slate-500 text-sm md:text-base resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleRunResearch(e);
                }
              }}
            />
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 border-t border-slate-850 mt-3 pt-3">
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setQuery(p)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800/80 hover:bg-slate-850 hover:text-slate-100 transition-all text-slate-400"
                  >
                    💡 {p.length > 32 ? p.slice(0, 32) + "..." : p}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={status === "running" || !query.trim()}
                className={`w-full md:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${status === "running" || !query.trim()
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                  }`}
              >
                {status === "running" ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Researching...
                  </>
                ) : (
                  <>
                    <span>Run Deep Research</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Global Error Display */}
        {status === "error" && errorMsg && (
          <div className="mb-8 p-4 rounded-xl bg-rose-950/30 border border-rose-800 text-rose-350 text-sm flex gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold">Research Execution Error</p>
              <p className="mt-1 opacity-90">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Agent workflow grids */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {agents.map((agent, i) => (
            <AgentCard key={i} agent={agent} />
          ))}
        </div>

        {/* Results layout */}
        {status === "done" && report && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Report */}
            <div className="lg:col-span-2">
              <ReportViewer report={report} />
            </div>

            {/* Sources List */}
            <div className="space-y-4">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">
                  Sources Gathered ({sources.length})
                </h3>
                {sources.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No external sources logged.</p>
                ) : (
                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                    {sources.map((s, i) => (
                      <div key={i} className="p-3 bg-black/35 rounded-lg border border-slate-850 hover:border-blue-500/40 transition-all">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-xs text-blue-400 hover:underline line-clamp-1 flex items-center gap-1"
                        >
                          {s.title || `Source [${i + 1}]`}
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <p className="text-[10px] text-slate-450 mt-0.5 line-clamp-1">{s.url}</p>
                        {s.snippet && (
                          <p className="text-[11px] text-slate-350 mt-1.5 line-clamp-2 italic leading-relaxed">
                            "{s.snippet}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
