import { NextResponse } from "next/server";
import { z } from "zod";

const TripInput = z.object({
  destination: z.string().min(2),
  startDate: z.string(),
  endDate: z.string(),
  budget: z.coerce.number().positive(),
  travelers: z.coerce.number().int().positive(),
  status: z.string(),
  interests: z.string().optional(),
  transport: z.string()
});

export async function POST(req: Request) {
  const parsed = TripInput.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({error: parsed.error.flatten()}, {status:400});

  // NEXT SPRINT:
  // 1) geocode destination
  // 2) fetch VERIFIED benefits matching eligibility/date/radius
  // 3) fetch ordinary trip candidates/prices from approved providers
  // 4) rank within budget/interests
  // 5) let AI assemble narrative ONLY from retrieved records
  // 6) persist trip + itinerary + savings provenance
  return NextResponse.json({
    status: "prototype",
    input: parsed.data,
    message: "Trip request validated. Connect Supabase and travel/location providers in Sprint 2."
  });
}
