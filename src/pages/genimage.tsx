'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  SelectChangeEvent
} from '@mui/material';

type Model = 'stable-diffusion-xl' | 'midjourney-style' | 'flux-schnell' | 'google-imagen4' | 'bytedance-seedream3' | 'recraft-v3-svg';

interface Parameters {
  prompt: string;
  negative_prompt?: string;
  width?: string;
  height?: string;
  guidance_scale?: string;
  num_inference_steps?: string;
  seed?: string;
  chaos?: string;
  aspect_ratio?: string;
  output_quality?: string;
  num_outputs?: string;
  output_format?: string;
  safety_filter_level?: string;
  size?: string;
  style?: string;
  [key: string]: any;
}

export default function ImageGeneratorPage() {
  const [model, setModel] = useState<Model>('stable-diffusion-xl');
  const [parameters, setParameters] = useState<Parameters>({
    prompt: '',
    negative_prompt: '',
    width: '1024',
    height: '1024',
    guidance_scale: '7.5',
    num_inference_steps: '28',
    seed: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const handleParamChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setParameters(prev => ({ ...prev, [name]: value }));
  };
    
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setParameters(prev => ({ ...prev, [name]: value }));
  };

  const handleModelChange = (e: SelectChangeEvent<Model>) => {
    const newModel = e.target.value as Model;
    setModel(newModel);
    setParameters({
      prompt: parameters.prompt,
      negative_prompt: parameters.negative_prompt,
    });
  };

  // Updated to match your working component pattern
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!parameters.prompt) {
      setError('Prompt is a required field.');
      return;
    }

    setLoading(true);
    setError(null);
    setImages([]);

    try {
      const filteredParams = Object.fromEntries(
        Object.entries(parameters).filter(([_, value]) => value !== '')
      );
      
      const payload = {
        model,
        parameters: filteredParams,
      };
      
      // Debug logging
      console.log('Sending payload:', payload);
      console.log('Prompt value:', `"${filteredParams.prompt}"`);
      console.log('Prompt length:', filteredParams.prompt?.length);
      console.log('API URL:', `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/generate-image`);
      
      // Use the same environment variable as your working component
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/generate-image-advanced`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! Status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('Error response:', errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.log('Could not parse error response');
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success && result.images?.length > 0) {
        setImages(result.images);
      } else {
        setError(result.error || 'The API returned success but no images were found.');
      }
    } catch (err: any) {
      console.error('Frontend submission error:', err);
      setError(err.message || 'An unexpected error occurred. Please check the console.');
    } finally {
      setLoading(false);
    }
  };
  
  const renderModelParameters = () => {
    switch (model) {
      case 'stable-diffusion-xl':
        return (
          <>
            <TextField 
              label="Guidance Scale (cfg)" 
              type="number" 
              name="guidance_scale" 
              value={parameters.guidance_scale || '7.5'} 
              onChange={handleParamChange} 
              inputProps={{ step: "0.1" }} 
              fullWidth 
            />
            <TextField 
              label="Inference Steps" 
              type="number" 
              name="num_inference_steps" 
              value={parameters.num_inference_steps || '28'} 
              onChange={handleParamChange} 
              fullWidth 
            />
            <TextField 
              label="Width" 
              type="number" 
              name="width" 
              value={parameters.width || '1024'} 
              onChange={handleParamChange} 
              fullWidth 
            />
            <TextField 
              label="Height" 
              type="number" 
              name="height" 
              value={parameters.height || '1024'} 
              onChange={handleParamChange} 
              fullWidth 
            />
          </>
        );
      case 'midjourney-style':
        return (
          <>
            <TextField 
              label="Chaos" 
              type="number" 
              name="chaos" 
              value={parameters.chaos || ''} 
              placeholder="0-100" 
              onChange={handleParamChange} 
              fullWidth 
            />
            <FormControl fullWidth>
              <InputLabel id="aspect-ratio-label">Aspect Ratio</InputLabel>
              <Select 
                labelId="aspect-ratio-label" 
                name="aspect_ratio" 
                value={parameters.aspect_ratio || '1:1'} 
                label="Aspect Ratio" 
                onChange={handleSelectChange}
              >
                <MenuItem value="1:1">1:1 (Square)</MenuItem>
                <MenuItem value="16:9">16:9 (Widescreen)</MenuItem>
                <MenuItem value="9:16">9:16 (Portrait)</MenuItem>
                <MenuItem value="4:3">4:3 (Landscape)</MenuItem>
                <MenuItem value="3:4">3:4 (Tall)</MenuItem>
              </Select>
            </FormControl>
          </>
        );
      case 'flux-schnell':
        return (
          <>
            <TextField 
              label="Number of Images" 
              type="number" 
              name="num_outputs" 
              value={parameters.num_outputs || '1'} 
              inputProps={{ min: "1", max: "4" }} 
              onChange={handleParamChange} 
              fullWidth 
            />
            <TextField 
              label="Quality" 
              type="number" 
              name="output_quality" 
              value={parameters.output_quality || '90'} 
              inputProps={{ min: "1", max: "100" }} 
              onChange={handleParamChange} 
              fullWidth 
            />
          </>
        );
      case 'google-imagen4':
        return (
          <>
            <FormControl fullWidth>
              <InputLabel id="aspect-ratio-label">Aspect Ratio</InputLabel>
              <Select 
                labelId="aspect-ratio-label" 
                name="aspect_ratio" 
                value={parameters.aspect_ratio || '1:1'} 
                label="Aspect Ratio" 
                onChange={handleSelectChange}
              >
                <MenuItem value="1:1">1:1 (Square)</MenuItem>
                <MenuItem value="9:16">9:16 (Portrait)</MenuItem>
                <MenuItem value="16:9">16:9 (Landscape)</MenuItem>
                <MenuItem value="3:4">3:4 (Tall)</MenuItem>
                <MenuItem value="4:3">4:3 (Wide)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="output-format-label">Output Format</InputLabel>
              <Select 
                labelId="output-format-label" 
                name="output_format" 
                value={parameters.output_format || 'jpg'} 
                label="Output Format" 
                onChange={handleSelectChange}
              >
                <MenuItem value="jpg">JPG</MenuItem>
                <MenuItem value="png">PNG</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="safety-filter-label">Safety Filter Level</InputLabel>
              <Select 
                labelId="safety-filter-label" 
                name="safety_filter_level" 
                value={parameters.safety_filter_level || 'block_only_high'} 
                label="Safety Filter Level" 
                onChange={handleSelectChange}
              >
                <MenuItem value="block_low_and_above">Strict (Block Low and Above)</MenuItem>
                <MenuItem value="block_medium_and_above">Medium (Block Medium and Above)</MenuItem>
                <MenuItem value="block_only_high">Permissive (Block Only High)</MenuItem>
              </Select>
            </FormControl>
          </>
        );
      case 'bytedance-seedream3':
        return (
          <>
            <FormControl fullWidth>
              <InputLabel id="aspect-ratio-label">Aspect Ratio</InputLabel>
              <Select 
                labelId="aspect-ratio-label" 
                name="aspect_ratio" 
                value={parameters.aspect_ratio || '16:9'} 
                label="Aspect Ratio" 
                onChange={handleSelectChange}
              >
                <MenuItem value="1:1">1:1 (Square)</MenuItem>
                <MenuItem value="3:4">3:4 (Portrait)</MenuItem>
                <MenuItem value="4:3">4:3 (Landscape)</MenuItem>
                <MenuItem value="16:9">16:9 (Widescreen)</MenuItem>
                <MenuItem value="9:16">9:16 (Tall Portrait)</MenuItem>
                <MenuItem value="2:3">2:3 (Classic Portrait)</MenuItem>
                <MenuItem value="3:2">3:2 (Classic Landscape)</MenuItem>
                <MenuItem value="21:9">21:9 (Ultra Wide)</MenuItem>
                <MenuItem value="custom">Custom (Use Width/Height)</MenuItem>
              </Select>
            </FormControl>
            
            {parameters.aspect_ratio !== 'custom' && (
              <FormControl fullWidth>
                <InputLabel id="size-label">Image Size</InputLabel>
                <Select 
                  labelId="size-label" 
                  name="size" 
                  value={parameters.size || 'regular'} 
                  label="Image Size" 
                  onChange={handleSelectChange}
                >
                  <MenuItem value="small">Small (Shortest: 512px)</MenuItem>
                  <MenuItem value="regular">Regular (1 Megapixel)</MenuItem>
                  <MenuItem value="big">Big (Longest: 2048px)</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {parameters.aspect_ratio === 'custom' && (
              <>
                <TextField 
                  label="Width" 
                  type="number" 
                  name="width" 
                  value={parameters.width || '1024'} 
                  onChange={handleParamChange} 
                  inputProps={{ min: "512", max: "2048" }}
                  helperText="512-2048 pixels"
                  fullWidth 
                />
                <TextField 
                  label="Height" 
                  type="number" 
                  name="height" 
                  value={parameters.height || '1024'} 
                  onChange={handleParamChange} 
                  inputProps={{ min: "512", max: "2048" }}
                  helperText="512-2048 pixels"
                  fullWidth 
                />
              </>
            )}
            
            <TextField 
              label="Guidance Scale" 
              type="number" 
              name="guidance_scale" 
              value={parameters.guidance_scale || '2.5'} 
              onChange={handleParamChange} 
              inputProps={{ step: "0.1", min: "1", max: "10" }}
              helperText="1-10, Higher = more literal prompt adherence"
              fullWidth 
            />
          </>
        );
      case 'recraft-v3-svg':
        return (
          <>
            <FormControl fullWidth>
              <InputLabel id="aspect-ratio-label">Aspect Ratio</InputLabel>
              <Select 
                labelId="aspect-ratio-label" 
                name="aspect_ratio" 
                value={parameters.aspect_ratio || 'Not set'} 
                label="Aspect Ratio" 
                onChange={handleSelectChange}
              >
                <MenuItem value="Not set">Not Set (Use Size)</MenuItem>
                <MenuItem value="1:1">1:1 (Square)</MenuItem>
                <MenuItem value="4:3">4:3 (Landscape)</MenuItem>
                <MenuItem value="3:4">3:4 (Portrait)</MenuItem>
                <MenuItem value="3:2">3:2 (Classic Landscape)</MenuItem>
                <MenuItem value="2:3">2:3 (Classic Portrait)</MenuItem>
                <MenuItem value="16:9">16:9 (Widescreen)</MenuItem>
                <MenuItem value="9:16">9:16 (Tall Portrait)</MenuItem>
                <MenuItem value="1:2">1:2 (Narrow Portrait)</MenuItem>
                <MenuItem value="2:1">2:1 (Wide Landscape)</MenuItem>
                <MenuItem value="7:5">7:5 (Wide)</MenuItem>
                <MenuItem value="5:7">5:7 (Tall)</MenuItem>
                <MenuItem value="4:5">4:5 (Portrait)</MenuItem>
                <MenuItem value="5:4">5:4 (Landscape)</MenuItem>
                <MenuItem value="3:5">3:5 (Tall Portrait)</MenuItem>
                <MenuItem value="5:3">5:3 (Wide Landscape)</MenuItem>
              </Select>
            </FormControl>
            
            {(parameters.aspect_ratio === 'Not set' || !parameters.aspect_ratio) && (
              <FormControl fullWidth>
                <InputLabel id="size-label">Image Size</InputLabel>
                <Select 
                  labelId="size-label" 
                  name="size" 
                  value={parameters.size || '1024x1024'} 
                  label="Image Size" 
                  onChange={handleSelectChange}
                >
                  <MenuItem value="1024x1024">1024×1024 (Square)</MenuItem>
                  <MenuItem value="1365x1024">1365×1024 (Wide)</MenuItem>
                  <MenuItem value="1024x1365">1024×1365 (Tall)</MenuItem>
                  <MenuItem value="1536x1024">1536×1024 (Wide)</MenuItem>
                  <MenuItem value="1024x1536">1024×1536 (Tall)</MenuItem>
                  <MenuItem value="1820x1024">1820×1024 (Ultra Wide)</MenuItem>
                  <MenuItem value="1024x1820">1024×1820 (Ultra Tall)</MenuItem>
                  <MenuItem value="1024x2048">1024×2048 (Very Tall)</MenuItem>
                  <MenuItem value="2048x1024">2048×1024 (Very Wide)</MenuItem>
                  <MenuItem value="1434x1024">1434×1024 (Wide)</MenuItem>
                  <MenuItem value="1024x1434">1024×1434 (Tall)</MenuItem>
                  <MenuItem value="1024x1280">1024×1280 (Tall)</MenuItem>
                  <MenuItem value="1280x1024">1280×1024 (Wide)</MenuItem>
                  <MenuItem value="1024x1707">1024×1707 (Very Tall)</MenuItem>
                  <MenuItem value="1707x1024">1707×1024 (Very Wide)</MenuItem>
                </Select>
              </FormControl>
            )}
            
            <FormControl fullWidth>
              <InputLabel id="style-label">Style</InputLabel>
              <Select 
                labelId="style-label" 
                name="style" 
                value={parameters.style || 'any'} 
                label="Style" 
                onChange={handleSelectChange}
              >
                <MenuItem value="any">Any Style</MenuItem>
                <MenuItem value="engraving">Engraving</MenuItem>
                <MenuItem value="line_art">Line Art</MenuItem>
                <MenuItem value="line_circuit">Line Circuit</MenuItem>
                <MenuItem value="linocut">Linocut</MenuItem>
              </Select>
            </FormControl>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        AI Image Generator 🎨
      </Typography>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            <FormControl fullWidth>
              <InputLabel id="model-select-label">Model</InputLabel>
              <Select 
                labelId="model-select-label" 
                name="model" 
                value={model} 
                label="Model" 
                onChange={handleModelChange}
              >
                <MenuItem value="stable-diffusion-xl">Stable Diffusion 3.5</MenuItem>
                <MenuItem value="midjourney-style">OpenJourney (Midjourney Style)</MenuItem>
                <MenuItem value="flux-schnell">Flux Schnell</MenuItem>
                <MenuItem value="google-imagen4">Google Imagen 4</MenuItem>
                <MenuItem value="bytedance-seedream3">ByteDance SeeDream-3</MenuItem>
                <MenuItem value="recraft-v3-svg">Recraft V3 SVG</MenuItem>
              </Select>
            </FormControl>
            
            <TextField 
              label="Prompt" 
              name="prompt" 
              value={parameters.prompt} 
              onChange={handleParamChange} 
              placeholder="e.g., A majestic lion jumping from a big stone at sunset" 
              multiline 
              rows={4} 
              required 
              fullWidth 
            />
            {model !== 'google-imagen4' && model !== 'bytedance-seedream3' && model !== 'recraft-v3-svg' && (
              <TextField 
                label="Negative Prompt" 
                name="negative_prompt" 
                value={parameters.negative_prompt} 
                onChange={handleParamChange} 
                placeholder="e.g., blurry, low quality, ugly" 
                multiline 
                rows={2} 
                fullWidth 
              />
            )}

            <Typography variant="h6" component="h3" sx={{ mt: 1 }}>
              Model Parameters
            </Typography>
            {renderModelParameters()}
            
            {model !== 'google-imagen4' && model !== 'recraft-v3-svg' && (
              <TextField 
                label="Seed (Optional)" 
                name="seed" 
                value={parameters.seed || ''} 
                placeholder="Leave blank for random" 
                onChange={handleParamChange} 
                fullWidth 
              />
            )}

            <Button 
              type="submit" 
              variant="contained" 
              size="large" 
              disabled={loading} 
              sx={{ mt: 2, height: '48px' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Image'}
            </Button>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '60vh', 
            border: '2px dashed', 
            borderColor: 'grey.300', 
            borderRadius: 2, 
            p: 2 
          }}>
            {loading && <CircularProgress size={60} />}
            {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
            {!loading && !error && images.length === 0 && (
              <Typography variant="h6" color="text.secondary">
                Your generated images will appear here
              </Typography>
            )}
            {images.length > 0 && (
              <Grid container spacing={2}>
                {images.map((src, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Box 
                      component="a" 
                      href={src} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      sx={{ textDecoration: 'none' }}
                    >
                       <Box 
                         component="img" 
                         src={src} 
                         alt={`Generated image ${index + 1}`} 
                         sx={{ 
                           width: '100%', 
                           borderRadius: 1.5, 
                           boxShadow: 3, 
                           transition: 'transform 0.2s', 
                           '&:hover': { transform: 'scale(1.05)' } 
                         }} 
                       />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}