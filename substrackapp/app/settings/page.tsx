"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Bell, Slack, Moon, Sun, Save } from "lucide-react";

const NOTIFY_OPTIONS = [
  { value: "30", label: "30日前" },
  { value: "14", label: "14日前" },
  { value: "7", label: "7日前" },
  { value: "3", label: "3日前" },
  { value: "1", label: "1日前" },
  { value: "0", label: "当日" },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>(["7", "3", "1"]);
  const [testingSlack, setTestingSlack] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSlackWebhookUrl(data.slackWebhookUrl || "");
        if (data.notifyDaysBefore) {
          setSelectedDays(data.notifyDaysBefore.split(",").map((d: string) => d.trim()));
        }
      });
  }, [session]);

  if (status === "loading") return null;
  if (!session) {
    router.push("/login");
    return null;
  }

  function toggleDay(value: string) {
    setSelectedDays((prev) =>
      prev.includes(value)
        ? prev.filter((d) => d !== value)
        : [...prev, value]
    );
  }

  async function handleSave() {
    setLoading(true);
    setSaved(false);

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slackWebhookUrl: slackWebhookUrl || null,
        notifyDaysBefore: selectedDays.sort((a, b) => Number(b) - Number(a)).join(","),
        darkMode: theme === "dark",
      }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setLoading(false);
  }

  async function handleTestSlack() {
    if (!slackWebhookUrl) return;
    setTestingSlack(true);
    setTestResult(null);

    try {
      const res = await fetch(slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "🔔 SubsTrack テスト通知\n━━━━━━━━━━━━━━\nSlack通知の設定が完了しました！",
        }),
      });
      setTestResult(res.ok ? "success" : "error");
    } catch {
      setTestResult("error");
    }
    setTestingSlack(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">設定</h1>

        <div className="space-y-6">
          {/* Slack Webhook */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Slack className="h-4 w-4" />
                Slack通知
              </CardTitle>
              <CardDescription>
                Slack Incoming Webhook URLを設定して通知を受け取る
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slack-url">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="slack-url"
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={slackWebhookUrl}
                    onChange={(e) => setSlackWebhookUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleTestSlack}
                    disabled={!slackWebhookUrl || testingSlack}
                  >
                    {testingSlack ? "送信中..." : "テスト"}
                  </Button>
                </div>
                {testResult === "success" && (
                  <p className="text-sm text-green-600">テスト通知を送信しました</p>
                )}
                {testResult === "error" && (
                  <p className="text-sm text-destructive">
                    送信に失敗しました。URLを確認してください
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  空にするとSlack通知が無効になります
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Timing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />
                通知タイミング
              </CardTitle>
              <CardDescription>
                期限の何日前に通知するか選択（複数選択可）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {NOTIFY_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      id={`notify-${option.value}`}
                      checked={selectedDays.includes(option.value)}
                      onCheckedChange={() => toggleDay(option.value)}
                    />
                    <Label
                      htmlFor={`notify-${option.value}`}
                      className="cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                毎日朝9時（JST）に通知チェックを実行します
              </p>
            </CardContent>
          </Card>

          {/* Dark Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                ダークモード
              </CardTitle>
              <CardDescription>
                アプリの外観を切り替える
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
                  }
                />
                <Moon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {theme === "dark" ? "ダークモード" : "ライトモード"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            className="w-full gap-2"
            disabled={loading}
          >
            <Save className="h-4 w-4" />
            {loading ? "保存中..." : saved ? "保存しました！" : "設定を保存"}
          </Button>
        </div>
      </main>
    </div>
  );
}
