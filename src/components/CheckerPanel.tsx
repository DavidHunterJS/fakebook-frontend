import React from 'react';
import {
    Box, Paper, Typography, Button, CircularProgress,
    Alert, Grid
} from '@mui/material';
import { 
    CloudUpload, WarningAmber, CheckCircle, RadioButtonUnchecked, 
    Visibility, Error as ErrorIcon, Code as CodeIcon 
} from '@mui/icons-material';
import { ComplianceResult } from '../types/compliance';

interface CheckerPanelProps {
    checkerState: 'upload' | 'processing' | 'results' | 'error';
    processingStep: number;
    errorMessage: string;
    complianceData: ComplianceResult | null;
    originalImageUrl: string | null;
    uploadedFile: File | null;
    isDragging: boolean;
    fileInputRef: React.RefObject<HTMLInputElement  | null>;
    onSimulateUpload: () => void;
    onDragEvents: (e: React.DragEvent<HTMLDivElement>, isOver: boolean) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onResetAll: () => void;
    onViewDetails: () => void;
}

const DetailItem = ({ label, value, isError = false }: { label: string, value: string | number, isError?: boolean }) => (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f7fafc', height: '100%' }}>
        <Typography fontSize={12} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={0.5}>
            {label}
        </Typography>
        <Typography fontSize={18} fontWeight={600} color={isError ? 'error.main' : 'text.primary'}>
            {value}
        </Typography>
    </Paper>
);

const UploadArea: React.FC<Partial<CheckerPanelProps>> = ({ onSimulateUpload, fileInputRef, onFileInputChange, onDragEvents, onDrop, isDragging, uploadedFile }) => (
    <Box>
        <input type="file" ref={fileInputRef} onChange={onFileInputChange} accept="image/*" style={{ display: 'none' }} />
        <Box 
            onClick={onSimulateUpload} 
            onDragOver={(e) => onDragEvents?.(e, true)} 
            onDragLeave={(e) => onDragEvents?.(e, false)} 
            onDrop={onDrop} 
            sx={{ 
                border: 3, 
                borderColor: isDragging ? 'primary.main' : 'divider', 
                borderStyle: 'dashed', 
                borderRadius: 2, 
                p: { xs: 4, sm: 6 }, 
                textAlign: 'center', 
                bgcolor: isDragging ? 'action.hover' : 'background.default', 
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main' }
            }}
        >
            <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6">Drop your product image here</Typography>
            <Typography color="text.secondary" variant="body2">or click to browse • PNG, JPG up to 10MB</Typography>
        </Box>
        {uploadedFile && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2">Selected: {uploadedFile.name}</Typography>
            </Box>
        )}
    </Box>
);

