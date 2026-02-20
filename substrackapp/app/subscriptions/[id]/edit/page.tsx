"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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

export default function EditSubscriptionPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "",
    planType: "PAID",
    amount: "",
    billingCycle: "MONTHLY",
    expiresAt: "",
    subscriptionStatus: "ACTIVE",
    memo: "",
  });

  useEffect(() => {
    if (!session) return;
    fetch(`/api/subscriptions/${params.id}`)
      .then((res) => res.json())
      .then((data: Subscription) => {
        setForm({
          name: data.name,
          category: data.category,
          planType: data.planType,
          amount: data.amount?.toString() || "",
          billingCycle: data.billingCycle || "MONTHLY",
          expiresAt: new Date(data.expiresAt).toISOString().split("T")[0],
          subscriptionStatus: data.status,
          memo: data.memo || "",
        });
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [session, params.id]);

  if (status === "loading" || fetching) return null;
  if (!session) {
    router.push("/login");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/subscriptions/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        planType: form.planType,
        amount: form.planType === "PAID" ? parseInt(form.amount) || 0 : 0,
        billingCycle: form.planType === "PAID" ? form.billingCycle : null,
        expiresAt: form.expiresAt,
        status: form.subscriptionStatus,
        memo: form.memo,
      }),
    });

    if (res.ok) {
      router.push("/subscriptions");
    } else {
      const data = await res.json();
      setError(data.error || "更新に失敗しました");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/subscriptions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">サブスクを編集</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">サービス名 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">カテゴリ *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, category: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AI">AI</SelectItem>
                    <SelectItem value="ENTERTAINMENT">エンタメ</SelectItem>
                    <SelectItem value="MUSIC">音楽</SelectItem>
                    <SelectItem value="OTHER">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>プランタイプ</Label>
                <RadioGroup
                  value={form.planType}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, planType: v }))
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="FREE" id="free" />
                    <Label htmlFor="free">無料</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="PAID" id="paid" />
                    <Label htmlFor="paid">有料</Label>
                  </div>
                </RadioGroup>
              </div>

              {form.planType === "PAID" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="amount">金額（円）</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>請求サイクル</Label>
                    <RadioGroup
                      value={form.billingCycle}
                      onValueChange={(v) =>
                        setForm((prev) => ({ ...prev, billingCycle: v }))
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="MONTHLY" id="edit-monthly" />
                        <Label htmlFor="edit-monthly">月次</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="YEARLY" id="edit-yearly" />
                        <Label htmlFor="edit-yearly">年次</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="expiresAt">期限日 *</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      expiresAt: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscriptionStatus">ステータス</Label>
                <Select
                  value={form.subscriptionStatus}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, subscriptionStatus: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">有効</SelectItem>
                    <SelectItem value="PAUSED">一時停止</SelectItem>
                    <SelectItem value="CANCELLED">解約済み</SelectItem>
                    <SelectItem value="EXPIRED">期限切れ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo">メモ（任意）</Label>
                <Textarea
                  id="memo"
                  value={form.memo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, memo: e.target.value }))
                  }
                  rows={3}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/subscriptions")}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "更新中..." : "更新する"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
