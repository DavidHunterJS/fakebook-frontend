// src/pages/checker.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, Button, Card,  Chip, Avatar,  
   AppBar, Toolbar, Container, Paper,  Collapse,
  CircularProgress,  Fab
} from '@mui/material';
import {
  CloudUpload, CheckCircle, Warning, Error as ErrorIcon,
  PhotoCamera, AutoFixHigh, ArrowForward, Info, 
    
} from '@mui/icons-material';

// --- (IMPORTANT) Make sure to import your actual API function ---
import { uploadImage } from '../utils/api';
import { analytics } from '../utils/analytics';
import ComplianceFixer from '../components/complianceFixer';
import type { ComplianceResult } from '../types/compliance';
import { 
  processMaskForViolations, 
  categorizeIssues,
  type Issue
} from '../utils/analysisUtils';

// 👇 --- IMPORT YOUR CUSTOM HOOK ---
import { useSubscription } from '../hooks/useSubscription';

// --- Neomorphic Theme Constants (from compliance-kit.tsx) ---
const theme = {
  bgColor: '#e6f7f5',
  darkShadow: '#c4d9d6',
  lightShadow: '#ffffff',
  primary: '#14b8a6', // teal
  primaryDark: '#0d9488',
  textPrimary: '#1e3a8a', // dark blue
  textSecondary: '#475569', // slate gray
  
  // Neomorphic shadows
  shadowOuter: '12px 12px 24px #c4d9d6, -12px -12px 24px #ffffff',
  shadowOuterSm: '8px 8px 16px #c4d9d6, -8px -8px 16px #ffffff',
  shadowOuterXs: '4px 4px 8px #c4d9d6, -4px -4px 8px #ffffff',
  shadowInner: 'inset 6px 6px 12px #c4d9d6, inset -6px -6px 12px #ffffff',
  shadowInnerSm: 'inset 4px 4px 8px #c4d9d6, inset -4px -4px 8px #ffffff',
};

type CheckerState = 'upload' | 'processing' | 'results' | 'error' | 'fixing';

