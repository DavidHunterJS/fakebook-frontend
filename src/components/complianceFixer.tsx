// src/components/complianceFixer.tsx

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Grid,
  Avatar,
  Chip,
  Collapse,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  AutoFixHigh,
} from '@mui/icons-material';
import type { ComplianceResult } from '../types/compliance';

// Import the shared functions
import { 
  processMaskForViolations, 
  categorizeIssues,
  type Issue
} from '../utils/analysisUtils';

// --- Props Interface ---
export interface ComplianceFixerProps {
  originalImageUrl: string;
  complianceData: ComplianceResult;
  onBack: () => void;
  violationOverlayUrl: string | null; // The original image with red dots
  cutoutImageUrl: string | undefined;
  onFixSuccess: () => void | Promise<void>; // This deducts the credit
}

// --- Helper Types ---
type FixerState = 'idle' | 'fixing' | 'rechecking' | 'success' | 'error';

// --- Styling Theme (simplified) ---
const theme = {
  bgColor: '#e6f7f5',
  darkShadow: '#c4d9d6',
  lightShadow: '#ffffff',
  primary: '#14b8a6',
  primaryDark: '#0d9488',
  textPrimary: '#1e3a8a',
  textSecondary: '#475569',
  shadowOuter: '12px 12px 24px #c4d9d6, -12px -12px 24px #ffffff',
};


/**
 * Loads an image from any URL (even cross-origin) and returns it
 * as a data: URL by drawing it to a canvas. This bypasses S3 CORS issues.
 */
async function loadImageAsDataUrl(imageUrl: string): Promise<string> {
  console.log('🔄 [loadImageAsDataUrl] Starting conversion for:', imageUrl);
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ [loadImageAsDataUrl] Canvas context failed');
      return reject(new Error('Canvas context failed'));
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    // Add timeout
    const timeout = setTimeout(() => {
      console.error('❌ [loadImageAsDataUrl] Timeout loading image');
      reject(new Error('Image load timeout'));
    }, 10000);
    
    img.onload = () => {
      clearTimeout(timeout);
      console.log('✅ [loadImageAsDataUrl] Image loaded, dimensions:', img.width, 'x', img.height);
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      
      console.log('✅ [loadImageAsDataUrl] Data URL created, length:', dataUrl.length);
      resolve(dataUrl);
    };
    
    img.onerror = (error) => {
      clearTimeout(timeout);
      console.error('❌ [loadImageAsDataUrl] Image load error:', error);
      reject(new Error('Failed to load image to canvas - CORS or network error'));
    };
    
    img.src = imageUrl;
  });
}


// --- HELPER COMPONENT: IssueSection ---
const IssueSection: React.FC<{ title: string; issues: Issue[]; type: 'critical' }> = ({
  title,
  issues,
}) => {
  const isOpen = true; 
  const colors = { bg: '#fef2f2', text: '#991b1b', iconColor: '#dc2626' };
  
  // Filter out 'pass' status issues
  const issuesToDisplay = issues.filter(issue => issue.status !== 'pass');

  return (
    <Box sx={{ mt: 2 }}>
      <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: colors.text }}>
        {title}
      </Typography>
      <Collapse in={isOpen}>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {issuesToDisplay.length === 0 ? (
             <Paper elevation={0} sx={{ p: 2, bgcolor: '#f0fdf4', borderLeft: '4px solid #10b981' }}>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                 <CheckCircle sx={{ fontSize: '1.25rem', color: '#16a34a' }} />
                 <Typography sx={{ fontWeight: 600, color: '#14532d' }}>
                   No critical issues found
                 </Typography>
               </Box>
             </Paper>
          ) : (
            issuesToDisplay.map((issue, idx) => (
              <Paper
                key={idx}
                elevation={0}
                sx={{
                  p: 2,
                  borderLeft: `4px solid ${issue.status === 'fail' ? '#ef4444' : '#f97316'}`,
                  bgcolor: issue.status === 'fail' ? colors.bg : '#fff7ed',
                  borderRadius: '0.5rem',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <ErrorIcon sx={{ fontSize: '1.25rem', color: colors.iconColor }} />
                  <Typography sx={{ fontWeight: 600, color: '#111827' }}>
                    {issue.name}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: 500, fontSize: '0.875rem' }}>
                  {issue.value}
                </Typography>
              </Paper>
            ))
          )}
        </Box>
      </Collapse>
    </Box>
  );
};


