// export const metadata: Metadata = {
//   title: "ButlerAI",
//   description: "",
// };

import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen p-2 bg-[#f5f5f5]">
      <Sidebar />

      <div className="p-2 border border-neutral-200 h-full w-full bg-white rounded-md">
        {children}
      </div>
    </div>
  );
}
