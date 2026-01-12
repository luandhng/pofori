import { TechnicianSidebar } from "@/components/TechnicianSidebar";

export default function TechniciansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-14 h-full">
      <div className="col-span-3 h-full">
        <TechnicianSidebar />
      </div>
      <div className="col-span-11 h-full">{children}</div>
    </div>
  );
}
