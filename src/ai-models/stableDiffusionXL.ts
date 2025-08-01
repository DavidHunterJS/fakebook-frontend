// src/ai-models/stableDiffusionXL.ts

import { ModelConfig } from './types';

const stableDiffusionXL: ModelConfig = {
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
};

export default stableDiffusionXL;