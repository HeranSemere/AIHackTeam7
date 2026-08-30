export type FieldStatus =
  | "verified"
  | "extracted"
  | "needsConfirmation"
  | "missing"
  | "contradiction";

export interface EvidenceField {
  label: string;
  value: string;
  status: FieldStatus;
  source: string;
  contradictionDetail?: {
    otherSource: string;
    otherValue: string;
    action: string;
  };
}

export interface ScoreCriterion {
  key: string;
  label: string;
  score: number;
  max: number;
  reason: string;
  evidence: string[];
}

export interface Contradiction {
  id: string;
  title: string;
  fieldA: { label: string; value: string };
  fieldB: { label: string; value: string };
  severity: "Low" | "Medium" | "High";
  recommendedAction: string;
}

export interface MissingItem {
  id: string;
  label: string;
  requiredFrom: string;
}

export interface Declaration {
  id: string;
  title: string;
  text: string;
  explained: boolean;
  accepted: boolean;
}

export type EligibilityStatus =
  | "eligible"
  | "provisionallyEligible"
  | "notEligible";

export interface Application {
  id: string;
  businessName: string;
  owner: string;
  location: string;
  sector: string;
  businessType: string;
  yearsOperating: number;
  status: "draft" | "submitted" | "needsReview";
  progress: number; // 0-100, applicant-side completeness

  employment: { total: number; female: number; male: number; youth: number };
  financial: {
    annualSales2023: number;
    annualSales2024: number | null;
    revenueGrowth: string;
    fundingRequested: number;
  };
  management: string;
  equipment: { item: string; qty: number; estValueETB: number }[];
  fundingRequest: { amount: number; purpose: string; expectedUse: string };

  evidence: EvidenceField[];

  eligibility: {
    status: EligibilityStatus;
    checks: { label: string; passed: boolean }[];
    exclusionFactor?: { reason: string; evidence: string };
  };

  scoring: ScoreCriterion[];
  finalScore: number;

  contradictions: Contradiction[];
  missing: MissingItem[];

  siteVisitQuestions: string[];

  recommendation: {
    status:
      | "Strongly Recommended"
      | "Recommended"
      | "Needs Review"
      | "Not Recommended"
      | "Ineligible";
    summary: string;
  };

  declarations: Declaration[];

  proposal: {
    projectTitle: string;
    location: string;
    sector: string;
    fundingTargetETB: number;
    beneficiaries: number;
    sdgs: string[];
    milestones: string[];
  };

  reviewerDecision?: {
    choice: "approve" | "moreInfo" | "reject" | null;
    notes: string;
  };

  shortlisted?: boolean;
  rank?: number;
}

export interface DashboardStats {
  total: number;
  eligible: number;
  notEligible: number;
  needsReview: number;
  avg: number;
}
