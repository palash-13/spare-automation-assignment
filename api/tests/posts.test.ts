import { describe, expect, test } from "bun:test";
import { GraphQLClient, hasToken, token } from "../client/graphqlClient";
import { POST_BY_SLUG_QUERY, POSTS_QUERY } from "../client/queries";
import type { Post, PostData, PostsData } from "../client/types";

const client = new GraphQLClient(token);

function expectValidPost(post: Post) {
  expect(post.id).toBeString();
  expect(post.name.length).toBeGreaterThan(0);
  expect(post.slug).toMatch(/^[a-z0-9-]+$/);
  expect(post.url).toStartWith("https://www.producthunt.com/");
  expect(post.votesCount).toBeGreaterThanOrEqual(0);
  expect(post.commentsCount).toBeGreaterThanOrEqual(0);
  expect(Number.isNaN(Date.parse(post.createdAt))).toBe(false);
}

describe.skipIf(!hasToken)("Posts", () => {
  test("returns at most `first` posts with a valid shape and rate-limit headers", async () => {
    const { status, headers, body } = await client.query<PostsData>(POSTS_QUERY, { first: 5 });

    expect(status).toBe(200);
    expect(body.errors).toBeUndefined();
    const edges = body.data!.posts.edges;
    expect(edges.length).toBeGreaterThan(0);
    expect(edges.length).toBeLessThanOrEqual(5);
    edges.forEach((e) => expectValidPost(e.node));

    // Clients depend on these to back off before being throttled
    expect(headers.get("x-rate-limit-remaining")).not.toBeNull();
  });

  test("cursor pagination returns a distinct next page", async () => {
    const page1 = await client.query<PostsData>(POSTS_QUERY, { first: 5 });
    const { endCursor, hasNextPage } = page1.body.data!.posts.pageInfo;
    expect(hasNextPage).toBe(true);

    const page2 = await client.query<PostsData>(POSTS_QUERY, { first: 5, after: endCursor });
    const ids1 = new Set(page1.body.data!.posts.edges.map((e) => e.node.id));
    const ids2 = page2.body.data!.posts.edges.map((e) => e.node.id);

    expect(ids2.length).toBeGreaterThan(0);
    expect(ids2.filter((id) => ids1.has(id))).toEqual([]);
  });

  test("a post fetched by slug matches the same post from the list", async () => {
    const list = await client.query<PostsData>(POSTS_QUERY, { first: 1 });
    const fromList = list.body.data!.posts.edges[0]!.node;

    const single = await client.query<PostData>(POST_BY_SLUG_QUERY, { slug: fromList.slug });
    expect(single.body.data!.post).not.toBeNull();
    expect(single.body.data!.post!.id).toBe(fromList.id);
    expect(single.body.data!.post!.name).toBe(fromList.name);
  });

  test("order: VOTES returns posts sorted by votes descending", async () => {
    const { body } = await client.query<PostsData>(POSTS_QUERY, { first: 10, order: "VOTES" });
    const votes = body.data!.posts.edges.map((e) => e.node.votesCount);

    expect(votes.length).toBeGreaterThan(1);
    expect(votes).toEqual([...votes].sort((a, b) => b - a));
  });

  test("an unknown slug returns null, not an error or a random post", async () => {
    const { status, body } = await client.query<PostData>(POST_BY_SLUG_QUERY, {
      slug: "qa-nonexistent-slug-7f3a9c",
    });
    expect(status).toBe(200);
    expect(body.data?.post ?? null).toBeNull();
  });
});
