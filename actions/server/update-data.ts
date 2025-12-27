"use server";

import { createClient } from "@/lib/supabase/server";

interface Props {
  id: string;
  newHours: string;
}

export const updateBusinessHours = async ({ id, newHours }: Props) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("businesses")
    .update({ operating_hours: newHours })
    .eq("id", id);

  console.log(error);

  return data;
};
