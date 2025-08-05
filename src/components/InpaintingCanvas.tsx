import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Slider, ButtonGroup, Alert, LinearProgress
} from '@mui/material';
import { Brush, Clear, Download, Upload, Visibility } from '@mui/icons-material';
import { uploadImage } from '../utils/api';

interface InpaintingCanvasProps {
  onImageChange: (imageUrl: string) => void;
  onMaskChange: (maskUrl: string) => void;
}

interface DrawingTool {
  type: 'brush' | 'eraser';
  size: number;
  opacity: number;
}

export const InpaintingCanvas: React.FC<InpaintingCanvasProps> = ({
  onImageChange,
  onMaskChange,
}) => {
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const uiMaskCanvasRef = useRef<HTMLCanvasElement>(null);
  const sdMaskCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<DrawingTool>({ type: 'brush', size: 20, opacity: 0.5 });
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [showSDMask, setShowSDMask] = useState(false);

  const canvasWidth = 800;
  const canvasHeight = 600;

  useEffect(() => {
    const baseCanvas = baseCanvasRef.current;
    const uiMaskCanvas = uiMaskCanvasRef.current;
    const sdMaskCanvas = sdMaskCanvasRef.current;
    
    if (baseCanvas && uiMaskCanvas && sdMaskCanvas) {
      const baseCtx = baseCanvas.getContext('2d');
      const uiMaskCtx = uiMaskCanvas.getContext('2d');
      const sdMaskCtx = sdMaskCanvas.getContext('2d');
      
      if (baseCtx && uiMaskCtx && sdMaskCtx) {
        // Initialize all canvases
        [baseCanvas, uiMaskCanvas, sdMaskCanvas].forEach(canvas => {
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
        });

        // Set up base canvas with placeholder
        baseCtx.fillStyle = '#f5f5f5';
        baseCtx.fillRect(0, 0, canvasWidth, canvasHeight);
        baseCtx.fillStyle = '#999';
        baseCtx.font = '20px Arial';
        baseCtx.textAlign = 'center';
        baseCtx.fillText('Upload an image to start inpainting', canvasWidth / 2, canvasHeight / 2);

        // Initialize SD mask canvas with black background
        sdMaskCtx.fillStyle = '#000000';
        sdMaskCtx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
    }
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setError('');
    try {
      const s3Url = await uploadImage(file);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const baseCanvas = baseCanvasRef.current;
        const uiMaskCanvas = uiMaskCanvasRef.current;
        const sdMaskCanvas = sdMaskCanvasRef.current;
        
        if (baseCanvas && uiMaskCanvas && sdMaskCanvas) {
          const baseCtx = baseCanvas.getContext('2d');
          const uiMaskCtx = uiMaskCanvas.getContext('2d');
          const sdMaskCtx = sdMaskCanvas.getContext('2d');
          
          if (baseCtx && uiMaskCtx && sdMaskCtx) {
            // Clear all canvases
            baseCtx.clearRect(0, 0, canvasWidth, canvasHeight);
            uiMaskCtx.clearRect(0, 0, canvasWidth, canvasHeight);
            sdMaskCtx.clearRect(0, 0, canvasWidth, canvasHeight);

            // Draw image on base canvas
            const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const x = (canvasWidth - scaledWidth) / 2;
            const y = (canvasHeight - scaledHeight) / 2;
            baseCtx.drawImage(img, x, y, scaledWidth, scaledHeight);

            // Reset SD mask to black
            sdMaskCtx.fillStyle = '#000000';
            sdMaskCtx.fillRect(0, 0, canvasWidth, canvasHeight);

            onImageChange(s3Url);
          }
        }
        setIsUploading(false);
      };
      img.onerror = () => {
        setError('Failed to load image from S3');
        setIsUploading(false);
      };
      img.src = s3Url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setIsUploading(false);
    }
  }, [onImageChange]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const updateSDMask = useCallback(() => {
    const uiMaskCanvas = uiMaskCanvasRef.current;
    const sdMaskCanvas = sdMaskCanvasRef.current;
    
    if (!uiMaskCanvas || !sdMaskCanvas) return;

    const uiCtx = uiMaskCanvas.getContext('2d');
    const sdCtx = sdMaskCanvas.getContext('2d');
    
    if (!uiCtx || !sdCtx) return;

    // Get the image data from UI mask
    const imageData = uiCtx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;

    // Create new image data for SD mask
    const sdImageData = sdCtx.createImageData(canvasWidth, canvasHeight);
    const sdData = sdImageData.data;

    // For this model: WHITE = inpaint, BLACK = preserve
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];

      if (alpha > 0) {
        // WHITE for painted areas (areas to inpaint)
        sdData[i] = 255;     // R
        sdData[i + 1] = 255; // G
        sdData[i + 2] = 255; // B
        sdData[i + 3] = 255; // A
      } else {
        // BLACK for unpainted areas (areas to preserve)
        sdData[i] = 0;       // R
        sdData[i + 1] = 0;   // G
        sdData[i + 2] = 0;   // B
        sdData[i + 3] = 255; // A
      }
    }

    // Clear the SD canvas and draw the new mask
    sdCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    sdCtx.putImageData(sdImageData, 0, 0);
  }, []);

  const uploadSDMask = useCallback(async () => {
    const sdMaskCanvas = sdMaskCanvasRef.current;
    if (!sdMaskCanvas) return;

    // Check if there's actually any mask content
    const ctx = sdMaskCanvas.getContext('2d');
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;
    
    // Check if any pixels are white (indicating mask content)
    let hasMaskContent = false;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) {
        hasMaskContent = true;
        break;
      }
    }
    
    if (!hasMaskContent) {
      console.log('No mask content to upload');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      sdMaskCanvas.toBlob(async (blob) => {
        if (blob) {
          setIsUploading(true);
          setError('');
          try {
            console.log('Uploading mask blob size:', blob.size);
            const maskS3Url = await uploadImage(blob);
            console.log('Mask uploaded successfully:', maskS3Url);
            onMaskChange(maskS3Url);
            resolve();
          } catch (err) {
            console.error('Failed to upload mask:', err);
            setError(err instanceof Error ? err.message : 'Failed to upload mask');
            reject(err);
          } finally {
            setIsUploading(false);
          }
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/png', 1.0); // Use maximum quality
    });
  }, [onMaskChange]);

  const getCanvasCoordinates = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = uiMaskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }, []);

  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = uiMaskCanvasRef.current;
    if (!canvas) return;
    
    event.preventDefault();
    setIsDrawing(true);
    
    const { x, y } = getCanvasCoordinates(event);
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.lineWidth = tool.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'red';
      ctx.globalAlpha = 1.0;
      
      if (tool.type === 'brush') {
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.globalCompositeOperation = 'destination-out';
      }
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      // Draw a small dot for single clicks
      ctx.arc(x, y, tool.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }, [tool, getCanvasCoordinates]);

  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = uiMaskCanvasRef.current;
    if (!canvas) return;
    
    event.preventDefault();
    const { x, y } = getCanvasCoordinates(event);
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.lineWidth = tool.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'red';
      ctx.globalAlpha = 1.0;

      if (tool.type === 'brush') {
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.globalCompositeOperation = 'destination-out';
      }
      
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }, [isDrawing, tool, getCanvasCoordinates]);

  const stopDrawing = useCallback(async () => {
    if (isDrawing) {
      setIsDrawing(false);
      // Add a small delay to ensure drawing is complete
      setTimeout(async () => {
        updateSDMask();
        // Wait a bit more for the mask to be processed
        setTimeout(async () => {
          try {
            await uploadSDMask();
          } catch (err) {
            console.error('Failed to upload mask after drawing:', err);
          }
        }, 50);
      }, 10);
    }
  }, [isDrawing, updateSDMask, uploadSDMask]);

  const clearMask = useCallback(async () => {
    const uiMaskCanvas = uiMaskCanvasRef.current;
    const sdMaskCanvas = sdMaskCanvasRef.current;
    
    if (uiMaskCanvas && sdMaskCanvas) {
      const uiCtx = uiMaskCanvas.getContext('2d');
      const sdCtx = sdMaskCanvas.getContext('2d');
      
      if (uiCtx && sdCtx) {
        uiCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Create a completely black mask
        sdCtx.fillStyle = '#000000';
        sdCtx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        try {
          await uploadSDMask();
        } catch (err) {
          console.error('Failed to upload cleared mask:', err);
        }
      }
    }
  }, [uploadSDMask]);

  const downloadMask = useCallback(() => {
    const canvas = showSDMask ? sdMaskCanvasRef.current : uiMaskCanvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = showSDMask ? 'stable-diffusion-mask.png' : 'ui-mask.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  }, [showSDMask]);

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Inpainting Canvas
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {isUploading && <LinearProgress sx={{ mb: 2 }} />}
        <Box sx={{ mb: 2 }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            Upload Base Image
          </Button>
        </Box>
        <Box
          sx={{
            position: 'relative',
            border: '2px solid #e0e0e0',
            borderRadius: 2,
            overflow: 'hidden',
            mb: 3,
            backgroundColor: '#f8f9fa',
            width: '100%',
            paddingTop: `${(canvasHeight / canvasWidth) * 100}%`,
          }}
        >
          {/* Base image canvas */}
          <canvas
            ref={baseCanvasRef}
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%' 
            }}
          />
          
          {/* UI mask canvas (red overlay) */}
          <canvas
            ref={uiMaskCanvasRef}
            // Mouse events are passed directly as they match the expected type
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            // Touch events are adapted before being passed to the drawing functions
            onTouchStart={(event: React.TouchEvent<HTMLCanvasElement>) => {
              // Create a simplified object from the touch event and cast it.
              // This is safe because our drawing functions only use clientX/clientY.
              const touch = event.touches[0];
              startDrawing({
                clientX: touch.clientX,
                clientY: touch.clientY,
              } as React.MouseEvent<HTMLCanvasElement>);
            }}
            onTouchMove={(event: React.TouchEvent<HTMLCanvasElement>) => {
              event.preventDefault(); // Prevent scrolling
              const touch = event.touches[0];
              draw({
                clientX: touch.clientX,
                clientY: touch.clientY,
              } as React.MouseEvent<HTMLCanvasElement>);
            }}
            onTouchEnd={stopDrawing}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              cursor: 'crosshair',
              width: '100%',
              height: '100%',
              opacity: showSDMask ? 0 : tool.opacity,
              display: showSDMask ? 'none' : 'block',
              touchAction: 'none', // Prevent scrolling on touch
            }}
          />
          {/* Stable Diffusion mask canvas (black and white) */}
          <canvas
            ref={sdMaskCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: showSDMask ? 'block' : 'none',
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>View Mode</Typography>
            <ButtonGroup variant="outlined" size="small">
              <Button
                variant={!showSDMask ? 'contained' : 'outlined'}
                onClick={() => setShowSDMask(false)}
              >
                UI Mask
              </Button>
              <Button
                variant={showSDMask ? 'contained' : 'outlined'}
                startIcon={<Visibility />}
                onClick={() => setShowSDMask(true)}
              >
                SD Mask
              </Button>
            </ButtonGroup>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom>Drawing Tool</Typography>
            <ButtonGroup variant="outlined" size="small">
              <Button
                variant={tool.type === 'brush' ? 'contained' : 'outlined'}
                startIcon={<Brush />}
                onClick={() => setTool(prev => ({ ...prev, type: 'brush' }))}
              >
                Brush
              </Button>
              <Button
                variant={tool.type === 'eraser' ? 'contained' : 'outlined'}
                onClick={() => setTool(prev => ({ ...prev, type: 'eraser' }))}
              >
                Eraser
              </Button>
            </ButtonGroup>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom>Brush Size: {tool.size}px</Typography>
            <Slider
              value={tool.size}
              onChange={(_, value) => setTool(prev => ({ ...prev, size: value as number }))}
              min={1}
              max={100}
              step={1}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom>Opacity: {Math.round(tool.opacity * 100)}% (Visual Effect)</Typography>
            <Slider
              value={tool.opacity}
              onChange={(_, value) => setTool(prev => ({ ...prev, opacity: value as number }))}
              min={0.1}
              max={1}
              step={0.1}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<Clear />} onClick={clearMask} size="small">
              Clear Mask
            </Button>
            <Button variant="outlined" startIcon={<Download />} onClick={downloadMask} size="small">
              Download {showSDMask ? 'SD' : 'UI'} Mask
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Instructions (FLUX Dev Inpainting):</strong>
            <br />1. Upload a base image.
            <br />2. Use the red brush to mark areas you want to change.
            <br />3. Toggle &quot;SD Mask&quot; to see the black/white mask sent to FLUX.
            <br />4. White areas = inpaint, Black areas = preserve.
            <br />5. Recommended: 28-50 inference steps, guidance 30.
            <br />6. Use a descriptive prompt for the masked area.
          </Typography>
          
          {/* Debug Information */}
          <Box sx={{ mt: 2, p: 1, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
            <Typography variant="caption" color="primary">
              <strong>Debug Info:</strong>
              <br />• Canvas Size: {canvasWidth}×{canvasHeight}
              <br />• Required API Parameters: strength: 0.5-0.8, prompt_strength: 0.5-0.8
              <br />• Model: stability-ai/stable-diffusion-inpainting
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};