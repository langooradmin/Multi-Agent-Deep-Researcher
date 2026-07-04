"use client";

import React, { useState } from "react";

interface ReportViewerProps {
  report: string;
}

export default function ReportViewer({ report }: ReportViewerProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy report: ", err);
    }
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const renderMarkdown = (rawText: string) => {
    if (!rawText) return null;

    const lines = rawText.split("\n");
    return lines.map((line, index) => {
      // H1 Header
      if (line.startsWith("# ")) {
        return (
          <h1
            key={index}
            className="text-2xl md:text-3xl font-extrabold text-slate-50 mt-6 mb-4 border-b border-slate-800 pb-3"
          >
            {line.replace("# ", "")}
          </h1>
        );
      }
      // H2 Header
      if (line.startsWith("## ")) {
        return (
          <h2
            key={index}
            className="text-lg md:text-xl font-bold text-slate-100 mt-5 mb-3 flex items-center border-l-2 border-blue-500 pl-2.5"
          >
            {line.replace("## ", "")}
          </h2>
        );
      }
      // H3 Header
      if (line.startsWith("### ")) {
        return (
          <h3 key={index} className="text-md md:text-lg font-semibold text-slate-200 mt-4 mb-2">
            {line.replace("### ", "")}
          </h3>
        );
      }
      // Unordered Lists
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const cleanLine = line.trim().replace(/^[-*]\s+/, "");
        return (
          <li key={index} className="list-disc list-inside ml-4 mb-2 text-slate-300 text-sm leading-relaxed">
            {parseBoldText(cleanLine)}
          </li>
        );
      }
      // Empty Lines
      if (!line.trim()) {
        return <div key={index} className="h-2"></div>;
      }
      // Normal Paragraph
      return (
        <p key={index} className="mb-3 text-slate-350 text-sm leading-relaxed">
          {parseBoldText(line)}
        </p>
      );
    });
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md">
      <div className="bg-slate-900/80 px-5 py-3 border-b border-slate-800 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Final Research Report
        </h2>
        <button
          onClick={copyToClipboard}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            copied
              ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50"
              : "bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750"
          }`}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              Copy Report
            </>
          )}
        </button>
      </div>
      <div className="p-6 md:p-8 max-h-[600px] overflow-y-auto prose prose-invert max-w-none">
        {renderMarkdown(report)}
      </div>
    </div>
  );
}
