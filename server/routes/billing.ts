import { Router, type Request } from "express";
import Stripe from "stripe";
import { storage } from "../storage.js";
import {
  authMiddleware,
  optionalAuthMiddleware,
  type AuthRequest,
} from "../middleware/auth.js";
import { resolveAuthPayload } from "../lib/auth.js";
import {
  envContainsPriceId,
  firstConfiguredPriceId,
  getStripePriceIdMap,
  inferPlanTierFromStripePriceId,
  isStripePriceIdUnmappedInEnv,
} from "../lib/stripePlanPrices.js";
import {
  normalizePlanTier,
  resolveOrganizationPlanTier,
} from "../middleware/plan.js";

const router = Router();

type PlanTier = "starter" | "pro" | "ai";

function getPriceMap() {
  return getStripePriceIdMap();
}

function normalizeTier(value: unknown): PlanTier {
  const v = String(value || "").toLowerCase();
  if (v === "ai") return "ai";
  if (v === "pro") return "pro";
  return "starter";
}

function getPlanFromTier(tier: PlanTier): string {
  if (tier === "ai") return "enterprise";
  if (tier === "pro") return "pro";
  return "trial";
}

function resolveCheckoutTarget(body: any): {
  priceId: string;
  planTier: PlanTier;
} {
  const requestedTier = normalizeTier(body?.planTier);
  const requestedPriceId = String(body?.priceId || "").trim();
  const prices = getPriceMap();

  if (requestedPriceId) {
    if (envContainsPriceId(prices.ai, requestedPriceId)) {
      return { priceId: requestedPriceId, planTier: "ai" };
    }
    if (envContainsPriceId(prices.pro, requestedPriceId)) {
      return { priceId: requestedPriceId, planTier: "pro" };
    }
    if (envContainsPriceId(prices.starter, requestedPriceId)) {
      return { priceId: requestedPriceId, planTier: "starter" };
    }
    // Unknown custom price id defaults to requested tier semantics.
    return { priceId: requestedPriceId, planTier: requestedTier };
  }

  const tierPrice =
    requestedTier === "ai"
      ? firstConfiguredPriceId(prices.ai)
      : requestedTier === "pro"
        ? firstConfiguredPriceId(prices.pro)
        : firstConfiguredPriceId(prices.starter);

  return { priceId: tierPrice, planTier: requestedTier };
}

function getBaseUrl(req: any): string {
  const origin = req.headers?.origin;
  if (origin) return origin;
  const protocol = req.headers?.["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers?.host || "localhost:3000";
  return `${protocol}://${host}`;
}

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe is not configured (missing STRIPE_SECRET_KEY)");
  }
  return new Stripe(secretKey);
}

function mapStripeSubscriptionStatus(status: string): {
  subscriptionStatus: string;
  plan: string;
  planTier: string;
} {
  const s = String(status || "").toLowerCase();
  if (s === "active" || s === "trialing") {
    return { subscriptionStatus: s, plan: "pro", planTier: "pro" };
  }
  if (s === "past_due" || s === "unpaid" || s === "incomplete") {
    return { subscriptionStatus: s, plan: "trial", planTier: "starter" };
  }
  if (s === "canceled" || s === "cancelled") {
    return { subscriptionStatus: "cancelled", plan: "trial", planTier: "starter" };
  }
  return { subscriptionStatus: s || "trialing", plan: "trial", planTier: "starter" };
}

function getAuthOrganizationId(req: Request): string | null {
  const payload = resolveAuthPayload({
    authorization: req.headers.authorization,
    cookieToken: (req as { cookies?: { token?: string } }).cookies?.token,
  });
  return payload?.organizationId || null;
}

/**
 * Persists plan and Stripe ids from a completed Checkout Session.
 * Used by Stripe webhooks and by POST /billing/sync-checkout-session (localhost / when webhooks are delayed).
 */
