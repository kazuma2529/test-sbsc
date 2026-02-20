import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    return NextResponse.json({
      slackWebhookUrl: user.slackWebhookUrl,
      notifyDaysBefore: user.notifyDaysBefore,
      darkMode: user.darkMode,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { slackWebhookUrl, notifyDaysBefore, darkMode } = body;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        slackWebhookUrl: slackWebhookUrl || null,
        notifyDaysBefore: notifyDaysBefore || "7,3,1",
        darkMode: darkMode ?? user.darkMode,
      },
    });

    return NextResponse.json({
      slackWebhookUrl: updated.slackWebhookUrl,
      notifyDaysBefore: updated.notifyDaysBefore,
      darkMode: updated.darkMode,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
