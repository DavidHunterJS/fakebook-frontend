// // pages/api/feedback.ts (or app/api/feedback/route.ts for app router)
// import { NextApiRequest, NextApiResponse } from 'next';
// import { MongoClient } from 'mongodb';

// const MONGODB_URI = process.env.MONGODB_URI!;

// let cachedClient: MongoClient | null = null;

// async function connectToDatabase() {
//   if (cachedClient) {
//     return cachedClient;
//   }
  
//   const client = new MongoClient(MONGODB_URI);
//   await client.connect();
//   cachedClient = client;
//   return client;
// }

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   try {
//     const { imageId, feedback, complianceData, timestamp } = req.body;

//     const client = await connectToDatabase();
//     const db = client.db('compliancekit');
//     const collection = db.collection('feedback');

//     const feedbackDocument = {
//       imageId,
//       feedback,
//       complianceData: {
//         nonWhitePixels: complianceData.nonWhitePixels,
//         totalIssues: complianceData.issues?.length || 0,
//         criticalIssues: complianceData.issues?.filter((i: any) => i.priority === 'critical').length || 0,
//         // Add other relevant compliance data
//       },
//       timestamp,
//       createdAt: new Date()
//     };

//     const result = await collection.insertOne(feedbackDocument);

//     res.status(200).json({ 
//       success: true, 
//       feedbackId: result.insertedId 
//     });

//   } catch (error) {
//     console.error('Error saving feedback:', error);
//     res.status(500).json({ error: 'Failed to save feedback' });
//   }
// }