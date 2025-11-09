// src/components/complianceFixer.tsx

import React, { useState, useEffect } from 'react';
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
  complianceData: ComplianceResult; // This contains the *original* analysis result
  onBack: () => void;
  violationOverlayUrl: string | null; 
  cutoutImageUrl: string | undefined;
  onFixSuccess: () => void | Promise<void>; 
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


async function loadImageAsDataUrl(imageUrl: string): Promise<string> {
  // ... (This function is unchanged) ...
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
  const [downloadError, setDownloadError] = useState<string | null>(null); // For download-specific errors
  const [fixedImageUrl, setFixedImageUrl] = useState<string | null>(null);
  const [fixedImageOverlayUrl, setFixedImageOverlayUrl] = useState<string | null>(null);
  const [reCheckResult, setReCheckResult] = useState<ComplianceResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    critical: true,
    warning: true,
    passing: false,
  });
  const handleToggle = (section: 'critical' | 'warning' | 'passing') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // The ORIGINAL issues are only needed to determine `fixesToApply`
  const { 
    critical: originalCritical, 
    important: originalImportant, 
    minor: originalMinor 
  } = categorizeIssues(props.complianceData); // No originalNonWhitePixels needed here yet

  const fixesToApply: string[] = [];
  if (originalCritical.some((issue) => issue.name === 'White Background' && issue.status === 'fail')) {
    fixesToApply.push('background');
  }
  if (originalCritical.some((issue) => issue.name === 'Image Size' && issue.status === 'fail')) {
    fixesToApply.push('resize');
  }

  const handleFixAndReAnalyze = async () => {
    if (fixerState !== 'idle') return; 

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
      
      // We still use analysisData.nonWhitePixels > 0 here to decide if an overlay is needed
      if (analysisData.segmentationUrl && analysisData.nonWhitePixels > 0) {
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

  useEffect(() => {
    handleFixAndReAnalyze();
  }, []); 

  const handleDownload = async () => {
    if (!fixedImageUrl) return;

    setIsDownloading(true);
    setDownloadError(null); 

    try {
      const response = await fetch(fixedImageUrl);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = props.originalFileName 
        ? `fixed-${props.originalFileName}` 
        : 'compliancekit-fixed-image.png';
      link.download = fileName; 
      
      document.body.appendChild(link);
      link.click(); 
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Download failed:', err);
      if (err instanceof Error) {
        setDownloadError(`Download failed: ${err.message}`);
      } else {
        setDownloadError('An unknown download error occurred.');
      }
    } finally {
      setIsDownloading(false);
    }
  };
  
  // --- UI RENDER ---
  
  const renderStateContent = () => {
    switch (fixerState) {
      case 'idle':
      case 'fixing':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={24} sx={{ color: theme.primary }} />
            <Typography sx={{ color: theme.textPrimary, fontWeight: 500 }}>
              Applying fixes...
            </Typography>
          </Box>
        );
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
             label="Fix complete!" 
             color="success" 
           />
        );
        
      case 'error':
        return <Typography color="error" variant="body2">{errorMessage}</Typography>;
      
      default:
        return null; 
    }
  };

  // Get all categories from the re-check result
  // --- IMPORTANT CHANGE HERE: Pass originalNonWhitePixels to categorizeIssues ---
  const { 
    critical: newCritical, 
    important: newImportant, 
    minor: newMinor 
  } = categorizeIssues(reCheckResult, props.complianceData.nonWhitePixels); // Pass the original count

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar sx={{ bgcolor: theme.primary, color: 'white', width: 40, height: 40, mr: 2 }}>
          <AutoFixHigh />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700} color={theme.textPrimary}>Auto-Fix Results</Typography>
          <Typography color={theme.textSecondary}>Review the fix and the new compliance report.</Typography>
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
            
            {/* --- DOWNLOAD BUTTON ADDED HERE --- */}
            {fixerState === 'success' && (
              <Box sx={{ mt: 2 }}>
                <Button
                  fullWidth 
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
                {downloadError && (
                  <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    {downloadError}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* --- NEW FULL-WIDTH RESULTS SECTION --- */}
      <Box sx={{ mt: 3 }}>
        {reCheckResult && (
          <>
            <Typography variant="h5" fontWeight={700} color={theme.textPrimary} sx={{ mb: 2 }}>
              New Compliance Report
            </Typography>
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
      </Box>

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