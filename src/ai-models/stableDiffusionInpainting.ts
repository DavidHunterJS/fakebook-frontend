import { ModelConfig } from './types';

const stableDiffusionInpainting: ModelConfig = {
  id: 'stable-diffusion-inpainting',
  name: 'FLUX Dev Inpainting',
  type: 'image',
  category: 'Image Generation',
  endpoint: 'generate-image-advanced',
  parameters: [
    {
      name: 'prompt',
      label: 'Prompt',
      type: 'textarea',
      required: true,
      placeholder: 'a vision of paradise. unreal engine',
      tooltip: 'Prompt for generated image.',
      rows: 3
    },
    {
      name: 'image',
      label: 'Image URL',
      type: 'text',
      required: true,
      placeholder: 'https://example.com/your-image.png',
      tooltip: 'The image to inpaint. Can contain alpha mask.'
    },
    {
      name: 'mask',
      label: 'Mask Image URL',
      type: 'text',
      required: false,
      placeholder: 'https://example.com/your-mask.png',
      tooltip: 'Black areas will be preserved while white areas will be inpainted.'
    },
    {
      name: 'num_outputs',
      label: 'Number of Images',
      type: 'number',
      defaultValue: 1,
      inputProps: { min: 1, max: 4 },
      tooltip: 'Number of outputs to generate.'
    },
    {
      name: 'num_inference_steps',
      label: 'Inference Steps',
      type: 'number',
      defaultValue: 28,
      inputProps: { min: 1, max: 50 },
      tooltip: 'Number of denoising steps. Recommended range is 28-50.'
    },
    {
      name: 'guidance',
      label: 'Guidance',
      type: 'number',
      defaultValue: 30,
      inputProps: { step: 1, min: 0, max: 100 },
      tooltip: 'Guidance for generated image.'
    },
    {
      name: 'seed',
      label: 'Seed (Optional)',
      type: 'text',
      placeholder: 'Leave blank for random',
      tooltip: 'Random seed. Set for reproducible generation.'
    },
    {
      name: 'megapixels',
      label: 'Megapixels',
      type: 'select',
      defaultValue: '1',
      tooltip: 'Approximate number of megapixels for generated image.',
      options: [
        { value: '0.25', label: '0.25 MP' },
        { value: '1', label: '1 MP' },
        { value: 'match_input', label: 'Match Input' }
      ]
    },
    {
      name: 'output_format',
      label: 'Output Format',
      type: 'select',
      defaultValue: 'webp',
      tooltip: 'Format of the output images.',
      options: [
        { value: 'webp', label: 'WebP' },
        { value: 'jpg', label: 'JPG' },
        { value: 'png', label: 'PNG' }
      ]
    },
    {
      name: 'output_quality',
      label: 'Output Quality',
      type: 'number',
      defaultValue: 80,
      inputProps: { min: 0, max: 100 },
      tooltip: 'Quality when saving the output images, from 0 to 100.'
    },
    {
      name: 'lora_weights',
      label: 'LoRA Weights (Optional)',
      type: 'text',
      placeholder: 'fofr/flux-pixar-cars',
      tooltip: 'Load LoRA weights from Replicate, HuggingFace, CivitAI, or .safetensors URLs.'
    },
    {
      name: 'lora_scale',
      label: 'LoRA Scale',
      type: 'number',
      defaultValue: 1,
      inputProps: { step: 0.1, min: -1, max: 3 },
      tooltip: 'Determines how strongly the main LoRA should be applied.'
    },
    {
      name: 'disable_safety_checker',
      label: 'Disable Safety Checker',
      type: 'switch',
      defaultValue: false,
      tooltip: 'Disable safety checker for generated images.'
    }
  ]
};

export default stableDiffusionInpainting;