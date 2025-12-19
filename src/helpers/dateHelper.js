const formatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata", // 🔥 force IST
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export const formatDateTime = (date) => {
  if (!date) return "-";
  return formatter.format(new Date(date));
};