// --- Main Component ---
const ModernizedComplianceChecker: React.FC = () => {
  // --- State and Refs ---
  const [checkerState, setCheckerState] = useState<CheckerState>('upload');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<number>(0);
  // const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [complianceData, setComplianceData] = useState<ComplianceResult | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showViolations, setShowViolations] = useState<boolean>(true);
  const [expandedSections, setExpandedSections] = useState({
    critical: true,
    warning: true,
    passing: false,
  });
  const [processedOverlayUrl, setProcessedOverlayUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // This replaces all the manual state and logic for credits
  const { 
    subscription, 
    isLoading: isLoadingCredits, 
    error: creditError, 
    refetch: refetchCredits, // This is our new "fetchCredits" function
    getRemainingCredits,
    hasCreditsFor 
  } = useSubscription();

  // --- All handler functions (handleNavigateToFixer, processMaskForViolations, etc.) ---

  const handleNavigateToFixer = () => {
    console.log("1. handleNavigateToFixer CALLED in the main component!");
    setCheckerState('fixing');
  };

  const handleBackToResults = () => {
    setCheckerState('results');
  };

  
  // --- handleUploadAndAnalysis (UPDATED) ---
  const handleUploadAndAnalysis = async (file: File) => {
    setCheckerState('processing');
    setErrorMessage('');
    setProcessedOverlayUrl(null);

    // 👇 --- Check credits using the hook's helper ---
    if (!hasCreditsFor('check')) {
      setErrorMessage("You've run out of 'check' credits. Please upgrade your plan.");
      setCheckerState('error');
      analytics.errorOccurred('credits_exhausted', 'check');
      return; // Stop execution
    }
    
    // Track upload start
    const uploadStartTime = Date.now();
    const fileSizeMB = file.size / (1024 * 1024);
    const fileType = file.name.split('.').pop() || 'unknown';
    analytics.imageUploaded(fileType, fileSizeMB);

    // Set a temporary URL for immediate preview
    const localUrl = URL.createObjectURL(file);
    setOriginalImageUrl(localUrl);

    try {
      setProcessingStep(1);
      const imageUrl = await uploadImage(file);
      
      if (localUrl !== imageUrl) {
        URL.revokeObjectURL(localUrl);
        setOriginalImageUrl(imageUrl);
      }

      setProcessingStep(2);
      
      try {
        const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/analyze-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ imageUrl }),
        });

        // Handle 403 (Credits Exhausted) from middleware
        if (analysisResponse.status === 403) {
          const errorData = await analysisResponse.json().catch(() => ({}));
          throw new Error(errorData.message || "You've run out of 'check' credits. Please upgrade your plan.");
        }
        
        if (!analysisResponse.ok) {
          const errorData = await analysisResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Analysis failed: ${analysisResponse.statusText}`);
        }

        const result: ComplianceResult = await analysisResponse.json();
        console.log('📦 Full result from backend:', result);
        console.log('📦 Result keys:', Object.keys(result));

        // Track successful analysis
        const processingTime = (Date.now() - uploadStartTime) / 1000;
        const totalIssues = result.issues ? result.issues.length : 0;
        analytics.analysisCompleted(totalIssues, processingTime);
        
        setProcessingStep(4);
        console.log('🔍 Step 4: Checking if we should process mask...');
        console.log('segmentationUrl:', result.segmentationUrl);
        console.log('nonWhitePixels:', result.nonWhitePixels);
        if (result.segmentationUrl && result.nonWhitePixels > 0) {
          console.log('✅ Conditions met! Calling processMaskForViolations...');
          console.log('imageUrl:', imageUrl);
          console.log('maskUrl:', result.segmentationUrl);
          try {
            const overlayUrl = await processMaskForViolations(imageUrl, result.segmentationUrl);
            console.log('✅ processMaskForViolations SUCCESS! overlayUrl length:', overlayUrl.length);
            setProcessedOverlayUrl(overlayUrl);
          } catch (error) {
            console.error("Mask processing failed, falling back to original image.", error);
            setProcessedOverlayUrl(imageUrl);
          }
        } else {
          console.log('⚠️ Skipping mask processing. Reasons:');
          console.log('  - Has segmentationUrl?', !!result.segmentationUrl);
          console.log('  - Has nonWhitePixels > 0?', result.nonWhitePixels > 0);  
          setProcessedOverlayUrl(imageUrl);
        }
        
        setProcessingStep(5);
        setComplianceData(result);
        setCheckerState('results');

        // 👇 --- RE-FETCH CREDITS using the hook's refetch function ---
        await refetchCredits(); 

        // Track results viewed
        analytics.resultsViewed(totalIssues > 0);

      } catch (fetchError: unknown) {
        
        if (fetchError instanceof Error) {
          analytics.errorOccurred('analysis_error', fetchError.message);
        }
        
        // ... (rest of your timeout logic)
        
        throw fetchError;
      }

    } catch (error) {
      console.error('Error during upload and analysis:', error);
      
      let userFriendlyMessage = 'An unexpected error occurred during analysis.';
      
      if (error instanceof Error) {
        // Handle specific error types with user-friendly messages
        if (error.message.includes("You've run out of 'check' credits")) {
          userFriendlyMessage = error.message;
        } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          userFriendlyMessage = 'The analysis is taking longer than expected. This can happen with large images or when our servers are busy. Please try again with a smaller image or wait a few minutes.';
        } else if (error.message.includes('Network')) {
          userFriendlyMessage = 'Unable to connect to our analysis servers. Please check your internet connection and try again.';
        } else if (error.message.includes('File size')) {
          userFriendlyMessage = error.message; // File size errors are already user-friendly
        } else if (error.message.includes('Invalid file type')) {
          userFriendlyMessage = error.message; // File type errors are already user-friendly
        } else {
          userFriendlyMessage = error.message;
        }
      }
      if (error instanceof Error) {
       analytics.errorOccurred('upload_error', error.message);
        }
      setErrorMessage(userFriendlyMessage);
      setCheckerState('error');
    }
  };

    useEffect(() => {
    if (checkerState === 'results' && complianceData) {
      // Show modal after a brief delay
      const timer = setTimeout(() => {
        // setShowFeedbackModal(true);
      }, 20000); // 20 second delay

      return () => clearTimeout(timer);
    }
  }, [checkerState, complianceData]);
  
  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size cannot exceed 10MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Invalid file type. Please upload an image.');
      return;
    }
    handleUploadAndAnalysis(file);
  };

  const handleDragEvents = (e: React.DragEvent<HTMLElement>, isOver: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isOver);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    handleDragEvents(e, false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleResetAll = () => {
    setCheckerState('upload');
    setComplianceData(null);
    if (originalImageUrl && originalImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(originalImageUrl);
    }
    setOriginalImageUrl(null);
    setProcessedOverlayUrl(null);
    setErrorMessage('');
  };
  

  // --- UI Sub-components using the NEW design ---
  const Header = () => (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        bgcolor: theme.bgColor, 
        boxShadow: theme.shadowOuterSm,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ height: '64px' }}>
          {/* Logo matching compliance-kit.tsx */}
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: '1.8rem',
              fontWeight: 700,
              color: theme.textPrimary, // Was #2563eb
            }}
          >
            Compliance
            <Typography
              component="span"
              sx={{ 
                fontSize: '1.8rem', 
                fontWeight: 700, 
                color: theme.primary 
              }}
            >
              Kit
            </Typography>
          </Typography>
          
          <Chip 
            label="Beta" 
            size="small" 
            sx={{ 
              background: theme.primary,
              color: 'white',
              fontWeight: 600,
              px: 1
            }} 
          />
        </Toolbar>
      </Container>
    </AppBar>
  );

  const ProcessingState: React.FC = () => {
    const steps = [
      "Uploading to secure storage", 
      "Analyzing image with AI", 
      "Checking Amazon requirements",
      "Processing violation highlights",
      "Generating compliance report"
    ];

    return (
      <Box sx={{ textAlign: 'center', p: 4, bgcolor: theme.bgColor }}>
        <CircularProgress size={60} sx={{ mb: 3, color: theme.primary }} />
        <Typography variant="h6" gutterBottom sx={{ color: theme.textPrimary }}>
          Analyzing your image...
        </Typography>
        <Box sx={{ maxWidth: 400, mx: 'auto', textAlign: 'left' }}>
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            let status: 'pending' | 'active' | 'completed' = 'pending';
            if (processingStep > stepNumber) status = 'completed';
            if (processingStep === stepNumber) status = 'active';

            return (
              <Box 
                key={label} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  py: 1,
                  color: status === 'completed' ? 'success.main' : 
                          status === 'active' ? theme.primary : 'text.secondary'
                }}
              >
                {status === 'completed' ? (
                  <CheckCircle fontSize="small" />
                ) : status === 'active' ? (
                  <CircularProgress size={16} sx={{ color: theme.primary }} />
                ) : (
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      border: 2, 
                      borderColor: 'grey.300' 
                    }} 
                  />
                )}
                <Typography variant="body2" sx={{ color: status === 'active' ? theme.textPrimary : 'inherit' }}>
                  {label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const UploadArea = () => (
    <Box sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center' }}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />
      
      {/* Hero Section Above Upload */}
      <Box sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700, 
            color: theme.textPrimary,
            mb: 2
          }}
        >
          Amazon Image Compliance Checker
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ color: theme.textSecondary, fontWeight: 400 }}
        >
          Instantly check if your product images meet Amazon&apos;s requirements
        </Typography>
      </Box>

      {/* Updated Upload Box (Neomorphic Inset) */}
      <Box 
        onClick={() => fileInputRef.current?.click()} 
        onDragOver={(e) => handleDragEvents(e, true)} 
        onDragEnter={(e) => handleDragEvents(e, true)} 
        onDragLeave={(e) => handleDragEvents(e, false)} 
        onDrop={handleDrop}
        sx={{ 
          border: 'none',
          borderRadius: '30px', // Match landing page cards
          p: { xs: 4, sm: 6 },
          background: theme.bgColor,
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          boxShadow: isDragging 
            ? 'inset 8px 8px 16px #c4d9d6, inset -8px -8px 16px #ffffff' // Deeper inset
            : theme.shadowInner, // Inset shadow
          '&:hover': { 
            boxShadow: 'inset 8px 8px 16px #c4d9d6, inset -8px -8px 16px #ffffff',
          }
        }}
      >
      <CloudUpload 
          sx={{ 
            fontSize: 56, 
            color: theme.primary, // Use theme color
            mb: 2,
            opacity: 0.9
          }} 
        />
        <Typography 
          variant="h6" 
          fontWeight={600} 
          sx={{ color: theme.textPrimary, mb: 0.5 }}
        >
          Drop your product image here
        </Typography>
        <Typography sx={{ color: theme.textSecondary, mb: 3, fontSize: '0.95rem' }}>
          or click to browse • PNG, JPG up to 10MB
        </Typography>
        
        {/* Feature Pills (Neomorphic) */}
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['White Background Check', '85% Product Fill', 'Image Quality'].map((feature) => (
            <Chip 
              key={feature}
              label={feature}
              size="small"
              sx={{ 
                bgcolor: theme.bgColor,
                color: theme.primary,
                fontWeight: 600,
                fontSize: '0.8rem',
                boxShadow: theme.shadowOuterXs, // Small outer shadow
                border: `1px solid ${theme.primary}22`
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Trust Badges (Neomorphic) */}
      <Box sx={{ 
        mt: 4, 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 2, // Reduced gap
        flexWrap: 'wrap'
      }}>
        {[
          { icon: <CheckCircle />, text: 'Free to Use' },
          { icon: <CheckCircle />, text: 'No Sign-up Required' },
          { icon: <CheckCircle />, text: 'Instant Results' }
        ].map((item) => (
          <Box 
            key={item.text}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              px: 2,
              py: 1,
              borderRadius: '100px',
              bgcolor: theme.bgColor,
              boxShadow: theme.shadowOuterXs, // Small outer shadow
              border: `1px solid ${theme.primary}22`
            }}
          >
            <CheckCircle sx={{ color: theme.primary, fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: theme.primary, fontWeight: 600 }}>
              {item.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );

  // --- ResultsDisplay (UPDATED) ---
  const ResultsDisplay = ({ onFixIssuesClick }: { onFixIssuesClick: () => void }) => {
    console.log("2. ResultsDisplay received onFixIssuesClick prop:", typeof onFixIssuesClick);
    const { critical, important, minor } = categorizeIssues(complianceData);
    const totalIssues = critical.length + important.length;

    const ProgressIndicator = () => (
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Use theme primary color */}
            <Avatar sx={{ bgcolor: theme.primary, color: 'white', width: 32, height: 32 }}>✓</Avatar>
            <Typography fontWeight={500} color={theme.primary}>Upload</Typography>
          </Box>
          <ArrowForward fontSize="small" sx={{ color: '#9ca3af' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Use theme primary color */}
            <Avatar sx={{ bgcolor: theme.primary, color: 'white', width: 32, height: 32 }}>2</Avatar>
            <Typography fontWeight={500} color={theme.primary}>Review</Typography>
          </Box>
          <ArrowForward fontSize="small" sx={{ color: '#d1d5db' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Avatar sx={{ bgcolor: '#d1d5db', color: '#6b7280', width: 32, height: 32 }}>3</Avatar>
            <Typography color="#6b7280">Fix</Typography>
          </Box>
        </Box>
        <Typography variant="h4" fontWeight={700} color={theme.textPrimary}>Compliance Check Results</Typography>
      </Box>
    );
  
    // This component is semantic (red/green) and should stay that way for UX
    const StatusAlert = () => (
      <Box sx={{ borderRadius: '0.75rem', p: 3, mb: 4, bgcolor: totalIssues > 0 ? '#fef2f2' : '#f0fdf4', border: '1px solid', borderColor: totalIssues > 0 ? '#fecaca' : '#bbf7d0' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar sx={{ bgcolor: totalIssues > 0 ? '#fee2e2' : '#dcfce7', color: totalIssues > 0 ? '#dc2626' : '#16a34a', width: 48, height: 48 }}>
            {totalIssues > 0 ? <ErrorIcon /> : <CheckCircle />}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600} color={totalIssues > 0 ? "#991b1b" : "#14532d"} gutterBottom>
              {totalIssues > 0 ? `${totalIssues} issue${totalIssues !== 1 ? 's' : ''} found` : "All checks passed!"}
            </Typography>
            <Typography color={totalIssues > 0 ? "#b91c1c" : "#166534"} sx={{ mb: 2 }}>
              {totalIssues > 0 ? "Your image needs fixes before it can be submitted to Amazon." : "Your image appears to meet Amazon's main requirements."}
            </Typography>
            {totalIssues > 0 && 
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, fontSize: '0.875rem' }}>
                <Chip icon={<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444' }} />} label={`${critical.length} Critical`} variant="outlined" size="small" />
                <Chip icon={<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f97316' }} />} label={`${important.length} Warnings`} variant="outlined" size="small" />
                <Chip icon={<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10b981' }} />} label={`${minor.length} Passing`} variant="outlined" size="small" />
              </Box>
            }
          </Box>
        </Box>
      </Box>
    );

    // Apply neomorphic style to the card
    const VisualizationCard = () => (
      <Card 
        elevation={0} 
        sx={{ 
          borderRadius: '30px', 
          mb: 3, 
          bgcolor: theme.bgColor, 
          boxShadow: theme.shadowOuter,
          border: 'none'
        }}
      >
        <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.darkShadow}`, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Info sx={{ color: theme.primary }} />
          <Typography fontWeight={600} color={theme.textPrimary}>Background Issues Detected</Typography>
        </Box>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 2, width: '100%', maxWidth: '320px', aspectRatio: '1 / 1' }}>
            {originalImageUrl && (
              <Box
                component="img"
                src={(showViolations ? processedOverlayUrl : originalImageUrl) || ''}
                alt="Product Visualization"
                sx={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '0.5rem', 
                  border: `1px solid ${theme.darkShadow}`, // Use theme shadow
                  objectFit: 'contain' 
                }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Neomorphic button */}
            <Button 
              onClick={() => setShowViolations(!showViolations)}
              disabled={!originalImageUrl}
              sx={{
                bgcolor: theme.bgColor, 
                color: theme.textSecondary,
                boxShadow: theme.shadowOuterSm,
                textTransform: 'none',
                borderRadius: '50px',
                '&:hover': { 
                  bgcolor: theme.bgColor, 
                  boxShadow: theme.shadowOuterXs 
                }
              }}
            >
              {showViolations ? 'Hide Issues' : 'Show Issues'}
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }}/>
              <Typography variant="body2" color="#4b5563">{complianceData?.nonWhitePixels?.toLocaleString() || 0} background pixels need fixing</Typography>
            </Box>
          </Box>
          {showViolations && complianceData?.nonWhitePixels && complianceData.nonWhitePixels > 0 &&
            <Typography variant="body2" color="#dc2626" fontWeight={500} sx={{ mt: 1 }}>
              Red pixels show exact locations of non-white background violations
            </Typography>
          }
        </Box>
      </Card>
    );
    
    // Container is neomorphic, but content (issues) remains semantic (red/green)
    const IssueSection = ({ title, issues, type }: { title: string; issues: Issue[]; type: 'critical' | 'warning' | 'passing' }) => {
      if (issues.length === 0) return null;
      
      const isOpen = expandedSections[type];
      const colors = {
        critical: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', iconColor: '#dc2626' },
        warning: { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', iconColor: '#ea580c' },
        passing: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', iconColor: '#16a34a' }
      };
      
      const SectionIcon = type === 'critical' ? Warning : type === 'warning' ? Warning : CheckCircle;
      const handleToggle = () => setExpandedSections(prev => ({...prev, [type]: !prev[type]}));
      
      return (
        <Box sx={{ mb: 2 }}>
          {/* Neomorphic button for the section header */}
          <Button fullWidth onClick={handleToggle} sx={{
            display: 'flex', justifyContent: 'space-between', p: 1.5, textTransform: 'none',
            bgcolor: theme.bgColor,
            border: 'none',
            borderRadius: '30px',
            boxShadow: theme.shadowOuterSm,
            '&:hover': { 
              bgcolor: theme.bgColor, 
              boxShadow: theme.shadowOuterXs 
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {/* Semantic icon color is preserved for UX */}
              <SectionIcon sx={{ color: colors[type].iconColor }} />
              <Typography sx={{ fontWeight: 600, fontSize: '1.125rem', color: colors[type].text }}>
                {title}
              </Typography>
            </Box>
            <SectionIcon sx={{ color: colors[type].iconColor }} />
          </Button>
          <Collapse in={isOpen}>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {/* Issue items remain semantic */}
              {issues.map((issue, idx) => {
                const IssueIcon = issue.status === 'fail' ? ErrorIcon : 
                                issue.status === 'warn' ? Warning : 
                                CheckCircle;            
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

    // --- AutoFixCTA (UPDATED) ---
    const AutoFixCTA = ({ onClick }: { onClick: () => void }) => {
      console.log("3. AutoFixCTA received onClick prop:", typeof onClick);

      // 👇 --- Use the hook's helpers ---
      const fixesAvailable = getRemainingCredits('fix');
      // Get total from subscription, default to 0 if subscription is null
      // const fixesTotal = subscription?.credits.fixes.totalAvailable || subscription?.credits.fixes.remaining || 0;
      const planName = subscription?.tier || 'Free';

      return (
        <Box sx={{ 
          bgcolor: theme.bgColor, 
          border: 'none', 
          borderRadius: '30px', 
          p: 3, 
          mb: 3,
          boxShadow: theme.shadowOuter
        }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight={600} color={theme.textPrimary} gutterBottom>Auto-Fix Available</Typography>
              <Typography color={theme.textSecondary} variant="body2" sx={{ mb: 0.5 }}>We can automatically fix {critical.length} critical issue{critical.length !== 1 && 's'} for you in seconds.</Typography>
              
              {/* 👇 --- Use real credit data from hook --- */}
              <Typography color={theme.primary} variant="caption">
                {fixesAvailable} {planName === 'Free' ? 'lifetime' : ''} fixes remaining.
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              startIcon={<AutoFixHigh />} 
              onClick={onClick}
              // 👇 --- Disable button if no fixes are left ---
              disabled={fixesAvailable <= 0 || !hasCreditsFor('fix')}
              sx={{
                  bgcolor: theme.primary, 
                  color: 'white', 
                  py: 1.5, 
                  px: 3, 
                  fontWeight: 600,
                  borderRadius: '50px',
                  boxShadow: theme.shadowOuterSm,
                  '&:hover': { 
                    bgcolor: theme.primaryDark, 
                    boxShadow: theme.shadowOuterXs 
                  },
                  '&:disabled': {
                    bgcolor: 'grey.400'
                  }
              }}>
              {fixesAvailable <= 0 ? 'No Fixes Remaining' : 'Fix All Critical Issues'}
            </Button>
          </Box>
        </Box>
      );
    };
    
    return (
      <Box>
        <ProgressIndicator />
        <StatusAlert />
        <VisualizationCard />
        {critical.length > 0 && <AutoFixCTA onClick={onFixIssuesClick}/>}
        <IssueSection title={`Critical Issues (${critical.length})`} issues={critical} type="critical" />
        <IssueSection title={`Warnings (${important.length})`} issues={important} type="warning" />
        <IssueSection title={`Passing Requirements (${minor.length})`} issues={minor} type="passing" />
      </Box>
    );

  };

  // This component is semantic (error) and should stay that way for UX
  const ErrorState = () => (
    <Box sx={{ textAlign: 'center', p: 4, bgcolor: theme.bgColor, borderRadius: '30px', boxShadow: theme.shadowOuter }}>
      <Avatar sx={{ bgcolor: '#fee2e2', color: '#dc2626', width: 64, height: 64, mx: 'auto', mb: 2 }}>
        <ErrorIcon sx={{ fontSize: 32 }} />
      </Avatar>
      <Typography variant="h6" fontWeight={600} color="#991b1b" gutterBottom>
        Analysis Failed
      </Typography>
      <Typography color="#b91c1c" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
        {errorMessage}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <Button 
          variant="contained" 
          onClick={handleResetAll}
          sx={{ 
            bgcolor: '#dc2626', 
            '&:hover': { bgcolor: '#b91c1c' },
            borderRadius: '50px',
            boxShadow: theme.shadowOuterSm
          }}
        >
          Try Again
        </Button>
        <Typography variant="caption" color="#6b7280" sx={{ maxWidth: 300 }}>
          Tip: Try using a smaller image (under 2MB) or a simpler product photo for faster processing.
        </Typography>
      </Box>
    </Box>
  );

  // --- MainContentArea (UPDATED WITH KEY) ---
  const MainContentArea = () => {
    switch (checkerState) {
      case 'processing':
        return <ProcessingState />;
      case 'error':
        return <ErrorState />;
      case 'results':
        return <ResultsDisplay onFixIssuesClick={handleNavigateToFixer} />;
      case 'fixing':
        if (originalImageUrl && complianceData) {
          console.log("Data being sent to fixer:", complianceData);
          return (
            <ComplianceFixer
              key="fixer-component" // ADD THIS KEY - prevents remounting
              originalImageUrl={originalImageUrl}
              complianceData={complianceData}
              onBack={handleBackToResults}
              violationOverlayUrl={processedOverlayUrl}
              cutoutImageUrl={complianceData.cutoutUrl}
              onFixSuccess={refetchCredits} 
            />
          );
        }
        return <ErrorState />; 

      case 'upload':
      default:
        if (isLoadingCredits) {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', gap: 2 }}>
              <CircularProgress sx={{ color: theme.primary }} />
              <Typography sx={{ color: theme.textPrimary, fontWeight: 500 }}>
                Loading ComplianceKit...
              </Typography>
            </Box>
          );
        }
        
        if (creditError) {
          return (
             <Box sx={{ textAlign: 'center', p: 4, bgcolor: theme.bgColor, borderRadius: '30px', boxShadow: theme.shadowOuter }}>
               <Avatar sx={{ bgcolor: '#fee2e2', color: '#dc2626', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                 <ErrorIcon sx={{ fontSize: 32 }} />
               </Avatar>
               <Typography variant="h6" fontWeight={600} color="#991b1b" gutterBottom>
                 Failed to load user data
               </Typography>
               <Typography color="#b91c1b" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                {creditError}
               </Typography>
               <Button 
                variant="contained" 
                onClick={refetchCredits}
                sx={{ 
                  bgcolor: theme.primary, 
                  '&:hover': { bgcolor: theme.primaryDark },
                  borderRadius: '50px',
                  boxShadow: theme.shadowOuterSm
                }}
              >
                 Try Again
               </Button>
             </Box>
          );
        }
        
        return <UploadArea />;
    }
  };

  // --- Main Render Logic ---

  return (
    <Box sx={{ 
      background: theme.bgColor, // Use theme background
      minHeight: '100vh',
      position: 'relative',
    }}>
    <Header />
    <Container maxWidth="lg" component="main" sx={{ py: 6, position: 'relative' }}>
      {/* Wrap content in a Box to center it and apply neomorphic style if it's not the upload page */}
      {checkerState === 'upload' ? (
         <MainContentArea />
      ) : (
        <Paper 
          elevation={0}
          sx={{
            p: { xs: 2, sm: 4 },
            bgcolor: theme.bgColor,
            borderRadius: '30px',
            boxShadow: theme.shadowOuter
          }}
        >
          <MainContentArea />
        </Paper>
      )}
    </Container>
    
    {checkerState !== 'upload' && (
      <Fab 
        variant="extended" 
        sx={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24, 
          bgcolor: theme.primary, // Use theme color
          color: 'white', 
          '&:hover': { bgcolor: theme.primaryDark },
          boxShadow: theme.shadowOuterSm, // Add shadow
          borderRadius: '50px'
        }} 
        onClick={handleResetAll}
      >
        <PhotoCamera sx={{ mr: 1 }} />
        Check Another
      </Fab>
    )}
    
    {/* Add the feedback modal */}

    </Box>
  );
};

export default ModernizedComplianceChecker;