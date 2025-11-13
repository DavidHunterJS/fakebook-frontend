// src/pages/blog/index.tsx
import NextLink from 'next/link';
import type { GetStaticProps, GetStaticPropsResult } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import BlogLayout from '@/components/BlogLayout';
import {
  Typography,
  Grid,
  Paper,
  CardActionArea,
} from '@mui/material';

// --- Post Types ---
interface Post {
  slug: string;
  title: string | null;
  date: string | null;
}

interface BlogPageProps {
  posts: Post[];
}

// --- Helper Function ---
function getPostsDirectory(): string {
  // Try multiple possible locations
  const possiblePaths = [
    path.join(__dirname, '../../../posts'),    // Production build
    path.join(process.cwd(), 'posts'),         // Development
    path.join(__dirname, '../../posts'),       // Alternative
  ];

  for (const postsPath of possiblePaths) {
    if (fs.existsSync(postsPath)) {
      console.log('Found posts directory at:', postsPath);
      return postsPath;
    }
  }

  throw new Error('Posts directory not found in any expected location');
}

// Helper function to build props from a given posts directory path
function buildPropsFromPath(postsDirectory: string): GetStaticPropsResult<BlogPageProps> {
  const filenames = fs.readdirSync(postsDirectory);

  const allPostsData = filenames
    .filter((filename) => filename.endsWith('.md'))
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
}

// --- getStaticProps ---

export async function getServerSideProps() {
  try {
    const postsDirectory = getPostsDirectory();
    return buildPropsFromPath(postsDirectory);
  } catch (error) {
    console.error('Error loading posts:', error);
    return {
      props: {
        posts: [],
      },
    };
  }
}

// --- Page Component ---
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
          textAlign: 'center',
        }}
      >
        Amazon Image Compliance Blog
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {posts.map((post) => (
          <Grid size={{xs:12, md: 10, lg: 8}} key={post.slug}>
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
                    variant="h2"
                    sx={{
                      color: '#1e3a8a',
                      mb: '0.8rem',
                      fontSize: '1.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {post.title || 'Untitled Post'}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#64748b', fontSize: '0.95rem' }}
                  >
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