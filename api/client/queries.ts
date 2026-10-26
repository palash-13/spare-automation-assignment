const POST_FIELDS = `id name slug tagline url votesCount commentsCount createdAt`;

export const POSTS_QUERY = `
  query Posts($first: Int!, $after: String, $order: PostsOrder) {
    posts(first: $first, after: $after, order: $order) {
      edges { cursor node { ${POST_FIELDS} } }
      pageInfo { endCursor hasNextPage }
    }
  }`;

export const POST_BY_SLUG_QUERY = `
  query Post($slug: String!) {
    post(slug: $slug) { ${POST_FIELDS} }
  }`;

export const TOPICS_QUERY = `
  query Topics($first: Int!) {
    topics(first: $first) {
      edges { cursor node { id name slug followersCount } }
      pageInfo { endCursor hasNextPage }
    }
  }`;
