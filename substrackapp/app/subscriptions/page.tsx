"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  getDaysRemaining,
  formatDate,
  formatAmount,
} from "@/lib/subscription-helpers";
import {
  Plus,
  Pencil,
  Trash2,
  Gift,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

interface Subscription {
  id: string;
  name: string;
  category: string;
  planType: string;
  amount: number;
  billingCycle: string | null;
  expiresAt: string;
  status: string;
  memo: string | null;
}

export default function SubscriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [sortBy, setSortBy] = useState("expiresAt");

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      category: categoryFilter,
      planType: planFilter,
      status: statusFilter,
      sort: sortBy,
    });
    const res = await fetch(`/api/subscriptions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setSubscriptions(data);
    }
    setLoading(false);
  }, [categoryFilter, planFilter, statusFilter, sortBy]);

  useEffect(() => {
    if (session) fetchSubscriptions();
  }, [session, fetchSubscriptions]);

  if (status === "loading") return null;
  if (!session) {
    router.push("/login");
    return null;
  }

  async function handleDelete(id: string) {
    if (!confirm("このサブスクを削除しますか？")) return;
    const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    if (res.ok) fetchSubscriptions();
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">サブスク一覧</h1>
          <Link href="/subscriptions/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              追加
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="カテゴリ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全カテゴリ</SelectItem>
              <SelectItem value="AI">AI</SelectItem>
              <SelectItem value="ENTERTAINMENT">エンタメ</SelectItem>
              <SelectItem value="MUSIC">音楽</SelectItem>
              <SelectItem value="OTHER">その他</SelectItem>
            </SelectContent>
          </Select>

          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="プランタイプ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全プラン</SelectItem>
              <SelectItem value="FREE">無料</SelectItem>
              <SelectItem value="PAID">有料</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全ステータス</SelectItem>
              <SelectItem value="ACTIVE">有効</SelectItem>
              <SelectItem value="PAUSED">一時停止</SelectItem>
              <SelectItem value="CANCELLED">解約済み</SelectItem>
              <SelectItem value="EXPIRED">期限切れ</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="並び順" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expiresAt">期限日が近い順</SelectItem>
              <SelectItem value="amount">金額が高い順</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            読み込み中...
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              サブスクが登録されていません
            </p>
            <Link href="/subscriptions/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                最初のサブスクを追加
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((sub) => {
              const daysRemaining = getDaysRemaining(sub.expiresAt);
              const isUrgent = daysRemaining <= 7 && daysRemaining >= 0;
              const isExpired = daysRemaining < 0;

              return (
                <Card
                  key={sub.id}
                  className={`transition-all hover:shadow-md ${
                    isUrgent ? "border-orange-300 dark:border-orange-700" : ""
                  } ${isExpired ? "opacity-70" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base truncate">
                            {sub.name}
                          </h3>
                          {isUrgent && (
                            <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              CATEGORY_COLORS[sub.category]
                            }`}
                          >
                            {CATEGORY_LABELS[sub.category]}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              sub.planType === "FREE"
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            }`}
                          >
                            {sub.planType === "FREE" ? (
                              <Gift className="h-3 w-3" />
                            ) : (
                              <CreditCard className="h-3 w-3" />
                            )}
                            {sub.planType === "FREE" ? "無料" : "有料"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              STATUS_COLORS[sub.status]
                            }`}
                          >
                            {STATUS_LABELS[sub.status]}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {sub.planType === "PAID" && (
                            <span className="font-medium text-foreground">
                              {formatAmount(sub.amount, sub.billingCycle)}
                            </span>
                          )}
                          <span>
                            期限: {formatDate(sub.expiresAt)}
                            {daysRemaining >= 0 ? (
                              <span
                                className={`ml-1 ${
                                  isUrgent
                                    ? "text-orange-600 font-medium"
                                    : "text-muted-foreground"
                                }`}
                              >
                                （残り{daysRemaining}日）
                              </span>
                            ) : (
                              <span className="ml-1 text-red-500">
                                （{Math.abs(daysRemaining)}日超過）
                              </span>
                            )}
                          </span>
                        </div>
                        {sub.memo && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {sub.memo}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Link href={`/subscriptions/${sub.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(sub.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
