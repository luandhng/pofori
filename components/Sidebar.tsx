import { Button } from "@/components/Button";
import {
  CalendarBlankIcon,
  MoneyIcon,
  UsersIcon,
  ScissorsIcon,
  BroadcastIcon,
  HeadsetIcon,
  UserGearIcon,
} from "@phosphor-icons/react/ssr";

export function Sidebar() {
  return (
    <div className="w-48 flex flex-col justify-between p-2 border-r borderColor">
      <div className="flex flex-col text-sm gap-2">
        <div className="flex flex-col gap-2 w-full">
          <div className="w-full flex flex-col gap-2">
            <Button icon={<CalendarBlankIcon size={16} />} text="Schedule" />
            <Button icon={<MoneyIcon size={16} />} text="Transactions" />
            <Button icon={<ScissorsIcon size={16} />} text="Services" />
            <Button icon={<HeadsetIcon size={16} />} text="AI Receptionist" />
            <Button icon={<UsersIcon size={16} />} text="Customers" />
            <Button icon={<UserGearIcon size={16} />} text="Technicians" />
            <Button icon={<BroadcastIcon size={16} />} text="Marketing" />
          </div>
        </div>

        {/* <div className="border-b borderColor" /> */}

        {/* <TechnicianSidebar /> */}
      </div>

      <div className="">
        {/* <div className="bg-black w-6 h-6 rounded-full"></div> */}

        <div></div>
      </div>
    </div>
  );
}
