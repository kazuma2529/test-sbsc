"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  getDaysRemaining,
  formatDate,
  formatAmount,
  getMonthlyAmount,
} from "@/lib/subscription-helpers";
import { TrendingUp, AlertTriangle, Gift, CreditCard, Plus } from "lucide-react";

interface Subscription {
  id: string;
  name: string;
  category: string;
  planType: string;
  amount: number;
  billingCycle: string | null;
  expiresAt: string;
  status: string;
}

const CHART_COLORS: Record<string, string> = {
  AI: "#3b82f6",
  ENTERTAINMENT: "#8b5cf6",
  MUSIC: "#22c55e",
  OTHER: "#6b7280",
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetch("/api/subscriptions?status=ACTIVE")
      .then((res) => res.json())
      .then((data) => {
        setSubscriptions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  if (status === "loading") return null;
  if (!session) {
    router.push("/login");
    return null;
  }

  const paidSubscriptions = subscriptions.filter((s) => s.planType === "PAID");
  const freeSubscriptions = subscriptions.filter((s) => s.planType === "FREE");

  const monthlyTotal = paidSubscriptions.reduce(
    (sum, s) => sum + getMonthlyAmount(s.amount, s.billingCycle),
    0
  );
  const yearlyTotal = monthlyTotal * 12;

  const categoryData = Object.entries(CATEGORY_LABELS)
    .map(([key, label]) => {
      const amount = paidSubscriptions
        .filter((s) => s.category === key)
        .reduce(
          (sum, s) => sum + getMonthlyAmount(s.amount, s.billingCycle),
          0
        );
      return { name: label, value: amount, key };
    })
    .filter((d) => d.value > 0);

  const upcomingExpirations = subscriptions
    .filter((s) => {
      const days = getDaysRemaining(s.expiresAt);
      return days >= 0 && days <= 30;
    })
    .sort(
      (a, b) =>
        new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">ダッシュボード</h1>
            <p className="text-sm text-muted-foreground mt-1">
              サブスクリプションの概要
            </p>
          </div>
          <Link href="/subscriptions/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              追加
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            読み込み中...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">今月の合計</span>
                  </div>
                  <p className="text-2xl font-bold">
                    ¥{monthlyTotal.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    月額換算（有料のみ）
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">年間コスト予測</span>
                  </div>
                  <p className="text-2xl font-bold">
                    ¥{yearlyTotal.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">年額換算</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-xs">有料プラン</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {paidSubscriptions.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">件</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Gift className="h-4 w-4" />
                    <span className="text-xs">無料プラン</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {freeSubscriptions.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">件</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">カテゴリ別支出</CardTitle>
                  <CardDescription>有料プランの月額換算</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryData.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                      有料プランが登録されていません
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, value }) =>
                            `${name}: ¥${value.toLocaleString()}`
                          }
                          labelLine={true}
                        >
                          {categoryData.map((entry) => (
                            <Cell
                              key={entry.key}
                              fill={CHART_COLORS[entry.key] || "#6b7280"}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number | string | undefined) =>
                            `¥${Number(value ?? 0).toLocaleString()}/月`
                          }
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    30日以内に期限が来るサブスク
                  </CardTitle>
                  <CardDescription>
                    {upcomingExpirations.length > 0
                      ? `${upcomingExpirations.length}件のサブスクが期限に近づいています`
                      : "期限が近いサブスクはありません"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingExpirations.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      期限が近いサブスクはありません
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {upcomingExpirations.map((sub) => {
                        const daysRemaining = getDaysRemaining(sub.expiresAt);
                        const isUrgent = daysRemaining <= 7;
                        return (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between gap-3 py-2 border-b last:border-0"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {sub.planType === "FREE" ? (
                                <Gift className="h-4 w-4 text-orange-500 flex-shrink-0" />
                              ) : (
                                <CreditCard className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {sub.name}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                                      CATEGORY_COLORS[sub.category]
                                    }`}
                                  >
                                    {CATEGORY_LABELS[sub.category]}
                                  </span>
                                  {sub.planType === "PAID" &&
                                    sub.amount > 0 && (
                                      <span className="text-xs text-muted-foreground">
                                        {formatAmount(
                                          sub.amount,
                                          sub.billingCycle
                                        )}
                                      </span>
                                    )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-muted-foreground">
                                {formatDate(sub.expiresAt)}
                              </p>
                              <p
                                className={`text-xs font-medium ${
                                  isUrgent
                                    ? "text-orange-600"
                                    : "text-muted-foreground"
                                }`}
                              >
                                残り{daysRemaining}日
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {subscriptions.length === 0 && (
              <div className="text-center py-8 border rounded-xl border-dashed">
                <p className="text-muted-foreground mb-4">
                  サブスクがまだ登録されていません
                </p>
                <Link href="/subscriptions/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    最初のサブスクを追加
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
