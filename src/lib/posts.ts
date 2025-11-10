// src/lib/posts.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { fileURLToPath } from 'url';

interface Post {
  slug: string;
  title: string;
  date: string;
  content: string;
}

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Navigate from src/lib to project root, then to posts
const postsDirectory = path.join(__dirname, '..', '..', '..', 'posts');

export async function getAllPosts(): Promise<Post[]> {
  let filenames: string[];
  try {
    if (!fs.existsSync(postsDirectory)) {
      console.warn(`'posts' directory not found at: ${postsDirectory}`);
      return [];
    }
    filenames = fs.readdirSync(postsDirectory);
  } catch (err) {
    console.error('Could not read posts directory:', err);
    return [];
  }
  
  const posts = await Promise.all(
    filenames.map(async (filename) => {
      if (!filename.endsWith('.md')) {
        return null;
      }
      const filePath = path.join(postsDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      
      const { data: rawData, content } = matter(fileContents);
      const data = rawData as { title: string, date: string }; 
      
      const processedContent = await remark().use(html).process(content);
      const htmlContent = processedContent.toString();
      
      return {
        slug: filename.replace('.md', ''),
        title: data.title,
        date: data.date,
        content: htmlContent
      };
    })
  );
  
  const validPosts = posts.filter((post): post is Post => post !== null);
  return validPosts.sort((a: Post, b: Post) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const posts = await getAllPosts();
  return posts.find(post => post.slug === slug);
}