import { ModelConfig } from './types';
const imagen4: ModelConfig ={
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
  };
  export default imagen4