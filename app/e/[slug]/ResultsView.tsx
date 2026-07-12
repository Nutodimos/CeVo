"use client";
import toast from 'react-hot-toast';

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Download, Share2, CheckCircle2 } from "lucide-react";

type ResultsData = {
  electionName: string;
  slug: string;
  openedAt: string;
  closedAt: string;
  totalRegistered: number;
  totalVoted: number;
  certifiedAt?: string;
  positions: {
    title: string;
    candidates: {
      name: string;
      votes: number;
      isWinner: boolean;
    }[];
  }[];
};

export default function ResultsView({ data }: { data: ResultsData }) {
  const graphicRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleShare = async () => {
    if (!graphicRef.current) return;
    setIsCapturing(true);
    
    try {
      const canvas = await html2canvas(graphicRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = imgData;
      a.download = `${data.slug}-results.png`;
      a.click();
    } catch (err) {
      console.error("Failed to generate image:", err);
      toast.error("Failed to generate image.");
    } finally {
      setIsCapturing(false);
    }
  };

  const percent = data.totalRegistered > 0 ? Math.round((data.totalVoted / data.totalRegistered) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Action Bar */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-surface-900">Official Results</h2>
          <p className="text-sm text-surface-500">The results have been certified and published.</p>
        </div>
        <button 
          onClick={handleShare}
          disabled={isCapturing}
          className="btn-primary py-2 px-4 shrink-0 flex items-center gap-2"
        >
          {isCapturing ? "Generating..." : <><Share2 className="w-4 h-4" /> Share Results (PNG)</>}
        </button>
      </div>

      {/* Hidden Graphic for html2canvas (Tall portrait ~1080x1350 equivalent) */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div 
          ref={graphicRef} 
          className="bg-white p-12 text-surface-900 flex flex-col"
          style={{ width: "1080px", minHeight: "1350px", fontFamily: "sans-serif" }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black mb-4 text-[#F26522]">{data.electionName}</h1>
            <h2 className="text-3xl font-bold text-[#557C99]">Official Election Results</h2>
            <p className="text-xl text-surface-500 mt-4">Voting closed: {data.closedAt}</p>
          </div>

          {/* Winners List */}
          <div className="grid grid-cols-2 gap-8 flex-1 content-start">
            {data.positions.map((pos) => {
              const winners = pos.candidates.filter(c => c.isWinner);
              return (
                <div key={pos.title} className="bg-surface-50 p-6 rounded-2xl border-l-8 border-[#557C99]">
                  <h3 className="text-2xl font-bold text-surface-500 uppercase tracking-wider mb-4">{pos.title}</h3>
                  {winners.length > 0 ? winners.map((w, i) => (
                    <div key={i} className="mb-3 last:mb-0">
                      <div className="text-3xl font-black text-surface-900 leading-none">{w.name}</div>
                      <div className="text-xl font-bold text-emerald-600 mt-2">{w.votes} Votes</div>
                    </div>
                  )) : (
                    <div className="text-2xl font-medium text-surface-400">No votes cast</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Turnout */}
          <div className="mt-12 pt-8 border-t-2 border-surface-200 flex justify-between items-center text-2xl font-medium text-surface-600">
            <div>Turnout: <strong className="text-surface-900">{data.totalVoted}</strong> / {data.totalRegistered} ({percent}%)</div>
            <div className="font-bold text-surface-300">Powered by CeVo Platform</div>
          </div>
        </div>
      </div>

      {/* Visible Full Results UI for the Web */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden animate-fade-in-up">
        <div className="bg-surface-900 text-white p-8 text-center">
          <h1 className="text-3xl font-black mb-2">{data.electionName}</h1>
          <p className="text-surface-400 font-medium">Final Results Breakdown</p>
        </div>

        <div className="p-8 space-y-12">
          {data.positions.map((pos) => (
            <div key={pos.title}>
              <h3 className="text-xl font-bold text-surface-900 mb-4 border-b border-surface-200 pb-2">{pos.title}</h3>
              <div className="space-y-3">
                {pos.candidates.map((c, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${
                    c.isWinner ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-white border-surface-200"
                  }`}>
                    <div className="flex items-center gap-3">
                      {c.isWinner && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      <span className={`text-lg ${c.isWinner ? "font-bold text-emerald-900" : "font-medium text-surface-700"}`}>
                        {c.name}
                      </span>
                    </div>
                    <div className="font-mono text-lg bg-white px-3 py-1 rounded-md border border-surface-100 font-semibold shadow-sm">
                      {c.votes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-surface-50 p-6 rounded-2xl border border-surface-200 text-center">
            <div className="text-sm uppercase tracking-wider font-bold text-surface-500 mb-2">Total Turnout</div>
            <div className="text-4xl font-black text-surface-900">
              {data.totalVoted} <span className="text-2xl text-surface-400">/ {data.totalRegistered}</span>
            </div>
            <div className="text-emerald-600 font-bold mt-1">{percent}% Participation</div>
          </div>
        </div>
      </div>

    </div>
  );
}
