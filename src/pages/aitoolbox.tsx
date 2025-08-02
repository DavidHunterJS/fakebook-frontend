// src/pages/aitoolbox.tsx

'use client';

import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
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
  SelectChangeEvent,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { MODEL_CONFIGS, ModelConfig, ParameterConfig } from '../ai-models';
import { InpaintingCanvas } from '../components/InpaintingCanvas'; // Import the canvas component

// Model configuration types
interface SelectOption {
  value: string;
  label: string;
}

export default function AIGeneratorPage() {
  const [selectedModelId, setSelectedModelId] = useState<string>('stable-diffusion-xl');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [generatedText, setGeneratedText] = useState<string>('');
  
  // New state for inpainting
  const [canvasImageUrl, setCanvasImageUrl] = useState<string>('');
  const [canvasMaskUrl, setCanvasMaskUrl] = useState<string>('');

  const currentModel = MODEL_CONFIGS.find(model => model.id === selectedModelId);
  const isImageModel = currentModel?.type === 'image';
  const isTextModel = currentModel?.type === 'text';
  const isInpaintingModel = selectedModelId === 'stable-diffusion-inpainting';

  // Initialize parameters when model changes
  const initializeParameters = (modelConfig: ModelConfig) => {
    const initialParams: Record<string, any> = {};
    modelConfig.parameters.forEach(param => {
      if (param.defaultValue !== undefined) {
        initialParams[param.name] = param.defaultValue;
      }
    });
    return initialParams;
  };

  // Initialize parameters on component mount
  useEffect(() => {
    if (currentModel && Object.keys(parameters).length === 0) {
      setParameters(initializeParameters(currentModel));
    }
  }, [currentModel, parameters]);

  // Update parameters when inpainting canvas changes
  useEffect(() => {
    if (isInpaintingModel && canvasImageUrl && canvasMaskUrl) {
      setParameters(prev => ({
        ...prev,
        image: canvasImageUrl,
        mask: canvasMaskUrl
      }));
    }
  }, [isInpaintingModel, canvasImageUrl, canvasMaskUrl]);

  const handleModelChange = (e: SelectChangeEvent<string>) => {
    const newModelId = e.target.value;
    const newModel = MODEL_CONFIGS.find(model => model.id === newModelId);
    
    setSelectedModelId(newModelId);
    if (newModel) {
      setParameters(initializeParameters(newModel));
    }
    
    // Clear previous results
    setImages([]);
    setGeneratedText('');
    setError(null);
    
    // Clear canvas URLs when switching away from inpainting
    if (newModelId !== 'stable-diffusion-inpainting') {
      setCanvasImageUrl('');
      setCanvasMaskUrl('');
    }
  };

  const handleParamChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setParameters(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setParameters(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setParameters(prev => ({ ...prev, [name]: checked }));
  };

  // Canvas handlers for inpainting
  const handleCanvasImageChange = (imageUrl: string) => {
    setCanvasImageUrl(imageUrl);
  };

  const handleCanvasMaskChange = (maskUrl: string) => {
    setCanvasMaskUrl(maskUrl);
  };

  // Render a single parameter field with tooltip
  const renderParameter = (paramConfig: ParameterConfig) => {
    const { name, label, type, placeholder, helperText, tooltip, options, inputProps, rows, required, showWhen } = paramConfig;
    
    // Check if parameter should be shown
    if (showWhen && !showWhen(parameters)) {
      return null;
    }

    // Skip rendering image and mask fields for inpainting model (handled by canvas)
    if (isInpaintingModel && (name === 'image' || name === 'mask')) {
      return null;
    }

    const value = parameters[name] ?? '';

    // Create label with optional tooltip
    const labelWithTooltip = tooltip ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {label}
        <Tooltip title={tooltip} placement="top" arrow>
          <IconButton size="small" sx={{ p: 0, minWidth: 'auto', width: 16, height: 16 }}>
            <HelpOutline sx={{ fontSize: 14, color: 'text.secondary' }} />
          </IconButton>
        </Tooltip>
      </Box>
    ) : label;

    switch (type) {
      case 'textarea':
        return (
          <TextField
            key={name}
            label={labelWithTooltip}
            name={name}
            value={value}
            onChange={handleParamChange}
            placeholder={placeholder}
            helperText={helperText}
            multiline
            rows={rows || 2}
            required={required}
            fullWidth
          />
        );

      case 'number':
        return (
          <TextField
            key={name}
            label={labelWithTooltip}
            name={name}
            type="number"
            value={value}
            onChange={handleParamChange}
            placeholder={placeholder}
            helperText={helperText}
            inputProps={inputProps}
            required={required}
            fullWidth
          />
        );

      case 'select':
        return (
          <FormControl key={name} fullWidth>
            <InputLabel id={`${name}-label`}>{labelWithTooltip}</InputLabel>
            <Select
              labelId={`${name}-label`}
              name={name}
              value={value}
              label={label} // Use original label for Select component
              onChange={handleSelectChange}
            >
              {options?.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'switch':
        return (
          <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  name={name}
                  checked={Boolean(value)}
                  onChange={handleSwitchChange}
                />
              }
              label={label}
            />
            {tooltip && (
              <Tooltip title={tooltip} placement="top" arrow>
                <IconButton size="small" sx={{ p: 0, minWidth: 'auto', width: 16, height: 16 }}>
                  <HelpOutline sx={{ fontSize: 14, color: 'text.secondary' }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );

      case 'text':
      default:
        return (
          <TextField
            key={name}
            label={labelWithTooltip}
            name={name}
            value={value}
            onChange={handleParamChange}
            placeholder={placeholder}
            helperText={helperText}
            required={required}
            fullWidth
          />
        );
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!parameters.prompt) {
      setError('Prompt is a required field.');
      return;
    }

    if (!currentModel) {
      setError('No model selected.');
      return;
    }

    // Additional validation for inpainting
    if (isInpaintingModel) {
      if (!canvasImageUrl) {
        setError('Please upload a base image using the canvas.');
        return;
      }
      if (!canvasMaskUrl) {
        setError('Please create a mask by painting on the canvas.');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setImages([]);
    setGeneratedText('');

    try {
      const filteredParams = Object.fromEntries(
        Object.entries(parameters).filter(([, value]) => value !== '' && value !== undefined)
      );
      
      const payload = {
        model: selectedModelId,
        parameters: filteredParams,
      };
      
      console.log('Sending payload:', payload);
      
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/${currentModel.endpoint}`;
      
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

      if (result.success) {
        if (isTextModel && result.text) {
          setGeneratedText(result.text);
        } else if (isImageModel && result.images?.length > 0) {
          setImages(result.images);
        } else {
          setError('The API returned success but no content was found.');
        }
      } else {
        setError(result.error || 'Generation failed.');
      }
    } catch (err) {
      console.error('Frontend submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please check the console.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (loading) {
      return <CircularProgress size={60} />;
    }
    
    if (error) {
      return <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>;
    }
    
    if (isTextModel && generatedText) {
      return (
        <Paper elevation={3} sx={{ p: 3, maxHeight: '60vh', overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Generated Text:
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
            {generatedText}
          </Typography>
        </Paper>
      );
    }
    
    if (isImageModel && images.length > 0) {
      return (
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
      );
    }
    
    return (
      <Typography variant="h6" color="text.secondary">
        Your generated {isTextModel ? 'text' : 'images'} will appear here
      </Typography>
    );
  };

  // Group models by category for the select dropdown
  const groupedModels = MODEL_CONFIGS.reduce((acc, model) => {
    if (!acc[model.category]) {
      acc[model.category] = [];
    }
    acc[model.category].push(model);
    return acc;
  }, {} as Record<string, ModelConfig[]>);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        AI Toolbox 🎨🤖
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
                value={selectedModelId} 
                label="Model" 
                onChange={handleModelChange}
              >
                {Object.entries(groupedModels).map(([category, models]) => [
                  <MenuItem key={`${category}-header`} disabled>
                    <Typography variant="body2" color="text.secondary">{category}</Typography>
                  </MenuItem>,
                  ...models.map(model => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.name}
                    </MenuItem>
                  ))
                ])}
              </Select>
            </FormControl>

            {currentModel && (
              <>
                <Typography variant="h6" component="h3" sx={{ mt: 1 }}>
                  Model Parameters
                </Typography>
                
                {currentModel.parameters.map(paramConfig => renderParameter(paramConfig))}
              </>
            )}

            <Button 
              type="submit" 
              variant="contained" 
              size="large" 
              disabled={loading} 
              sx={{ mt: 2, height: '48px' }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `Generate ${isTextModel ? 'Text' : 'Image'}`
              )}
            </Button>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          {/* Show inpainting canvas only for inpainting model */}
          {isInpaintingModel && (
            <InpaintingCanvas
              onImageChange={handleCanvasImageChange}
              onMaskChange={handleCanvasMaskChange}

            />
          )}
          
          {/* Results section */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: isInpaintingModel ? '40vh' : '60vh', 
            border: '2px dashed', 
            borderColor: 'grey.300', 
            borderRadius: 2, 
            p: 2 
          }}>
            {renderResults()}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}