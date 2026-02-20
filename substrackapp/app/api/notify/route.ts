import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runNotifications();
}

export async function POST(request: NextRequest) {
  // Allow manual trigger for testing
  return runNotifications();
}

async function runNotifications() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const users = await prisma.user.findMany({
    where: { slackWebhookUrl: { not: null } },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
      },
    },
  });

  let notificationsSent = 0;

  for (const user of users) {
    if (!user.slackWebhookUrl) continue;

    const notifyDays = user.notifyDaysBefore
      .split(",")
      .map((d) => parseInt(d.trim()))
      .filter((d) => !isNaN(d));

    for (const sub of user.subscriptions) {
      const expiresAt = new Date(sub.expiresAt);
      expiresAt.setHours(0, 0, 0, 0);

      const diffMs = expiresAt.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (notifyDays.includes(diffDays)) {
        const categoryLabels: Record<string, string> = {
          AI: "AI",
          ENTERTAINMENT: "エンタメ",
          MUSIC: "音楽",
          OTHER: "その他",
        };

        const planLabel = sub.planType === "FREE" ? "無料" : "有料";
        const categoryLabel = categoryLabels[sub.category] || sub.category;
        const dateStr = expiresAt.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });

        let message = `🔔 SubsTrack リマインダー\n━━━━━━━━━━━━━━\n📌 ${sub.name}（${categoryLabel}・${planLabel}）\n`;

        if (sub.planType === "PAID" && sub.amount > 0) {
          const cycleLabel = sub.billingCycle === "YEARLY" ? "年" : "月";
          message += `💰 ¥${sub.amount.toLocaleString()}/${cycleLabel}\n`;
        }

        const remainingText = diffDays === 0 ? "本日" : `残り${diffDays}日`;
        message += `📅 期限日：${dateStr}（${remainingText}）`;

        try {
          await fetch(user.slackWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: message }),
          });
          notificationsSent++;
        } catch (err) {
          console.error(`Failed to send Slack notification for ${sub.name}:`, err);
        }
      }
    }

    // Auto-renew expired PAID subscriptions and expire FREE subscriptions
    for (const sub of user.subscriptions) {
      const expiresAt = new Date(sub.expiresAt);
      expiresAt.setHours(0, 0, 0, 0);

      if (expiresAt <= today) {
        if (sub.planType === "FREE") {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "EXPIRED" },
          });
        } else {
          const newExpiry = new Date(expiresAt);
          if (sub.billingCycle === "YEARLY") {
            newExpiry.setFullYear(newExpiry.getFullYear() + 1);
          } else {
            newExpiry.setMonth(newExpiry.getMonth() + 1);
          }
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { expiresAt: newExpiry },
          });
        }
      }
    }
  }

  return NextResponse.json({ success: true, notificationsSent });
}
