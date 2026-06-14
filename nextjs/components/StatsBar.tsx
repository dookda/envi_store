import { prisma } from "@/lib/db/prisma";
import { Icon } from "@/components/ui/icon";
import type { getT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  iconColor: string;
  iconBg: string;
  valueColor?: string;
}

function StatCard({ label, value, icon, iconColor, iconBg, valueColor }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-4">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", iconBg)}>
        <Icon name={icon} size={20} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className={cn("text-2xl font-bold leading-none", valueColor ?? "text-text-primary")}>{value}</p>
        <p className="mt-1 truncate text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}

interface Props {
  t: ReturnType<typeof getT>;
}

export default async function StatsBar({ t }: Props) {
  const now  = new Date();
  const soon = new Date(now.getTime() + 30 * 86_400_000);

  const [total, inUse, expiringSoon, expired] = await Promise.all([
    prisma.equipmentItem.count({ where: { isArchived: false } }),
    prisma.equipmentItem.count({ where: { isArchived: false, inUse: true } }),
    prisma.equipmentItem.count({ where: { isArchived: false, inUse: true, expiredAt: { gt: now, lte: soon } } }),
    prisma.equipmentItem.count({ where: { isArchived: false, inUse: true, expiredAt: { lte: now } } }),
  ]);

  const cards: StatCardProps[] = [
    {
      label:      t.statsTotal,
      value:      total,
      icon:       "devices",
      iconColor:  "text-brand",
      iconBg:     "bg-brand/10",
    },
    {
      label:      t.statsInUse,
      value:      inUse,
      icon:       "check_circle",
      iconColor:  "text-success",
      iconBg:     "bg-success/10",
      valueColor: "text-success",
    },
    {
      label:      t.statsExpiringSoon,
      value:      expiringSoon,
      icon:       "schedule",
      iconColor:  "text-warning",
      iconBg:     "bg-warning/10",
      valueColor: expiringSoon > 0 ? "text-warning" : undefined,
    },
    {
      label:      t.statsExpired,
      value:      expired,
      icon:       "warning",
      iconColor:  "text-danger",
      iconBg:     "bg-danger/10",
      valueColor: expired > 0 ? "text-danger" : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
