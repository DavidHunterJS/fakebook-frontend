// pages/blog/[slug].tsx
// import { GetStaticProps, GetStaticPaths } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import NextLink from 'next/link';
import SEO from '@/components/SEO';
import BlogLayout from '@/components/BlogLayout';
import {
  Typography,
  Paper,
  Box,
  Button,
  Link,
  List,
  ListItem,
} from '@mui/material';

// --- Reusable Style Objects ---
const btnBase = {
  padding: '0.8rem 2rem',
  borderRadius: '50px',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  textTransform: 'none',
};

const btnPrimary = {
  ...btnBase,
  background: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)',
  color: 'white',
  boxShadow: '8px 8px 16px #c4d9d6, -8px -8px 16px #ffffff',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '10px 10px 20px #c4d9d6, -10px -10px 20px #ffffff',
  },
};

// --- Interfaces ---
interface Frontmatter {
  title: string;
  description: string;
  date: string;
  modified?: string;
  author?: string;
  image?: string;
  metaDescription?: string;
  keywords?: string[];
  relatedPosts?: string[];
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
}

interface BlogPostProps {
  frontmatter: Frontmatter;
  content: string;
  slug: string;
}

// --- Helper Function ---
function getPostsDirectory(): string {
  // Try multiple possible locations
  const possiblePaths = [
    path.join(__dirname, '../../../posts'),    // Production build
    path.join(process.cwd(), 'posts'),         // Development
    path.join(__dirname, '../../posts'),       // Alternative
    '/app/posts',                               // Heroku production (ADD THIS!)
  ];

  for (const postsPath of possiblePaths) {
    if (fs.existsSync(postsPath)) {
      console.log('Found posts directory at:', postsPath);
      return postsPath;
    }
  }

  throw new Error('Posts directory not found in any expected location');
}

