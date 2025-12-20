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
      <div className="flex h-screen p-2 bg-[#fafafa]">
        <Sidebar />

        <div className="border border-neutral-200 p-8 flex flex-col gap-8 h-full w-full bg-white rounded-2xl">
          <ContentTitle />

          <div className="">{children}</div>
        </div>
      </div>
    </Providers>
  );
}
