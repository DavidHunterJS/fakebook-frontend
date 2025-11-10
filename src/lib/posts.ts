// src/lib/posts.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

interface Post {
  slug: string;
  title: string;
  date: string;
  content: string;
}

const postsDirectory = path.join(process.cwd(), 'posts');

console.log('=== Posts Directory Debug ===');
console.log('process.cwd():', process.cwd());
console.log('postsDirectory:', postsDirectory);
console.log('Directory exists:', fs.existsSync(postsDirectory));

// List all files in the current directory
try {
  console.log('Files in cwd:', fs.readdirSync(process.cwd()));
} catch (err) {
  console.log('Could not list cwd files:', err);
}

if (fs.existsSync(postsDirectory)) {
  try {
    const files = fs.readdirSync(postsDirectory);
    console.log('Files in posts directory:', files);
  } catch (err) {
    console.log('Could not read posts directory:', err);
  }
}
console.log('============================');

export async function getAllPosts(): Promise<Post[]> {
  let filenames: string[];
  try {
    if (!fs.existsSync(postsDirectory)) {
      console.warn(`'posts' directory not found at: ${postsDirectory}`);
      console.warn('Returning empty posts array');
      return [];
    }
    
    filenames = fs.readdirSync(postsDirectory);
    console.log('✅ Found files in posts directory:', filenames);
    
    if (filenames.length === 0) {
      console.warn('⚠️ Posts directory is empty');
      return [];
    }
  } catch (err) {
    console.error('❌ Could not read posts directory:', err);
    return [];
  }
  
  const posts = await Promise.all(
    filenames.map(async (filename) => {
      if (!filename.endsWith('.md')) {
        console.log(`Skipping non-markdown file: ${filename}`);
        return null;
      }
      
      console.log(`Processing markdown file: ${filename}`);
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
  console.log(`✅ Successfully processed ${validPosts.length} posts`);
  return validPosts.sort((a: Post, b: Post) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const posts = await getAllPosts();
  return posts.find(post => post.slug === slug);
}