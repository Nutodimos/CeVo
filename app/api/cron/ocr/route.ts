import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processVoteVerification } from "@/lib/verification";

// Ensure this runs on Node.js runtime (not Edge) — Gemini needs it
export const runtime = "nodejs";
export const maxDuration = 60; // seconds — Vercel Pro allows up to 300
export const dynamic = "force-dynamic"; // Prevent static caching of DB calls

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // In production, CRON_SECRET must always be set — refuse to run without it.
  if (process.env.NODE_ENV === "production" && !cronSecret) {
    console.error("[CRON] CRON_SECRET is not set in production. Refusing to run.");
    return NextResponse.json(
      { error: "Server misconfiguration: CRON_SECRET is required in production." },
      { status: 500 }
    );
  }

  // Validate the bearer token whenever a secret is configured.
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  console.log("[CRON] Verification sweep-up batch triggered at", new Date().toISOString());

  try {
    // Find all rows stuck at pending_ocr for more than 5 minutes
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const stuckVotes = await prisma.pendingVote.findMany({
      where: {
        status: "pending_ocr",
        updatedAt: { lt: fiveMinsAgo }
      },
      take: 20 // Process a small batch to respect rate limits (15 RPM free tier)
    });

    let processed = 0;

    for (const vote of stuckVotes) {
      await processVoteVerification(vote.id);
      processed++;
      // simple backoff to respect Gemini free tier limits
      await new Promise(r => setTimeout(r, 4000));
    }

    console.log(`[CRON] Sweep-up complete. Processed ${processed} stuck rows.`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processed,
    });
  } catch (error) {
    console.error("[CRON] Sweep-up batch failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
