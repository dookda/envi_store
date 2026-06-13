import Link from "next/link";
import Image from "next/image";
import type { EquipmentItem } from "@prisma/client";
import { BASE_PATH } from "@/lib/base-path";

interface Props {
  item: EquipmentItem;
}

export default function EquipmentCard({ item }: Props) {
  return (
    <Link href={`${BASE_PATH}/equipment/${item.id}`}>
      <div className="rounded-2xl border border-slate-100 bg-white transition-shadow hover:shadow-sm overflow-hidden">
        {item.image ? (
          <div className="relative aspect-video w-full bg-slate-100">
            <Image src={item.image} alt={item.equipmentName} fill className="object-contain" unoptimized />
          </div>
        ) : null}
        <div className="p-4">
          <p className="truncate font-semibold text-slate-800">{item.equipmentName}</p>
          <p className="mt-0.5 text-xs text-slate-400">{item.model}</p>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-slate-500">👤 {item.customerName}</p>
            <p className="text-xs text-slate-500">📍 {item.location}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
