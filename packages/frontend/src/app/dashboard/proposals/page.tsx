"use client";

import { useEffect, useState } from "react";
import { proposalsApi } from "@/lib/api";
import toast from "react-hot-toast";

interface Proposal {
  id: string;
  title: string;
  content: string;
  pricing: string;
  status: string;
  ai_generated: boolean;
  client_name: string;
  created_at: string;
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [genForm, setGenForm] = useState({
    projectDescription: "",
    clientBudget: "",
    clientTimeline: "",
  });

  const fetchProposals = async () => {
    try {
      const { data } = await proposalsApi.list();
      setProposals(data.proposals || []);
    } catch {
      // API not connected
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProposals(); }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await proposalsApi.generate({
        projectDescription: genForm.projectDescription,
        clientBudget: genForm.clientBudget ? parseFloat(genForm.clientBudget) : undefined,
        clientTimeline: genForm.clientTimeline || undefined,
      });
      toast.success("Proposal generated!");
      setShowGenerator(false);
      fetchProposals();
    } catch {
      toast.error("Failed to generate proposal");
    } finally {
      setGenerating(false);
    }
  };

  const statusColors: Record<string, string> = {
    draft: "bg-dark-600 text-dark-300",
    sent: "bg-primary-500/10 text-primary-400",
    accepted: "bg-green-500/10 text-green-400",
    rejected: "bg-red-500/10 text-red-400",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Proposals</h1>
          <p className="text-dark-400 mt-1">AI-generated and manual proposals</p>
        </div>
        <button onClick={() => setShowGenerator(!showGenerator)} className="btn-primary">
          Generate with AI
        </button>
      </div>

      {showGenerator && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">AI Proposal Generator</h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="label">Project Description *</label>
              <textarea
                value={genForm.projectDescription}
                onChange={(e) => setGenForm({ ...genForm, projectDescription: e.target.value })}
                className="input min-h-[120px]"
                placeholder="Describe the project requirements..."
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Client Budget (USD)</label>
                <input type="number" value={genForm.clientBudget}
                  onChange={(e) => setGenForm({ ...genForm, clientBudget: e.target.value })}
                  className="input" placeholder="e.g., 500" />
              </div>
              <div>
                <label className="label">Client Timeline</label>
                <input value={genForm.clientTimeline}
                  onChange={(e) => setGenForm({ ...genForm, clientTimeline: e.target.value })}
                  className="input" placeholder="e.g., 2 weeks" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={generating} className="btn-primary">
                {generating ? "Generating..." : "Generate Proposal"}
              </button>
              <button type="button" onClick={() => setShowGenerator(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="card text-center text-dark-400 py-8">Loading proposals...</div>
        ) : proposals.length === 0 ? (
          <div className="card text-center text-dark-400 py-8">
            No proposals yet. Generate your first AI-powered proposal above.
          </div>
        ) : (
          proposals.map((proposal) => (
            <div key={proposal.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-white font-medium">{proposal.title}</h3>
                  {proposal.client_name && (
                    <p className="text-dark-400 text-sm">Client: {proposal.client_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {proposal.ai_generated && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/10 text-purple-400">AI Generated</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${statusColors[proposal.status] || statusColors.draft}`}>
                    {proposal.status}
                  </span>
                </div>
              </div>
              <p className="text-dark-300 text-sm line-clamp-2">{proposal.content}</p>
              <p className="text-dark-500 text-xs mt-2">{new Date(proposal.created_at).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
