import { Content } from "@/components/Content";
import { Sidebar } from "@/components/Sidebar";

const Dashboard = () => {
  return (
    <div className="flex h-screen p-2 bg-[#f5f5f5]">
      <Sidebar />

      <div className="flex-1">
        <Content />
      </div>
    </div>
  );
};

export default Dashboard;
