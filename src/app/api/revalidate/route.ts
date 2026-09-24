// src/app/api/revalidate/route.ts
// ────────────────────────────────────────────────────────────────────────────
//  Webhook de revalidation Next.js App Router (Phase 6).
//  Écoute les webhooks Shopify (products/create|update|delete,
//  collections/create|update|delete) et invalide le cache à la demande via
//  revalidateTag() / revalidatePath().
//  Sécurité : signature HMAC-SHA256 du corps brut vérifiée en temps constant
//  contre SHOPIFY_WEBHOOK_SECRET (header x-shopify-hmac-sha256).
// ────────────────────────────────────────────────────────────────────────────

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

const HMAC_HEADER = "x-shopify-hmac-sha256";
const TOPIC_HEADER = "x-shopify-topic";

/** Topics supportés et invaldations associées. */
function planForTopic(topic: string): {
  tags: string[];
  paths: string[];
} | null {
  const t = topic.trim().toLowerCase();
  if (t.startsWith("products/")) {
    return {
      tags: ["products"],
      paths: ["/", "/collections", "/lookbook"],
    };
  }
  if (t.startsWith("collections/")) {
    return {
      tags: ["collections", "products"],
      // Le lookbook est piloté par une collection Shopify réelle : une MAJ de
      // collection doit donc rafraîchir /lookbook au même titre que /collections.
      paths: ["/", "/collections", "/lookbook"],
    };
  }
  return null;
}

/** Comparaison temps constant (anti timing-attack) sur deux buffers. */
function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Webhook non configuré (SHOPIFY_WEBHOOK_SECRET manquant)." },
      { status: 500 },
    );
  }

  const topic = request.headers.get(TOPIC_HEADER) ?? "";
  const receivedHmac = request.headers.get(HMAC_HEADER) ?? "";

  if (!topic) {
    return NextResponse.json(
      { ok: false, error: "Header x-shopify-topic manquant." },
      { status: 400 },
    );
  }

  if (!receivedHmac) {
    return NextResponse.json(
      { ok: false, error: "Header x-shopify-hmac-sha256 manquant." },
      { status: 401 },
    );
  }

  // Le corps DOIT rester brut pour le calcul HMAC (pas de request.json() avant).
  const rawBody = await request.text();

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  const valid = safeEqual(
    Buffer.from(receivedHmac, "utf8"),
    Buffer.from(expected, "utf8"),
  );

  if (!valid) {
    return NextResponse.json(
      { ok: false, error: "Signature HMAC invalide." },
      { status: 401 },
    );
  }

  const plan = planForTopic(topic);

  if (!plan) {
    return NextResponse.json(
      { ok: false, error: `Topic non supporté : ${topic}.` },
      { status: 400 },
    );
  }

  // Payload JSON : on tente de lire le handle pour une invalidation chirurgicale.
  let handle: string | null = null;
  try {
    const payload = JSON.parse(rawBody) as { handle?: unknown };
    if (typeof payload.handle === "string" && payload.handle.length > 0) {
      handle = payload.handle;
    }
  } catch {
    handle = null;
  }

  for (const tag of plan.tags) {
    // Webhook externe (hors Server Action) → expiration immédiate.
    // Cf. docs Next 16 : revalidateTag(tag, { expire: 0 }).
    revalidateTag(tag, { expire: 0 });
  }
  for (const path of plan.paths) {
    revalidatePath(path);
  }
  if (handle) {
    if (topic.toLowerCase().startsWith("products/")) {
      revalidateTag(`product-${handle}`, { expire: 0 });
      revalidatePath(`/products/${handle}`);
    } else {
      revalidateTag(`collection-${handle}`, { expire: 0 });
    }
  }

  return NextResponse.json({
    ok: true,
    revalidated: true,
    topic,
    tags: plan.tags,
    paths: plan.paths,
    handle,
  });
}
