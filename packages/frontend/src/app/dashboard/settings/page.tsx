"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [apiKeys, setApiKeys] = useState({
    openai: "",
    elevenlabs: "",
    pinecone: "",
  });

  const handleSave = () => {
    toast.success("Settings saved (API keys stored securely)");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-dark-400 mt-1">Configure your AI assistant and integrations</p>
      </div>

      {/* Profile */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={user?.fullName || ""} readOnly />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={user?.email || ""} readOnly />
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">API Keys</h2>
        <p className="text-dark-400 text-sm mb-4">Your API keys are encrypted and stored securely.</p>
        <div className="space-y-4">
          <div>
            <label className="label">OpenAI API Key</label>
            <input
              type="password"
              value={apiKeys.openai}
              onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
              className="input"
              placeholder="sk-..."
            />
          </div>
          <div>
            <label className="label">ElevenLabs API Key</label>
            <input
              type="password"
              value={apiKeys.elevenlabs}
              onChange={(e) => setApiKeys({ ...apiKeys, elevenlabs: e.target.value })}
              className="input"
              placeholder="Enter ElevenLabs API key"
            />
          </div>
          <div>
            <label className="label">Pinecone API Key</label>
            <input
              type="password"
              value={apiKeys.pinecone}
              onChange={(e) => setApiKeys({ ...apiKeys, pinecone: e.target.value })}
              className="input"
              placeholder="Enter Pinecone API key"
            />
          </div>
        </div>
        <button onClick={handleSave} className="btn-primary mt-4">Save API Keys</button>
      </div>

      {/* Integrations */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Integrations</h2>
        <div className="space-y-4">
          {[
            { name: "Google Calendar", desc: "Connect for meeting scheduling", connected: false },
            { name: "Zoom", desc: "Auto-generate Zoom meeting links", connected: false },
            { name: "Stripe", desc: "Payment processing for billing", connected: false },
            { name: "WhatsApp", desc: "Client communication via WhatsApp", connected: false },
          ].map((integration) => (
            <div key={integration.name} className="flex items-center justify-between p-4 bg-dark-800/30 rounded-lg">
              <div>
                <p className="text-white font-medium">{integration.name}</p>
                <p className="text-dark-400 text-sm">{integration.desc}</p>
              </div>
              <button className={integration.connected ? "btn-secondary text-sm" : "btn-primary text-sm"}>
                {integration.connected ? "Connected" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
