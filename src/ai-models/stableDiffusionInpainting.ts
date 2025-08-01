import { ModelConfig } from './types';

const stableDiffusionInpainting: ModelConfig = {
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
      defaultValue: 'a vision of paradise. unreal engine',
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
      options: [64,128,192,256,320,384,448,512,576,640,704,768,832,896,960,1024].map(v => ({ value: String(v), label: `${v}px` }))
    },
    {
      name: 'width',
      label: 'Width',
      type: 'select',
      defaultValue: 512,
      tooltip: 'Width of the generated image in pixels. Must be a multiple of 64.',
      options: [64,128,192,256,320,384,448,512,576,640,704,768,832,896,960,1024].map(v => ({ value: String(v), label: `${v}px` }))
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
      inputProps: { step: 0.1, min: 1, max: 20 },
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
};

export default stableDiffusionInpainting;