import { Badge } from "./ui/badge";

interface BadgeButtonProps {
  label: string;
}

export default function BadgeButton({ label }: BadgeButtonProps) {
  return (
    <Badge variant="outline" className="rounded-sm cursor-pointer">
      {label}
    </Badge>
  );
}
