export type MockupType = "vehicle" | "scaffold" | "fence";

export interface MockupItem {
  type: MockupType;
  item_type: MockupType; // Alias fÃ¼r KompatibilitÃ¤t
  url: string;
  title: string;
  status: "success" | "error";
}

// âœ… TYPE GUARD
export function isMockupItem(obj: any): obj is MockupItem {
  return (
    obj &&
    typeof obj === "object" &&
    (typeof obj.type === "string" || typeof obj.item_type === "string") &&
    typeof obj.url === "string" &&
    typeof obj.title === "string"
  );
}

// âœ… NORMALISIERUNGS-FUNKTION
export function normalizeMockupItem(obj: any): MockupItem {
  const type = obj.type || obj.item_type || "vehicle";

  return {
    type,
    item_type: type,
    url: obj.url || "",
    title: obj.title || "Mockup",
    status: obj.status || (obj.url ? "success" : "error"),
  };
}
