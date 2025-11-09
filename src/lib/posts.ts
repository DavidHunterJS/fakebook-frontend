// src/lib/posts.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

// 1. Define the Post type
interface Post {
  slug: string;
  title: string;
  date: string;
  content: string;
}

// 2. Get the path to the 'posts' directory using process.cwd()
const postsDirectory = path.join(process.cwd(), 'posts');

// 3. Update the function to return a Promise of Post[]
export async function getAllPosts(): Promise<Post[]> {
  let filenames: string[];
  try {
    // Check if the directory exists
    if (!fs.existsSync(postsDirectory)) {
      console.warn(`'posts' directory not found at: ${postsDirectory}`);
      return [];
    }
    filenames = fs.readdirSync(postsDirectory);
  } catch (err) {
    console.error('Could not read posts directory:', err);
    return [];
  }
  
  // 4. This map now returns Promise<Post | null>
  const posts = await Promise.all(
    filenames.map(async (filename) => {
      if (!filename.endsWith('.md')) {
        return null;
      }

      const filePath = path.join(postsDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      
      const { data: rawData, content } = matter(fileContents);
      // Safely assert the 'data' object
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
  
  // 6. Use a type guard to filter out nulls AND set the correct type
  const validPosts = posts.filter((post): post is Post => post !== null);

  // 7. Type the sort function parameters
  return validPosts.sort((a: Post, b: Post) => (a.date < b.date ? 1 : -1));
}

// 8. Update the return type here as well
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const posts = await getAllPosts();
  return posts.find(post => post.slug === slug);
}