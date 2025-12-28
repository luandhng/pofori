import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Input } from "./ui/input";
import { UserGearIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "./ui/button";

interface Props {
  activeTech: any;
}

export const SheetTechnician = ({ activeTech }: Props) => {
  return (
    <Sheet>
      <SheetTrigger className="cursor-pointer">
        <UserGearIcon size={24} />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            Edit{" "}
            {activeTech.first_name.slice(0, 1).toUpperCase() +
              activeTech.first_name.slice(1)}{" "}
            {activeTech.last_name.slice(0, 1).toUpperCase() +
              activeTech.last_name.slice(1)}
          </SheetTitle>
          <SheetDescription>
            Make changes to this technician profile here. Click save when
            you&apos;re done.
          </SheetDescription>

          <div className="flex flex-col justify-between gap-4 bg-yellow-500 h-full">
            <div className="flex flex-col gap-4">
              <Input
                placeholder="First Name"
                defaultValue={activeTech.first_name}
              />
              <Input
                placeholder="Last Name"
                defaultValue={activeTech.last_name}
              />
              <Input placeholder="Email" defaultValue={activeTech.email} />
              <Input
                placeholder="Phone"
                defaultValue={activeTech.phone_number}
              />
            </div>

            <Input type="submit" value="Save" />
          </div>
        </SheetHeader>

        <SheetFooter>
          <Button type="submit">Save changes</Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
