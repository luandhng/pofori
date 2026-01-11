import { useTechnicians } from "@/hooks/use-technicians";
import { Input } from "./ui/input";
import ComboboxMultiple from "./ComboboxMultiple";
import { formatPhoneNumber } from "@/actions/client/format-phone-number";

interface TechnicianInfoProps {
  technicianId: string | undefined;
}

export const TechnicianInfo = ({ technicianId }: TechnicianInfoProps) => {
  const { data: technician } = useTechnicians();

  const getTechnicianFirstName = () => {
    const found = technician?.find((t) => t.id === technicianId);

    return found ? found.first_name : "Unknown Technician";
  };

  const getTechnicianLastName = () => {
    const found = technician?.find((t) => t.id === technicianId);

    return found ? found.last_name : "Unknown Technician";
  };

  const getTechnicianEmail = () => {
    const found = technician?.find((t) => t.id === technicianId);

    return found ? found.email : "Unknown Technician";
  };

  const getTechnicianPhone = () => {
    const found = technician?.find((t) => t.id === technicianId);

    return found ? found.phone_number : "Unknown Technician";
  };

  const getTechnicianServices = () => {
    const found = technician?.find((t) => t.id === technicianId);

    return found ? found.technician_services.map((item: any) => item) : [];
  };

  console.log(getTechnicianServices());

  return (
    <div className="flex border-b p-10 justify-between bg-linear-to-t from-white to-neutral-100">
      <div className="flex flex-col gap-2">
        <div>
          <div className="flex gap-2 text-2xl font-semibold">
            <div>
              {getTechnicianFirstName().charAt(0).toUpperCase() +
                getTechnicianFirstName().slice(1)}
            </div>
            <div>
              {getTechnicianLastName().charAt(0).toUpperCase() +
                getTechnicianLastName().slice(1)}
            </div>
          </div>

          <div className="text-neutral-500">{getTechnicianEmail()}</div>
        </div>
        <div>{formatPhoneNumber(getTechnicianPhone())}</div>
      </div>

      <div className="bg-neutral-200 p-2 rounded-full h-40 w-40"></div>

      {/* <div className="flex gap-2">
        <Input
          defaultValue={getTechnicianFirstName()}
          placeholder="First Name"
          type="text"
        />
        <Input
          defaultValue={getTechnicianLastName()}
          placeholder="Last Name"
          type="text"
        />
      </div>
      <Input
        defaultValue={getTechnicianEmail()}
        placeholder="Email"
        type="email"
      />
      <Input
        defaultValue={getTechnicianPhone()}
        placeholder="Phone"
        type="tel"
      /> */}
      {/* <ComboboxMultiple defaultValues={getTechnicianServices()} /> */}
    </div>
  );
};
