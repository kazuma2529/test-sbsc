"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { ArrowLeft, Gift, CreditCard } from "lucide-react";
import Link from "next/link";

function getDefaultExpiry(planType: "FREE" | "PAID") {
  const date = new Date();
  if (planType === "FREE") {
    date.setDate(date.getDate() + 7);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString().split("T")[0];
}

export default function NewSubscriptionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState<1 | 2>(1);
  const [planType, setPlanType] = useState<"FREE" | "PAID" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    amount: "",
    billingCycle: "MONTHLY",
    expiresAt: "",
    memo: "",
  });

  if (status === "loading") return null;
  if (!session) {
    router.push("/login");
    return null;
  }

  function selectPlanType(type: "FREE" | "PAID") {
    setPlanType(type);
    setForm((prev) => ({ ...prev, expiresAt: getDefaultExpiry(type) }));
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        planType,
        amount: planType === "PAID" ? parseInt(form.amount) || 0 : 0,
        billingCycle: planType === "PAID" ? form.billingCycle : null,
        expiresAt: form.expiresAt,
        memo: form.memo,
      }),
    });

    if (res.ok) {
      router.push("/subscriptions");
    } else {
      const data = await res.json();
      setError(data.error || "登録に失敗しました");
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
          <h1 className="text-2xl font-bold">サブスクを追加</h1>
        </div>

        {/* Step 1: Plan Type Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              登録するプランタイプを選択してください
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => selectPlanType("FREE")}
                className="text-left"
              >
                <Card className="cursor-pointer hover:border-primary hover:shadow-md transition-all h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                        <Gift className="h-6 w-6 text-orange-600 dark:text-orange-300" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">無料プラン</CardTitle>
                        <CardDescription>
                          無料トライアル・フリープラン
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      無料トライアルや永続無料プランを管理します。
                      デフォルトの期限は登録日から7日後です。
                    </p>
                  </CardContent>
                </Card>
              </button>

              <button
                onClick={() => selectPlanType("PAID")}
                className="text-left"
              >
                <Card className="cursor-pointer hover:border-primary hover:shadow-md transition-all h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                        <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">有料プラン</CardTitle>
                        <CardDescription>
                          月額・年額の有料サブスク
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      有料のサブスクリプションを管理します。
                      デフォルトの期限は登録日から1ヶ月後です。
                    </p>
                  </CardContent>
                </Card>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && planType && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  planType === "FREE"
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                }`}
              >
                {planType === "FREE" ? (
                  <Gift className="h-3 w-3" />
                ) : (
                  <CreditCard className="h-3 w-3" />
                )}
                {planType === "FREE" ? "無料プラン" : "有料プラン"}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setStep(1); setPlanType(null); }}
                className="text-xs text-muted-foreground"
              >
                変更
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">サービス名 *</Label>
                  <Input
                    id="name"
                    placeholder="例: Netflix, ChatGPT Plus"
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
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AI">AI</SelectItem>
                      <SelectItem value="ENTERTAINMENT">エンタメ</SelectItem>
                      <SelectItem value="MUSIC">音楽</SelectItem>
                      <SelectItem value="OTHER">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {planType === "PAID" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="amount">金額（円）</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="例: 1490"
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
                          <RadioGroupItem value="MONTHLY" id="monthly" />
                          <Label htmlFor="monthly">月次</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="YEARLY" id="yearly" />
                          <Label htmlFor="yearly">年次</Label>
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
                  <p className="text-xs text-muted-foreground">
                    {planType === "FREE"
                      ? "デフォルト：登録日 + 7日"
                      : "デフォルト：登録日 + 1ヶ月"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memo">メモ（任意）</Label>
                  <Textarea
                    id="memo"
                    placeholder="メモを入力..."
                    value={form.memo}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, memo: e.target.value }))
                    }
                    rows={3}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setStep(1); setPlanType(null); }}
                    className="flex-1"
                  >
                    戻る
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading || !form.name || !form.category}
                  >
                    {loading ? "登録中..." : "登録する"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}
      </main>
    </div>
  );
}
