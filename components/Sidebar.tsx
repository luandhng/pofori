import { Button } from "@/components/Button";
import {
  CalendarBlankIcon,
  MoneyIcon,
  UsersIcon,
  UserGearIcon,
  WalletIcon,
  ScissorsIcon,
  ChatIcon,
  CrownSimpleIcon,
  NotificationIcon,
  HeadsetIcon,
} from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { TechnicianSidebar } from "./TechnicianSidebar";

export function Sidebar() {
  return (
    <div className="w-56 flex flex-col justify-between p-2 border-r border-slate-200">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between p-2 rounded-md">
          <Link href={"/dashboard"} className="flex items-center gap-1.5">
            <div className="bg-black w-3.5 h-3.5 rounded-sm"></div>
            <p>Super Salon</p>
          </Link>

          <NotificationIcon size={15} weight="fill" />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <p className="px-2 text-xs text-neutral-500 font-medium">Main Menu</p>
          <div className="w-full flex flex-col gap-1">
            <Button
              icon={<CalendarBlankIcon weight="fill" size={15} />}
              text="Schedule"
            />
            <Button
              icon={<MoneyIcon weight="fill" size={15} />}
              text="Transactions"
            />
            {/* <Button
              icon={<UserGearIcon weight="fill" size={15} />}
              text="Technicians"
            /> */}
            {/* <Button
              icon={<WalletIcon weight="fill" size={15} />}
              text="Payroll"
            /> */}
            <Button
              icon={<ScissorsIcon weight="fill" size={15} />}
              text="Services"
            />
            <Button
              icon={<HeadsetIcon weight="fill" size={15} />}
              text="AI Receptionist"
            />
            <Button
              icon={<UsersIcon weight="fill" size={15} />}
              text="Customer List"
            />
            {/* <Button
              icon={<CrownSimpleIcon weight="fill" size={15} />}
              text="Loyalty Program"
            /> */}
          </div>
        </div>

        <TechnicianSidebar />
      </div>

      <div className="">
        {/* <div className="bg-black w-6 h-6 rounded-full"></div> */}

        <div></div>
      </div>
    </div>
  );
}