async function applyCheckoutSessionToOrganization(
  session: Stripe.Checkout.Session,
  organizationId: string
): Promise<void> {
  const metaOrg =
    String(session.metadata?.organizationId || "").trim() ||
    String(session.client_reference_id || "").trim();
  if (!metaOrg || metaOrg !== organizationId) {
    throw new Error("Checkout session does not match organization");
  }

  const status = String(session.status || "");
  if (status !== "complete") {
    throw new Error("Checkout session is not complete");
  }

  const customerRaw = session.customer;
  const customerId =
    typeof customerRaw === "string"
      ? customerRaw
      : customerRaw &&
          typeof customerRaw === "object" &&
          !Array.isArray(customerRaw)
        ? (customerRaw as Stripe.Customer).id
        : null;

  const subRaw = session.subscription;
  const subscriptionId =
    typeof subRaw === "string"
      ? subRaw
      : subRaw && typeof subRaw === "object" && !Array.isArray(subRaw)
        ? (subRaw as Stripe.Subscription).id
        : null;

  let priceId = String(session.metadata?.priceId || "").trim() || null;
  if (!priceId && session.line_items && typeof session.line_items === "object") {
    const items = session.line_items as Stripe.ApiList<Stripe.LineItem>;
    const first = items.data?.[0];
    const p = first?.price;
    priceId = typeof p === "string" ? p : p?.id || null;
  }

  const sessionPlanTier = normalizeTier(
    session.metadata?.planTier || inferPlanTierFromStripePriceId(priceId)
  );

  const billingEmail =
    String(
      session.customer_details?.email ||
        (session as { customer_email?: string | null }).customer_email ||
        ""
    ).trim() || null;

  await storage.updateOrganizationBillingById(organizationId, {
    plan: getPlanFromTier(sessionPlanTier),
    planTier: sessionPlanTier,
    subscriptionStatus: "active",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: priceId,
    billingEmail,
  });
}

router.get("/billing/config", (_req, res) => {
  const prices = getPriceMap();
  res.json({
    enabled: Boolean(
      process.env.STRIPE_SECRET_KEY && (prices.starter || prices.pro || prices.ai)
    ),
    publishableKey:
      process.env.STRIPE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      null,
    defaultPriceId: prices.starter || prices.pro || prices.ai || null,
    prices: {
      starter: prices.starter || null,
      pro: prices.pro || null,
      ai: prices.ai || null,
    },
  });
});

router.post(
  "/billing/create-checkout-session",
  optionalAuthMiddleware,
  async (req: AuthRequest, res) => {
  try {
    const stripe = getStripeClient();
    const baseUrl = getBaseUrl(req);
    const body = req.body || {};
    const target = resolveCheckoutTarget(body);
    const priceId = String(target.priceId || "").trim();
    const email = String(body.email || "").trim();
    const organizationId =
      req.auth?.organizationId || getAuthOrganizationId(req) || undefined;

    if (!priceId) {
      return res
        .status(400)
        .json({ error: "Missing Stripe price id. Configure STRIPE_PRICE_ID." });
    }

    const successUrl = String(
      body.successUrl || `${baseUrl}/register?billing=success`
    );
    const cancelUrl = String(body.cancelUrl || `${baseUrl}/?billing=cancelled`);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      ...(organizationId ? { client_reference_id: organizationId } : {}),
      ...(email ? { customer_email: email } : {}),
      metadata: {
        source: "landing_page",
        planTier: target.planTier,
        priceId,
        ...(organizationId ? { organizationId } : {}),
      },
    });

    return res.json({
      id: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    return res.status(500).json({
      error: "Failed to create checkout session",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/billing/sync-checkout-session", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const sessionId = String((req.body || {}).sessionId || "").trim();
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "subscription"],
    });
    await applyCheckoutSessionToOrganization(session, organizationId);
    return res.json({ ok: true });
  } catch (error) {
    console.error("sync-checkout-session:", error);
    const message = error instanceof Error ? error.message : "Sync failed";
    if (message.includes("does not match")) {
      return res.status(403).json({ error: message });
    }
    return res.status(500).json({
      error: "Failed to sync checkout session",
      message,
    });
  }
});

