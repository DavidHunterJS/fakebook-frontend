export interface ComplianceResult {
  complianceScore: number;
  cutoutUrl: string;
  backgroundPixels: number;
  nonWhitePixels: number;
  productCoverage: number;
  edgeCompliance: number;
  isCompliant: boolean;
  segmentationUrl?: string;
  issues: string[];
  dimensions?: {
    width: number;
    height: number;
    longestSide: number;
    isCompliant: boolean;
    zoomEnabled: boolean;
    isOptimal: boolean;
  };
  quality?: {
    dpi: number;
    sharpnessScore: number;
    fileSize: number;
    fileSizeMB: number;
    format: string;
    colorSpace: string;
    compressionQuality: number;
    exposureScore: number;
    overallScore: number;
  };
  productFill?: {
    percentage: number;
    passes85Rule: boolean;
    productPixels: number;
    totalPixels: number;
  };
}