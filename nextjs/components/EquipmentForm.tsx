"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { EquipmentItem } from "@prisma/client";
import { createEquipment, updateEquipment } from "@/lib/db/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BASE_PATH } from "@/lib/base-path";

interface Props {
  equipment?: EquipmentItem;
}

type FieldErrors = Record<string, string[] | undefined>;

const fields = [
  { name: "equipmentName", label: "Band", placeholder: "Air quality monitor XR-200" },
  { name: "model", label: "Model", placeholder: "XR-200" },
  { name: "customerName", label: "Customer Name", placeholder: "Acme Corp" },
  { name: "location", label: "Installation Location", placeholder: "Building A, Floor 3" },
] as const;

export default function EquipmentForm({ equipment }: Props) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(equipment?.image ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const result = equipment
      ? await updateEquipment(equipment.id, formData)
      : await createEquipment(formData);

    setLoading(false);

    if (result.error) {
      setErrors(result.error as FieldErrors);
      return;
    }

    router.push(equipment ? `${BASE_PATH}/equipment/${equipment.id}` : BASE_PATH);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <Label htmlFor={field.name} className="mb-1.5 block text-sm text-slate-600">
            {field.label}
          </Label>
          <Input
            id={field.name}
            name={field.name}
            placeholder={field.placeholder}
            defaultValue={(equipment?.[field.name] as string | undefined) ?? ""}
            className="rounded-xl border-slate-200"
          />
          {errors[field.name] ? <p className="mt-1 text-xs text-red-500">{errors[field.name]?.[0]}</p> : null}
        </div>
      ))}

      <div>
        <Label htmlFor="installedAt" className="mb-1.5 block text-sm text-slate-600">
          Installed Date
        </Label>
        <Input
          id="installedAt"
          name="installedAt"
          type="date"
          defaultValue={
            equipment?.installedAt
              ? new Date(equipment.installedAt).toISOString().slice(0, 10)
              : ""
          }
          className="rounded-xl border-slate-200"
        />
        {errors.installedAt ? <p className="mt-1 text-xs text-red-500">{errors.installedAt[0]}</p> : null}
      </div>

      <div>
        <Label htmlFor="image" className="mb-1.5 block text-sm text-slate-600">
          Equipment Photo
        </Label>
        {preview ? (
          <div className="mb-2 relative aspect-video w-full rounded-xl border border-slate-200 bg-slate-50">
            <Image src={preview} alt="Equipment preview" fill className="object-contain" unoptimized />
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="absolute right-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-xs text-slate-500 shadow hover:bg-white"
            >
              Remove
            </button>
          </div>
        ) : null}
        <Input
          ref={fileRef}
          id="image"
          name="image"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="rounded-xl border-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-xs file:text-slate-600"
        />
      </div>

      {errors._form ? <p className="text-xs text-red-500">{errors._form[0]}</p> : null}
      <Button type="submit" className="h-12 w-full rounded-xl" disabled={loading}>
        {loading ? "Saving..." : equipment ? "Update Equipment" : "Add Equipment"}
      </Button>
    </form>
  );
}
