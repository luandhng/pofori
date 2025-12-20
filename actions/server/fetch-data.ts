"use server";

import { createClient } from "@/lib/supabase/server";

export const fetchBusiness = async () => {
  const supabase = await createClient();

  const { data } = await supabase.from("businesses").select().single();

  return data;
};

export const fetchAppointment = async (businessId: string) => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("appointments")
    .select()
    .eq("business_id", businessId);

  return data;
};