// --- Main Component ---
const ComplianceFixer: React.FC<ComplianceFixerProps> = (props) => {
  const [fixerState, setFixerState] = useState<FixerState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fixedImageUrl, setFixedImageUrl] = useState<string | null>(null);
  const [fixedImageOverlayUrl, setFixedImageOverlayUrl] = useState<string | null>(null);
  const [reCheckResult, setReCheckResult] = useState<ComplianceResult | null>(null);

  const { critical } = categorizeIssues(props.complianceData);
  const fixesToApply: string[] = [];
  if (critical.some((issue) => issue.name === 'White Background' && issue.status === 'fail')) {
    fixesToApply.push('background');
  }
  if (critical.some((issue) => issue.name === 'Image Size' && issue.status === 'fail')) {
    fixesToApply.push('resize');
  }

  /**
   * Main workflow function to fix, re-analyze, and update the UI.
   */
  const handleFixAndReAnalyze = async () => {
    console.log('🚀 [FIXER] handleFixAndReAnalyze START');
    setFixerState('fixing');
    setErrorMessage(null);
    let fixedUrl = ''; 

    try {
      // --- STEP 1: FIX THE IMAGE ---
      console.log('📤 [FIXER] Step 1: Sending fix request...');
      console.log('   - cutoutImageUrl:', props.cutoutImageUrl);
      console.log('   - fixesToApply:', fixesToApply);
      console.log('   - dimensions:', props.complianceData.dimensions);
      
      const fixResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/fix-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cutoutImageUrl: props.cutoutImageUrl,
          fixesToApply: fixesToApply,
          dimensions: props.complianceData.dimensions,
        }),
      });

      console.log('📥 [FIXER] Fix response status:', fixResponse.status);
      
      if (!fixResponse.ok) {
        const errorData = await fixResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ [FIXER] Fix request failed:', errorData);
        throw new Error(errorData.error || 'Failed to fix image.');
      }

      const fixData = await fixResponse.json();
      console.log('📦 [FIXER] Fix response data:', fixData);
      fixedUrl = fixData.fixedUrl; 
      console.log('✅ [FIXER] Step 1 Success. Fixed URL:', fixedUrl);
      setFixedImageUrl(fixedUrl);
      
      // DON'T call onFixSuccess yet - it causes parent re-render which unmounts us!
      // We'll call it at the very end after setting all state

      // --- STEP 2: RE-ANALYZE THE FIXED IMAGE ---
      console.log('📤 [FIXER] Step 2: Re-analyzing fixed image...');
      setFixerState('rechecking');
      const absoluteUrl = fixedUrl;

      const analyzeResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          imageUrl: absoluteUrl, 
          skipCreditDeduction: true 
        }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || 'Failed to re-analyze image.');
      }

      const analysisData: ComplianceResult = await analyzeResponse.json();
      console.log('✅ [FIXER] Step 2 Success. Analysis result:', analysisData);
      setReCheckResult(analysisData);

      // --- STEP 3: CREATE NEW OVERLAY (RED DOTS) ---
      console.log('🔍 [FIXER] Step 3: Creating overlay image...');
      console.log('   - Fixed URL:', fixedUrl);
      console.log('   - Segmentation URL:', analysisData.segmentationUrl);
      console.log('   - Non-white pixels:', analysisData.nonWhitePixels);
      
      if (analysisData.segmentationUrl && analysisData.nonWhitePixels > 0) {
        // This case handles if the fix *failed* (there are still violations)
        console.log('⚠️ [FIXER] Re-analysis has violations, creating red-dot overlay...');
        try {
          const overlay = await processMaskForViolations(fixedUrl, analysisData.segmentationUrl);
          console.log('✅ [FIXER] Overlay created successfully, length:', overlay.length);
          setFixedImageOverlayUrl(overlay);
        } catch (err) {
          console.error('❌ [FIXER] Failed to create overlay, falling back to data URL:', err);
          const dataUrl = await loadImageAsDataUrl(fixedUrl);
          setFixedImageOverlayUrl(dataUrl);
        }
      } else {
        // This is the success case (nonWhitePixels is 0 or no segmentation)
        console.log('✅ [FIXER] Re-analysis passed! Converting to data URL to bypass CORS...');
        try {
          const dataUrl = await loadImageAsDataUrl(fixedUrl);
          console.log('✅ [FIXER] Data URL created successfully, length:', dataUrl.length);
          setFixedImageOverlayUrl(dataUrl);
        } catch (err) {
          console.error('❌ [FIXER] Failed to create data URL:', err);
          // Last resort: try using the URL directly
          console.log('⚠️ [FIXER] Using URL directly as fallback');
          setFixedImageOverlayUrl(fixedUrl);
        }
      }

      console.log('🎉 [FIXER] All steps complete! Setting state to success.');
      setFixerState('success');

      // Don't call onFixSuccess here - it will be called when user navigates back
      // This prevents parent re-renders from unmounting this component

    } catch (error: any) {
      console.error('❌ [FIXER] Error in fix/re-analyze process:', error);
      setErrorMessage(error.message);
      setFixerState('error');
    }
  };
  
  // --- UI RENDER ---
  
  const renderStateContent = () => {
    switch (fixerState) {
      case 'fixing':
        return <CircularProgress size={24} sx={{ color: theme.primary, mr: 2 }} />;
      case 'rechecking':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={24} sx={{ color: theme.primary }} />
            <Typography sx={{ color: theme.textPrimary, fontWeight: 500 }}>
              Fix applied! Re-analyzing...
            </Typography>
          </Box>
        );
      case 'success':
        return (
           <Chip 
             icon={<CheckCircle />} 
             label="All issues fixed and verified!" 
             color="success" 
           />
        );
      case 'error':
        return <Typography color="error" variant="body2">Error: {errorMessage}</Typography>;
      case 'idle':
      default:
        return (
          <Button
            variant="contained"
            startIcon={<AutoFixHigh />}
            onClick={handleFixAndReAnalyze}
            disabled={fixesToApply.length === 0}
            sx={{
              bgcolor: theme.primary,
              color: 'white',
              py: 1.5,
              px: 3,
              fontWeight: 600,
              borderRadius: '50px',
              boxShadow: theme.shadowOuter,
              '&:hover': { bgcolor: theme.primaryDark }
            }}
          >
            {fixesToApply.length > 0 
              ? `Fix ${fixesToApply.length} Critical Issue${fixesToApply.length > 1 ? 's' : ''}`
              : 'No fixes to apply'
            }
          </Button>
        );
    }
  };

  // Debug logs
  console.log('--- [FIXER] Re-rendering ---');
  console.log('State:', fixerState);
  console.log('Fixed Image URL:', fixedImageUrl);
  console.log('Overlay URL:', fixedImageOverlayUrl);
  console.log('Error:', errorMessage);
  console.log('---------------------------');

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar sx={{ bgcolor: theme.primary, color: 'white', width: 40, height: 40, mr: 2 }}>
          <AutoFixHigh />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700} color={theme.textPrimary}>Auto-Fix</Typography>
          <Typography color={theme.textSecondary}>Review the "Before" and "After" images below.</Typography>
        </Box>
      </Box>

      {/* Comparison View */}
      <Grid container spacing={3}>
        {/* Original Image */}
        <Grid size={{xs:12, md:6}}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: theme.darkShadow, borderRadius: '16px', height: '100%' }}>
            <Typography variant="h6" color={theme.textSecondary} gutterBottom>Before</Typography>
            <Box
              component="img"
              src={props.violationOverlayUrl || props.originalImageUrl}
              alt="Original Image"
              sx={{ width: '100%', borderRadius: '8px', border: `1px solid ${theme.darkShadow}` }}
            />
            <IssueSection title="Original Issues" issues={critical} type="critical" />
          </Paper>
        </Grid>
        
        {/* Fixed Image */}
        <Grid size={{xs:12, md:6}}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: theme.darkShadow, borderRadius: '16px', height: '100%' }}>
            <Typography variant="h6" color={theme.textSecondary} gutterBottom>After</Typography>
            
            {!fixedImageUrl ? (
              <Box sx={{
                height: 300,
                bgcolor: '#f4f4f4',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.textSecondary,
                flexDirection: 'column',
                gap: 2
              }}>
                <CircularProgress size={24} sx={{ color: fixerState === 'idle' ? 'grey.400' : theme.primary }} />
                <Typography>
                  {
                    fixerState === 'idle' ? 'Your fixed image will appear here...' :
                    fixerState === 'fixing' ? 'Applying fixes...' :
                    fixerState === 'rechecking' ? 'Verifying fixes...' :
                    'Loading final image...'
                  }
                </Typography>
              </Box>
            ) : (
              <Box
                component="img"
                src={fixedImageOverlayUrl || fixedImageUrl}
                alt="Fixed Image"
                sx={{ width: '100%', borderRadius: '8px', border: `1px solid ${theme.darkShadow}` }}
              />
            )}
            
            {/* Show the NEW issue list for the fixed image */}
            {reCheckResult && (
              <IssueSection 
                title="New Issues" 
                issues={categorizeIssues(reCheckResult).critical} 
                type="critical" 
              />
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Actions */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          variant="outlined" 
          onClick={props.onBack} 
          sx={{ borderRadius: '50px' }}
          disabled={fixerState === 'fixing' || fixerState === 'rechecking'}
        >
          Back to Results
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', minHeight: '48px' }}>
          {renderStateContent()}
        </Box>
      </Box>
    </Box>
  );
};

export default ComplianceFixer;