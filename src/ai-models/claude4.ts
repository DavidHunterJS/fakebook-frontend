import { ModelConfig } from './types';
const claude4: ModelConfig = {
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
  };

  export default claude4;