"use client";

import { useEffect, useState } from "react";
import { knowledgeApi } from "@/lib/api";
import toast from "react-hot-toast";

interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  created_at: string;
}

const CATEGORIES = [
  { value: "pricing", label: "Pricing" },
  { value: "portfolio", label: "Portfolio" },
  { value: "delivery_timeline", label: "Delivery Timeline" },
  { value: "business_rules", label: "Business Rules" },
  { value: "faq", label: "FAQ" },
  { value: "communication_tone", label: "Communication Tone" },
  { value: "services", label: "Services" },
  { value: "custom", label: "Custom" },
];

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [formData, setFormData] = useState({ category: "pricing", title: "", content: "" });

  const fetchEntries = async () => {
    try {
      const { data } = await knowledgeApi.list(filterCategory || undefined);
      setEntries(data.knowledge || []);
    } catch { /* API not connected */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchEntries(); }, [filterCategory]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await knowledgeApi.create(formData);
      toast.success("Knowledge entry added");
      setShowForm(false);
      setFormData({ category: "pricing", title: "", content: "" });
      fetchEntries();
    } catch { toast.error("Failed to create entry"); }
  };

  const handleDelete = async (id: string) => {
    try {
      await knowledgeApi.delete(id);
      toast.success("Entry deleted");
      fetchEntries();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <p className="text-dark-400 mt-1">Your business data used by AI in every response</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">Add Entry</button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
        <p className="text-amber-300 text-sm">
          <strong>Important:</strong> AI will ONLY use the data you enter here. It will never hallucinate
          services or pricing. Add your complete business information for best results.
        </p>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Add Knowledge Entry</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Category *</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input">
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Title *</label>
                <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input" required />
              </div>
            </div>
            <div>
              <label className="label">Content *</label>
              <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input min-h-[150px]" placeholder="Enter detailed information..." required />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Save Entry</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilterCategory("")}
          className={`px-3 py-1 rounded-full text-sm ${!filterCategory ? "bg-primary-500/20 text-primary-400" : "bg-dark-700 text-dark-300"}`}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => setFilterCategory(c.value)}
            className={`px-3 py-1 rounded-full text-sm ${filterCategory === c.value ? "bg-primary-500/20 text-primary-400" : "bg-dark-700 text-dark-300"}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-dark-400 text-center py-8">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="card text-center text-dark-400 py-8">No entries yet. Add your business information above.</div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-primary-500/10 text-primary-400 capitalize mr-2">
                    {entry.category.replace("_", " ")}
                  </span>
                  <h3 className="text-white font-medium mt-2">{entry.title}</h3>
                </div>
                <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
              </div>
              <p className="text-dark-300 text-sm mt-2 whitespace-pre-wrap">{entry.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
