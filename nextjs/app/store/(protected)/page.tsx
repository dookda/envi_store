import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { BASE_PATH, LOGIN_PATH } from "@/lib/base-path";
import EquipmentCard from "@/components/EquipmentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db/prisma";
import { filterSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

function getString(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

async function EquipmentList({
  userId,
  search,
  sortBy,
  sortDir,
}: {
  userId: string;
  search?: string;
  sortBy: "equipmentName" | "createdAt";
  sortDir: "asc" | "desc";
}) {
  const where: Prisma.EquipmentItemWhereInput = { userId, isArchived: false };

  if (search) {
    where.OR = [
      { equipmentName: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.EquipmentItemOrderByWithRelationInput =
    sortBy === "equipmentName" ? { equipmentName: sortDir } : { createdAt: sortDir };

  const items = await prisma.equipmentItem.findMany({ where, orderBy });

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-slate-400">No equipment found.</p>
        <Link href={`${BASE_PATH}/equipment/new`}>
          <Button className="mt-4 rounded-xl" size="sm">
            Add your first equipment
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <EquipmentCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();
  const [session, rawParams] = await Promise.all([auth(), searchParams]);
  if (!session?.user?.id) redirect(LOGIN_PATH);
  const parsed = filterSchema.safeParse({
    search: getString(rawParams.search),
    sortBy: getString(rawParams.sortBy),
    sortDir: getString(rawParams.sortDir),
  });
  const filters = parsed.success ? parsed.data : filterSchema.parse({});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Equipment</h1>
        <Link href={`${BASE_PATH}/equipment/new`}>
          <Button className="rounded-xl text-sm" size="sm">
            + Add
          </Button>
        </Link>
      </div>

      <form className="flex gap-2">
        <Input
          name="search"
          placeholder="Search name, model, customer..."
          defaultValue={filters.search}
          className="flex-1 rounded-xl border-slate-200 bg-white"
        />
        <Button type="submit" variant="outline" className="rounded-xl border-slate-200" size="sm">
          Filter
        </Button>
        <Link href={BASE_PATH}>
          <Button variant="ghost" className="rounded-xl text-slate-400" size="sm">
            Clear
          </Button>
        </Link>
      </form>

      <Suspense fallback={<div className="py-8 text-center text-sm text-slate-400">Loading...</div>}>
        <EquipmentList
          userId={session.user.id}
          search={filters.search}
          sortBy={filters.sortBy}
          sortDir={filters.sortDir}
        />
      </Suspense>
    </div>
  );
}
