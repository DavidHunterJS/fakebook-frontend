// src/utils/analysisUtils.ts
import React from 'react';
import { Box, Typography, Collapse, Paper, Button } from '@mui/material';
import { CheckCircle, Warning, Error as ErrorIcon } from '@mui/icons-material';
import { ComplianceResult } from '../types/compliance';

// --- Interface definitions (moved from component) ---
export interface Issue {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  value: string;
  details?: string;
  priority: 'critical' | 'important' | 'minor';
}

export interface CategorizedIssues {
  critical: Issue[];
  important: Issue[];
  minor: Issue[];
}

// --- NEW SHARED COMPONENT: IssueSection ---
// This is the powerful component moved from your checker.tsx
export const IssueSection = ({ title, issues, type, expanded, onToggle }: {
  title: string;
  issues: Issue[];
  type: 'critical' | 'warning' | 'passing';
  expanded: boolean;
  onToggle: () => void;
}): React.ReactElement | null => {
  if (issues.length === 0) return null;

  const colors = {
    critical: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', iconColor: '#dc2626' },
    warning: { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', iconColor: '#ea580c' },
    passing: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', iconColor: '#16a34a' }
  };
  const SectionIcon = type === 'critical' || type === 'warning' ? Warning : CheckCircle;

  return (
    <Box sx={{ mb: 2 }}>
      <Button fullWidth onClick={onToggle} sx={{
        display: 'flex', justifyContent: 'space-between', p: 1.5, textTransform: 'none',
        bgcolor: '#e6f7f5', border: 'none', borderRadius: '30px',
        boxShadow: '8px 8px 16px #c4d9d6, -8px -8px 16px #ffffff',
        '&:hover': { bgcolor: '#e6f7f5', boxShadow: '4px 4px 8px #c4d9d6, -4px -4px 8px #ffffff' }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <SectionIcon sx={{ color: colors[type].iconColor }} />
          <Typography sx={{ fontWeight: 600, fontSize: '1.125rem', color: colors[type].text }}>
            {title}
          </Typography>
        </Box>
        <SectionIcon sx={{ color: colors[type].iconColor }} />
      </Button>
      <Collapse in={expanded}>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {issues.map((issue, idx) => {
            const IssueIcon = issue.status === 'fail' ? ErrorIcon : issue.status === 'warn' ? Warning : CheckCircle;
            return (
              <Paper key={idx} elevation={0} sx={{
                p: 2,
                borderLeft: `4px solid ${type === 'critical' ? '#ef4444' : type === 'warning' ? '#f97316' : '#10b981'}`,
                bgcolor: colors[type].bg,
                borderRadius: '0.5rem'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <IssueIcon sx={{ fontSize: '1.25rem', color: colors[type].iconColor }} />
                  <Typography sx={{ fontWeight: 600, color: '#111827' }}>
                    {issue.name}
                  </Typography>
                   <Box sx={{
                      display: 'inline-flex', alignItems: 'center', px: 0.75, py: 0.25, borderRadius: '0.25rem',
                      fontSize: '0.75rem', fontWeight: 500, ml: 0.5,
                      bgcolor: issue.status === 'fail' ? '#fee2e2' : issue.status === 'warn' ? '#ffedd5' : '#dcfce7',
                      color: issue.status === 'fail' ? '#991b1b' : issue.status === 'warn' ? '#ea580c' : '#166534',
                      border: `1px solid ${issue.status === 'fail' ? '#fca5a5' : issue.status === 'warn' ? '#fdba74' : '#86efac'}`
                    }}>
                      {issue.status === 'fail' ? 'FAIL' : issue.status === 'warn' ? 'WARN' : 'PASS'}
                    </Box>
                </Box>
                <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: 500, fontSize: '0.875rem' }}>
                  {issue.value}
                </Typography>
                {issue.details && (
                  <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    {issue.details}
                  </Typography>
                )}
              </Paper>
            );
          })}
        </Box>
      </Collapse>
    </Box>
  );
};


/**
 * This is your 100% working function from ModernizedComplianceChecker.
 * It assumes a (Product=White, Background=Black) mask.
 */
export async function processMaskForViolations(
  imageUrl: string,
  maskUrl: string
): Promise<string> {
  // ... (Your existing processMaskForViolations code remains unchanged)
  console.log("processMaskForViolations FIRED!!!!! (from SHARED util)");
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas context failed'));

    const originalImg = new Image();
    originalImg.crossOrigin = 'Anonymous';
    const maskImg = new Image();
    maskImg.crossOrigin = 'Anonymous';

    let loaded = 0;
    const onImageLoad = () => {
      loaded++;
      if (loaded === 2) {
        canvas.width = originalImg.width;
        canvas.height = originalImg.height;
        
        ctx.drawImage(originalImg, 0, 0);
        const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = originalData.data;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
        const maskData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        for (let i = 0; i < pixels.length; i += 4) {
          const maskValue = (maskData[i] + maskData[i + 1] + maskData[i + 2]) / 3;
          
          // This is YOUR working logic
          const isBackground = maskValue < 128; 
          
          if (isBackground) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const isPureWhite = (r === 255 && g === 255 && b === 255);
            
            if (!isPureWhite) {
              pixels[i] = 255; // R
              pixels[i + 1] = 0;   // G
              pixels[i + 2] = 0;   // B
            }
          }
        }
        ctx.putImageData(originalData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      }
    };
    
    originalImg.onload = onImageLoad;
    maskImg.onload = onImageLoad;
    originalImg.onerror = () => reject(new Error('Failed to load original image'));
    maskImg.onerror = () => reject(new Error('Failed to load mask image'));

    originalImg.src = imageUrl;
    maskImg.src = maskUrl;
  });
};

/**
 * This is your 100% working categorization function.
 */
export const categorizeIssues = (data: ComplianceResult | null): CategorizedIssues => {
  // ... (Your existing categorizeIssues code remains unchanged)
  if (!data) return { critical: [], important: [], minor: [] };
  
  const critical: Issue[] = [];
  const important: Issue[] = [];
  const minor: Issue[] = [];

  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  if (data.nonWhitePixels > 0) {
    critical.push({ name: "White Background", status: "fail", value: `${data.nonWhitePixels.toLocaleString()} non-white pixels found`, details: "Amazon requires a pure white background (RGB 255,255,255).", priority: "critical" });
  }
  if (data.productFill && !data.productFill.passes85Rule) {
    important.push({ name: "Product Fill", status: "warn", value: `Product fills only ${data.productFill.percentage}% of the frame`, details: "Amazon's guideline is that the product should fill at least 85% of the image.", priority: "important" });
  }
  // ... (rest of your categorizeIssues logic) ...
  if (data.quality) {
    const { dpi,    } = data.quality;
    if (dpi < 72) {
      minor.push({ name: "DPI (Dots Per Inch)", status: "warn", value: `${dpi} DPI`, details: "Below standard web resolution (72 DPI)", priority: "minor" });
    } else {
      minor.push({ name: "DPI", status: "pass", value: `${dpi} DPI`, details: "Meets standard web resolution.", priority: "minor" });
    }
  }
  if (data.quality) {
    const {  overallScore,   } = data.quality;
    if (overallScore < 60) {
      critical.push({ name: "Image Quality", status: "fail", value: `Quality score: ${overallScore.toFixed(0)}`, details: "Poor image quality...", priority: "critical" });
    } else if (overallScore < 75) {
      important.push({ name: "Image Quality", status: "warn", value: `Quality score: ${overallScore.toFixed(0)}`, details: "Image quality could be improved.", priority: "important" });
    } else {
      minor.push({ name: "Image Quality", status: "pass", value: `Quality score: ${overallScore.toFixed(0)}`, details: "Good image quality.", priority: "minor" });
    }
  }
  if (data.quality?.colorSpace) {
    const colorSpace = data.quality.colorSpace.toUpperCase();
    if (colorSpace === 'RGB' || colorSpace === 'SRGB') {
      minor.push({ name: "Color Space", status: "pass", value: "Correct color profile", details: `${colorSpace} - Optimal for Amazon`, priority: "minor" });
    } else if (colorSpace === 'CMYK') {
      critical.push({ name: "Color Space", status: "fail", value: "Should be RGB", details: `Currently: ${colorSpace}. Convert to RGB/sRGB.`, priority: "critical" });
    } else {
      important.push({ name: "Color Space", status: "warn", value: `Non-standard: ${colorSpace}`, details: "RGB or sRGB recommended", priority: "important" });
    }
  }
  if (data.dimensions) {
    const { width, height, longestSide } = data.dimensions;
    if (longestSide < 1000) {
      critical.push({ name: "Image Size", status: "fail", value: `${width} × ${height}px`, details: "Below 1,000px minimum.", priority: "critical" });
    } else if (longestSide < 1600) {
      important.push({ name: "Image Size", status: "warn", value: `${width} × ${height}px`, details: "1,600px+ recommended for zoom.", priority: "important" });
    } else {
      minor.push({ name: "Image Size", status: "pass", value: `${width} × ${height}px`, details: "Optimal size.", priority: "minor" });
    }
    if (width > 0 && height > 0) {
      const divisor = gcd(width, height);
      const ratioW = width / divisor;
      const ratioH = height / divisor;
      const isSquare = ratioW === 1 && ratioH === 1;
      if (isSquare) {
        minor.push({ name: "Aspect Ratio", status: "pass", value: "1:1 (Square)", details: "Ideal for Amazon.", priority: "minor" });
      } else {
        important.push({ name: "Aspect Ratio", status: "warn", value: `${ratioW}:${ratioH}`, details: "Square (1:1) is recommended.", priority: "important" });
      }
    }
  }
  const format = data.quality?.format?.toLowerCase();
  const acceptedFormats = ['jpeg', 'jpg', 'png', 'gif', 'tiff', 'tif'];
  if (format && acceptedFormats.includes(format)) {
    minor.push({ name: "File Format", status: "pass", value: `${format.toUpperCase()}`, details: "Accepted format.", priority: "minor" });
  } else {
    important.push({ name: "File Format", status: "fail", value: `${format?.toUpperCase() || 'Unknown'}`, details: "Amazon requires JPEG, PNG, GIF, or TIFF.", priority: "important" });
  }
  const fileSizeMB = data.quality?.fileSizeMB || 0;
  if (fileSizeMB > 10) {
    critical.push({ name: "File Size", status: "fail", value: `${fileSizeMB.toFixed(2)} MB`, details: "Exceeds 10MB limit.", priority: "critical" });
  } else if (fileSizeMB > 5) {
    important.push({ name: "File Size", status: "warn", value: `${fileSizeMB.toFixed(2)} MB`, details: "Over 5MB may load slowly.", priority: "important" });
  } else {
    minor.push({ name: "File Size", status: "pass", value: `${fileSizeMB.toFixed(2)} MB`, details: "Optimal size.", priority: "minor" });
  }

  return { critical, important, minor };
};