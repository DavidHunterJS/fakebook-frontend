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
} from '@mui/material';
import {
  CheckCircle,
  AutoFixHigh,
  Download, 
} from '@mui/icons-material';
import type { ComplianceResult } from '../types/compliance';

// Import the shared functions AND the IssueSection component
import { 
  processMaskForViolations, 
  categorizeIssues,
  IssueSection 
} from '../utils/analysisUtils'; 

// --- Props Interface ---
export interface ComplianceFixerProps {
  originalImageUrl: string;
  complianceData: ComplianceResult;
  onBack: () => void;
  violationOverlayUrl: string | null; 
  cutoutImageUrl: string | undefined;
  onFixSuccess: () => void | Promise<void>; 
  
  // This prop is needed for the download filename
  originalFileName: string | null; 
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


// --- Main Component ---
const ComplianceFixer: React.FC<ComplianceFixerProps> = (props) => {
  const [fixerState, setFixerState] = useState<FixerState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fixedImageUrl, setFixedImageUrl] = useState<string | null>(null);
  const [fixedImageOverlayUrl, setFixedImageOverlayUrl] = useState<string | null>(null);
  const [reCheckResult, setReCheckResult] = useState<ComplianceResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Add state for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    critical: true,
    warning: true,
    passing: false,
  });
  const handleToggle = (section: 'critical' | 'warning' | 'passing') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Get all original issues
  const { 
    critical: originalCritical, 
    important: originalImportant, 
    minor: originalMinor 
  } = categorizeIssues(props.complianceData);

  const fixesToApply: string[] = [];
  if (originalCritical.some((issue) => issue.name === 'White Background' && issue.status === 'fail')) {
    fixesToApply.push('background');
  }
  if (originalCritical.some((issue) => issue.name === 'Image Size' && issue.status === 'fail')) {
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
      
      if (!fixResponse.ok) {
        const errorData = await fixResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ [FIXER] Fix request failed:', errorData);
        throw new Error(errorData.error || 'Failed to fix image.');
      }

      const fixData = await fixResponse.json();
      fixedUrl = fixData.fixedUrl; 
      console.log('✅ [FIXER] Step 1 Success. Fixed URL:', fixedUrl);
      setFixedImageUrl(fixedUrl);
      
      // --- STEP 2: RE-ANALYZE THE FIXED IMAGE ---
      console.log('📤 [FIXER] Step 2: Re-analyzing fixed image...');
      setFixerState('rechecking');

      const analyzeResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          imageUrl: fixedUrl, 
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
      
      if (analysisData.segmentationUrl && analysisData.nonWhitePixels > 0) {
        // This case handles if the fix *failed* (there are still violations)
        console.log('⚠️ [FIXER] Re-analysis has violations, creating red-dot overlay...');
        try {
          const overlay = await processMaskForViolations(fixedUrl, analysisData.segmentationUrl);
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
          setFixedImageOverlayUrl(dataUrl);
        } catch (err) {
          console.error('❌ [FIXER] Failed to create data URL:', err);
          setFixedImageOverlayUrl(fixedUrl); // Fallback
        }
      }

      console.log('🎉 [FIXER] All steps complete! Setting state to success.');
      setFixerState('success');

    } catch (error: unknown) {
      console.error('❌ [FIXER] Error in fix/re-analyze process:', error);
      let message = 'An unknown error occurred.';
      if (error instanceof Error) message = error.message;
      else if (typeof error === 'string') message = error;
      setErrorMessage(message);
      setFixerState('error');
    }
  };

  /**
   * Securely downloads the cross-origin image from S3.
   */
  const handleDownload = async () => {
    if (!fixedImageUrl) return;

    setIsDownloading(true);
    setErrorMessage(null); // Clear any previous errors

    try {
      const response = await fetch(fixedImageUrl);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Use the prop to create the new filename
      const fileName = props.originalFileName 
        ? `fixed-${props.originalFileName}` 
        : 'compliancekit-fixed-image.png'; // Fallback name
      link.download = fileName; 
      
      document.body.appendChild(link);
      link.click(); 
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Download failed:', err);
      if (err instanceof Error) {
        setErrorMessage(`Download failed: ${err.message}`);
      } else {
        setErrorMessage('An unknown download error occurred.');
      }
    } finally {
      setIsDownloading(false);
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
          <Button
            variant="contained"
            onClick={handleDownload}
            disabled={isDownloading}
            startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <Download />}
            sx={{
              bgcolor: theme.primary,
              color: 'white',
              py: 1.5,
              px: 3,
              fontWeight: 600,
              borderRadius: '50px',
              boxShadow: theme.shadowOuter,
              '&:hover': { bgcolor: theme.primaryDark },
              '&:disabled': { bgcolor: 'grey.500', boxShadow: 'none' }
            }}
          >
            {isDownloading ? 'Downloading...' : 'Download Fixed Image'}
          </Button>
        );
        
      case 'error':
        return <Typography color="error" variant="body2">{errorMessage}</Typography>;
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

  // Get all categories from the re-check result
  const { 
    critical: newCritical, 
    important: newImportant, 
    minor: newMinor 
  } = categorizeIssues(reCheckResult);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar sx={{ bgcolor: theme.primary, color: 'white', width: 40, height: 40, mr: 2 }}>
          <AutoFixHigh />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700} color={theme.textPrimary}>Auto-Fix</Typography>
          <Typography color={theme.textSecondary}>Review the &quot;Before&quot; and &quot;After&quot; images below.</Typography>
        </Box>
      </Box>

      {/* Comparison View */}
      <Grid container spacing={3}>
        {/* Original Image */}
        <Grid size={{xs:12,md:6}} >
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: theme.darkShadow, borderRadius: '16px', height: '100%' }}>
            <Typography variant="h6" color={theme.textSecondary} gutterBottom>Before</Typography>
            <Box
              component="img"
              src={props.violationOverlayUrl || props.originalImageUrl}
              alt="Original Image"
              sx={{ width: '100%', borderRadius: '8px', border: `1px solid ${theme.darkShadow}` }}
            />
            
            {/* --- RENDER ALL ORIGINAL ISSUES --- */}
            <IssueSection 
              title={`Critical Issues (${originalCritical.length})`} 
              issues={originalCritical} 
              type="critical" 
              expanded={expandedSections.critical} 
              onToggle={() => handleToggle('critical')} 
            />
            <IssueSection 
              title={`Warnings (${originalImportant.length})`} 
              issues={originalImportant} 
              type="warning" 
              expanded={expandedSections.warning} 
              onToggle={() => handleToggle('warning')} 
            />
            <IssueSection 
              title={`Passing Requirements (${originalMinor.length})`} 
              issues={originalMinor} 
              type="passing" 
              expanded={expandedSections.passing} 
              onToggle={() => handleToggle('passing')} 
            />
          </Paper>
        </Grid>
        
        {/* Fixed Image */}
        <Grid size={{xs:12,md:6}} >
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
              <>
                {/* --- RENDER ALL NEW ISSUES --- */}
                <IssueSection 
                  title={`New Critical Issues (${newCritical.length})`} 
                  issues={newCritical} 
                  type="critical" 
                  expanded={expandedSections.critical} 
                  onToggle={() => handleToggle('critical')} 
                />
                <IssueSection 
                  title={`New Warnings (${newImportant.length})`} 
                  issues={newImportant} 
                  type="warning" 
                  expanded={expandedSections.warning} 
                  onToggle={() => handleToggle('warning')} 
                />
                <IssueSection 
                  title={`New Passing Requirements (${newMinor.length})`} 
                  issues={newMinor} 
                  type="passing" 
                  expanded={expandedSections.passing} 
                  onToggle={() => handleToggle('passing')} 
                />
              </>
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