import { NextApiRequest, NextApiResponse } from 'next';
// IMPORTANT: Replace this with your actual session management library
// import { getSession } from 'next-auth/react'; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Step 1: Authenticate the user on the Next.js server.
  // YOU MUST REPLACE THIS with your real authentication logic to get the user's ID.
  // Example using next-auth:
  // const session = await getSession({ req });
  // if (!session || !session.user) {
  //   return res.status(401).json({ error: 'Not authenticated' });
  // }
  // const userId = session.user.id;
  
  try {
    // Step 2: Forward the request to your REAL Express backend.
    const expressApiUrl = `${process.env.EXPRESS_API_URL}/api/analysis/analyze-image`; // Adjust path as needed
    console.log("[DEBUG] inside front end analyze image")
    const apiResponse = await fetch(expressApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // This is a secret your Next.js and Express servers share to verify the request is legitimate.
        // It proves the request is coming from your trusted proxy.
        'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET}`,
      },
      // Pass along the image URL from the browser's request.
      // The Express server will handle getting the userId from the auth token.
      body: JSON.stringify({ imageUrl: req.body.imageUrl }),
    });

    // Step 3: Get the data (or error) from your Express server.
    const data = await apiResponse.json();

    // Step 4: Send the final response from Express back to the browser.
    return res.status(apiResponse.status).json(data);

  } catch (error) {
    console.error('Error in Next.js proxy to Express:', error);
    return res.status(500).json({ error: 'An internal server error occurred while contacting the analysis service.' });
  }
}