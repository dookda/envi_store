import Link from "next/link";
import Image from "next/image";
import type { EquipmentItem } from "@prisma/client";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

export type EquipmentCardItem = Pick<
  EquipmentItem,
  | "id"
  | "equipmentName"
  | "model"
  | "customerName"
  | "location"
  | "latitude"
  | "longitude"
  | "image"
  | "inUse"
  | "expiredAt"
>;

function RemainDays({ expiredAt }: { expiredAt: Date }) {
  const days = Math.ceil((expiredAt.getTime() - Date.now()) / 86_400_000);
  if (days > 30) return <p className="flex items-center gap-1 text-xs text-success"><Icon name="schedule" size={14} /> เหลืออีก {days} วัน</p>;
  if (days > 0)  return <p className="flex items-center gap-1 text-xs text-warning"><Icon name="schedule" size={14} /> เหลืออีก {days} วัน</p>;
  if (days === 0) return <p className="flex items-center gap-1 text-xs text-danger"><Icon name="schedule" size={14} /> วันนี้</p>;
  return <p className="flex items-center gap-1 text-xs text-danger"><Icon name="schedule" size={14} /> เกินกำหนด {Math.abs(days)} วัน</p>;
}

export default function EquipmentCard({ item }: { item: EquipmentCardItem }) {
  return (
    <Link href={`/equipment/${item.id}`}>
      <div className="relative overflow-hidden rounded-card border border-border bg-surface transition-shadow hover:shadow-sm">

        {item.inUse && (
          <Badge variant="success" className="absolute right-2 top-2 z-10 h-5 w-5 p-0">
            <Icon name="check" size={12} />
          </Badge>
        )}

        {item.image && (
          <div className="relative aspect-video w-full bg-surface-sunken">
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${item.image}`}
              alt={item.equipmentName}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        )}

        <div className="p-4">
          <p className="truncate font-semibold text-text-primary">{item.equipmentName}</p>
          <p className="mt-0.5 text-xs text-text-muted">{item.model}</p>
          <div className="mt-3 space-y-1">
            <p className="flex items-center gap-1 text-xs text-text-secondary">
              <Icon name="person" size={14} />
              {item.customerName}
            </p>
            <p className="flex items-center gap-1 text-xs text-text-secondary">
              <Icon name="location_on" size={14} />
              {item.latitude != null && item.longitude != null
                ? `${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`
                : item.location}
            </p>
            {item.inUse && item.expiredAt ? <RemainDays expiredAt={item.expiredAt} /> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
