import { useTechnicians } from "@/hooks/use-technicians";
import { Input } from "./ui/input";
import ComboboxMultiple from "./ComboboxMultiple";

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
    <div className="col-span-3 flex flex-col gap-2 border rounded-xl overflow-hidden p-4">
      <div className="flex gap-2">
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
      />
      <ComboboxMultiple defaultValues={getTechnicianServices()} />
    </div>
  );
};
