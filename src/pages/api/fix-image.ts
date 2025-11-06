import type { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

type ResponseData = {
  fixedUrl?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // We now expect the URL of the transparent cutout image
  const { cutoutImageUrl } = req.body;

  if (!cutoutImageUrl) {
    return res.status(400).json({ error: 'cutoutImageUrl is required' });
  }

  try {
    // REMOVED: No need to call Replicate here anymore!

    // --- Step 1: Fetch the transparent cutout image ---
    console.log('Fetching transparent cutout image to process...');
    const imageResponse = await fetch(cutoutImageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // --- Step 2: Use sharp.flatten() to add the white background ---
    console.log('Compositing image onto a white background with sharp.flatten()...');
    const finalImageBuffer = await sharp(imageBuffer)
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // This is the "tried-and-true" step
      .jpeg()
      .toBuffer();

    // --- Step 3: Save the final image and return its URL ---
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)){
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `${Date.now()}-fixed-bg.jpg`;
    const filepath = path.join(uploadsDir, filename);
    
    fs.writeFileSync(filepath, finalImageBuffer);
    console.log('Final image saved to:', filepath);

    const fixedUrl = `/uploads/${filename}`;
    
    res.status(200).json({ fixedUrl });

  } catch (error) {
    console.error('An error occurred during the image fixing process:', error);
    res.status(500).json({ error: 'Failed to fix image.' });
  }
}