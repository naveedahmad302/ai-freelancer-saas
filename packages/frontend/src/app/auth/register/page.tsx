"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(formData);
      toast.success("Account created! Welcome to FreelancerAI");
      router.push("/dashboard");
    } catch {
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-dark-400 mt-1">Start automating your freelance business</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="input"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="label">Business Name</label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="input"
              placeholder="Your Business Name"
              required
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              placeholder="Min 8 characters"
              minLength={8}
              required
            />
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-dark-400 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary-400 hover:text-primary-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
