export type MilitaryStatus = "active_duty"|"reserve_guard"|"veteran"|"retired"|"family";

export interface VerifiedBenefit {
  id: string;
  title: string;
  description: string;
  eligibility: MilitaryStatus[];
  sourceUrl: string;
  verifiedAt: string;
  expiresAt?: string | null;
  normalPrice?: number | null;
  militaryPrice?: number | null;
}
