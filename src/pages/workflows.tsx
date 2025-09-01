import { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import Head from 'next/head';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Alert,
  Chip,
  CircularProgress,
  Backdrop,
  styled
} from '@mui/material';
import {
  CloudUpload,
  Download,
  Refresh,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';

// Types
interface WorkflowState {
  step: number; // 0=upload, 1=detection, 2=background, 3=enhance, 4=export, 5=complete
  progress: number; // 0-100
  uploadedFile: File | null;
  uploadedFileUrl: string | null;
  processedImages: {
    white?: string;
    transparent?: string;
    gradient?: string;
    lifestyle?: string;
    branded?: string;
  };
  platformExports: {
    [key: string]: string; // platform_background: url
  };
  isProcessing: boolean;
  error: string | null;
  creditsUsed: number;
  jobId: string | null;
}

interface User {
  id: string;
  creditsRemaining: number;
  plan: 'starter' | 'growth' | 'pro';
}

// Styled components
const UploadZone = styled(Paper)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  padding: theme.spacing(6),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.dark,
    backgroundColor: theme.palette.action.hover
  }
}));

const HiddenInput = styled('input')({
  display: 'none'
});

const STEP_LABELS = [
  'Upload Product Photo',
  'Detecting Product',
  'Removing Background', 
  'Enhancing Image',
  'Creating Exports',
  'Complete!'
];

const STEP_DESCRIPTIONS = [
  'Drop your product image or click to browse',
  'AI is analyzing your product and identifying key features',
  'Carefully removing background while preserving product details',
  'Generating 5 professional background variations',
  'Creating optimized versions for different platforms',
  'Your professional product photos are ready!'
];

const WORKFLOW_COST = 3; // credits

