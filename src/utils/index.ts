const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatCurrency = (value: number) => currencyFormatter.format(value);

// SQLite's datetime('now') is UTC without a zone marker ("YYYY-MM-DD HH:MM:SS")
export const formatDateTime = (sqliteDate: string) =>
  new Date(sqliteDate.replace(" ", "T") + "Z").toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

// Errors thrown in the main process arrive wrapped as
// "Error invoking remote method 'x': Error: <message>"; keep only <message>
export const getErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/^Error invoking remote method '[^']+': (Error: )?/, "");
};
