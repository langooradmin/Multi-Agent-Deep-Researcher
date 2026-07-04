"use client";

import React from "react";

export interface Agent {
  name: string;
  role: string;
  status: "pending" | "running" | "done" | "error";
  output: string;
  error?: string;
}

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const getStatusBadge = () => {
    switch (agent.status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            Pending
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-700/50 animate-pulse">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-400 animate-ping"></span>
            Running
          </span>
        );
      case "done":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-800/50">
            Done
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950/50 text-rose-400 border border-rose-850/50">
            Error
          </span>
        );
    }
  };

  const getBorderColor = () => {
    switch (agent.status) {
      case "running":
        return "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-slate-900/60";
      case "done":
        return "border-emerald-500/40 bg-slate-900/30";
      case "error":
        return "border-rose-500/50 bg-rose-950/5";
      default:
        return "border-slate-850 bg-slate-950/20";
    }
  };

  return (
    <div
      className={`p-5 rounded-xl border backdrop-blur-md transition-all duration-300 flex flex-col justify-between h-full ${getBorderColor()}`}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg text-slate-100">{agent.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{agent.role}</p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Display Agent Action Log */}
        <div className="mt-4 bg-black/45 rounded-lg p-3 border border-slate-800/60 font-mono text-xs text-slate-300 min-h-[80px] max-h-[140px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
          {agent.status === "pending" && (
            <span className="text-slate-550 italic">Awaiting previous steps...</span>
          )}
          {agent.status === "running" && !agent.output && (
            <span className="text-blue-400 animate-pulse">Agent is thinking...</span>
          )}
          {agent.output && <span>{agent.output}</span>}
          {agent.status === "error" && agent.error && (
            <span className="text-rose-400">{agent.error}</span>
          )}
        </div>
      </div>
    </div>
  );
}
