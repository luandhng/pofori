import { format } from "date-fns";

export const formatTime = (isoString: string) => {
  return format(isoString, "h:mm a");
};
