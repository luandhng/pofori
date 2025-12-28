// export const metadata: Metadata = {
//   title: "ButlerAI",
//   description: "",
// };

import { Sidebar } from "@/components/Sidebar";
import Providers from "../providers";
import { ContentTitle } from "@/components/ContentTitle";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <div className="flex h-screen">
        <Sidebar />

        <div className="flex-1">
          {/* <ContentTitle /> */}

          <div className="h-full">{children}</div>
        </div>
      </div>
    </Providers>
  );
}
