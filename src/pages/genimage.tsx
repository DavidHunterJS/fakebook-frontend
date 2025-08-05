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

// --- TYPE DEFINITIONS ---

// Type for the form parameters state
type ParameterValues = Record<string, string | number | boolean>;

// Model configuration types
interface SelectOption {
  value: string | number;
  label: string;
}

interface ParameterConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'switch' | 'textarea';
  defaultValue?: string | number | boolean;
  placeholder?: string;
  helperText?: string;
  tooltip?: string;
  options?: SelectOption[];
  inputProps?: Record<string, string | number>;
  rows?: number;
  required?: boolean;
  showWhen?: (params: ParameterValues) => boolean;
}

interface ModelConfig {
  id: string;
  name: string;
  type: 'image' | 'text';
  category: string;
  parameters: ParameterConfig[];
  endpoint: string;
}

// --- MODEL CONFIGURATIONS ---
const MODEL_CONFIGS: ModelConfig[] = [
  // --- EXISTING MODELS ---
  {
    id: 'stable-diffusion-xl',
    name: 'Stable Diffusion 3.5',
    type: 'image',
    category: 'Image Generation',
    endpoint: 'generate-image-advanced',
    parameters: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'e.g., A majestic lion jumping from a big stone at sunset',
        tooltip: 'Describe what you want to generate. Be specific and detailed for better results.',
        rows: 4
      },
      {
        name: 'negative_prompt',
        label: 'Negative Prompt',
        type: 'textarea',
        placeholder: 'e.g., blurry, low quality, ugly',
        tooltip: 'Describe what you DON\'T want in the image. Common examples: blurry, distorted, low quality, extra limbs.',
        rows: 2
      },
      {
        name: 'width',
        label: 'Width',
        type: 'number',
        defaultValue: 1024,
        tooltip: 'Image width in pixels. Higher values create larger images but take more time and resources.'
      },
      {
        name: 'height',
        label: 'Height',
        type: 'number',
        defaultValue: 1024,
        tooltip: 'Image height in pixels. Higher values create larger images but take more time and resources.'
      },
      {
        name: 'guidance_scale',
        label: 'Guidance Scale (cfg)',
        type: 'number',
        defaultValue: 7.5,
        inputProps: { step: 0.1 },
        tooltip: 'Controls how closely the AI follows your prompt. Higher values (10-20) = more literal, Lower values (5-7) = more creative freedom.'
      },
      {
        name: 'num_inference_steps',
        label: 'Inference Steps',
        type: 'number',
        defaultValue: 28,
        tooltip: 'Number of denoising steps. More steps = higher quality but slower generation. 20-30 is usually optimal.'
      },
      {
        name: 'seed',
        label: 'Seed (Optional)',
        type: 'text',
        placeholder: 'Leave blank for random',
        tooltip: 'Random seed for reproducible results. Use the same seed with the same prompt to get identical results.'
      }
    ]
  },
  {
    id: 'stable-diffusion-inpainting',
    name: 'Stable Diffusion Inpainting',
    type: 'image',
    category: 'Image Generation',
    endpoint: 'generate-image-advanced',
    parameters: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        placeholder: 'a vision of paradise. unreal engine',
        tooltip: 'What to generate in the masked area.',
        rows: 3
      },
      {
        name: 'image',
        label: 'Image URL',
        type: 'text',
        required: true,
        placeholder: 'https://example.com/your-image.png',
        tooltip: 'The initial image to inpaint on.'
      },
      {
        name: 'mask',
        label: 'Mask Image URL',
        type: 'text',
        required: true,
        placeholder: 'https://example.com/your-mask.png',
        tooltip: 'Black and white mask. White pixels are inpainted, black pixels are preserved.'
      },
      {
        name: 'height',
        label: 'Height',
        type: 'select',
        defaultValue: 512,
        tooltip: 'Height of the generated image in pixels. Must be a multiple of 64.',
        options: [64,128,192,256,320,384,448,512,576,640,704,768,832,896,960,1024].map(v => ({ value: v, label: `${v}px` }))
      },
      {
        name: 'width',
        label: 'Width',
        type: 'select',
        defaultValue: 512,
        tooltip: 'Width of the generated image in pixels. Must be a multiple of 64.',
        options: [64,128,192,256,320,384,448,512,576,640,704,768,832,896,960,1024].map(v => ({ value: v, label: `${v}px` }))
      },
      {
        name: 'negative_prompt',
        label: 'Negative Prompt',
        type: 'textarea',
        tooltip: 'Specify what you DON\'T want to see in the output.',
        placeholder: 'e.g., blurry, low quality'
      },
      {
        name: 'num_outputs',
        label: 'Number of Images',
        type: 'number',
        defaultValue: 1,
        inputProps: { min: 1, max: 4 },
        tooltip: 'Number of images to generate.'
      },
      {
        name: 'num_inference_steps',
        label: 'Inference Steps',
        type: 'number',
        defaultValue: 50,
        inputProps: { min: 1, max: 500 },
        tooltip: 'Number of denoising steps.'
      },
      {
        name: 'guidance_scale',
        label: 'Guidance Scale',
        type: 'number',
        defaultValue: 7.5,
        inputProps: { min: 1, max: 20, step: 0.1 },
        tooltip: 'Scale for classifier-free guidance. Higher is more strict.'
      },
      {
        name: 'scheduler',
        label: 'Scheduler',
        type: 'select',
        defaultValue: 'DPMSolverMultistep',
        tooltip: 'Choose a scheduler.',
        options: ["DDIM","K_EULER","DPMSolverMultistep","K_EULER_ANCESTRAL","PNDM","KLMS"].map(v => ({ value: v, label: v }))
      },
      {
        name: 'seed',
        label: 'Seed (Optional)',
        type: 'text',
        placeholder: 'Leave blank for random',
        tooltip: 'Random seed for reproducible results.'
      },
      {
        name: 'disable_safety_checker',
        label: 'Disable Safety Checker',
        type: 'switch',
        defaultValue: false,
        tooltip: 'Disable safety checker for generated images. Only available via API.'
      }
    ]
  },
  {
    id: 'midjourney-style',
    name: 'OpenJourney (Midjourney Style)',
    type: 'image',
    category: 'Image Generation',
    endpoint: 'generate-image-advanced',
    parameters: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'e.g., A majestic lion jumping from a big stone at sunset',
        tooltip: 'Describe what you want to generate. Midjourney-style works well with artistic and creative descriptions.',
        rows: 4
      },
      {
        name: 'negative_prompt',
        label: 'Negative Prompt',
        type: 'textarea',
        placeholder: 'e.g., blurry, low quality, ugly',
        tooltip: 'Describe what you DON\'T want in the image. Common examples: blurry, distorted, low quality, extra limbs.',
        rows: 2
      },
      {
        name: 'chaos',
        label: 'Chaos',
        type: 'number',
        placeholder: '0-100',
        tooltip: 'Controls randomness and variety. 0 = very consistent, 100 = highly varied and unpredictable results.'
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        defaultValue: '1:1',
        tooltip: 'The width-to-height ratio of your image. Choose based on your intended use (social media, wallpaper, etc.).',
        options: [
          { value: '1:1', label: '1:1 (Square)' },
          { value: '16:9', label: '16:9 (Widescreen)' },
          { value: '9:16', label: '9:16 (Portrait)' },
          { value: '4:3', label: '4:3 (Landscape)' },
          { value: '3:4', label: '3:4 (Tall)' }
        ]
      },
      {
        name: 'seed',
        label: 'Seed (Optional)',
        type: 'text',
        placeholder: 'Leave blank for random',
        tooltip: 'Random seed for reproducible results. Use the same seed with the same prompt to get identical results.'
      }
    ]
  },
  {
    id: 'flux-schnell',
    name: 'Flux Schnell',
    type: 'image',
    category: 'Image Generation',
    endpoint: 'generate-image-advanced',
    parameters: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'e.g., A majestic lion jumping from a big stone at sunset',
        tooltip: 'Describe what you want to generate. Flux Schnell is fast and works well with detailed descriptions.',
        rows: 4
      },
      {
        name: 'negative_prompt',
        label: 'Negative Prompt',
        type: 'textarea',
        placeholder: 'e.g., blurry, low quality, ugly',
        tooltip: 'Describe what you DON\'T want in the image. Common examples: blurry, distorted, low quality, extra limbs.',
        rows: 2
      },
      {
        name: 'num_outputs',
        label: 'Number of Images',
        type: 'number',
        defaultValue: 1,
        inputProps: { min: 1, max: 4 },
        tooltip: 'How many different images to generate. More images = more variety but longer wait time.'
      },
      {
        name: 'output_quality',
        label: 'Quality',
        type: 'number',
        defaultValue: 90,
        inputProps: { min: 1, max: 100 },
        tooltip: 'Output image quality (1-100). Higher quality = larger file size. 80-95 is usually optimal.'
      },
      {
        name: 'seed',
        label: 'Seed (Optional)',
        type: 'text',
        placeholder: 'Leave blank for random',
        tooltip: 'Random seed for reproducible results. Use the same seed with the same prompt to get identical results.'
      }
    ]
  },
  {
    id: 'google-imagen4',
    name: 'Google Imagen 4',
    type: 'image',
    category: 'Image Generation',
    endpoint: 'generate-image-advanced',
    parameters: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'e.g., A majestic lion jumping from a big stone at sunset',
        tooltip: 'Describe what you want to generate. Google Imagen excels at photorealistic images and natural scenes.',
        rows: 4
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        defaultValue: '1:1',
        tooltip: 'The width-to-height ratio of your image. Choose based on your intended use (social media, wallpaper, etc.).',
        options: [
          { value: '1:1', label: '1:1 (Square)' },
          { value: '9:16', label: '9:16 (Portrait)' },
          { value: '16:9', label: '16:9 (Landscape)' },
          { value: '3:4', label: '3:4 (Tall)' },
          { value: '4:3', label: '4:3 (Wide)' }
        ]
      },
      {
        name: 'output_format',
        label: 'Output Format',
        type: 'select',
        defaultValue: 'jpg',
        tooltip: 'Image file format. JPG = smaller files, good for photos. PNG = larger files, supports transparency.',
        options: [
          { value: 'jpg', label: 'JPG' },
          { value: 'png', label: 'PNG' }
        ]
      },
      {
        name: 'safety_filter_level',
        label: 'Safety Filter Level',
        type: 'select',
        defaultValue: 'block_only_high',
        tooltip: 'Content safety filtering level. Strict = blocks more content, Permissive = allows more creative freedom.',
        options: [
          { value: 'block_low_and_above', label: 'Strict (Block Low and Above)' },
          { value: 'block_medium_and_above', label: 'Medium (Block Medium and Above)' },
          { value: 'block_only_high', label: 'Permissive (Block Only High)' }
        ]
      }
    ]
  },
  {
    id: 'bytedance-seedream3',
    name: 'ByteDance SeeDream-3',
    type: 'image',
    category: 'Image Generation',
    endpoint: 'generate-image-advanced',
    parameters: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'e.g., A majestic lion jumping from a big stone at sunset',
        tooltip: 'Describe what you want to generate. SeeDream-3 excels at detailed and artistic imagery.',
        rows: 4
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        defaultValue: '16:9',
        tooltip: 'The width-to-height ratio of your image. Choose "custom" to set exact pixel dimensions.',
        options: [
          { value: '1:1', label: '1:1 (Square)' },
          { value: '3:4', label: '3:4 (Portrait)' },
          { value: '4:3', label: '4:3 (Landscape)' },
          { value: '16:9', label: '16:9 (Widescreen)' },
          { value: '9:16', label: '9:16 (Tall Portrait)' },
          { value: '2:3', label: '2:3 (Classic Portrait)' },
          { value: '3:2', label: '3:2 (Classic Landscape)' },
          { value: '21:9', label: '21:9 (Ultra Wide)' },
          { value: 'custom', label: 'Custom (Use Width/Height)' }
        ]
      },
      {
        name: 'size',
        label: 'Image Size',
        type: 'select',
        defaultValue: 'regular',
        tooltip: 'Preset image sizes. Small = faster generation, Big = higher detail but slower.',
        options: [
          { value: 'small', label: 'Small (Shortest: 512px)' },
          { value: 'regular', label: 'Regular (1 Megapixel)' },
          { value: 'big', label: 'Big (Longest: 2048px)' }
        ],
        showWhen: (params) => params.aspect_ratio !== 'custom'
      },
      {
        name: 'width',
        label: 'Width',
        type: 'number',
        defaultValue: 1024,
        inputProps: { min: 512, max: 2048 },
        helperText: '512-2048 pixels',
        tooltip: 'Custom image width in pixels. Higher values = more detail but slower generation.',
        showWhen: (params) => params.aspect_ratio === 'custom'
      },
      {
        name: 'height',
        label: 'Height',
        type: 'number',
        defaultValue: 1024,
        inputProps: { min: 512, max: 2048 },
        helperText: '512-2048 pixels',
        tooltip: 'Custom image height in pixels. Higher values = more detail but slower generation.',
        showWhen: (params) => params.aspect_ratio === 'custom'
      },
      {
        name: 'guidance_scale',
        label: 'Guidance Scale',
        type: 'number',
        defaultValue: 2.5,
        inputProps: { step: 0.1, min: 1, max: 10 },
        helperText: '1-10, Higher = more literal prompt adherence',
        tooltip: 'How closely the AI follows your prompt. Higher values = more literal interpretation, lower = more creative freedom.'
      }
    ]
  },
  {
    id: 'recraft-v3-svg',
    name: 'Recraft V3 SVG',
    type: 'image',
    category: 'Image Generation',
    endpoint: 'generate-image-advanced',
    parameters: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'e.g., A majestic lion jumping from a big stone at sunset',
        tooltip: 'Describe what you want to generate. Recraft V3 specializes in vector graphics, logos, and clean illustrations.',
        rows: 4
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        defaultValue: 'Not set',
        tooltip: 'The width-to-height ratio. Choose "Not Set" to use specific pixel dimensions instead.',
        options: [
          { value: 'Not set', label: 'Not Set (Use Size)' },
          { value: '1:1', label: '1:1 (Square)' },
          { value: '4:3', label: '4:3 (Landscape)' },
          { value: '3:4', label: '3:4 (Portrait)' },
          { value: '3:2', label: '3:2 (Classic Landscape)' },
          { value: '2:3', label: '2:3 (Classic Portrait)' },
          { value: '16:9', label: '16:9 (Widescreen)' },
          { value: '9:16', label: '9:16 (Tall Portrait)' },
          { value: '1:2', label: '1:2 (Narrow Portrait)' },
          { value: '2:1', label: '2:1 (Wide Landscape)' },
          { value: '7:5', label: '7:5 (Wide)' },
          { value: '5:7', label: '5:7 (Tall)' },
          { value: '4:5', label: '4:5 (Portrait)' },
          { value: '5:4', label: '5:4 (Landscape)' },
          { value: '3:5', label: '3:5 (Tall Portrait)' },
          { value: '5:3', label: '5:3 (Wide Landscape)' }
        ]
      },
      {
        name: 'size',
        label: 'Image Size',
        type: 'select',
        defaultValue: '1024x1024',
        tooltip: 'Preset image dimensions in pixels. Choose based on your intended use case.',
        options: [
          { value: '1024x1024', label: '1024×1024 (Square)' },
          { value: '1365x1024', label: '1365×1024 (Wide)' },
          { value: '1024x1365', label: '1024×1365 (Tall)' },
          { value: '1536x1024', label: '1536×1024 (Wide)' },
          { value: '1024x1536', label: '1024×1536 (Tall)' },
          { value: '1820x1024', label: '1820×1024 (Ultra Wide)' },
          { value: '1024x1820', label: '1024×1820 (Ultra Tall)' },
          { value: '1024x2048', label: '1024×2048 (Very Tall)' },
          { value: '2048x1024', label: '2048×1024 (Very Wide)' },
          { value: '1434x1024', label: '1434×1024 (Wide)' },
          { value: '1024x1434', label: '1024×1434 (Tall)' },
          { value: '1024x1280', label: '1024×1280 (Tall)' },
          { value: '1280x1024', label: '1280×1024 (Wide)' },
          { value: '1024x1707', label: '1024×1707 (Very Tall)' },
          { value: '1707x1024', label: '1707×1024 (Very Wide)' }
        ],
        showWhen: (params) => params.aspect_ratio === 'Not set' || !params.aspect_ratio
      },
      {
        name: 'style',
        label: 'Style',
        type: 'select',
        defaultValue: 'any',
        tooltip: 'Visual style for the generated SVG. Each style has distinct characteristics for different design needs.',
        options: [
          { value: 'any', label: 'Any Style' },
          { value: 'engraving', label: 'Engraving' },
          { value: 'line_art', label: 'Line Art' },
          { value: 'line_circuit', label: 'Line Circuit' },
          { value: 'linocut', label: 'Linocut' }
        ]
      }
    ]
  },
  {
    id: 'luma-photon',
    name: 'Luma Photon',
    type: 'image',
    category: 'Image Generation',
    endpoint: 'generate-image-advanced',
    parameters: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'e.g., A majestic lion jumping from a big stone at sunset',
        tooltip: 'Text prompt describing what you want to generate. Be specific and detailed for better results.',
        rows: 4
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        defaultValue: '16:9',
        tooltip: 'The width-to-height ratio of your generated image. Choose based on your intended use.',
        options: [
          { value: '1:1', label: '1:1 (Square)' },
          { value: '3:4', label: '3:4 (Portrait)' },
          { value: '4:3', label: '4:3 (Landscape)' },
          { value: '9:16', label: '9:16 (Tall Portrait)' },
          { value: '16:9', label: '16:9 (Widescreen)' },
          { value: '9:21', label: '9:21 (Ultra Tall)' },
          { value: '21:9', label: '21:9 (Ultra Wide)' }
        ]
      },
      {
        name: 'image_reference',
        label: 'Reference Image URL',
        type: 'text',
        placeholder: 'https://example.com/reference-image.jpg',
        tooltip: 'URL of a reference image to guide the generation. The AI will use this image as a visual reference for composition, style, or content.',
        helperText: 'Optional: Provide a URL to an image that should guide the generation'
      },
      {
        name: 'image_reference_weight',
        label: 'Reference Image Weight',
        type: 'number',
        defaultValue: 0.85,
        inputProps: { step: 0.01, min: 0, max: 1 },
        helperText: '0.0 to 1.0 - Higher values make the reference image more influential',
        tooltip: 'Controls how strongly the reference image influences the generation. 0 = no influence, 1 = maximum influence.',
        showWhen: (params) => !!params.image_reference && String(params.image_reference).trim() !== ''
      },
      {
        name: 'style_reference',
        label: 'Style Reference URL',
        type: 'text',
        placeholder: 'https://example.com/style-reference.jpg',
        tooltip: 'URL of an image whose artistic style should be applied to the generation. This affects colors, brush strokes, artistic technique, etc.',
        helperText: 'Optional: Provide a URL to an image whose style should be copied'
      },
      {
        name: 'style_reference_weight',
        label: 'Style Reference Weight',
        type: 'number',
        defaultValue: 0.85,
        inputProps: { step: 0.01, min: 0, max: 1 },
        helperText: '0.0 to 1.0 - Higher values make the style reference more influential',
        tooltip: 'Controls how strongly the style reference influences the generation. 0 = no influence, 1 = maximum influence.',
        showWhen: (params) => !!params.style_reference && String(params.style_reference).trim() !== ''
      },
      {
        name: 'character_reference',
        label: 'Character Reference URL',
        type: 'text',
        placeholder: 'https://example.com/character-reference.jpg',
        tooltip: 'URL of an image containing a character or person that should be referenced in the generation. Useful for consistent character generation.',
        helperText: 'Optional: Provide a URL to an image containing a character to reference'
      },
      {
        name: 'seed',
        label: 'Seed (Optional)',
        type: 'text',
        placeholder: 'Leave blank for random',
        tooltip: 'Random seed for reproducible results. Use the same seed with the same parameters to get identical results.'
      }
    ]
  },
  {
    id: 'claude-4-sonnet',
    name: 'Claude 4 Sonnet',
    type: 'text',
    category: 'Text Generation',
    endpoint: 'generate-text',
    parameters: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'e.g., Write a short story about a robot discovering emotions',
        tooltip: 'Your question or instruction for Claude. Be clear and specific about what you want.',
        rows: 4
      },
      {
        name: 'system_prompt',
        label: 'System Prompt',
        type: 'textarea',
        placeholder: 'Set the assistant\'s behavior and personality',
        tooltip: 'Instructions that define Claude\'s role, personality, or behavior. Example: "You are a helpful coding assistant."',
        rows: 3
      },
      {
        name: 'max_tokens',
        label: 'Max Tokens',
        type: 'number',
        defaultValue: 8192,
        inputProps: { min: 1024, max: 64000 },
        helperText: '1024-64000 tokens',
        tooltip: 'Maximum length of Claude\'s response. ~1 token ≈ 0.75 words. Higher = longer responses but slower generation.'
      },
      {
        name: 'extended_thinking',
        label: 'Extended Thinking Mode',
        type: 'switch',
        defaultValue: false,
        tooltip: 'Enables Claude to "think through" complex problems step-by-step before responding. Useful for math, reasoning, and analysis.'
      },
      {
        name: 'thinking_budget_tokens',
        label: 'Thinking Budget Tokens',
        type: 'number',
        defaultValue: 1024,
        inputProps: { min: 1024, max: 64000 },
        helperText: 'Tokens allocated for thinking process',
        tooltip: 'How many tokens Claude can use for internal reasoning when Extended Thinking is enabled.',
        showWhen: (params) => params.extended_thinking === true
      },
      {
        name: 'max_image_resolution',
        label: 'Max Image Resolution',
        type: 'number',
        defaultValue: 0.5,
        inputProps: { step: 0.001, min: 0.001, max: 2 },
        helperText: 'Megapixels (0.001-2.0)',
        tooltip: 'Maximum resolution for analyzing images. Higher = more detail but uses more resources. 0.5 MP is usually sufficient.'
      },
      {
        name: 'image',
        label: 'Image URL (Optional)',
        type: 'text',
        placeholder: 'https://example.com/image.jpg',
        helperText: 'Provide an image for Claude to analyze',
        tooltip: 'URL of an image for Claude to analyze. Claude can describe, analyze, or answer questions about images.'
      }
    ]
  }
];

