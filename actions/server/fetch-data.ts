"use server";

import { createClient } from "@/lib/supabase/server";

// Fetch with userId
export const fetchBusiness = async () => {
  const supabase = await createClient();

  const { data } = await supabase.from("businesses").select().single();

  return data;
};

// Fetch with businessId
export const fetchAppointment = async (businessId: string) => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("appointments")
    .select()
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
