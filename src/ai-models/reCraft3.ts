import { ModelConfig } from './types';
const reCraft3: ModelConfig = {
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
  };
  export default reCraft3;