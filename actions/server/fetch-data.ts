"use server";

import { createClient } from "@/lib/supabase/server";

// Fetch with userId
export const fetchBusiness = async () => {
  const supabase = await createClient();

  const { data } = await supabase.from("businesses").select().single();

  return data;
};

// Fetch with businessId
// fetchAppointment.ts
export const fetchAppointment = async (businessId: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      appointment_services (
        service_id,
        services (
          service,
          duration,
          price
        )
      )
    `
    )
    .eq("business_id", businessId);

  return data;
};

export const fetchTechnicians = async (businessId: string) => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("technicians")
    .select()
    .eq("business_id", businessId);

  return data;
};

export const fetchCustomers = async (businessId: string) => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("customers")
    .select()
    .eq("business_id", businessId);

  return data;
};

export const fetchServices = async (businessId: string) => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("services")
    .select()
    .eq("business_id", businessId);

  return data;
};
