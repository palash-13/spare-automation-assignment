import type { GraphQLResponse } from "./types";

export const API_URL = "https://api.producthunt.com/v2/api/graphql";

export interface GqlResult<T> {
  status: number;
  headers: Headers;
  body: GraphQLResponse<T>;
}

/**
 * Minimal typed GraphQL client built on Bun's native fetch.
 * Each call is an independent request, so tests share no state.
 */
export class GraphQLClient {
  constructor(private readonly token?: string) {}

  async query<T>(query: string, variables: Record<string, unknown> = {}): Promise<GqlResult<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });
    return { status: res.status, headers: res.headers, body: (await res.json()) as GraphQLResponse<T> };
  }
}

/** Bun loads .env automatically; PH_TOKEN comes from there or from CI secrets. */
export const token = process.env.PH_TOKEN;
export const hasToken = !!token;
