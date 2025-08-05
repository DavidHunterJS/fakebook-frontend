// src/ai-models/types.ts

export interface SelectOption {
  value: string;
  label: string;
}

export interface ParameterConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'switch' | 'textarea';
  defaultValue?: string | number | boolean;
  placeholder?: string;
  helperText?: string;
  tooltip?: string;
  options?: SelectOption[];
  inputProps?: Record<string, any>;
  rows?: number;
  required?: boolean;
  showWhen?: (params: Record<string, any>) => boolean;
}

export interface ModelConfig {
  id: string;
  name: string;
  type: 'image' | 'text';
  category: string;
  parameters: ParameterConfig[];
  endpoint: string;
  model?: string;
}