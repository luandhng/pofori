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
    <div className="flex border-b borderColor p-14 justify-between bg-linear-to-t from-[#161616] to-black">
      <div className="flex flex-col justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="border mb-2 text-xs border-green-400 text-green-400 py-1 px-2  rounded-sm w-fit">
              Active
            </div>
            <div className="flex gap-2 text-3xl font-semibold">
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
      </div>

      <div className="bg-neutral-800 p-2 rounded-full h-40 w-40"></div>

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
