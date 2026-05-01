"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  owner_email: string;
  owner_name: string;
  user_count: number;
  created_at: string;
}

interface Stats {
  totalTenants: number;
  totalUsers: number;
  monthlyAiCalls: number;
  monthlyProposals: number;
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<Stats>({ totalTenants: 0, totalUsers: 0, monthlyAiCalls: 0, monthlyProposals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [tenantsRes, statsRes] = await Promise.allSettled([
          adminApi.getTenants(),
          adminApi.getStats(),
        ]);
        if (tenantsRes.status === "fulfilled") setTenants(tenantsRes.value.data.tenants || []);
        if (statsRes.status === "fulfilled") setStats(statsRes.value.data.stats);
      } catch { /* admin access denied or API not connected */ } finally { setLoading(false); }
    }
    fetch();
  }, []);

  const toggleTenantStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await adminApi.updateTenantStatus(id, newStatus);
      toast.success(`Tenant ${newStatus}`);
      setTenants(tenants.map((t) => t.id === id ? { ...t, status: newStatus } : t));
    } catch { toast.error("Failed to update tenant"); }
  };

  return (
    <div className="min-h-screen bg-dark-950 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Admin Panel</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total Tenants", value: stats.totalTenants },
            { label: "Total Users", value: stats.totalUsers },
            { label: "Monthly AI Calls", value: stats.monthlyAiCalls },
            { label: "Monthly Proposals", value: stats.monthlyProposals },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <p className="text-3xl font-bold text-white">{loading ? "-" : stat.value}</p>
              <p className="text-dark-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tenants Table */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-dark-700/50">
            <h2 className="text-lg font-semibold text-white">All Tenants</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">Business</th>
                <th className="px-6 py-3 text-left">Owner</th>
                <th className="px-6 py-3 text-left">Plan</th>
                <th className="px-6 py-3 text-left">Users</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-dark-400">Loading...</td></tr>
              ) : tenants.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-dark-400">No tenants</td></tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="table-row">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{tenant.name}</p>
                      <p className="text-dark-500 text-xs">{tenant.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-dark-200 text-sm">{tenant.owner_name || "N/A"}</p>
                      <p className="text-dark-500 text-xs">{tenant.owner_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-primary-500/10 text-primary-400 capitalize">
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-dark-300">{tenant.user_count}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                        tenant.status === "active" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleTenantStatus(tenant.id, tenant.status)}
                        className={`text-sm ${tenant.status === "active" ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}`}
                      >
                        {tenant.status === "active" ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
