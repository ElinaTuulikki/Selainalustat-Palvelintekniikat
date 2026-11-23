export const dateStringToDate = (dateString: string): Date => {
  // Database format: YYYY-MM-DD
  if (dateString.includes("-")) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  // CSV format: DD/MM/YYYY
  const [day, month, year] = dateString.split("/").map(Number);
  return new Date(year, month - 1, day);
};

export const toIsoDate = (date: Date): string => {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}