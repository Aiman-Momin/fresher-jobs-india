export interface Job {
  id: string; title: string; company: string; location: string; url: string;
  description: string; posted?: string; first_seen?: string; source: string;
  role?: string; city?: string;
}
export interface Meta { updated: string; count: number }
export type Sort = "relevance" | "newest";
export interface Query { q: string; roles: string[]; cities: string[]; days: number; sort: Sort; savedOnly: boolean }
