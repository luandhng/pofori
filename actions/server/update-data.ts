"use server";

import { createClient } from "@/lib/supabase/server";

interface Props {
  id: string;
  newHours: string;
}

interface UpdateProps {
  id: string;
  data: {
    time?: string; // Use the exact column name from your DB (likely start_time)
    technician_id?: string;
    // Add other fields here if needed
  };
}

export const updateBusinessHours = async ({ id, newHours }: Props) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("businesses")
    .update({ operating_hours: newHours })
    .eq("id", id);

  return data;
};

export const updateAppointment = async ({ id, data }: UpdateProps) => {
  const supabase = await createClient();

  const { data: result, error } = await supabase
    .from("appointments")
    .update(data) // <--- dynamically updates whatever fields you pass
    .eq("id", id)
    .select();

  if (error) {
    console.error("Supabase Error:", error);
    throw new Error(error.message);
  }

  return result;
};

export const syncAppointmentServices = async ({
  appointment_id,
  service_ids,
}: {
  appointment_id: string;
  service_ids: string[];
}) => {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("appointment_services")
    .delete()
    .eq("appointment_id", appointment_id);

  if (deleteError) {
    console.error("Error deleting old services:", deleteError);
    throw new Error(deleteError.message);
  }

  if (service_ids.length === 0) return;

  const servicesToInsert = service_ids.map((serviceId) => ({
    appointment_id: appointment_id,
    service_id: serviceId,
  }));

  const { data: result, error: insertError } = await supabase
    .from("appointment_services")
    .insert(servicesToInsert)
    .select();

  if (insertError) {
    console.error("Error inserting new services:", insertError);
    throw new Error(insertError.message);
  }

  return result;
};
