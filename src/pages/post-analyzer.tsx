// pages/post-analyzer.tsx
import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Card, Divider, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper 
} from '@mui/material';
import api from '../utils/api';
import { getFullImageUrl } from '../utils/imgUrl';
import { Post } from '../types/post';

export default function PostAnalyzer() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/posts');
        setPosts(response.data);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Group posts by whether their images display correctly
  const workingPosts = posts.filter(post => 
    (post.image || (post.media && post.media.length > 0)) && 
    new Date(post.createdAt) < new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  
  const newPosts = posts.filter(post => 
    (post.image || (post.media && post.media.length > 0)) && 
    new Date(post.createdAt) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  // Extract common fields for comparison
  const getImageDetails = (post: Post) => {
    return {
      id: post._id,
      createdAt: new Date(post.createdAt).toLocaleString(),
      image: post.image || 'undefined',
      media: JSON.stringify(post.media || []),
      imageUrl: post.imageUrl || 'undefined',
      calculated: getImagePath(post)
    };
  };

  // Function to determine the image path used for display
  const getImagePath = (post: Post): string => {
    if (post.media && Array.isArray(post.media) && post.media.length > 0) {
      return getFullImageUrl(post.media[0], 'post');
    }
    if (post.image) {
      return getFullImageUrl(post.image, 'post');
    }
    if (post.imageUrl) {
      return post.imageUrl;
    }
    return 'No image available';
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Post Image Format Analyzer</Typography>
      
      {loading && <Typography>Loading posts...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      
      {!loading && !error && (
        <>
          <Card sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6">Analysis Summary</Typography>
            <Typography>
              Total posts with images: {workingPosts.length + newPosts.length}
            </Typography>
            <Typography>
              Older posts (likely working): {workingPosts.length}
            </Typography>
            <Typography>
              Recent posts (last 24h): {newPosts.length}
            </Typography>
          </Card>
          
          <Typography variant="h6" gutterBottom>Recent Posts (Might Not Be Working)</Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>post.image</TableCell>
                  <TableCell>post.media</TableCell>
                  <TableCell>Calculated URL</TableCell>
                  <TableCell>Preview</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {newPosts.map(post => (
                  <TableRow key={post._id}>
                    <TableCell>{post._id}</TableCell>
                    <TableCell>{new Date(post.createdAt).toLocaleString()}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {post.image || 'undefined'}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {JSON.stringify(post.media || [])}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getImagePath(post)}
                    </TableCell>
                    <TableCell>
                      <img 
                        src={getImagePath(post)}
                        alt="Preview" 
                        width={100} 
                        height={100}
                        style={{ objectFit: 'cover' }}
                        onError={(e) => {
                          console.error(`Failed to load image: ${getImagePath(post)}`);
                          (e.target as HTMLImageElement).src = '/images/image-error.png';
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Typography variant="h6" gutterBottom>Older Posts (Likely Working)</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>post.image</TableCell>
                  <TableCell>post.media</TableCell>
                  <TableCell>Calculated URL</TableCell>
                  <TableCell>Preview</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workingPosts.slice(0, 5).map(post => (
                  <TableRow key={post._id}>
                    <TableCell>{post._id}</TableCell>
                    <TableCell>{new Date(post.createdAt).toLocaleString()}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {post.image || 'undefined'}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {JSON.stringify(post.media || [])}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getImagePath(post)}
                    </TableCell>
                    <TableCell>
                      <img 
                        src={getImagePath(post)}
                        alt="Preview" 
                        width={100} 
                        height={100}
                        style={{ objectFit: 'cover' }}
                        onError={(e) => {
                          console.error(`Failed to load image: ${getImagePath(post)}`);
                          (e.target as HTMLImageElement).src = '/images/image-error.png';
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}