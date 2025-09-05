// pages/api/auth/google/callback.ts 

import { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'https://fakebook-backend-a2a77a290552.herokuapp.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, error, state } = req.query;
  
  console.log('OAuth callback received:', { code: !!code, error, state });
  
  if (error) {
    console.error('OAuth error:', error);
    return res.redirect('/login?error=oauth_failed');
  }
  
  if (!code || typeof code !== 'string') {
    console.error('No authorization code received');
    return res.redirect('/login?error=no_code');
  }
  
  try {
    console.log('Exchanging code with backend...');
    
    // Send the authorization code to your backend
    const response = await fetch(`${BACKEND_URL}/api/auth/google/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for session
      body: JSON.stringify({ code })
    });
    
    console.log('Backend exchange response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('OAuth exchange successful:', data);
      
      // Set cookies from backend response if needed
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        res.setHeader('Set-Cookie', setCookieHeader);
      }
      
      // OAuth successful, redirect to dashboard
      res.redirect('/dashboard?auth=success');
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend OAuth exchange failed:', response.status, errorData);
      res.redirect('/login?error=exchange_failed');
    }
  } catch (error) {
    console.error('Error exchanging OAuth code:', error);
    res.redirect('/login?error=network_error');
  }
}

