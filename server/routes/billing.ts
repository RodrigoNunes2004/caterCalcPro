import { Router, type Request } from "express";
import Stripe from "stripe";
import { storage } from "../storage.js";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";
import { verifyToken } from "../lib/auth.js";

const router = Router();

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
} {
  const s = String(status || "").toLowerCase();
  if (s === "active" || s === "trialing") {
    return { subscriptionStatus: s, plan: "pro" };
  }
  if (s === "past_due" || s === "unpaid" || s === "incomplete") {
    return { subscriptionStatus: s, plan: "trial" };
  }
  if (s === "canceled" || s === "cancelled") {
    return { subscriptionStatus: "cancelled", plan: "trial" };
  }
  return { subscriptionStatus: s || "trialing", plan: "trial" };
}

function getAuthOrganizationId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  const token =
    authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : (req as any).cookies?.token;
  const payload = token ? verifyToken(token) : null;
  return payload?.organizationId || null;
}

router.get("/billing/config", (_req, res) => {
  res.json({
    enabled: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    defaultPriceId: process.env.STRIPE_PRICE_ID || null,
  });
});

router.post("/billing/create-checkout-session", async (req, res) => {
  try {
    const stripe = getStripeClient();
    const baseUrl = getBaseUrl(req);
    const body = req.body || {};
    const priceId = String(body.priceId || process.env.STRIPE_PRICE_ID || "").trim();
    const email = String(body.email || "").trim();
    const organizationId = getAuthOrganizationId(req);

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

router.get("/billing/status", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const org = await storage.getOrganizationBilling(organizationId);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }
    return res.json({
      organizationId: org.id,
      plan: org.plan || "trial",
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
      const metadataOrgId =
        String(eventObject?.metadata?.organizationId || "").trim() ||
        String(eventObject?.client_reference_id || "").trim();
      const customerId = String(eventObject?.customer || "").trim() || null;
      const subscriptionId = String(eventObject?.subscription || "").trim() || null;
      const billingEmail = String(
        eventObject?.customer_details?.email || eventObject?.customer_email || ""
      ).trim() || null;

      if (metadataOrgId) {
        await storage.updateOrganizationBillingById(metadataOrgId, {
          plan: "pro",
          subscriptionStatus: "active",
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: String(eventObject?.metadata?.priceId || "") || null,
          billingEmail,
        });
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

      if (customerId) {
        await storage.updateOrganizationBillingByStripeCustomerId(customerId, {
          plan: mapped.plan,
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
