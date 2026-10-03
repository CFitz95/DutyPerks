import { NextResponse } from "next/server";
import { z } from "zod";

const TripInput = z.object({
  destination: z.string().trim().min(2).max(200),
  startDate: z.string().date(),
  endDate: z.string().date(),
  budget: z.coerce.number().positive(),
  travelers: z.coerce.number().int().positive().max(100),
  status: z.enum(["Active Duty", "Reserve / Guard", "Veteran", "Retired", "Military Family"]),
  interests: z.string().max(1000).optional(),
  transport: z.enum(["Driving", "Flying", "Either"])
}).refine(input => input.endDate >= input.startDate, { message: "End date must be on or after start date", path: ["endDate"] });

export async function POST(req: Request) {
  let input: unknown;
  try { input = await req.json(); }
  catch { return NextResponse.json({error: "Invalid JSON body"}, {status:400}); }
  const parsed = TripInput.safeParse(input);
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
