"use client";

import { useEffect, useState } from "react";
import { clientsApi } from "@/lib/api";
import toast from "react-hot-toast";

interface Client {
  id: string;
  name: string;
  email: string;
  platform: string;
  platform_username: string;
  tags: string[];
  created_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", platform: "", platformUsername: "" });
  const [search, setSearch] = useState("");

  const fetchClients = async () => {
    try {
      const { data } = await clientsApi.list({ search: search || undefined });
      setClients(data.clients || []);
    } catch {
      // API not connected yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await clientsApi.create(formData);
      toast.success("Client created");
      setShowForm(false);
      setFormData({ name: "", email: "", platform: "", platformUsername: "" });
      fetchClients();
    } catch {
      toast.error("Failed to create client");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    try {
      await clientsApi.delete(id);
      toast.success("Client deleted");
      fetchClients();
    } catch {
      toast.error("Failed to delete client");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-dark-400 mt-1">Manage your client relationships</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          Add Client
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">New Client</h2>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input" />
            </div>
            <div>
              <label className="label">Platform</label>
              <select value={formData.platform} onChange={(e) => setFormData({ ...formData, platform: e.target.value })} className="input">
                <option value="">Select platform</option>
                <option value="fiverr">Fiverr</option>
                <option value="upwork">Upwork</option>
                <option value="direct">Direct</option>
                <option value="website">Website</option>
              </select>
            </div>
            <div>
              <label className="label">Platform Username</label>
              <input value={formData.platformUsername} onChange={(e) => setFormData({ ...formData, platformUsername: e.target.value })}
                className="input" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Create Client</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="input max-w-md"
        />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Platform</th>
              <th className="px-6 py-3 text-left">Added</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-dark-400">Loading...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-dark-400">No clients yet. Add your first client above.</td></tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="table-row">
                  <td className="px-6 py-4 text-white font-medium">{client.name}</td>
                  <td className="px-6 py-4 text-dark-300">{client.email || "-"}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary-500/10 text-primary-400 capitalize">
                      {client.platform || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-dark-400 text-sm">{new Date(client.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(client.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
