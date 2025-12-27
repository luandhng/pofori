"use client";

import { DateSwitcher } from "@/components/DateSwitcher";

const Dashboard = () => {
  return (
    <div>
      <div className="border border-neutral-200 grid grid-cols-2 rounded-2xl">
        <div className="p-6 flex flex-col gap-6 border-r">
          <h2 className="text-lg">Operating Hours</h2>
          <div className="flex flex-col gap-6">
            <DateSwitcher date="Monday" />
            <DateSwitcher date="Tuesday" />
            <DateSwitcher date="Wednesday" />
            <DateSwitcher date="Thursday" />
            <DateSwitcher date="Friday" />
            <DateSwitcher date="Saturday" />
            <DateSwitcher date="Sunday" />
          </div>
        </div>
        <div className="p-6 text-lg">Address</div>
        <div></div>
      </div>
    </div>
  );
};

export default Dashboard;
