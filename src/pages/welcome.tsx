// pages/trippy-mui-page.tsx

import React from 'react';
import Head from 'next/head';
import { Box, Container, Typography, Button, AppBar, Toolbar, Grid, Link, List, ListItem } from '@mui/material';

// Reusable component for feature cards using MUI
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <Box sx={{ textAlign: 'center', p: 3 }}>
    <Typography variant="h1" sx={{ fontSize: '3rem', mb: 1.5 }}>{icon}</Typography>
    <Typography variant="h3" sx={{ fontSize: '1.5rem', fontWeight: 700, mb: 1, color: '#1a202c' }}>
      {title}
    </Typography>
    <Typography sx={{ color: '#4a5568', lineHeight: 1.7 }}>
      {description}
    </Typography>
  </Box>
);

// Reusable component for pricing cards using MUI
interface PricingCardProps {
  title: string;
  price: string;
  features: string[];
  isFeatured?: boolean;
  ctaText: string;
}

const PricingCard: React.FC<PricingCardProps> = ({ title, price, features, isFeatured = false, ctaText }) => (
  <Box sx={{
    background: 'white',
    borderRadius: '12px',
    p: '2.5rem',
    textAlign: 'center',
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
    border: '2px solid',
    borderColor: isFeatured ? '#667eea' : '#e2e8f0',
    position: 'relative',
    transition: 'transform 0.3s ease',
    transform: isFeatured ? 'scale(1.05)' : 'none',
    zIndex: isFeatured ? 10 : 1,
  }}>
    {isFeatured && (
      <Box sx={{
        background: '#667eea', color: 'white', py: 0.5, px: 2, borderRadius: '20px',
        fontSize: '0.8rem', fontWeight: 600, position: 'absolute', top: '-15px',
        left: '50%', transform: 'translateX(-50%)',
      }}>
        Most Popular
      </Box>
    )}
    <Typography variant="h3" sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a202c', mb: 0.5 }}>
      {title}
    </Typography>
    <Typography sx={{ fontSize: '3rem', fontWeight: 800, color: '#667eea', mb: 2 }}>
      {price}<Box component="span" sx={{ fontSize: '1rem' }}>/mo</Box>
    </Typography>
    <List sx={{ mb: 2.5, p: 0, textAlign: 'left' }}>
      {features.map((feature, index) => (
        <ListItem key={index} sx={{ p: '0.5rem 0', color: '#4a5568' }}>
          <Box component="span" sx={{ color: '#38a169', mr: 0.5 }}>✓</Box> {feature}
        </ListItem>
      ))}
    </List>
    <Button variant="contained" disableElevation sx={{
        background: '#667eea', color: 'white', textTransform: 'none', fontWeight: 600,
        borderRadius: '8px', py: 0.75, px: 1.5, '&:hover': { background: '#5a67d8', transform: 'translateY(-1px)' }
      }}>
        {ctaText}
    </Button>
  </Box>
);


