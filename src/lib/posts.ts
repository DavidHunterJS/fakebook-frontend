// src/lib/posts.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

// 1. Get the path to the 'posts' directory
// __dirname is the path to the current directory (src/lib)
// We go up two levels ('..', '..') to get to the project root
// Then we join that with 'posts'
const postsDirectory = path.join(__dirname, '..', '..', 'posts');

export async function getAllPosts() {
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
  
  const posts = await Promise.all(
    filenames.map(async (filename) => {
      // 2. Make sure we only process markdown files
      if (!filename.endsWith('.md')) {
        return null;
      }

      const filePath = path.join(postsDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);
      
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
  
  // 3. Filter out any null entries (from non-markdown files)
  const validPosts = posts.filter(post => post !== null) as any[];

  return validPosts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(slug: string) {
  const posts = await getAllPosts();
  return posts.find(post => post.slug === slug);
}