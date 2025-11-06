import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';

export async function getStaticProps() {
  const posts = await getAllPosts();
  return { props: { posts } };
}

export default function BlogPage({ posts }: { posts: any[] }) {
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