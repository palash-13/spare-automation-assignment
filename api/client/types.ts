/** Response shapes for the parts of the Product Hunt v2 schema under test. */

export interface GraphQLError {
  message?: string;
  // Product Hunt returns OAuth-style errors instead of the spec's `message` field
  error?: string;
  error_description?: string;
}

export interface GraphQLResponse<T> {
  data: T | null;
  errors?: GraphQLError[];
}

export interface PageInfo {
  endCursor: string | null;
  hasNextPage: boolean;
}

export interface Connection<T> {
  edges: { cursor: string; node: T }[];
  pageInfo: PageInfo;
}

export interface Post {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  url: string;
  votesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  followersCount: number;
}

export type PostsData = { posts: Connection<Post> };
export type PostData = { post: Post | null };
export type TopicsData = { topics: Connection<Topic> };
