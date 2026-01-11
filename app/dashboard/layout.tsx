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
      <div className="h-screen overflow-hidden">
        <div className="border-b px-4 py-3 font-semibold text-base">
          Big Salon
        </div>
        <div className="flex h-full">
          <Sidebar />

          <div className="flex-1">
            <div className="h-full">{children}</div>
          </div>
        </div>
      </div>
    </Providers>
  );
}