// Main Page Component
const TrippyMuiPage: React.FC = () => {
  const commonBtnStyles = {
    py: 0.75, px: 3, borderRadius: '8px', textDecoration: 'none', fontWeight: 600,
    transition: 'all 0.3s ease', border: '2px solid transparent', fontSize: '0.9rem',
    textTransform: 'none',
  };

  return (
    <Box sx={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <Head>
        <title>Trippy.lol - Stop Paying $10K for $9 Work</title>
        <meta name="description" content="Creative agencies charge thousands for AI art that takes minutes. We give you the same professional results with one integrated platform." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* Header */}
      <AppBar position="fixed" elevation={0} sx={{ background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
            <Link href="#" sx={{ textDecoration: 'none', fontSize: '1.8rem', fontWeight: 800, color: '#667eea' }}>
              trippy.lol
            </Link>
            <Box sx={{ display: {xs: 'none', md: 'flex'}, gap: '1rem' }}>
              <Button variant="outlined" sx={{ ...commonBtnStyles, color: '#667eea', borderColor: '#667eea', '&:hover': { background: '#667eea', color: 'white', borderColor: '#667eea' } }}>
                <Link href="/login" sx={{ textDecoration: 'none'}}>
                  Log In
                </Link>
              </Button>
              <Button variant="contained" disableElevation sx={{ ...commonBtnStyles, background: '#667eea', '&:hover': { background: '#5a67d8' } }}>
                Start Free
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ pt: '140px', pb: '80px', background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: '800px', mx: 'auto' }}>
            {/* <Box sx={{ display: 'inline-block', background: '#e6fffa', color: '#065f46', py: 0.5, px: 2, borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, mb: 4, border: '1px solid #a7f3d0' }}>
              Built by a homeless developer using AI
            </Box> */}
            <Typography variant="h1" component="h1" sx={{ fontSize: {xs: '2.5rem', md:'3.5rem'}, fontWeight: 800, color: '#1a202c', mb: 1.5, lineHeight: 1.2 }}>
              Stop Paying <Box component="span" sx={{ color: '#e53e3e', textDecoration: 'line-through' }}>$10,000</Box><br />
              for <Box component="span" sx={{ color: '#38a169' }}>$9</Box> Work
            </Typography>
            <Typography sx={{ fontSize: '1.25rem', color: '#4a5568', mb: 3, maxWidth: '600px', mx: 'auto' }}>
              Creative agencies charge thousands for AI art that takes minutes. We give you the same professional results with one integrated platform instead of juggling 5 different AI tools.
            </Typography>
            <Box sx={{ display: 'flex', gap: '1rem', justifyContent: 'center', mb: 4, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center' }}>
                    <Link href='/workflows'>
                <Button variant="contained" disableElevation sx={{ ...commonBtnStyles, py: 2, px: 4, fontSize: '1.1rem', background: '#667eea', '&:hover': { background: '#5a67d8' } }}>
                    Start Creating Free
                </Button>
                    </Link>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Problem Section */}
      <Box sx={{ py: '80px' }}>
          <Container maxWidth="lg">
              <Grid container spacing={{xs: 4, md: 8}} alignItems="center">
                  <Grid size={{xs:12, md:6}}>
                      <Typography variant="h2" component="h2" sx={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a202c', mb: 4 }}>
                          Creative Work Shouldn&apos;t Bankrupt You
                      </Typography>
                      <List sx={{p: 0}}>
                          {["Agencies charge $5K-15K for AI-generated designs", "You need 5+ different AI tools for one project", "Hours wasted switching between platforms", "No way to prove you created the work", "Results look obviously AI-generated"].map(text => (
                              <ListItem key={text} sx={{p: 0, mb: 1.5, fontSize: '1.1rem', color: '#4a5568', alignItems: 'flex-start'}}>
                                  <Box component="span" sx={{color: '#e53e3e', fontSize: '1.2rem', mr: 2, mt: 0.25}}>✗</Box>
                                  {text}
                              </ListItem>
                          ))}
                      </List>
                  </Grid>
                  <Grid size={{xs:12,md:6}}>
                      <Box sx={{ background: '#fff5f5', border: '2px solid #fed7d7', borderRadius: '12px', p: 4, textAlign: 'center' }}>
                          <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, color: '#e53e3e', textDecoration: 'line-through' }}>$10,000</Typography>
                          <Typography sx={{ color: '#718096', fontWeight: 600, mt: 0.5 }}>What agencies charge</Typography>
                          <Typography sx={{ my: 2, fontSize: '2rem' }}>vs</Typography>
                          <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, color: '#38a169', mt: 1 }}>$9/month</Typography>
                          <Typography sx={{ color: '#718096', fontWeight: 600, mt: 0.5 }}>What you actually need</Typography>
                      </Box>
                  </Grid>
              </Grid>
          </Container>
      </Box>

      {/* Solution Section */}
      <Box sx={{ py: '80px', background: '#f7fafc' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: '700px', mx: 'auto', mb: 4 }}>
            <Typography variant="h2" component="h2" sx={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a202c', mb: 1.5 }}>
              One Platform. Every AI Tool. Professional Results.
            </Typography>
            <Typography sx={{ fontSize: '1.1rem', color: '#4a5568' }}>
              Stop jumping between DALL-E, Midjourney, and 5 other apps. Create complete workflows that would cost agencies $10K+ in minutes.
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, alignItems: 'center', justifyContent: 'center', gap: {xs: 3, md: 0} }}>
            {[ { icon: '✨', title: 'Generate', active: true }, { icon: '🎨', title: 'Enhance' }, { icon: '📈', title: 'Upscale' }, { icon: '🔄', title: 'Iterate' }, { icon: '🏆', title: 'Publish' }].map((step, index, arr) => (
                <React.Fragment key={index}>
                    <Box sx={{ background: 'white', borderRadius: '10px', p: '1.5rem', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '2px solid', borderColor: step.active ? '#667eea' : '#e2e8f0', width: 150, height: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', transform: step.active ? 'scale(1.05)' : 'none', mx: 'auto' }}>
                        <Typography sx={{ fontSize: '2rem', mb: 1 }}>{step.icon}</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a202c' }}>{step.title}</Typography>
                    </Box>
                    {index < arr.length - 1 && <Box sx={{ fontSize: '2.5rem', color: '#cbd5e0', textAlign: 'center', transform: { xs: 'rotate(90deg)', md: 'none' } }}>→</Box>}
                </React.Fragment>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: '80px' }}>
        <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', maxWidth: '700px', mx: 'auto', mb: 4 }}>
                <Typography variant="h2" sx={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a202c', mb: 1.5 }}>Everything You Need. Nothing You Don&apos;t.</Typography>
                <Typography sx={{ fontSize: '1.1rem', color: '#4a5568' }}>Built by someone who lived this problem - no fancy office, no VC money, just pure focus on what creators actually need.</Typography>
            </Box>
            <Grid container spacing={4} sx={{mt: 4}}>
                <Grid size={{xs:12,md:4}} ><FeatureCard icon="🔗" title="Seamless Workflows" description="Click 'Send to Upscaler' and your image automatically moves to the next tool. No downloading, re-uploading, or copying prompts." /></Grid>
                <Grid size={{xs:12,md:4}} ><FeatureCard icon="🛡️" title="Proof of Creation" description="Every piece you create gets cryptographic proof you made it. Never worry about copyright disputes or stolen work again." /></Grid>
                <Grid size={{xs:12,md:4}} ><FeatureCard icon="🎯" title="Professional Quality" description="Access the same AI models agencies use - FLUX Pro, SDXL, GPT-4 - with templates that actually work." /></Grid>
            </Grid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box sx={{ py: '80px', background: '#f7fafc' }}>
          <Container maxWidth="lg">
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h2" sx={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a202c', mb: 1 }}>Choose Your Creative Freedom</Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: '#4a5568' }}>Start free, upgrade when you&apos;re making money. Cancel anytime.</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: {xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)'}, gap: 3, maxWidth: '1000px', mx: 'auto', alignItems: 'center' }}>
                <PricingCard title="Basic" price="$9" features={['50 AI generations', 'All core workflows', 'Creation proof', 'Community templates']} ctaText="Get Started" />
                <PricingCard title="Pro" price="$29" features={['500 AI generations', 'Priority processing', 'Custom fine-tuning', 'Advanced workflows', 'Marketplace selling']} ctaText="Start Pro Trial" isFeatured={true} />
                <PricingCard title="Business" price="$99" features={['2,000 AI generations', 'Team collaboration', 'White-label options', 'API access', 'Premium support']} ctaText="Scale Your Team" />
              </Box>
          </Container>
      </Box>

      {/* Final CTA Section */}
      <Box sx={{ py: '80px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', textAlign: 'center' }}>
          <Container>
              <Typography variant="h2" sx={{ fontSize: '2.5rem', fontWeight: 700, mb: 1 }}>Join the AI Creative Revolution</Typography>
              <Typography sx={{ fontSize: '1.25rem', mb: 3, opacity: 0.9 }}>Start creating professional work today. No credit card required.</Typography>
              <Button sx={{ background: 'white', color: '#667eea', py: 2, px: 4, fontSize: '1.1rem', borderRadius: '10px', textTransform: 'none', fontWeight: 600, transition: 'all 0.3s ease', '&:hover': { background: 'white', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}}>
                Create Your First Project Free
              </Button>
          </Container>
      </Box>
    </Box>
  );
};

export default TrippyMuiPage;