// src/pages/blog/[slug].tsx
import { getPostBySlug, getAllPosts } from '../../lib/posts';
import type { GetStaticPropsContext, GetStaticPathsResult } from 'next';
import { ParsedUrlQuery } from 'querystring'; // Needed for params type

// --- 1. Define your Post type ---
// Based on usage, your post object looks like this.
// Ideally, this type would be defined in '@/lib/posts' and exported.
interface Post {
  slug: string;
  title: string;
  date: string;
  content: string; // This is expected to be an HTML string
}

// --- 2. Define types for props and params ---
interface BlogPostProps {
  post: Post;
}

interface PostParams extends ParsedUrlQuery {
  slug: string;
}

// --- 3. Type getStaticPaths ---
export async function getStaticPaths(): Promise<GetStaticPathsResult<PostParams>> {
  // Assuming getAllPosts() returns at least { slug: string }[]
  const posts: Pick<Post, 'slug'>[] = await getAllPosts(); 
  
  return {
    paths: posts.map((post) => ({
      params: { slug: post.slug },
    })),
    fallback: false,
  };
}

// --- 4. Type getStaticProps ---
export async function getStaticProps(
  context: GetStaticPropsContext<PostParams>
) {
  // We can be sure params and slug exist here because of getStaticPaths
  const { slug } = context.params!; 
  const post = await getPostBySlug(slug);

  return { 
    props: { 
      post 
    } 
  };
}

// --- 5. Use the typed props ---
// The 'any' type is now replaced with the specific 'BlogPostProps' interface
export default function BlogPost({ post }: BlogPostProps) {
  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      <time className="text-gray-500 mb-8 block">{post.date}</time>
      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }} 
      />
    </article>
  );
}