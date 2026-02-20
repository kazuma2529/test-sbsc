import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { Category, PlanType, BillingCycle, Status } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const planType = searchParams.get("planType");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "expiresAt";

    const where: any = { userId: user.id };
    if (category && category !== "ALL") where.category = category as Category;
    if (planType && planType !== "ALL") where.planType = planType as PlanType;
    if (status && status !== "ALL") where.status = status as Status;

    const subscriptions = await prisma.subscription.findMany({
      where,
      orderBy:
        sort === "amount"
          ? { amount: "desc" }
          : { expiresAt: "asc" },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, category, planType, amount, billingCycle, expiresAt, memo } = body;

    if (!name || !category || !planType || !expiresAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        name,
        category: category as Category,
        planType: planType as PlanType,
        amount: planType === "FREE" ? 0 : (amount || 0),
        billingCycle: planType === "PAID" ? (billingCycle as BillingCycle) : null,
        expiresAt: new Date(expiresAt),
        memo,
      },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
