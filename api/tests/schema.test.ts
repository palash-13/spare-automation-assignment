import { describe, expect, test } from "bun:test";
import { GraphQLClient, hasToken, token } from "../client/graphqlClient";
import { TOPICS_QUERY } from "../client/queries";
import type { TopicsData } from "../client/types";

const client = new GraphQLClient(token);

describe.skipIf(!hasToken)("Schema & error handling", () => {
  test("querying an unknown field returns a GraphQL validation error, not a 500", async () => {
    const { status, body } = await client.query<unknown>(`{ posts(first: 1) { edges { node { notARealField } } } }`);

    expect(status).toBeLessThan(500);
    expect(body.errors?.length).toBeGreaterThan(0);
    expect(body.data ?? null).toBeNull();
  });

  test("topics return a valid shape", async () => {
    const { status, body } = await client.query<TopicsData>(TOPICS_QUERY, { first: 3 });

    expect(status).toBe(200);
    const topics = body.data!.topics.edges.map((e) => e.node);
    expect(topics.length).toBeGreaterThan(0);
    for (const t of topics) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.slug).toMatch(/^[a-z0-9-]+$/);
      expect(t.followersCount).toBeGreaterThanOrEqual(0);
    }
  });
});
