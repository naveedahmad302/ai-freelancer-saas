"use client";

import { useEffect, useState } from "react";
import { conversationsApi } from "@/lib/api";
import toast from "react-hot-toast";

interface Message {
  role: string;
  content: string;
  timestamp: string;
}

interface Conversation {
  _id: string;
  clientId: string;
  platform: string;
  status: string;
  messages?: Message[];
  updatedAt: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await conversationsApi.list();
        setConversations(data.conversations || []);
      } catch {
        // API not connected
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const openConversation = async (conv: Conversation) => {
    try {
      const { data } = await conversationsApi.get(conv._id);
      setSelected(data.conversation);
    } catch {
      toast.error("Failed to load conversation");
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !newMessage.trim()) return;

    setSending(true);
    try {
      await conversationsApi.sendMessage({
        clientId: selected.clientId,
        platform: selected.platform,
        message: newMessage,
        autoReply: true,
      });
      setNewMessage("");
      // Reload conversation
      await openConversation(selected);
      toast.success("Message sent with AI reply");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const platformColors: Record<string, string> = {
    fiverr: "bg-green-500/10 text-green-400",
    whatsapp: "bg-emerald-500/10 text-emerald-400",
    email: "bg-blue-500/10 text-blue-400",
    direct: "bg-purple-500/10 text-purple-400",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Conversations</h1>
        <p className="text-dark-400 mt-1">AI-managed client communications</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6" style={{ minHeight: "600px" }}>
        {/* Conversation List */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-dark-700/50">
            <h2 className="text-sm font-medium text-dark-300">All Conversations</h2>
          </div>
          <div className="overflow-y-auto max-h-[500px]">
            {loading ? (
              <p className="p-4 text-dark-400 text-sm">Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-dark-400 text-sm">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => openConversation(conv)}
                  className={`w-full text-left p-4 border-b border-dark-700/50 hover:bg-dark-800/30 transition-colors ${
                    selected?._id === conv._id ? "bg-dark-800/50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-white">Client {conv.clientId.slice(0, 8)}...</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${platformColors[conv.platform] || "bg-dark-600 text-dark-300"}`}>
                      {conv.platform}
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 mt-1">{new Date(conv.updatedAt).toLocaleString()}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className="md:col-span-2 card p-0 flex flex-col">
          {selected ? (
            <>
              <div className="p-4 border-b border-dark-700/50">
                <p className="text-white font-medium">Client {selected.clientId.slice(0, 12)}...</p>
                <p className="text-xs text-dark-400 capitalize">{selected.platform}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                {selected.messages?.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "ai" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "ai"
                        ? "bg-primary-600/20 text-primary-100"
                        : msg.role === "user"
                        ? "bg-dark-600 text-dark-100"
                        : "bg-dark-700 text-dark-200"
                    }`}>
                      <p className="text-xs text-dark-400 mb-1 capitalize">{msg.role}</p>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-dark-700/50 flex gap-3">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="input flex-1"
                  placeholder="Type a client message to get AI reply..."
                />
                <button type="submit" disabled={sending} className="btn-primary">
                  {sending ? "..." : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-dark-400">
              Select a conversation to view
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