export default function ProductEnhancementWorkflow() {
  
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowState>({
    step: 0,
    progress: 0,
    uploadedFile: null,
    uploadedFileUrl: null,
    processedImages: {},
    platformExports: {},
    isProcessing: false,
    error: null,
    creditsUsed: 0,
    jobId: null
  });

  // Initialize socket connection
  useEffect(() => {
    // Get user data first
    fetchUserData();

    // Initialize socket
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
    
    // Listen for workflow progress updates
    socketRef.current.on('workflow-progress', (data) => {
      setWorkflow(prev => ({
        ...prev,
        step: data.step,
        progress: data.progress,
        error: data.error || null
      }));
    });

    // Listen for workflow completion
    socketRef.current.on('workflow-complete', (data) => {
      setWorkflow(prev => ({
        ...prev,
        step: 5,
        progress: 100,
        processedImages: data.processedImages,
        platformExports: data.platformExports,
        isProcessing: false,
        creditsUsed: WORKFLOW_COST
      }));
    });

    // Listen for workflow errors
    socketRef.current.on('workflow-error', (data) => {
      setWorkflow(prev => ({
        ...prev,
        isProcessing: false,
        error: data.message,
        step: 0,
        progress: 0
      }));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user/profile', {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const validateFile = (file: File): string | null => {
    // File size validation (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB';
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a JPEG, PNG, or WebP image';
    }

    return null;
  };

  const handleFileUpload = (file: File) => {
    const validation = validateFile(file);
    if (validation) {
      setWorkflow(prev => ({ ...prev, error: validation }));
      return;
    }

    // Check credits
    if (!user || user.creditsRemaining < WORKFLOW_COST) {
      setWorkflow(prev => ({ ...prev, error: 'Insufficient credits. Please upgrade your plan.' }));
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    setWorkflow(prev => ({
      ...prev,
      uploadedFile: file,
      uploadedFileUrl: previewUrl,
      error: null,
      step: 0
    }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const startWorkflow = async () => {
    if (!workflow.uploadedFile || !user) return;

    setWorkflow(prev => ({ 
      ...prev, 
      isProcessing: true,
      step: 1,
      progress: 0,
      error: null 
    }));

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('image', workflow.uploadedFile);
      formData.append('userId', user.id);
      formData.append('workflowType', 'product_enhancement');

      // Start the workflow
      const response = await fetch('/api/workflow/start', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to start workflow');
      }

      const { jobId } = await response.json();
      
      setWorkflow(prev => ({ ...prev, jobId }));
      
      // Join the socket room for this job
      if (socketRef.current) {
        socketRef.current.emit('join-workflow', { jobId, userId: user.id });
      }

    } catch (error) {
      setWorkflow(prev => ({
        ...prev,
        isProcessing: false,
        error: 'Failed to start processing. Please try again.'+error,
        step: 0,
        progress: 0
      }));
    }
  };

  const downloadResults = async (format: 'zip' | 'individual' = 'zip') => {
    if (!workflow.jobId) return;

    try {
      const response = await fetch(`/api/workflow/download/${workflow.jobId}?format=${format}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      if (format === 'zip') {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `product-photos-${workflow.jobId}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const resetWorkflow = () => {
    if (workflow.uploadedFileUrl) {
      URL.revokeObjectURL(workflow.uploadedFileUrl);
    }
    
    setWorkflow({
      step: 0,
      progress: 0,
      uploadedFile: null,
      uploadedFileUrl: null,
      processedImages: {},
      platformExports: {},
      isProcessing: false,
      error: null,
      creditsUsed: 0,
      jobId: null
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Head>
        <title>Product Photo Enhancement - Trippy.lol</title>
        <meta name="description" content="Transform your product photos into 5 marketplace-ready variations in under 2 minutes" />
      </Head>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
            Product Photo Enhancement
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Transform raw product photos into 5 marketplace-ready variations in under 2 minutes
          </Typography>
          
          {/* Credits Display */}
          {user && (
            <Box mt={2}>
              <Chip
                label={`Credits Remaining: ${user.creditsRemaining} (This workflow costs ${WORKFLOW_COST} credits)`}
                color="primary"
                variant="outlined"
              />
            </Box>
          )}
        </Box>

        {/* Progress Stepper */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={workflow.step} alternativeLabel>
            {STEP_LABELS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Box textAlign="center" mt={3}>
            <Typography variant="h6" gutterBottom>
              {STEP_LABELS[workflow.step]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {STEP_DESCRIPTIONS[workflow.step]}
            </Typography>
            
            {workflow.isProcessing && (
              <Box mt={2}>
                <LinearProgress 
                  variant="determinate" 
                  value={workflow.progress}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {workflow.progress}% complete
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Main Content */}
        <Paper sx={{ p: 4 }}>
          
          {/* Error Display */}
          {workflow.error && (
            <Alert 
              severity="error" 
              icon={<ErrorIcon />}
              sx={{ mb: 3 }}
            >
              {workflow.error}
            </Alert>
          )}

          {/* Upload Section */}
          {workflow.step === 0 && (
            <Box>
              {!workflow.uploadedFile ? (
                <UploadZone
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  elevation={0}
                >
                  <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    Drop your product image here
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    or click to browse your files
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supports JPEG, PNG, WebP • Max 10MB • Min 400x400px
                  </Typography>
                  
                  <HiddenInput
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileInput}
                  />
                </UploadZone>
              ) : (
                <Box textAlign="center">
                  <Box mb={3}>
                    <img
                      src={workflow.uploadedFileUrl!}
                      alt="Uploaded product"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  </Box>
                  
                  <Box display="flex" justifyContent="center" gap={2}>
                    <Button
                      onClick={startWorkflow}
                      disabled={workflow.isProcessing || !user || user.creditsRemaining < WORKFLOW_COST}
                      variant="contained"
                      size="large"
                      startIcon={workflow.isProcessing ? <CircularProgress size={20} /> : <CheckCircle />}
                    >
                      {workflow.isProcessing ? 'Processing...' : `Start Enhancement (${WORKFLOW_COST} credits)`}
                    </Button>
                    
                    <Button
                      onClick={resetWorkflow}
                      disabled={workflow.isProcessing}
                      variant="outlined"
                      size="large"
                      startIcon={<Refresh />}
                    >
                      Choose Different Image
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Processing Display */}
          {workflow.isProcessing && workflow.step > 0 && workflow.step < 5 && (
            <Box textAlign="center" py={6}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h5" gutterBottom>
                {STEP_LABELS[workflow.step]}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {STEP_DESCRIPTIONS[workflow.step]}
              </Typography>
            </Box>
          )}

          {/* Results Display */}
          {workflow.step === 5 && (
            <Box>
              <Box textAlign="center" mb={4}>
                <Typography variant="h4" gutterBottom>
                  Your Professional Product Photos Are Ready!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  5 background variations × 6 platform formats = 30 optimized images
                </Typography>
              </Box>

              {/* Background Variations Preview */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {Object.entries(workflow.processedImages).map(([type, url]) => (
                  <Grid size={{xs:12,sm:6,md:4,lg:2.4}} key={type}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="140"
                        image={url}
                        alt={`${type} background`}
                        sx={{ objectFit: 'contain', bgcolor: 'grey.100' }}
                      />
                      <CardContent sx={{ textAlign: 'center', py: 1 }}>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {type}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Download Options */}
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light' }}>
                <Typography variant="h6" gutterBottom>
                  Download Your Photos
                </Typography>
                <Box display="flex" justifyContent="center" gap={2} mb={2}>
                  <Button
                    onClick={() => downloadResults('zip')}
                    variant="contained"
                    size="large"
                    startIcon={<Download />}
                  >
                    Download All (ZIP)
                  </Button>
                  <Button
                    onClick={resetWorkflow}
                    variant="outlined"
                    size="large"
                    startIcon={<Refresh />}
                  >
                    Process Another Image
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Credits used: {workflow.creditsUsed} • 
                  Remaining: {user ? user.creditsRemaining - workflow.creditsUsed : 0}
                </Typography>
              </Paper>
            </Box>
          )}
        </Paper>
      </Container>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={workflow.isProcessing}
      >
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6">
            {STEP_LABELS[workflow.step]}
          </Typography>
        </Box>
      </Backdrop>
    </>
  );
}