import { ModelConfig } from './types';
const fluxSchnell: ModelConfig = {
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
  };
  export default fluxSchnell