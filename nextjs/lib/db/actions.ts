"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { equipmentSchema } from "@/lib/validation/schemas";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function saveImage(file: File): Promise<string> {
  const ext = path.extname(file.name).toLowerCase() || ".jpg";
  const filename = `${crypto.randomUUID()}${ext}`;
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, filename), Buffer.from(await file.arrayBuffer()));
  return `/api/uploads/${filename}`;
}

export async function createEquipment(formData: FormData) {
  const raw = {
    equipmentName: formData.get("equipmentName"),
    model: formData.get("model"),
    customerName: formData.get("customerName") || undefined,
    location: formData.get("location") || undefined,
    inUse: formData.get("inUse") || undefined,
    installedAt: formData.get("installedAt") || undefined,
    expiredAt: formData.get("expiredAt") || undefined,
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
  };
  const result = equipmentSchema.safeParse(raw);
  if (!result.success) return { error: result.error.flatten().fieldErrors };

  const imageFile = formData.get("image") as File | null;
  const image = imageFile && imageFile.size > 0 ? await saveImage(imageFile) : undefined;

  await prisma.equipmentItem.create({
    data: { ...result.data, ...(image ? { image } : {}) },
  });

  revalidatePath("/");
  return { success: true };
}

export async function updateEquipment(id: string, formData: FormData) {
  const raw = {
    equipmentName: formData.get("equipmentName"),
    model: formData.get("model"),
    customerName: formData.get("customerName") || undefined,
    location: formData.get("location") || undefined,
    inUse: formData.get("inUse") || undefined,
    installedAt: formData.get("installedAt") || undefined,
    expiredAt: formData.get("expiredAt") || undefined,
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
  };
  const result = equipmentSchema.safeParse(raw);
  if (!result.success) return { error: result.error.flatten().fieldErrors };

  const item = await prisma.equipmentItem.findFirst({ where: { id, isArchived: false } });
  if (!item) return { error: { _form: ["Equipment not found"] } };

  const imageFile = formData.get("image") as File | null;
  const image = imageFile && imageFile.size > 0 ? await saveImage(imageFile) : undefined;

  await prisma.equipmentItem.update({
    where: { id },
    data: { ...result.data, ...(image ? { image } : {}) },
  });

  revalidatePath("/");
  revalidatePath(`/equipment/${id}`);
  return { success: true };
}

export async function deleteEquipment(id: string) {
  const item = await prisma.equipmentItem.findFirst({ where: { id } });
  if (!item) return { error: { _form: ["Equipment not found"] } };

  await prisma.equipmentItem.delete({ where: { id } });

  revalidatePath("/");
  return { success: true };
}
