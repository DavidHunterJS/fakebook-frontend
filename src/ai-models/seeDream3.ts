import { ModelConfig } from './types';
const seeDream3: ModelConfig = {
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
  };
  export default seeDream3;