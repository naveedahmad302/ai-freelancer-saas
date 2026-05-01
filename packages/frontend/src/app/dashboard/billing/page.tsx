"use client";

import { useEffect, useState } from "react";
import { billingApi } from "@/lib/api";
import toast from "react-hot-toast";

interface PlanLimits {
  name: string;
  price: number;
  aiCalls: number;
  automations: number;
  clients: number;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<{ plan: string; status: string } | null>(null);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [plans, setPlans] = useState<Record<string, PlanLimits>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [subRes, plansRes] = await Promise.allSettled([
          billingApi.getSubscription(),
          billingApi.getPlans(),
        ]);
        if (subRes.status === "fulfilled") {
          setSubscription(subRes.value.data.subscription);
          setUsage(subRes.value.data.usage || {});
        }
        if (plansRes.status === "fulfilled") {
          setPlans(plansRes.value.data.plans || {});
        }
      } catch { /* API not connected */ } finally { setLoading(false); }
    }
    fetch();
  }, []);

  const handleUpgrade = async (plan: string) => {
    try {
      const { data } = await billingApi.checkout(plan);
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Billing not configured. Set STRIPE_SECRET_KEY in environment.");
      }
    } catch { toast.error("Failed to start checkout"); }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-dark-400 mt-1">Manage your subscription and usage</p>
      </div>

      {/* Current Plan */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Current Plan</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-500/10 rounded-xl flex items-center justify-center">
            <span className="text-primary-400 font-bold text-xl capitalize">
              {subscription?.plan?.[0] || "S"}
            </span>
          </div>
          <div>
            <p className="text-white text-xl font-bold capitalize">{subscription?.plan || "Starter"}</p>
            <p className="text-dark-400 text-sm capitalize">Status: {subscription?.status || "Active"}</p>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">This Month&apos;s Usage</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-dark-400 text-sm">AI Calls</p>
            <p className="text-2xl font-bold text-white">{usage.ai_call || 0}</p>
          </div>
          <div>
            <p className="text-dark-400 text-sm">Automations Run</p>
            <p className="text-2xl font-bold text-white">{usage.automation_fiverr || 0}</p>
          </div>
          <div>
            <p className="text-dark-400 text-sm">Proposals Generated</p>
            <p className="text-2xl font-bold text-white">{usage.proposal || 0}</p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-lg font-semibold text-white mb-4">Available Plans</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(plans).length > 0 ? (
          Object.entries(plans).map(([key, plan]) => (
            <div key={key} className={`card ${subscription?.plan === key ? "border-primary-500/50" : ""}`}>
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="text-3xl font-bold text-white mt-2">${plan.price}<span className="text-dark-400 text-sm">/mo</span></p>
              <ul className="mt-4 space-y-2 text-dark-300 text-sm">
                <li>{plan.aiCalls === -1 ? "Unlimited" : plan.aiCalls} AI calls</li>
                <li>{plan.automations === -1 ? "Unlimited" : plan.automations} automations</li>
                <li>{plan.clients === -1 ? "Unlimited" : plan.clients} clients</li>
              </ul>
              <button
                onClick={() => handleUpgrade(key)}
                disabled={subscription?.plan === key}
                className={`mt-6 w-full ${subscription?.plan === key ? "btn-secondary" : "btn-primary"}`}
              >
                {subscription?.plan === key ? "Current Plan" : "Upgrade"}
              </button>
            </div>
          ))
        ) : (
          <p className="text-dark-400 col-span-full">Loading plans...</p>
        )}
      </div>
    </div>
  );
}
