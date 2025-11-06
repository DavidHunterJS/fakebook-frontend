import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

export async function getAllPosts() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  const filenames = fs.readdirSync(postsDirectory);
  
  const posts = await Promise.all(
    filenames.map(async (filename) => {
      const filePath = path.join(postsDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);
      
      console.log('Raw content length:', content.length);
      console.log('First 200 chars:', content.substring(0, 200));
      
      const processedContent = await remark().use(html).process(content);
      const htmlContent = processedContent.toString();
      
      console.log('Processed HTML length:', htmlContent.length);
      console.log('First 200 chars HTML:', htmlContent.substring(0, 200));
      
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