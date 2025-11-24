import { Sidebar } from "@/components/sidebar";
import { Web } from "@/components/web";

const Dashboard = () => {
  return (
    <div className="flex p-1 h-screen">
      <Sidebar />
      <Web />
    </div>
  );
};

export default Dashboard;