export default function AIGeneratorPage() {
  const [selectedModelId, setSelectedModelId] = useState<string>('stable-diffusion-xl');
  const [parameters, setParameters] = useState<ParameterValues>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [generatedText, setGeneratedText] = useState<string>('');

  const currentModel = MODEL_CONFIGS.find(model => model.id === selectedModelId);
  const isImageModel = currentModel?.type === 'image';
  const isTextModel = currentModel?.type === 'text';

  // Initialize parameters when model changes
  const initializeParameters = (modelConfig: ModelConfig): ParameterValues => {
    const initialParams: ParameterValues = {};
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
  };

  const handleParamChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setParameters(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string | number>) => {
    const { name, value } = e.target;
    setParameters(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setParameters(prev => ({ ...prev, [name]: checked }));
  };

  // Render a single parameter field with tooltip
  const renderParameter = (paramConfig: ParameterConfig) => {
    const { name, label, type, placeholder, helperText, tooltip, options, inputProps, rows, required, showWhen } = paramConfig;
    
    if (showWhen && !showWhen(parameters)) {
      return null;
    }

    const value = parameters[name] ?? '';

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
              value={String(value)}
              label={label}
              onChange={handleSelectChange}
            >
              {options?.map(option => (
                <MenuItem key={String(option.value)} value={option.value}>
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
    if (currentModel?.parameters.some(p => p.required && !parameters[p.name])) {
       setError('Please fill in all required fields.');
       return;
    }

    if (!currentModel) {
      setError('No model selected.');
      return;
    }

    setLoading(true);
    setError(null);
    setImages([]);
    setGeneratedText('');

    try {
      const filteredParams = Object.fromEntries(
        Object.entries(parameters).filter(([, value]) => value !== '' && value !== undefined && value !== null)
      );
      
      const payload = {
        model: selectedModelId,
        parameters: filteredParams,
      };
      
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
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
            // Could not parse, use default message
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
        <Paper elevation={3} sx={{ p: 3, maxHeight: '60vh', overflow: 'auto', width: '100%' }}>
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
            <Grid key={index} size={{xs:12, sm:6, md:4}}>
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

  const groupedModels = MODEL_CONFIGS.reduce((acc, model) => {
    const category = model.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(model);
    return acc;
  }, {} as Record<string, ModelConfig[]>);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        AI Content Generator 🎨🤖
      </Typography>
      <Grid container spacing={4}>
        <Grid size={{xs:12,md:4}}>
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

        <Grid size={{xs:12, md:8}}>
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
            {renderResults()}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}