"use server";

import { createClient } from "@/lib/supabase/server";

export const fetchAppointment = async () => {
  const supabase = await createClient();

  const { data } = await supabase.from("appointments").select();

  return data;
};
