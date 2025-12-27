// 1. Convert "2025-12-25T14:00:00" (Local) -> UTC Date Object
// Usage: When saving to Supabase
export function localToUtc(localIsoString: string, timeZone: string): Date {
  // Create a date object treating the input string as if it were UTC first
  const date = new Date(localIsoString);

  // Calculate the offset for the target timezone (e.g. New York)
  // We format it to a string to see what the browser thinks that time is in the target zone
  const invDate = new Date(date.toLocaleString("en-US", { timeZone }));

  // Calculate the difference between "Browser UTC" and "Target Zone"
  const diff = date.getTime() - invDate.getTime();

  // Apply the difference to get the true UTC timestamp
  return new Date(date.getTime() + diff);
}

// 2. Convert UTC Date -> "14:00" (Local String)
// Usage: When Retell reads the time to the user
export function utcToLocal(utcDate: string | Date, timeZone: string): string {
  return new Date(utcDate).toLocaleString("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true, // "2:00 PM"
  });
}
