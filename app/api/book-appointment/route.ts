import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// 1. Define the shape of the data Retell sends
// Retell nests your parameters inside an "args" object.
interface RetellRequestBody {
  args: {
    customer_name: string;
    appointment_time: string; // ISO string format
  };
}

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use Service Role to bypass RLS for server-side writes
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    // 2. Parse the body with the interface we defined
    const body = (await req.json()) as RetellRequestBody;
    const { customer_name, appointment_time } = body.args;

    // Validation (Optional but recommended)
    if (!customer_name || !appointment_time) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    console.log(`Booking for: ${customer_name} at ${appointment_time}`);

    // 3. Insert into Supabase
    // Note: We use the table name string 'appointments' as shown in your screenshot
    const { error } = await supabase.from("appointments").insert([
      {
        name: customer_name,
        time: appointment_time,
        is_booked: true,
      },
    ]);

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    // 4. Return success to Retell
    return NextResponse.json({
      message: "Appointment booked successfully",
      status: "success",
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
