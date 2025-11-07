// src/pages/blog/index.tsx
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import type { GetStaticPropsResult } from 'next';

// --- 1. Define your Post type ---
// Based on usage, this is the shape of your post object.
// Ideally, this is exported from '@/lib/posts' or a shared types file.
interface Post {
  slug: string;
  title: string;
  date: string;
  // This page doesn't use 'content', so it's not required here.
}

// --- 2. Define the props for your page component ---
interface BlogPageProps {
  posts: Post[];
}

// --- 3. Type getStaticProps ---
// This ensures the props returned match what the page component expects.
export async function getStaticProps(): Promise<GetStaticPropsResult<BlogPageProps>> {
  const posts: Post[] = await getAllPosts(); // Assuming getAllPosts returns Post[]
  return { props: { posts } };
}

// --- 4. Use the typed props in your component ---
// Replaced { posts: any[] } with the specific BlogPageProps interface.
export default function BlogPage({ posts }: BlogPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.slug} className="border-b pb-8">
            <Link href={`/blog/${post.slug}`}>
              <h2 className="text-2xl font-semibold hover:text-blue-600 mb-2">
                {post.title}
              </h2>
            </Link>
            <time className="text-gray-500">{post.date}</time>
          </article>
        ))}
      </div>
    </div>
  );
}