"use client";

import { useState } from 'react';
import { Box, TextField, Button, CircularProgress, Typography, Alert, Paper } from '@mui/material';
import { urlToFile } from '../utils/fileUtils';

interface ImageGeneratorProps {
  onImageSelect: (file: File) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onImageSelect }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/generate-image`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate image.');
      }
      const data = await response.json();
      setGeneratedImage(data.imageUrl);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttachToPost = async () => {
    if (!generatedImage) return;
    const imageFile = await urlToFile(generatedImage, `ai-generated-${Date.now()}.png`);
    onImageSelect(imageFile);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
      <Typography variant="subtitle1" color="text.secondary">
        Describe the image you want to create.
      </Typography>
      
      <TextField
        fullWidth
        label="Prompt"
        variant="outlined"
        multiline
        rows={3}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g., A photo of a raccoon programming on a laptop"
      />
      
      <Button 
        variant="contained"
        onClick={handleGenerateImage} 
        disabled={isLoading}
        sx={{ height: '40px' }} // Give button a consistent height
      >
        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Generate Image'}
      </Button>

      {error && <Alert severity="error">{error}</Alert>}

      {generatedImage && (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper variant="outlined">
            <img
              src={generatedImage}
              alt="AI-generated content"
              style={{ width: '100%', display: 'block', borderRadius: '4px' }}
            />
          </Paper>
          <Button 
            onClick={handleAttachToPost} 
            variant="contained"
            color="success"
          >
            Use This Image
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ImageGenerator;