// --- Page Component ---
export default function BlogPost({ frontmatter, content, slug }: BlogPostProps) {
  // Add validation
  if (!frontmatter) {
    return (
      <BlogLayout>
        <Typography variant="h1">Error: Post data not found</Typography>
      </BlogLayout>
    );
  }

  // Generate Article Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: frontmatter.title || 'Untitled',
    description: frontmatter.description || '',
    image: `https://compliancekit.app${
      frontmatter.image || '/blog/default.jpg'
    }`,
    datePublished: frontmatter.date || new Date().toISOString(),
    dateModified: frontmatter.modified || frontmatter.date || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: frontmatter.author || 'David',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ComplianceKit',
      logo: {
        '@type': 'ImageObject',
        url: 'https://compliancekit.app/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://compliancekit.app/blog/${slug}`,
    },
  };

  // Generate FAQ Schema
  const faqSchema = frontmatter.faqs
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: frontmatter.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : null;

  return (
    <>
      {/* SEO and Schema stay outside the layout */}
      <SEO
        title={frontmatter.title}
        description={frontmatter.metaDescription || frontmatter.description}
        url={`/blog/${slug}`}
        image={frontmatter.image}
        type="article"
        article={{
          publishedTime: frontmatter.date,
          modifiedTime: frontmatter.modified,
          author: frontmatter.author,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Wrap visual content in the layout */}
      <BlogLayout>
        <Paper
          elevation={0}
          component="article"
          sx={{
            background: '#e6f7f5',
            padding: { xs: '1.5rem', md: '3rem' },
            borderRadius: '30px',
            boxShadow: '12px 12px 24px #c4d9d6, -12px -12px 24px #ffffff',
            maxWidth: '900px',
            mx: 'auto',
          }}
        >
          {/* Cover Image (if exists) */}
          {frontmatter.image && (
            <Box
              component="img"
              src={frontmatter.image}
              alt={frontmatter.title}
              sx={{
                width: '100%',
                height: 'auto',
                mb: 4,
                borderRadius: '20px',
                boxShadow:
                  '8px 8px 16px #c4d9d6, -8px -8px 16px #ffffff',
              }}
            />
          )}

          {/* Header */}
          <Box component="header" sx={{ mb: 4 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.2rem', md: '3.5rem' },
                color: '#1e3a8a',
                mb: '1rem',
                lineHeight: 1.2,
                fontWeight: 800,
              }}
            >
              {frontmatter.title}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#64748b', fontSize: '1rem' }}
            >
              <time dateTime={frontmatter.date}>
                {new Date(frontmatter.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              {frontmatter.author && (
                <Box component="span" sx={{ ml: 2 }}>
                  by {frontmatter.author}
                </Box>
              )}
            </Typography>
          </Box>

          {/* Content */}
          <Box
            sx={{
              color: '#475569',
              lineHeight: 1.7,
              '& h2, & h3, & h4': {
                color: '#1e3a8a',
                fontWeight: 700,
                mt: '2.5rem',
                mb: '1rem',
              },
              '& h2': { fontSize: '1.8rem' },
              '& h3': { fontSize: '1.5rem' },
              '& p': { fontSize: '1.1rem', my: '1.25rem' },
              '& strong': { color: '#1e3a8a', fontWeight: 700 },
              '& a': {
                color: '#14b8a6',
                textDecoration: 'underline',
                fontWeight: 500,
                '&:hover': { color: '#0d9488' },
              },
              '& ul, & ol': { my: '1.25rem', pl: '2rem' },
              '& li': { fontSize: '1.1rem', mb: '0.5rem' },
              '& li p': { my: '0.5rem' },
              '& blockquote': {
                borderLeft: '4px solid #14b8a6',
                pl: '1.5rem',
                my: '1.5rem',
                fontStyle: 'italic',
                color: '#334155',
              },
              '& code': {
                background: '#e6f7f5',
                boxShadow:
                  'inset 2px 2px 4px #c4d9d6, inset -2px -2px 4px #ffffff',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.95em',
              },
              '& pre': {
                background: '#e6f7f5',
                boxShadow:
                  'inset 4px 4px 8px #c4d9d6, inset -4px -4px 8px #ffffff',
                padding: '1rem',
                borderRadius: '12px',
                overflowX: 'auto',
              },
              '& pre > code': {
                background: 'none',
                boxShadow: 'none',
                padding: 0,
              },
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Related Posts (if exist) */}
          {frontmatter.relatedPosts &&
            frontmatter.relatedPosts.length > 0 && (
              <Box
                component="section"
                sx={{
                  mt: 6,
                  pt: 4,
                  borderTop: '2px solid #c4d9d6',
                }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: '1.8rem',
                    color: '#1e3a8a',
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  Related Articles
                </Typography>
                <List sx={{ spaceY: 1 }}>
                  {frontmatter.relatedPosts.map((postSlug) => (
                    <ListItem key={postSlug} sx={{ padding: '4px 0' }}>
                      <NextLink href={`/blog/${postSlug}`} passHref legacyBehavior>
                        <Link
                          sx={{
                            fontSize: '1.1rem',
                            color: '#14b8a6',
                            textDecoration: 'none',
                            fontWeight: 500,
                            '&:hover': {
                              color: '#0d9488',
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {postSlug
                            .replace(/-/g, ' ')
                            .replace(
                              /\w\S*/g,
                              (txt) =>
                                txt.charAt(0).toUpperCase() +
                                txt.substring(1).toLowerCase()
                            )}
                        </Link>
                      </NextLink>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

          {/* CTA */}
          <Paper
            component="section"
            elevation={0}
            sx={{
              mt: 6,
              background: '#e6f7f5',
              boxShadow:
                'inset 6px 6px 12px #c4d9d6, inset -6px -6px 12px #ffffff',
              borderRadius: '20px',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontSize: '1.5rem',
                color: '#1e3a8a',
                fontWeight: 700,
                mb: 1,
              }}
            >
              Need help checking your Amazon images?
            </Typography>
            <Typography sx={{ color: '#475569', mb: 3 }}>
              Try ComplianceKit free - 10 checks & 3 fixes, no credit
              card required.
            </Typography>
            <NextLink href="/" passHref legacyBehavior>
              <Button component="a" sx={btnPrimary}>
                Check Your Images Free &rarr;
              </Button>
            </NextLink>
          </Paper>
        </Paper>
      </BlogLayout>
    </>
  );
}

// --- Data Fetching ---

// export const getStaticPaths: GetStaticPaths = async () => {
//   try {
//     const postsDirectory = getPostsDirectory();
//     const filenames = fs.readdirSync(postsDirectory);

//     const paths = filenames
//       .filter((filename) => filename.endsWith('.md'))
//       .map((filename) => ({
//         params: { slug: filename.replace(/\.md$/, '') },
//       }));

//     console.log('Generated paths:', paths);

//     return {
//       paths,
//       fallback: 'blocking',
//     };
//   } catch (error) {
//     console.error('Error in getStaticPaths:', error);
//     return {
//       paths: [],
//       fallback: false,
//     };
//   }
// };

export async function getServerSideProps({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  
  try {
    const postsDirectory = getPostsDirectory();
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    
    console.log('getServerSideProps - Looking for file:', fullPath);
    
    if (!fs.existsSync(fullPath)) {
      console.error('Post file not found:', fullPath);
      return {
        notFound: true,
      };
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    console.log('Parsed frontmatter:', data);

    // Convert markdown to HTML
    const htmlContent = await marked(content);

    // Ensure all data is properly serialized for Next.js
    const frontmatter: Frontmatter = {
      title: data.title || '',
      description: data.description || '',
      date: data.date || '',
      modified: data.modified || undefined,
      author: data.author || undefined,
      image: data.image || undefined,
      metaDescription: data.metaDescription || undefined,
      keywords: data.keywords || undefined,
      relatedPosts: data.relatedPosts || undefined,
      faqs: data.faqs || undefined,
    };

    return {
      props: {
        frontmatter,
        content: htmlContent,
        slug,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      notFound: true,
    };
  }
}