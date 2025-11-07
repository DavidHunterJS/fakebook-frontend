import React from 'react';
import {
    Box, Paper, Typography, Chip, Button,
    CircularProgress, Grid
} from '@mui/material';
import {
    AutoFixHigh, CheckCircle, RadioButtonUnchecked, Download
} from '@mui/icons-material';
import { ComplianceResult } from '../types/compliance';

// Props for the main component
interface FixerPanelProps {
    checkerState: string;
    fixerState: 'ready' | 'fixing' | 'complete';
    fixingStep: number;
    complianceData: ComplianceResult | null;
    onStartFix: () => void;
    onResetAll: () => void;
}

// Props for the internal ImageFixer logic
// FIX: Changed 'interface' to 'type' to resolve the error
type ImageFixerProps = Omit<FixerPanelProps, 'checkerState'>;

// Button styles can be passed in or defined here
const primaryBtnSx = { background: '#667eea', color: 'white', borderRadius: '8px', py: 1.2, px: 3, textTransform: 'none', '&:hover': { background: '#5a67d8' } };
const outlineBtnSx = { color: '#667eea', borderColor: '#667eea', borderRadius: '8px', py: 1.2, px: 3, textTransform: 'none', '&:hover': { background: '#f7fafc' } };

// This internal component contains the logic for the different fixer states
const ImageFixer: React.FC<ImageFixerProps> = ({ fixerState, fixingStep, complianceData, onStartFix, onResetAll }) => {
    if (fixerState === 'ready') {
        return (
            <Box sx={{ textAlign: 'center', p: 4 }}>
                <AutoFixHigh sx={{ width: 48, height: 48, mx: 'auto', mb: 2, color: '#667eea' }} />
                <Typography variant="h6" color="text.primary" mb={2}>Ready to Fix Your Image</Typography>
                <Typography color="text.secondary" mb={3} fontSize={14}>
                    Our AI will automatically remove the non-compliant background and replace it with pure white (RGB 255,255,255).
                </Typography>
                <Button variant="contained" size="large" onClick={onStartFix} sx={primaryBtnSx} startIcon={<AutoFixHigh />} disabled={complianceData?.isCompliant}>
                    {complianceData?.isCompliant ? 'No Fix Needed' : 'Fix Image - $0.99'}
                </Button>
            </Box>
        );
    }

    if (fixerState === 'fixing') {
        const fixSteps = ["Isolating product", "Removing non-compliant pixels", "Applying pure white background", "Optimizing image"];
        return (
            <Box sx={{ textAlign: 'center', p: 4 }}>
                <CircularProgress size={40} sx={{ mb: 2, color: '#667eea' }} />
                <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>Fixing your image...</Typography>
                <Box sx={{ maxWidth: 280, mx: 'auto', textAlign: 'left' }}>
                    {fixSteps.map((label, index) => {
                        const stepNumber = index + 1;
                        let status: 'completed' | 'active' | 'pending' = 'pending';
                        if (fixingStep > stepNumber) status = 'completed';
                        if (fixingStep === stepNumber) status = 'active';
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
    }

    // fixerState === 'complete'
    return (
        <Box sx={{ textAlign: 'center', p: 4 }}>
            <CheckCircle sx={{ width: 48, height: 48, mx: 'auto', mb: 2, color: 'success.main' }} />
            <Typography variant="h6" color="text.primary" mb={2}>Image Fixed Successfully!</Typography>
            <Typography color="text.secondary" mb={3} fontSize={14}>
                Your image now meets Amazon&apos;s compliance requirements.
            </Typography>
            <Grid container spacing={2} mb={3}>
                <Grid size={{xs:6}}>
                    <Box textAlign="center">
                        <Box sx={{ background: 'linear-gradient(45deg, #fff 25%, #ffebeb 25%, #ffebeb 50%, #fff 50%, #fff 75%, #ffebeb 75%)', backgroundSize: '20px 20px', height: 120, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'error.main' }}>Before</Box>
                    </Box>
                </Grid>
                <Grid size={{xs:6}}>
                    <Box textAlign="center">
                        <Box sx={{ bgcolor: '#ffffff', height: 120, borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'success.main', fontWeight: 'bold' }}>Fixed (RGB 255,255,255)</Box>
                    </Box>
                </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'center' }}>
                <Button variant="contained" size="large" sx={primaryBtnSx} startIcon={<Download />}>Download Fixed Image</Button>
                <Button variant="outlined" size="large" onClick={onResetAll} sx={outlineBtnSx}>Fix Another Image</Button>
            </Box>
        </Box>
    );
};

export const FixerPanel: React.FC<FixerPanelProps> = ({ checkerState, ...props }) => {
    return (
        <Paper elevation={2} sx={{ borderRadius: '16px', p: 4, height: 'fit-content' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <AutoFixHigh sx={{ color: 'success.main' }} />
                <Typography variant="h5" fontWeight="bold" color="text.primary">Image Fixer</Typography>
                {checkerState !== 'results' && (
                    <Chip label="Waiting for check" size="small" sx={{ bgcolor: '#fed7d7', color: '#742a2a' }} />
                )}
            </Box>
            
            {checkerState !== 'results' ? (
                <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
                    <AutoFixHigh sx={{ width: 48, height: 48, mx: 'auto', mb: 2 }} />
                    <Typography>Upload an image first to see fixing options</Typography>
                </Box>
            ) : (
                <ImageFixer {...props} />
            )}
        </Paper>
    );
};