// src/lib/posts.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

export async function getAllPosts() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  
  // Check if the directory exists
  if (!fs.existsSync(postsDirectory)) {
    console.warn('Posts directory not found, returning empty array');
    return [];
  }
  
  const filenames = fs.readdirSync(postsDirectory);
  
  // Return empty array if no files
  if (filenames.length === 0) {
    return [];
  }
  
  const posts = await Promise.all(
    filenames.map(async (filename) => {
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
  
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(slug: string) {
  const posts = await getAllPosts();
  return posts.find(post => post.slug === slug);
}