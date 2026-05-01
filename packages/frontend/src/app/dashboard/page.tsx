"use client";

import { useEffect, useState } from "react";
import { clientsApi, proposalsApi, conversationsApi, meetingsApi } from "@/lib/api";

interface DashboardStats {
  totalClients: number;
  activeConversations: number;
  proposalsSent: number;
  upcomingMeetings: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeConversations: 0,
    proposalsSent: 0,
    upcomingMeetings: 0,
  });
  const [recentConversations, setRecentConversations] = useState<Array<{ _id: string; clientId: string; platform: string; status: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [clientsRes, convsRes, proposalsRes, meetingsRes] = await Promise.allSettled([
          clientsApi.list(),
          conversationsApi.list(),
          proposalsApi.list(),
          meetingsApi.list(true),
        ]);

        setStats({
          totalClients: clientsRes.status === "fulfilled" ? clientsRes.value.data.total || 0 : 0,
          activeConversations: convsRes.status === "fulfilled" ? convsRes.value.data.conversations?.length || 0 : 0,
          proposalsSent: proposalsRes.status === "fulfilled" ? proposalsRes.value.data.proposals?.length || 0 : 0,
          upcomingMeetings: meetingsRes.status === "fulfilled" ? meetingsRes.value.data.meetings?.length || 0 : 0,
        });

        if (convsRes.status === "fulfilled") {
          setRecentConversations(convsRes.value.data.conversations?.slice(0, 5) || []);
        }
      } catch {
        // Dashboard loads even if API is not yet connected
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const statCards = [
    { label: "Total Clients", value: stats.totalClients, color: "text-primary-400", bg: "bg-primary-500/10" },
    { label: "Active Conversations", value: stats.activeConversations, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Proposals Sent", value: stats.proposalsSent, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Upcoming Meetings", value: stats.upcomingMeetings, color: "text-amber-400", bg: "bg-amber-500/10" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-400 mt-1">Overview of your AI freelance operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <span className={`text-xl font-bold ${stat.color}`}>
                {loading ? "-" : stat.value}
              </span>
            </div>
            <p className="text-dark-400 text-sm mt-2">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <a href="/dashboard/proposals" className="btn-secondary text-center text-sm">
              Generate Proposal
            </a>
            <a href="/dashboard/clients" className="btn-secondary text-center text-sm">
              Add Client
            </a>
            <a href="/dashboard/automation" className="btn-secondary text-center text-sm">
              Run Automation
            </a>
            <a href="/dashboard/meetings" className="btn-secondary text-center text-sm">
              Schedule Meeting
            </a>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Conversations</h2>
          {recentConversations.length === 0 ? (
            <p className="text-dark-400 text-sm">No conversations yet. Start by connecting your platforms.</p>
          ) : (
            <div className="space-y-3">
              {recentConversations.map((conv) => (
                <div key={conv._id} className="flex items-center justify-between p-3 bg-dark-800/30 rounded-lg">
                  <div>
                    <p className="text-sm text-white">Client {conv.clientId.slice(0, 8)}...</p>
                    <p className="text-xs text-dark-400 capitalize">{conv.platform}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    conv.status === "active" ? "bg-green-500/10 text-green-400" : "bg-dark-600 text-dark-300"
                  }`}>
                    {conv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Status */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">System Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "AI Engine", status: "Operational" },
            { name: "Fiverr Automation", status: "Ready" },
            { name: "n8n Workflows", status: "Connected" },
            { name: "Voice AI", status: "Standby" },
          ].map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              <div>
                <p className="text-sm text-white">{item.name}</p>
                <p className="text-xs text-dark-400">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
