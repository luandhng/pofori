export const formatPhoneNumber = (str: string): string => {
  // Remove all non-numeric characters
  const cleaned = str.replace(/\D/g, "");

  // Match the standard US pattern (allowing optional leading '1')
  const match = cleaned.match(/^1?(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  return str;
};