const ProcessingState: React.FC<{ processingStep: number }> = ({ processingStep }) => {
    const steps = [
        "Uploading to secure storage",
        "Analyzing image with AI",
        "Checking Amazon requirements",
        "Finalizing analysis",
        "Generating compliance report"
    ];
    return (
        <Box sx={{ textAlign: 'center', p: 4 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>Analyzing your image...</Typography>
            <Box sx={{ maxWidth: 300, mx: 'auto', textAlign: 'left' }}>
                {steps.map((label, index) => {
                    const stepNumber = index + 1;
                    let status: 'completed' | 'active' | 'pending' = 'pending';
                    if (processingStep > stepNumber) status = 'completed';
                    if (processingStep === stepNumber) status = 'active';
                    return (
                        <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.8, color: status === 'completed' ? 'success.main' : status === 'active' ? 'primary.main' : 'text.secondary', fontWeight: status === 'active' ? 500 : 400, fontSize: 14 }}>
                            {status === 'completed' ? <CheckCircle fontSize="small"/> : status === 'active' ? <CircularProgress size={16} color="inherit"/> : <RadioButtonUnchecked fontSize="small"/>}
                            {label}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

const ErrorState: React.FC<{ errorMessage: string, onResetAll: () => void }> = ({ errorMessage, onResetAll }) => (
    <Box sx={{ textAlign: 'center', p: 4 }}>
        <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
        <Typography variant="h6" color="error">Analysis Failed</Typography>
        <Alert severity="error" sx={{ my: 2, textAlign: 'left' }}>{errorMessage}</Alert>
        <Button variant="contained" onClick={onResetAll}>Try Again</Button>
    </Box>
);

const ResultsDisplay: React.FC<{ complianceData: ComplianceResult, originalImageUrl: string | null, onViewDetails: () => void }> = ({ complianceData, originalImageUrl, onViewDetails }) => {
    const isCompliant = complianceData.isCompliant;
    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, mb: 2, bgcolor: isCompliant ? '#c6f6d5' : '#fed7d7', color: isCompliant ? '#22543d' : '#742a2a' }}>
                {isCompliant ? <CheckCircle /> : <WarningAmber />}
                <Box>
                    <Typography fontWeight="bold">{isCompliant ? 'Image is Compliant!' : 'Compliance Issues Detected'}</Typography>
                    <Typography fontSize={14} mt={0.5}>{isCompliant ? 'Your image meets Amazon requirements.' : 'Your image needs fixing.'}</Typography>
                </Box>
            </Box>
            <Typography variant="h4" fontWeight="bold" textAlign="center" my={2} color={isCompliant ? "success.main" : "error.main"}>
                Compliance Score: {complianceData.complianceScore}%
            </Typography>
            <Grid container spacing={2} my={2}>
                <Grid size={{xs:6}}><DetailItem label="Background Pixels" value={complianceData.backgroundPixels.toLocaleString()} /></Grid>
                <Grid size={{xs:6}}><DetailItem label="Non-White Pixels" value={complianceData.nonWhitePixels.toLocaleString()} isError={complianceData.nonWhitePixels > 0} /></Grid>
                <Grid size={{xs:6}}><DetailItem label="Product Coverage" value={`${complianceData.productCoverage}%`} /></Grid>
                <Grid size={{xs:6}}><DetailItem label="Edge Compliance" value={`${complianceData.edgeCompliance}%`} isError={complianceData.edgeCompliance < 90} /></Grid>
            </Grid>
            {complianceData.issues.length > 0 && (
                <Box sx={{ my: 2 }}>
                    <Typography variant="h6" color="error.main" mb={1}>Issues Found:</Typography>
                    {complianceData.issues.map((issue, index) => (<Alert key={index} severity="warning" icon={<WarningAmber />} sx={{ mb: 1 }}>{issue}</Alert>))}
                </Box>
            )}
            <Grid container spacing={2} my={3}>
                <Grid size={{xs:6}}>
                    <Box textAlign="center">
                        {originalImageUrl && <Box component="img" src={originalImageUrl} alt="Original Upload" sx={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }} />}
                        <Typography mt={1} variant="caption" color="text.secondary">Your Upload</Typography>
                    </Box>
                </Grid>
                <Grid size={{xs:6}}>
                    <Box textAlign="center">
                        {complianceData.segmentationUrl ? <Box component="img" src={complianceData.segmentationUrl} alt="AI Segmentation" sx={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 2 }} /> : <Box sx={{ height: 160, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'divider' }}><Typography color="text.secondary">No Mask</Typography></Box>}
                        <Typography mt={1} variant="caption" color="text.secondary">AI Analysis</Typography>
                    </Box>
                </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                 <Button variant="outlined" startIcon={<CodeIcon />} onClick={onViewDetails}>View Technical Details</Button>
            </Box>
        </Box>
    );
};

export const CheckerPanel: React.FC<CheckerPanelProps> = (props) => {
    const { checkerState, processingStep, errorMessage, complianceData, originalImageUrl, onViewDetails, onResetAll } = props;
    return (
        <Paper elevation={2} sx={{ borderRadius: '16px', p: { xs: 2, sm: 4 }, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Visibility sx={{ color: '#667eea' }} />
                <Typography variant="h5" fontWeight="bold" color="text.primary">Compliance Checker</Typography>
            </Box>
            {checkerState === 'upload' && <UploadArea {...props} />}
            {checkerState === 'processing' && <ProcessingState processingStep={processingStep} />}
            {checkerState === 'results' && complianceData && originalImageUrl && <ResultsDisplay complianceData={complianceData} originalImageUrl={originalImageUrl} onViewDetails={onViewDetails} />}
            {checkerState === 'error' && <ErrorState errorMessage={errorMessage} onResetAll={onResetAll} />}
        </Paper>
    );
};