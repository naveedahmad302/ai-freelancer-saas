"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950">
      {/* Navbar */}
      <nav className="border-b border-dark-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-xl font-bold text-white">FreelancerAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-dark-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-primary-300">AI-Powered Freelance Automation</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Your AI Freelance
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-cyan-400">
            Business Partner
          </span>
        </h1>
        <p className="text-xl text-dark-300 max-w-2xl mx-auto mb-12">
          Automate client communication, proposals, negotiations, and meetings.
          Let AI handle the business while you focus on what you do best.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/register" className="btn-primary text-lg px-8 py-3">
            Start Free Trial
          </Link>
          <Link href="#features" className="btn-secondary text-lg px-8 py-3">
            See Features
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-white text-center mb-16">Everything You Need</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "AI Communication", desc: "Intelligent client replies across Fiverr, WhatsApp, and email. Always on-brand with your business data.", icon: "💬" },
            { title: "Smart Proposals", desc: "Generate professional proposals with accurate pricing from your service catalog. No hallucinated data.", icon: "📝" },
            { title: "Auto Negotiation", desc: "AI handles pricing negotiations following your rules. Maximizes conversion without over-discounting.", icon: "🤝" },
            { title: "Fiverr Automation", desc: "Automated message reading and replies with human-like behavior. Per-tenant browser profiles.", icon: "🤖" },
            { title: "Meeting Scheduler", desc: "Auto-detect meeting intent, generate links, and integrate with Google Meet, Zoom, and Teams.", icon: "📅" },
            { title: "Voice AI Agent", desc: "AI joins meetings, speaks naturally, and responds in real-time. Your virtual meeting representative.", icon: "🎙️" },
            { title: "CRM & Memory", desc: "Full client history with vector-powered long-term memory. AI remembers every interaction.", icon: "🧠" },
            { title: "Workflow Engine", desc: "n8n-powered automation for WhatsApp, Gmail, and custom triggers. Full event orchestration.", icon: "⚡" },
            { title: "Multi-Tenant SaaS", desc: "Complete data isolation per user. Separate AI memory, workflows, and browser sessions.", icon: "🏢" },
          ].map((feature) => (
            <div key={feature.title} className="card hover:border-primary-500/30 transition-colors group">
              <span className="text-3xl mb-4 block">{feature.icon}</span>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-dark-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-white text-center mb-16">Simple Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { name: "Starter", price: 29, features: ["500 AI calls/mo", "3 automations", "50 clients", "Email support"] },
            { name: "Pro", price: 79, features: ["5,000 AI calls/mo", "20 automations", "500 clients", "Priority support", "Voice AI"], popular: true },
            { name: "Enterprise", price: 199, features: ["Unlimited AI calls", "Unlimited automations", "Unlimited clients", "24/7 support", "Custom integrations"] },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`card ${plan.popular ? "border-primary-500/50 ring-1 ring-primary-500/20" : ""} flex flex-col`}
            >
              {plan.popular && (
                <span className="text-xs font-medium text-primary-400 uppercase tracking-wider mb-2">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                <span className="text-dark-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-dark-300 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className={plan.popular ? "btn-primary w-full text-center" : "btn-secondary w-full text-center"}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800/50 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-dark-400 text-sm">
          &copy; {new Date().getFullYear()} AI FreelancerAI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
