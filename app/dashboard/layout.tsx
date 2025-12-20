// export const metadata: Metadata = {
//   title: "ButlerAI",
//   description: "",
// };

import { Sidebar } from "@/components/Sidebar";
import Providers from "../providers";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <div className="flex h-screen p-2 bg-[#fafafa]">
        <Sidebar />

        <div className="border border-neutral-200 h-full w-full bg-white rounded-md">
          <div className="border-b border-neutral-200 p-2">Schedule</div>

          <div className="p-2">{children}</div>
        </div>
      </div>
    </Providers>
  );
}
