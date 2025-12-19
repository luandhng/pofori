import { Button } from "@/components/Button";
import {
  CalendarBlankIcon,
  MoneyIcon,
  UsersIcon,
  UserGearIcon,
  WalletIcon,
  ScissorsIcon,
  CrownSimpleIcon,
  HeadsetIcon,
} from "@phosphor-icons/react/ssr";

export function Sidebar() {
  return (
    <div className="w-56 flex flex-col pr-2 gap-6">
      <div className="border flex items-center gap-2 p-2 rounded-md border-neutral-200 bg-white">
        <div className="bg-black w-4 h-4 rounded-full"></div>
        <p>Super Salon</p>
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        <p className="px-3 text-xs text-neutral-500 font-medium">Main Menu</p>
        <div className="w-full flex flex-col">
          <Button
            icon={<CalendarBlankIcon weight="fill" size={15} />}
            text="Appointments"
          />
          <Button
            icon={<MoneyIcon weight="fill" size={15} />}
            text="Transactions"
          />
          <Button
            icon={<UserGearIcon weight="fill" size={15} />}
            text="Technicians"
          />
          <Button
            icon={<WalletIcon weight="fill" size={15} />}
            text="Payroll"
          />
          <Button
            icon={<ScissorsIcon weight="fill" size={15} />}
            text="Services"
          />
          <Button
            icon={<HeadsetIcon weight="fill" size={15} />}
            text="AI Receptionist"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        <p className="px-3 text-xs text-neutral-500 font-medium">Customers</p>
        <div className="w-full flex flex-col">
          <Button
            icon={<UsersIcon weight="fill" size={15} />}
            text="Customer List"
          />
          <Button
            icon={<CrownSimpleIcon weight="fill" size={15} />}
            text="Loyalty Program"
          />
        </div>
      </div>
    </div>
  );
}
