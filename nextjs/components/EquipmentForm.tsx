"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { EquipmentItem } from "@prisma/client";
import { createEquipment, updateEquipment } from "@/lib/db/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/ui/form-field";
import LocationPicker from "@/components/LocationPicker";
import { useLang } from "@/components/LangProvider";

interface Props {
  equipment?: EquipmentItem;
}

type FieldErrors = Record<string, string[] | undefined>;

const TEXT_FIELDS = [
  { name: "equipmentName", labelKey: "fieldBand",     placeholder: "Air quality monitor XR-200", required: true  },
  { name: "model",         labelKey: "fieldModel",    placeholder: "XR-200",                    required: true  },
  { name: "customerName",  labelKey: "fieldCustomer", placeholder: "Acme Corp",                 required: false },
  { name: "location",      labelKey: "fieldLocation", placeholder: "Building A, Floor 3",       required: false },
] as const;

export default function EquipmentForm({ equipment }: Props) {
  const { t } = useLang();
  const router = useRouter();
  const [errors, setErrors]   = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [inUse, setInUse]     = useState(equipment?.inUse ?? false);
  const [preview, setPreview] = useState<string | null>(equipment?.image ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
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

    router.push(equipment ? `/equipment/${equipment.id}` : "/");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* In Use toggle */}
      <div className="flex items-center justify-between rounded-input border border-border px-4 py-3">
        <label htmlFor="inUseToggle" className="cursor-pointer select-none text-sm text-text-secondary">
          {t.inUse}
        </label>
        <Switch id="inUseToggle" checked={inUse} onCheckedChange={setInUse} />
        <input type="hidden" name="inUse" value={inUse ? "on" : ""} />
      </div>

      {TEXT_FIELDS.map((field) => (
        <FormField
          key={field.name}
          label={t[field.labelKey]}
          name={field.name}
          required={field.required}
          error={errors[field.name]?.[0]}
        >
          <Input
            id={field.name}
            name={field.name}
            placeholder={field.placeholder}
            defaultValue={(equipment?.[field.name] as string | undefined) ?? ""}
            required={field.required}
          />
        </FormField>
      ))}

      <FormField label={t.fieldInstalledAt} name="installedAt" required={inUse} error={errors.installedAt?.[0]}>
        <Input
          id="installedAt"
          name="installedAt"
          type="date"
          required={inUse}
          defaultValue={equipment?.installedAt ? new Date(equipment.installedAt).toISOString().slice(0, 10) : ""}
        />
      </FormField>

      <FormField label={t.fieldExpiredAt} name="expiredAt" required={inUse} error={errors.expiredAt?.[0]}>
        <Input
          id="expiredAt"
          name="expiredAt"
          type="date"
          required={inUse}
          defaultValue={equipment?.expiredAt ? new Date(equipment.expiredAt).toISOString().slice(0, 10) : ""}
        />
      </FormField>

      {/* Image upload */}
      <FormField label={t.fieldPhoto} name="image">
        {preview && (
          <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-input border border-border bg-surface-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.startsWith("blob:") ? preview : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${preview}`}
              alt="Equipment preview"
              className="h-full w-full object-contain"
            />
            <button
              type="button"
              onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="absolute right-2 top-2 rounded-full bg-surface/80 px-2 py-0.5 text-xs text-text-secondary shadow hover:bg-surface"
            >
              Remove
            </button>
          </div>
        )}
        <Input
          ref={fileRef}
          id="image"
          name="image"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="file:mr-3 file:rounded-lg file:border-0 file:bg-surface-sunken file:px-3 file:py-1 file:text-xs file:text-text-secondary"
        />
      </FormField>

      <LocationPicker initialLat={equipment?.latitude} initialLng={equipment?.longitude} />

      {errors._form && <p className="text-xs text-danger">{errors._form[0]}</p>}

      <Button type="submit" className="h-12 w-full rounded-input" disabled={loading}>
        {loading ? t.saving : equipment ? t.updateEquipment : t.registerEquipment}
      </Button>
    </form>
  );
}
