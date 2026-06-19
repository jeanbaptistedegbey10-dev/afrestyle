// src/lib/actions/admin.actions.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function approveDesigner(formData: FormData) {
  const designerId = formData.get("designerId") as string;

  await db.designer.update({
    where: { id: designerId },
    data: {
      status: "APPROVED",
      applications: {
        updateMany: {
          where: { designerId },
          data: { reviewedAt: new Date() },
        },
      },
    },
  });

  // TODO: envoyer email de confirmation au créateur
  // await sendApprovalEmail(designer.email);

  revalidatePath("/admin/designers");
}

export async function rejectDesigner(formData: FormData) {
  const designerId = formData.get("designerId") as string;
  const reason     = formData.get("reason") as string;

  await db.designer.update({
    where: { id: designerId },
    data: {
      status: "REJECTED",
      rejectionReason: reason || "Ne correspond pas aux critères actuels",
    },
  });

  revalidatePath("/admin/designers");
}