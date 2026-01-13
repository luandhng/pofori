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
      <div className="h-screen flex overflow-hidden">
        <Sidebar />

        <div className="flex-1">
          <div className="h-full">{children}</div>
        </div>
      </div>
    </Providers>
  );
}
