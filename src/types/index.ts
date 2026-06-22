export type Role = "admin" | "manager" | "mr";

export type RecommendationLevel =
  | "strong"
  | "moderate"
  | "occasional"
  | "not_interested";

export type VisitType = "new" | "follow_up" | "routine";

export type FollowUpStatus = "pending" | "completed" | "missed";

export type PartyType = "doctor" | "chemist" | "stockist" | "meeting";

export type Tier = "platinum" | "gold" | "silver";

export interface User {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: Role;
  territory: string;
  phone: string;
  avatarColor: string;
  status: "active" | "inactive";
  joinedAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  city: string;
  area: string;
  address: string;
  phone: string;
  email: string;
  qualification: string;
  visitFrequency: string;
  notes: string;
  lastVisitDate: string | null;
  totalVisits: number;
  tier: "platinum" | "gold" | "silver";
}

export interface Chemist {
  id: string;
  name: string;
  ownerName: string;
  city: string;
  area: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  stockistId: string | null;
  lastVisitDate: string | null;
  totalVisits: number;
  tier: Tier;
}

export interface Stockist {
  id: string;
  name: string;
  ownerName: string;
  city: string;
  area: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  monthlyOrderValue: number;
  lastVisitDate: string | null;
  totalVisits: number;
  tier: Tier;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  strength: string;
  dosageForm: string;
  description: string;
  totalMentions: number;
  doctorsRecommending: number;
}

export interface VisitProductEntry {
  productId: string;
  productName: string;
  sampleQuantity: number;
  recommendationLevel: RecommendationLevel;
}

export interface OrderProductEntry {
  productId: string;
  productName: string;
  units: number;
}

export interface Visit {
  id: string;
  partyType: PartyType;
  partyId: string;
  partyName: string;
  mrId: string;
  mrName: string;
  visitDate: string;
  visitTime: string;
  visitType: VisitType;
  city: string;
  products: VisitProductEntry[];
  feedback: string;
  competitorProducts: string;
  marketFeedback: string;
  nextFollowupDate: string | null;
  followUpStatus: FollowUpStatus;
  followUpNotes: string;
  overallRecommendation: RecommendationLevel;
  hasPersonalOrder: boolean;
  orderProducts: OrderProductEntry[];
}

export interface ActivityItem {
  id: string;
  type: "visit" | "followup" | "note";
  title: string;
  subtitle: string;
  timestamp: string;
  recommendation?: RecommendationLevel;
}

export type PlanVisitStatus = "pending" | "met" | "not_available" | "refused" | "other";

export interface PlanEntry {
  id: string;
  date: string;
  partyType: PartyType;
  partyId: string;
  partyName: string;
  city: string;
  area: string;
  productIds: string[];
  notes: string;
  visitStatus: PlanVisitStatus;
  mrId: string;
  mrName: string;
  isJointVisit: boolean;
  jointWithId: string;
  jointWithName: string;
}

export type PlanSubmissionStatus = "draft" | "submitted" | "approved";

export interface PlanSubmission {
  id: string;
  userId: string;
  month: string;
  status: PlanSubmissionStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string;
}

export type LeaveType = "casual" | "sick";

export type LeaveStatus = "pending" | "approved" | "rejected";

export interface Leave {
  id: string;
  userId: string;
  userName: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  reviewedBy: string;
  reviewNotes: string;
}
