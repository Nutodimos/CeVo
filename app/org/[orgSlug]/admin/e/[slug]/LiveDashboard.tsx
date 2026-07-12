"use client";
import { toastPrompt } from '@/lib/toast-dialogs';
import toast from 'react-hot-toast';

import { useState, useEffect } from "react";
import { stopElection } from "@/app/actions/controls";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, LineChart, Line, ResponsiveContainer, CartesianGrid } from "recharts";
import { Activity, Clock, ScanText, Flag, CheckCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";

type StatsPayload = {
  turnout: { voted: number; total: number; percent: number };
  byLevel: { level: string; voted: number; registered: number }[];
  overTime: { time: string; votes: number }[];
  verification: { pending: number; verified: number; review: number; flagged: number; rejected: number };
  election: { status: string; opensAt: string; closesAt: string };
};

export default function LiveDashboard({ electionId, electionSlug, orgSlug }: { electionId: string, electionSlug: string, orgSlug: string }) {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [ocrCooldown, setOcrCooldown] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [now, setNow] = useState(new Date());
  const router = useRouter();

  // Polling every 30 seconds
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/e/${electionSlug}/stats`);
        if (res.ok) {
          const data = await res.json();
          // If status changed to closed, reload page to switch to PostCloseDashboard
          if (stats && stats.election.status === "active" && data.election.status !== "active") {
            router.refresh();
          }
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [electionSlug, router, stats]);

  // Countdown timer for election window
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStopElection = async () => {
    if (!stats) return;
    const pendingReviewCount = stats.verification.review + stats.verification.flagged;
    
    let msg = `Are you sure you want to CLOSE polls for this election?`;
    if (pendingReviewCount > 0) {
      msg += `\n\nWARNING: ${pendingReviewCount} votes are still pending review and will need to be resolved before results can be published.`;
    }
    
    const confirmName = (await toastPrompt(msg + `\n\nType "CLOSE" to confirm:`));
    if (confirmName !== "CLOSE") return;

    setIsClosing(true);
    const res = await stopElection(electionId);
    if (res.success) {
      router.refresh();
    } else {
      toast.error(res.error || "Failed to close election");
      setIsClosing(false);
    }
  };

  if (!stats) {
    return <div className="p-12 text-center text-surface-500 animate-pulse">Loading Live Dashboard...</div>;
  }

  const { turnout, byLevel, overTime, verification, election } = stats;
  const closesAt = new Date(election.closesAt);
  const timeRemaining = Math.max(0, closesAt.getTime() - now.getTime());
  const hoursLeft = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minsLeft = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const secsLeft = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  const needsReview = verification.review > 0 || verification.flagged > 0;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" /> Live War Room
          </h1>
          <p className="text-surface-600">Monitoring real-time election telemetry.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white border border-surface-200 px-4 py-2 rounded-lg shadow-sm flex items-center gap-3">
            <Clock className="w-4 h-4 text-primary-500" />
            <div className="text-sm">
              {timeRemaining > 0 ? (
                <span className="font-mono font-bold text-surface-900">
                  {String(hoursLeft).padStart(2, '0')}:{String(minsLeft).padStart(2, '0')}:{String(secsLeft).padStart(2, '0')}
                </span>
              ) : (
                <span className="font-bold text-danger-500">Ended</span>
              )}
            </div>
          </div>
          <button 
            onClick={handleStopElection}
            disabled={isClosing}
            className="btn-danger py-2"
          >
            {isClosing ? "Closing..." : "Close Polls"}
          </button>
        </div>
      </div>

      {/* Turnout Summary Bar */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-sm font-medium text-surface-500 uppercase tracking-wider mb-1">Total Turnout</div>
          <div className="text-4xl font-black text-surface-900">
            {turnout.voted} <span className="text-xl text-surface-400 font-medium">/ {turnout.total}</span>
          </div>
          <div className="mt-2 w-full md:w-64 h-3 bg-surface-100 rounded-full overflow-hidden border border-surface-200">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000" 
              style={{ width: `${turnout.percent}%` }} 
            />
          </div>
          <div className="text-sm font-semibold text-emerald-600 mt-1">{turnout.percent}% Voted</div>
        </div>
        
        <div className="grid grid-cols-3 gap-8 border-t md:border-t-0 md:border-l border-surface-100 pt-4 md:pt-0 md:pl-8">
          <div>
            <div className="text-2xl font-bold text-surface-900">{verification.pending}</div>
            <div className="text-xs font-medium text-surface-500 uppercase">Pending Verification</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{verification.review}</div>
            <div className="text-xs font-medium text-surface-500 uppercase">Pending Review</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{verification.verified}</div>
            <div className="text-xs font-medium text-surface-500 uppercase">Verified</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-surface-900 mb-4">Turnout by Level</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byLevel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="level" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="registered" name="Registered" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="voted" name="Voted" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-surface-900 mb-4">Cumulative Votes Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    dy={10} 
                    tickFormatter={(val) => {
                      // format "YYYY-MM-DD HH:mm:ss" to "HH:mm"
                      return val.split(' ')[1].substring(0, 5);
                    }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(label) => label.split(' ')[1].substring(0, 5)}
                  />
                  <Line type="monotone" dataKey="votes" name="Votes Cast" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          
          <div className={`bg-white rounded-2xl border shadow-sm p-6 transition-colors ${needsReview ? 'border-amber-300' : 'border-surface-200'}`}>
            <h3 className="text-base font-semibold text-surface-900 mb-1 flex items-center gap-2">
              <ShieldAlert className={`w-5 h-5 ${needsReview ? 'text-amber-500' : 'text-surface-400'}`} />
              Review Queue
            </h3>
            <p className="text-sm text-surface-500 mb-4">
              {needsReview 
                ? "There are votes pending manual review. Resolving these quickly prevents a backlog at closing."
                : "Queue is empty. Gemini AI is handling everything automatically."}
            </p>
            
            <div className="flex gap-4 mb-5">
              <div className="flex-1 bg-amber-50 rounded-lg p-3 border border-amber-100 flex justify-between items-center">
                <div className="text-sm font-medium text-amber-800">Needs Review</div>
                <div className="text-xl font-bold text-amber-600">{verification.review}</div>
              </div>
              <div className="flex-1 bg-red-50 rounded-lg p-3 border border-red-100 flex justify-between items-center">
                <div className="text-sm font-medium text-red-800">Flagged Invalid</div>
                <div className="text-xl font-bold text-danger-600">{verification.flagged}</div>
              </div>
            </div>

            <Link href={`/org/${orgSlug}/admin/e/${electionSlug}/review`} className={`btn-primary w-full block text-center py-2 ${needsReview ? '' : 'btn-secondary'}`}>
              Open Review Queue
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-surface-900 mb-1 flex items-center gap-2">
              <ScanText className="w-5 h-5 text-indigo-500" />
              Verification Status
            </h3>
            <p className="text-sm text-surface-500 mb-4">
              Verification happens automatically via Gemini AI when a ballot is submitted.
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-surface-600">Pending Verification:</span>
                <span className="font-bold text-surface-900">{verification.pending}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-600">Pending Review:</span>
                <span className="font-bold text-amber-600">{verification.review}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-600">Successfully Verified:</span>
                <span className="font-bold text-emerald-600">{verification.verified}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-600">Rejected:</span>
                <span className="font-bold text-danger-600">{verification.rejected}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
