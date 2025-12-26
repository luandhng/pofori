import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const businessPhone = body.call?.to_number || "1111111111";

    const { data: business } = await supabase
      .from("businesses")
      .select("name")
      .eq("phone_number", businessPhone)
      .single();

    return NextResponse.json(`Business name: ${business?.name}`);
  } catch (error: any) {
    return NextResponse.json(
      { found: false, error: error.message },
      { status: 500 }
    );
  }
}

// import { createClient } from "@supabase/supabase-js";
// import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest) {
//   try {
//     const supabase = createClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.SUPABASE_SERVICE_ROLE_KEY!
//     );
//     const body = await req.json();

//     const customerPhone = body.call?.from_number || "999999";
//     const businessPhone = body.call?.to_number || "1111111111";

//     // Business
//     const { data: business } = await supabase
//       .from("businesses")
//       .select("id, name, opening_time, closing_time, date, time_zone")
//       .eq("phone_number", businessPhone)
//       .single();

//     const businessContext = `- Name: ${business?.name} \n Opening Hours: From ${
//       business?.opening_time
//     } to ${business?.closing_time} on ${business?.date.join(
//       ","
//     )} \n Time-zone: ${business?.time_zone}`;

//     //Customer
//     const { data: customer } = await supabase
//       .from("customers")
//       .select("id, first_name, last_name")
//       .eq("phone_number", customerPhone)
//       .eq("business_id", business?.id)
//       .single();

//     const customerContext = customer
//       ? `- Name: ${customer?.first_name} ${customer?.last_name} (ID: ${customer.id})`
//       : "New customer";

//     //Technicians
//     const { data: technicians } = await supabase
//       .from("technicians")
//       .select("id, first_name, last_name, available_date, skills")
//       .eq("business_id", business?.id);

//     const techniciansContext = technicians?.length
//       ? technicians
//           .map(
//             (t) =>
//               `- Name: ${t.first_name} ${t.last_name} (ID: ${
//                 t.id
//               })\n  Skills: ${(t.skills || []).join(", ")}\n Working Days: ${(
//                 t.available_date || []
//               ).join(", ")}`
//           )
//           .join("\n")
//       : "No specific technicians.";

//     //Appointments
//     const { data: appointments, error } = await supabase
//       .from("appointments")
//       .select("id, time, customer_id, services, technician_id, status")
//       .eq("business_id", business?.id)
//       .eq("customer_id", customer?.id);

//     const appointmentsContext = appointments?.length
//       ? appointments.map(
//           (a) =>
//             `- Time: ${a.time} (Status: ${a.status})\n Services: ${
//               a.services || []
//             }\n Customer: ${a.customer_id}\n Technician: ${a.technician_id}`
//         )
//       : "No appointments";

//     //Services
//     const { data: services } = await supabase
//       .from("services")
//       .select("service, duration, price")
//       .eq("business_id", business?.id);

//     const servicesContext = services?.length
//       ? services
//           .map((s) => `- ${s.service}: $${s.price} (${s.duration}m)`)
//           .join("\n")
//       : "No services listed.";

//     return NextResponse.json(
//       `
//       ### SALON INFORMATION
//       ${businessContext}

//       ### SALON MENU
//       ${servicesContext}

//       ### TECHNICIAN ROSTER
//       ${techniciansContext}

//       ### APPOINTMENTS
//       ${appointmentsContext}

//       ### CUSTOMER
//       ${customerContext}

//       - DO NOT ASK FOR CUSTOMER NAME WHEN CUSTOMER IS SHOWN HERE
//       - WHEN THE CUSTOMER WANT TO CANCEL AND CHANGE APPOINTMENTS, SHOW THEM THE APPOINTMENTS WITH STATUS: ACTIVE THAT THEY HAVE BOOKED

//       Start by saying: "Hello, this is ${business?.name}, what can I help you today?"
//       `
//     );
//   } catch (error: any) {
//     return NextResponse.json(
//       { found: false, error: error.message },
//       { status: 500 }
//     );
//   }
// }
