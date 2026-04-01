import type { Company } from "./types";

export function companyNameByIdMap(companies: Company[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of companies) {
    map.set(c.id, c.name);
  }
  return map;
}
