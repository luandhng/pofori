import { Button } from "@/components/Button";
import {
  HairDryerIcon,
  CalendarBlankIcon,
  UsersIcon,
} from "@phosphor-icons/react/ssr";

const Dashboard = () => {
  return (
    <div className="flex h-screen p-2 bg-neutral-100">
      <div className="w-56 font-medium flex flex-col pr-2 gap-2">
        <Button
          icon={<CalendarBlankIcon weight="bold" size={16} />}
          text="Appointments"
        />
        <Button icon={<UsersIcon weight="bold" size={16} />} text="Customers" />
        <Button
          icon={<HairDryerIcon weight="bold" size={16} />}
          text="Technicians"
        />
      </div>

      <div className="flex-1">
        <div className="p-2 border border-neutral-200 h-full w-full bg-white rounded-md">
          fasfs
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
