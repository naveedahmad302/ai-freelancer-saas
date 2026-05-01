"use client";

import { useEffect, useState } from "react";
import { meetingsApi } from "@/lib/api";
import toast from "react-hot-toast";

interface Meeting {
  id: string;
  title: string;
  platform: string;
  meeting_url: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  ai_agent_enabled: boolean;
  client_name: string;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "", platform: "google_meet", scheduledAt: "", durationMinutes: "30", aiAgentEnabled: false,
  });

  const fetchMeetings = async () => {
    try {
      const { data } = await meetingsApi.list();
      setMeetings(data.meetings || []);
    } catch { /* API not connected */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchMeetings(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await meetingsApi.create({
        title: formData.title,
        platform: formData.platform,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
      });
      toast.success("Meeting scheduled");
      setShowForm(false);
      fetchMeetings();
    } catch { toast.error("Failed to schedule meeting"); }
  };

  const platformIcons: Record<string, string> = {
    google_meet: "Google Meet",
    zoom: "Zoom",
    teams: "MS Teams",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Meetings</h1>
          <p className="text-dark-400 mt-1">Schedule and manage meetings with AI voice agent</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">Schedule Meeting</button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Title *</label>
              <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">Platform</label>
              <select value={formData.platform} onChange={(e) => setFormData({ ...formData, platform: e.target.value })} className="input">
                <option value="google_meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="teams">Microsoft Teams</option>
              </select>
            </div>
            <div>
              <label className="label">Date & Time *</label>
              <input type="datetime-local" value={formData.scheduledAt} onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input type="number" value={formData.durationMinutes} onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })} className="input" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Schedule</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-dark-400 text-center py-8">Loading...</div>
        ) : meetings.length === 0 ? (
          <div className="card text-center text-dark-400 py-8">No meetings scheduled</div>
        ) : (
          meetings.map((meeting) => (
            <div key={meeting.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">{meeting.title}</h3>
                  <p className="text-dark-400 text-sm">
                    {platformIcons[meeting.platform] || meeting.platform} &middot; {meeting.duration_minutes} min
                    {meeting.ai_agent_enabled && " &middot; AI Agent Enabled"}
                  </p>
                  <p className="text-dark-500 text-xs mt-1">{new Date(meeting.scheduled_at).toLocaleString()}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs capitalize ${
                meeting.status === "scheduled" ? "bg-primary-500/10 text-primary-400" :
                meeting.status === "completed" ? "bg-green-500/10 text-green-400" :
                "bg-dark-600 text-dark-300"
              }`}>
                {meeting.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
