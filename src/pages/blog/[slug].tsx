// pages/blog/[slug].tsx
import { GetStaticProps, GetStaticPaths } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import NextLink from 'next/link'; // Import NextLink
import SEO from '@/components/SEO';
import BlogLayout from '@/components/BlogLayout'; // <-- Import layout
import {
  Typography,
  Paper,
  Box,
  Button,
  Link, // <-- Import MUI Link
  List,
  ListItem,
} from '@mui/material';

// --- Reusable Style Objects (from your welcome.tsx) ---
// (You could also move these to a shared theme file)
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

// --- Interfaces (Unchanged) ---
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
  content: string; // This will be HTML from marked
  slug: string;
}

// --- Page Component (Refactored) ---
export default function BlogPost({ frontmatter, content, slug }: BlogPostProps) {
  // Generate Article Schema (Unchanged)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: frontmatter.title,
    description: frontmatter.description,
    image: `https://compliancekit.app${
      frontmatter.image || '/blog/default.jpg'
    }`,
    datePublished: frontmatter.date,
    dateModified: frontmatter.modified || frontmatter.date,
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

  // Generate FAQ Schema (Unchanged)
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
          component="article" // Use the 'article' tag
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
                mb: 4, // 32px
                borderRadius: '20px', // Softer radius
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

          {/* Content (Prose replacement) */}
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
            dangerouslySetInnerHTML={{ __html: content }} // 'content' is already HTML
          />

          {/* Related Posts (if exist) */}
          {frontmatter.relatedPosts &&
            frontmatter.relatedPosts.length > 0 && (
              <Box
                component="section"
                sx={{
                  mt: 6, // 48px
                  pt: 4, // 32px
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
                  {frontmatter.relatedPosts.map((slug) => (
                    <ListItem key={slug} sx={{ padding: '4px 0' }}>
                      <NextLink href={`/blog/${slug}`} passHref legacyBehavior>
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
                          {/* Simple slug-to-title guess */}
                          {slug
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

// --- Data Fetching (Refactored to use marked) ---

export const getStaticPaths: GetStaticPaths = async () => {
  const postsDirectory = path.join(process.cwd(), 'posts');
  const filenames = fs.readdirSync(postsDirectory);

  const paths = filenames
    .filter((filename) => filename.endsWith('.md'))
    .map((filename) => ({
      params: { slug: filename.replace(/\.md$/, '') },
    }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const postsDirectory = path.join(process.cwd(), 'posts');
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const { data: frontmatter, content } = matter(fileContents);

  // Convert markdown to HTML
  const htmlContent = await marked(content);

  return {
    props: {
      frontmatter,
      content: htmlContent, // Pass the HTML to the component
      slug,
    },
  };
};