// src/ai-models/index.ts

import { ModelConfig } from './types';
import stableDiffusionXL from './stableDiffusionXL';
import openJourney from './openJourney';
import fluxSchnell from './fluxSchnell';
import imagen4 from './imagen4';
import seeDream3 from './seeDream3';
import reCraft3 from './reCraft3';
import lumaPhoton from './lumaPhoton';
import claude4 from './claude4';
import stableDiffusionInpainting from './stableDiffusionInpainting';
// Import other models here later, e.g.:
// import midjourneyStyle from './midjourneyStyle'; 

// Combine all models into a single array
export const MODEL_CONFIGS: ModelConfig[] = [
  stableDiffusionXL,
  stableDiffusionInpainting,
  openJourney,
  fluxSchnell,
  imagen4,
  seeDream3,
  reCraft3,
  lumaPhoton,
  claude4,
  // Add other imported models here
  // midjourneyStyle,
];

// Re-export types for convenience
export * from './types';