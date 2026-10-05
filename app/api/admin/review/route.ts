import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin, sameOrigin } from "../../../../lib/admin-auth";
import { privateSupabase } from "../../../../lib/private-supabase";
const Id = z.string().uuid();
const price = z.union([z.literal(""), z.string().regex(/^\d{1,7}(\.\d{1,2})?$/)]);
const Offer = z.object({
  title: z.string().trim().min(3).max(200), description: z.string().trim().min(10).max(3000),
  requirements: z.string().trim().min(5).max(3000),
  category: z.enum(["food","hotel","attraction","tour","entertainment","shopping","automotive","fitness","education","financial"]),
  eligibility: z.array(z.enum(["active_duty","reserve_guard","veteran","retired","family"])).min(1),
  startsAt: z.union([z.literal(""), z.string().date()]), expiresAt: z.union([z.literal(""), z.string().date()]),
  noExpiry: z.boolean(), normalPrice: price, militaryPrice: price,
  confirm: z.literal(true)
}).refine(o => o.noExpiry ? !o.expiresAt : !!o.expiresAt, "Choose an expiry date or no published expiry")
  .refine(o => !o.startsAt || !o.expiresAt || o.startsAt <= o.expiresAt, "Invalid date order")
  .refine(o => !o.expiresAt || o.expiresAt >= new Date().toISOString().slice(0,10), "Offer expired");
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const admin = await getAdmin();
  if (!admin) return new Response("Unauthorized", { status: 401 });
  try {
    const form = await request.formData();
    const candidate = Id.parse(form.get("candidate"));
    const action = z.enum(["approve","dismiss","done"]).parse(form.get("action"));
    const existing = form.get("benefit") ? Id.parse(form.get("benefit")) : null;
    let offer = {};
    if (action === "approve") {
      if (!existing && form.get("newOffer") !== "on") throw new Error("Confirm distinct new offer");
      offer = Offer.parse({
        title: form.get("title"), description: form.get("description"), requirements: form.get("requirements"),
        category: form.get("category"), eligibility: form.getAll("eligibility"),
        startsAt: form.get("startsAt"), expiresAt: form.get("expiresAt"), noExpiry: form.get("noExpiry") === "on",
        normalPrice: form.get("normalPrice"), militaryPrice: form.get("militaryPrice"), confirm: form.get("confirm") === "on"
      });
    }
    const { error } = await privateSupabase().rpc("review_discovery_offer", { p_candidate: candidate, p_actor: admin.id, p_action: action, p_benefit: existing, p_offer: offer });
    if (error) throw new Error("Review failed");
    return NextResponse.redirect(new URL(`/admin?notice=${action === "approve" ? "saved" : "closed"}`, request.url), 303);
  } catch { return NextResponse.redirect(new URL("/admin?notice=review", request.url), 303); }
}
