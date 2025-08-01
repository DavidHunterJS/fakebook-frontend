import { ModelConfig } from './types';
const openJourney: ModelConfig =
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
  };
  export default openJourney;