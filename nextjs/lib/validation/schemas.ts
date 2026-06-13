import { z } from "zod";

export const equipmentSchema = z.object({
    equipmentName: z.string().min(1, "Equipment name is required").max(200),
    model: z.string().min(1, "Model is required").max(200),
    customerName: z.string().min(1, "Customer name is required").max(200),
    location: z.string().min(1, "Location is required").max(500),
    inUse: z.string().optional().transform((v) => v === "on"),
    installedAt: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
    expiredAt: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
    latitude: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
    longitude: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
}).superRefine((data, ctx) => {
    if (data.inUse) {
        if (!data.installedAt) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Installed date is required", path: ["installedAt"] });
        }
        if (!data.expiredAt) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Expire date is required", path: ["expiredAt"] });
        }
    }
    if (data.installedAt && data.expiredAt && data.expiredAt <= data.installedAt) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Expire date must be after installed date", path: ["expiredAt"] });
    }
});

export type EquipmentFormData = z.infer<typeof equipmentSchema>;

export const filterSchema = z.object({
    search: z.string().trim().optional(),
    serviceDate: z.string().optional(),
    sortBy: z.enum(["equipmentName", "createdAt"]).default("createdAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc"),
});
