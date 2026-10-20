"use server";

import { revalidatePath } from "next/cache";

import {
  createAdminService,
  deleteAdminService,
  reorderServices,
  type ServiceInput,
  toggleServiceActive,
  updateAdminService,
} from "@/lib/admin/services-admin-service";
import { requireAdminAuth } from "@/lib/auth/admin-auth";

export type ServiceActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function createServiceAction(input: ServiceInput): Promise<ServiceActionResult> {
  try {
    const { supabase } = await requireAdminAuth({ redirectToLogin: false });
    const service = await createAdminService(supabase, input);

    revalidatePath("/admin/services");
    revalidatePath("/services");
    revalidatePath("/book");

    return { success: true, data: service };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create service.";
    return { success: false, error: msg };
  }
}

export async function updateServiceAction(
  id: string,
  input: Partial<ServiceInput>,
): Promise<ServiceActionResult> {
  try {
    const { supabase } = await requireAdminAuth({ redirectToLogin: false });
    const service = await updateAdminService(supabase, id, input);

    revalidatePath("/admin/services");
    revalidatePath(`/admin/services/${id}`);
    revalidatePath("/services");
    revalidatePath("/book");

    return { success: true, data: service };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update service.";
    return { success: false, error: msg };
  }
}

export async function toggleServiceActiveAction(
  id: string,
  isActive: boolean,
): Promise<ServiceActionResult> {
  try {
    const { supabase } = await requireAdminAuth({ redirectToLogin: false });
    await toggleServiceActive(supabase, id, isActive);

    revalidatePath("/admin/services");
    revalidatePath("/services");
    revalidatePath("/book");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to toggle service status.";
    return { success: false, error: msg };
  }
}

export async function reorderServicesAction(serviceIds: string[]): Promise<ServiceActionResult> {
  try {
    const { supabase } = await requireAdminAuth({ redirectToLogin: false });
    await reorderServices(supabase, serviceIds);

    revalidatePath("/admin/services");
    revalidatePath("/services");
    revalidatePath("/book");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to reorder services.";
    return { success: false, error: msg };
  }
}

export async function deleteServiceAction(id: string): Promise<ServiceActionResult> {
  try {
    const { supabase } = await requireAdminAuth({ redirectToLogin: false });
    await deleteAdminService(supabase, id);

    revalidatePath("/admin/services");
    revalidatePath("/services");
    revalidatePath("/book");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete service.";
    return { success: false, error: msg };
  }
}
