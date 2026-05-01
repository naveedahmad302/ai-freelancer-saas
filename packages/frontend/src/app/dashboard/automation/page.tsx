"use client";

import { useEffect, useState } from "react";
import { automationApi } from "@/lib/api";
import toast from "react-hot-toast";

interface AutomationSession {
  id: string;
  platform: string;
  status: string;
  last_run: string;
  error_log: string;
}

export default function AutomationPage() {
  const [sessions, setSessions] = useState<AutomationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const { data } = await automationApi.getSessions();
      setSessions(data.sessions || []);
    } catch { /* API not connected */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, []);

  const runAutomation = async (platform: string, action: string) => {
    setRunning(`${platform}-${action}`);
    try {
      await automationApi.run({ platform, action });
      toast.success(`${action} job queued for ${platform}`);
      fetchSessions();
    } catch { toast.error("Failed to run automation"); } finally { setRunning(null); }
  };

  const stopAutomation = async (sessionId: string) => {
    try {
      await automationApi.stop(sessionId);
      toast.success("Automation stopped");
      fetchSessions();
    } catch { toast.error("Failed to stop automation"); }
  };

  const statusColors: Record<string, string> = {
    idle: "bg-dark-600 text-dark-300",
    running: "bg-green-500/10 text-green-400",
    error: "bg-red-500/10 text-red-400",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Automation</h1>
        <p className="text-dark-400 mt-1">Browser automation for freelance platforms</p>
      </div>

      {/* Fiverr Automation Card */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <span className="text-green-400 font-bold">F</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Fiverr Automation</h2>
              <p className="text-dark-400 text-sm">Automated inbox management with AI replies</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => runAutomation("fiverr", "read_messages")}
            disabled={running === "fiverr-read_messages"}
            className="btn-secondary text-left"
          >
            <p className="font-medium">Read Messages</p>
            <p className="text-xs text-dark-400 mt-1">Fetch new Fiverr inbox messages</p>
          </button>
          <button
            onClick={() => runAutomation("fiverr", "check_orders")}
            disabled={running === "fiverr-check_orders"}
            className="btn-secondary text-left"
          >
            <p className="font-medium">Check Orders</p>
            <p className="text-xs text-dark-400 mt-1">Monitor active Fiverr orders</p>
          </button>
          <button
            onClick={() => runAutomation("fiverr", "send_reply")}
            disabled={running === "fiverr-send_reply"}
            className="btn-secondary text-left"
          >
            <p className="font-medium">Send AI Reply</p>
            <p className="text-xs text-dark-400 mt-1">Reply to pending messages with AI</p>
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Automation Sessions</h2>
        {loading ? (
          <p className="text-dark-400 text-sm">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="text-dark-400 text-sm">No automation sessions yet. Run an automation above to get started.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-dark-800/30 rounded-lg">
                <div>
                  <p className="text-white font-medium capitalize">{session.platform}</p>
                  <p className="text-dark-400 text-xs">
                    Last run: {session.last_run ? new Date(session.last_run).toLocaleString() : "Never"}
                  </p>
                  {session.error_log && (
                    <p className="text-red-400 text-xs mt-1">{session.error_log.slice(0, 100)}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${statusColors[session.status] || statusColors.idle}`}>
                    {session.status}
                  </span>
                  {session.status === "running" && (
                    <button onClick={() => stopAutomation(session.id)} className="btn-danger text-xs px-3 py-1">
                      Stop
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
