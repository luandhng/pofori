import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();

    // 1. Get Both Numbers
    // const customerPhone = body.call?.from_number; // Caller
    // const businessPhone = body.call?.to_number; // Salon being called

    const customerPhone = "6998909982"; // Caller
    const businessPhone = "1111111111"; // Salon being called

    if (!customerPhone || !businessPhone) {
      return NextResponse.json({
        found: false,
        message: "Missing phone numbers",
      });
    }

    // 2. Identify the Salon
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("phone_number", businessPhone)
      .single();

    if (!business) {
      return NextResponse.json({ found: false, message: "Salon not found" });
    }

    // 3. Identify the Customer (Global Check)
    const { data: customer } = await supabase
      .from("customers")
      .select("first_name")
      .eq("phone_number", customerPhone)
      .eq("business_id", business.id)
      .single();

    if (!customer) {
      // Logic: If we don't know their name at all, they are definitely new.
      return NextResponse.json({
        found: false,
        salon_name: business.name,
        system_instruction: `You are answering for ${business.name}. This is a new customer. Say 'Hi, welcome to ${business.name}!, what can i help you today?' `,
      });
    }

    // 4. THE CRITICAL CHECK: Has he visited THIS salon before?
    // // We count past appointments for this phone + this salon_id
    // const { count } = await supabase
    //   .from("appointments")
    //   .select("*", { count: "exact", head: true }) // 'head' means don't fetch data, just count
    //   .eq("phone", customerPhone)
    //   .eq("salon_id", business.id); // <--- The Salon Filter

    const isStoreRegular = customer;

    // 5. Return context to AI
    if (isStoreRegular) {
      return NextResponse.json({
        found: true,
        customer_name: customer.first_name,
        salon_name: business.name,
        is_regular: true,
        system_instruction: `You are answering for ${business.name}. This is ${customer.first_name}, a regular customer. Say 'Welcome back to ${business.name}, ${customer.first_name}!, what can i help you today?'`,
      });
    } else {
      // Logic: We know his name (maybe from another store), but he is new to THIS store.
      return NextResponse.json({
        found: true,
        salon_name: business.name,
        is_regular: false,
        system_instruction: `You are answering for a new customer. Say 'Hi, welcome to ${business.name}!, what can i help you today?'`,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { found: false, error: error.message },
      { status: 500 }
    );
  }
}
