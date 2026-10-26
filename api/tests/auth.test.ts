import { describe, expect, test } from "bun:test";
import { GraphQLClient } from "../client/graphqlClient";
import { POSTS_QUERY } from "../client/queries";
import type { PostsData } from "../client/types";

// Security-first: these run without a token, so they guard auth on every CI run
describe("Authentication", () => {
  test("rejects requests with no token (401, no data leaked)", async () => {
    const { status, body } = await new GraphQLClient().query<PostsData>(POSTS_QUERY, { first: 1 });

    expect(status).toBe(401);
    expect(body.data).toBeNull();
    expect(body.errors?.[0]?.error).toBe("invalid_oauth_token");
  });

  test("rejects an invalid bearer token (401, no data leaked)", async () => {
    const client = new GraphQLClient("not-a-real-token-qa-check");
    const { status, body } = await client.query<PostsData>(POSTS_QUERY, { first: 1 });

    expect(status).toBe(401);
    expect(body.data).toBeNull();
  });
});