router.get("/billing/status", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const org = await storage.getOrganizationBilling(organizationId);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }
    // #region agent log
    {
      const resolved = resolveOrganizationPlanTier(org);
      const baseOnly = normalizePlanTier(org.planTier, org.plan);
      const fromStripe = inferPlanTierFromStripePriceId(
        org.stripePriceId == null ? null : String(org.stripePriceId)
      );
      const priceTail =
        org.stripePriceId == null
          ? ""
          : String(org.stripePriceId).slice(-8);
      fetch("http://127.0.0.1:7520/ingest/529b7cc2-88c7-4df6-9032-42107fab9a7e", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "24a4ce",
        },
        body: JSON.stringify({
          sessionId: "24a4ce",
          runId: "pre-fix",
          hypothesisId: "H1-H5",
          location: "server/routes/billing.ts:GET /billing/status",
          message: "Billing status resolved tiers",
          data: {
            organizationId,
            resolved,
            baseOnly,
            fromStripe,
            dbPlanTier: String(org.planTier ?? ""),
            dbPlan: String(org.plan ?? ""),
            stripePriceIdTail: priceTail,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
    return res.json({
      organizationId: org.id,
      plan: org.plan || "trial",
      planTier: resolveOrganizationPlanTier(org),
      subscriptionStatus: org.subscriptionStatus || "trialing",
      trialEndsAt: org.trialEndsAt || null,
      stripeCustomerId: org.stripeCustomerId || null,
      stripeSubscriptionId: org.stripeSubscriptionId || null,
      stripePriceId: org.stripePriceId || null,
      billingEmail: org.billingEmail || null,
      subscriptionCurrentPeriodEnd: org.subscriptionCurrentPeriodEnd || null,
    });
  } catch (error) {
    console.error("Error fetching billing status:", error);
    return res.status(500).json({ error: "Failed to fetch billing status" });
  }
});

router.post("/billing/webhook", async (req, res) => {
  try {
    let payload: any = req.body || {};
    const stripeSignature = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (
      webhookSecret &&
      stripeSignature &&
      typeof stripeSignature === "string" &&
      Buffer.isBuffer(req.body)
    ) {
      const stripe = getStripeClient();
      payload = stripe.webhooks.constructEvent(
        req.body,
        stripeSignature,
        webhookSecret
      );
    }

    const eventType = String(payload.type || "");
    const eventObject = payload?.data?.object || {};

    if (!eventType) {
      return res.status(400).json({ error: "Invalid Stripe event payload" });
    }

    if (eventType === "checkout.session.completed") {
      const session = eventObject as Stripe.Checkout.Session;
      const metadataOrgId =
        String(session?.metadata?.organizationId || "").trim() ||
        String(session?.client_reference_id || "").trim();
      if (metadataOrgId) {
        try {
          await applyCheckoutSessionToOrganization(session, metadataOrgId);
        } catch (e) {
          console.error("checkout.session.completed apply failed:", e);
        }
      }
    }

    if (
      eventType === "customer.subscription.created" ||
      eventType === "customer.subscription.updated" ||
      eventType === "customer.subscription.deleted"
    ) {
      const customerId = String(eventObject?.customer || "").trim();
      const subscriptionId = String(eventObject?.id || "").trim() || null;
      const priceId =
        String(eventObject?.items?.data?.[0]?.price?.id || "").trim() || null;
      const currentPeriodEndUnix = Number(eventObject?.current_period_end || 0);
      const currentPeriodEnd =
        currentPeriodEndUnix > 0 ? new Date(currentPeriodEndUnix * 1000) : null;
      const mapped = mapStripeSubscriptionStatus(String(eventObject?.status || ""));
      const inferredTier = inferPlanTierFromStripePriceId(priceId);
      let resolvedTier =
        mapped.subscriptionStatus === "active" || mapped.subscriptionStatus === "trialing"
          ? inferredTier
          : "starter";

      if (customerId) {
        const existing =
          await storage.getOrganizationBillingByStripeCustomerId(customerId);
        const activeOrTrialing =
          mapped.subscriptionStatus === "active" ||
          mapped.subscriptionStatus === "trialing";
        if (
          existing &&
          activeOrTrialing &&
          resolvedTier === "starter" &&
          isStripePriceIdUnmappedInEnv(priceId)
        ) {
          const prior = normalizePlanTier(existing.planTier, existing.plan);
          if (prior === "pro" || prior === "ai") {
            resolvedTier = prior;
          }
        }

        await storage.updateOrganizationBillingByStripeCustomerId(customerId, {
          plan: getPlanFromTier(resolvedTier),
          planTier: resolvedTier,
          subscriptionStatus: mapped.subscriptionStatus,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: priceId,
          subscriptionCurrentPeriodEnd: currentPeriodEnd,
        });
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return res.status(500).json({
      error: "Failed to process Stripe webhook",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
