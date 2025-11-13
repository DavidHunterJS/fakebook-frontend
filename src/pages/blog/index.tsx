// src/pages/blog/index.tsx
import NextLink from 'next/link';
import type { GetStaticProps, GetStaticPropsResult } from 'next';
import fs from 'fs'; // <-- Added
import path from 'path'; // <-- Added
import matter from 'gray-matter'; // <-- Added
import BlogLayout from '@/components/BlogLayout';
import {
  Typography,
  Grid,
  Paper,
  CardActionArea,
} from '@mui/material';

// --- Post Types (Updated) ---
interface Post {
  slug: string;
  title: string | null; // <-- Allow null to prevent serialization error
  date: string | null; // <-- Allow null
}
interface BlogPageProps {
  posts: Post[];
}

// --- getStaticProps (Updated) ---
// This now reads files directly and handles missing frontmatter
export const getStaticProps: GetStaticProps = async (): Promise<
  GetStaticPropsResult<BlogPageProps>
> => {
  const postsDirectory = path.resolve(process.cwd(), 'posts');
  const filenames = fs.readdirSync(postsDirectory);

  const allPostsData = filenames
    .filter((filename) => filename.endsWith('.md')) // Ensure we only read .md files
    .map((filename) => {
      // Get slug from filename
      const slug = filename.replace(/\.md$/, '');

      // Read markdown file as string
      const fullPath = path.join(postsDirectory, filename);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      // Use gray-matter to parse the post metadata section
      const { data } = matter(fileContents);

      // Return the data
      return {
        slug,
        // *** THIS IS THE FIX ***
        // Use 'null' as a fallback if the title or date is missing
        // in the .md file's frontmatter.
        title: data.title || null,
        date: data.date || null,
      };
    });

  // Sort posts by date (newest first)
  const sortedPosts = allPostsData.sort((a, b) => {
    if (!a.date || !b.date) return 0; // Handle null dates
    if (new Date(a.date) < new Date(b.date)) {
      return 1;
    } else {
      return -1;
    }
  });

  return {
    props: {
      posts: sortedPosts,
    },
  };
};

// --- Page Component (Updated to handle nulls and format date) ---
export default function BlogPage({ posts }: BlogPageProps) {
  return (
    <BlogLayout>
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: '2.2rem', md: '3.5rem' },
          color: '#1e3a8a',
          mb: '1.5rem',
          lineHeight: 1.2,
          fontWeight: 800,
          textAlign: 'center', // Center the main title
        }}
      >
        {/* This is the title you had */}
        Amazon Image Compliance Blog
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {posts.map((post) => (
          <Grid size={{xs:12, md: 10, lg: 8}} key={post.slug}>
            {/* We use CardActionArea inside a Link for a clickable card */}
            <NextLink href={`/blog/${post.slug}`} passHref legacyBehavior>
              <CardActionArea
                sx={{
                  borderRadius: '30px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    background: '#e6f7f5',
                    padding: '2.5rem',
                    borderRadius: '30px',
                    boxShadow:
                      '12px 12px 24px #c4d9d6, -12px -12px 24px #ffffff',
                    transition: 'all 0.3s ease',
                    height: '100%',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow:
                        '15px 15px 30px #c4d9d6, -15px -15px 30px #ffffff, 0 0 25px rgba(20, 184, 166, 0.15)',
                    },
                  }}
                >
                  <Typography
                    variant="h2" // Changed to h2 for semantics
                    sx={{
                      color: '#1e3a8a',
                      mb: '0.8rem',
                      fontSize: '1.75rem', // Slightly larger for a title
                      fontWeight: 600,
                    }}
                  >
                    {/* Handle potential null title */}
                    {post.title || 'Untitled Post'}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#64748b', fontSize: '0.95rem' }}
                  >
                    {/* Format the date and handle null */}
                    {post.date
                      ? new Date(post.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'No date'}
                  </Typography>
                </Paper>
              </CardActionArea>
            </NextLink>
          </Grid>
        ))}
      </Grid>
    </BlogLayout>
  );
}