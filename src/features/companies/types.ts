/** Company row as returned by the API (camelCase from server). */
export interface Company {
  id: string;
  userId: string;
  name: string;
  website: string | null;
  industry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListCompaniesResponse {
  items: Company[];
  page: number;
  limit: number;
  total: number;
}
