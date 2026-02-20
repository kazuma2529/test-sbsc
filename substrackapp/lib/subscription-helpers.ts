export const CATEGORY_LABELS: Record<string, string> = {
  AI: "AI",
  ENTERTAINMENT: "エンタメ",
  MUSIC: "音楽",
  OTHER: "その他",
};

export const CATEGORY_COLORS: Record<string, string> = {
  AI: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  ENTERTAINMENT:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  MUSIC: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "有効",
  PAUSED: "一時停止",
  CANCELLED: "解約済み",
  EXPIRED: "期限切れ",
};

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  PAUSED:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  EXPIRED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export function getDaysRemaining(expiresAt: string | Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiresAt);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatAmount(amount: number, billingCycle?: string | null): string {
  if (amount === 0) return "無料";
  const cycle = billingCycle === "YEARLY" ? "年" : "月";
  return `¥${amount.toLocaleString()}/${cycle}`;
}

export function getMonthlyAmount(amount: number, billingCycle?: string | null): number {
  if (!billingCycle || amount === 0) return 0;
  if (billingCycle === "YEARLY") return Math.round(amount / 12);
  return amount;
}
