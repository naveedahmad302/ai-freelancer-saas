// ─── Common Types ───────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "pro" | "enterprise";
  status: "active" | "suspended";
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: "user" | "owner" | "admin" | "super_admin";
  isActive: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  platform?: string;
  platformUsername?: string;
  notes?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  basePrice: number;
  currency: string;
  deliveryTimeDays?: number;
  revisions: number;
  isActive: boolean;
  metadata: Record<string, unknown>;
}

export interface Proposal {
  id: string;
  tenantId: string;
  clientId?: string;
  title: string;
  content: string;
  pricing: ProposalPricing;
  timeline: ProposalTimeline;
  status: "draft" | "sent" | "accepted" | "rejected";
  aiGenerated: boolean;
  source?: string;
  createdAt: string;
}

export interface ProposalPricing {
  items: Array<{ name: string; price: number; description: string }>;
  total: number;
  currency: string;
  notes?: string;
}

export interface ProposalTimeline {
  totalDays: number;
  milestones: Array<{ name: string; days: number; deliverables: string[] }>;
}

export interface Meeting {
  id: string;
  tenantId: string;
  clientId?: string;
  title: string;
  description?: string;
  platform: "google_meet" | "zoom" | "teams";
  meetingUrl: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  aiAgentEnabled: boolean;
}

export interface Conversation {
  _id: string;
  tenantId: string;
  clientId: string;
  platform: "fiverr" | "whatsapp" | "email" | "direct" | "website";
  status: "active" | "archived" | "closed";
  messages: Message[];
  context: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  role: "client" | "ai" | "user";
  content: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface NegotiationRule {
  id: string;
  tenantId: string;
  serviceId?: string;
  minPrice: number;
  maxDiscountPercent: number;
  autoAcceptAbove?: number;
  rules: Record<string, unknown>;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  tenantId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: "starter" | "pro" | "enterprise";
  status: "active" | "cancelled" | "past_due";
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

// ─── Workflow Types ─────────────────────────────────────────

export interface WorkflowPayload {
  tenantId: string;
  message: string;
  source: "fiverr" | "whatsapp" | "email";
  clientId?: string;
  metadata?: Record<string, unknown>;
}

// ─── API Response Types ─────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
