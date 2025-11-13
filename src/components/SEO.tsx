// src/components/SEO.tsx
import Head from 'next/head';

interface SEOProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article';
  article?: {
    publishedTime: string;
    modifiedTime?: string;
    author?: string;
  };
}

export default function SEO({ 
  title, 
  description, 
  url = '',
  image = '/og-image.jpg',
  type = 'website',
  article 
}: SEOProps) {
  const siteTitle = 'ComplianceKit';
  const siteDomain = 'https://compliancekit.app';
  
  // Build full title
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  
  // Build full URLs
  const fullUrl = url ? `${siteDomain}${url}` : siteDomain;
  const fullImage = image.startsWith('http') 
    ? image 
    : `${siteDomain}${image}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteTitle} />
      
      {/* Article-specific Open Graph tags */}
      {article && (
        <>
          <meta property="article:published_time" content={article.publishedTime} />
          {article.modifiedTime && (
            <meta property="article:modified_time" content={article.modifiedTime} />
          )}
          {article.author && (
            <meta property="article:author" content={article.author} />
          )}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
    </Head>
  );
}