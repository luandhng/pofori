// components/DateSwitcher.tsx
import { useBusiness } from "@/hooks/use-business";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { useUpdateBusiness } from "@/hooks/use-update-business";

interface Props {
  date: string;
}

const DEFAULT_CONFIG = {
  isOpen: false,
  open: "09:00",
  close: "17:00",
};

export const DateSwitcher = ({ date }: Props) => {
  const { data: business } = useBusiness();
  const { mutate } = useUpdateBusiness(business?.id!);

  const dayKey = date.toLowerCase();
  const currentConfig = business?.operating_hours?.[dayKey] || DEFAULT_CONFIG;

  const handleUpdate = (updates: Partial<typeof currentConfig>) => {
    const newOperatingHours = {
      ...(business?.operating_hours || {}),
      [dayKey]: {
        ...currentConfig,
        ...updates,
      },
    };

    mutate(newOperatingHours);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Switch
          checked={currentConfig.isOpen}
          onCheckedChange={(checked) => handleUpdate({ isOpen: checked })}
        />
        <p className="capitalize font-medium min-w-20">{date}</p>
      </div>

      <div
        className={`flex items-center gap-4 transition-opacity ${
          currentConfig.isOpen
            ? "opacity-100"
            : "opacity-30 pointer-events-none"
        }`}
      >
        <Input
          type="time"
          value={currentConfig.open}
          onChange={(e) => handleUpdate({ open: e.target.value })}
          className="w-32 bg-background"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <Input
          type="time"
          value={currentConfig.close}
          onChange={(e) => handleUpdate({ close: e.target.value })}
          className="w-32 bg-background"
        />
      </div>
    </div>
  );
};
