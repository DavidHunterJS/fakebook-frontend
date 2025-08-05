import { ModelConfig } from './types';
const lumaPhoton: ModelConfig = {    
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
        showWhen: (params) => params.image_reference && params.image_reference.trim() !== ''
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
        showWhen: (params) => params.style_reference && params.style_reference.trim() !== ''
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
  };
  export default lumaPhoton;