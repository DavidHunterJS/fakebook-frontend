// src/ai-models/types.ts
import React from 'react';

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
  inputProps?: React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>;
  rows?: number;
  required?: boolean;
  showWhen?: (params: Record<string, string | number | boolean>) => boolean;
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
