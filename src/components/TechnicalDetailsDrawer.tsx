// import React from 'react';
// import {
//     Box, Paper, Typography, Button, Drawer, List, ListItem,
//     ListItemText, Divider, Collapse, IconButton, Alert
// } from '@mui/material';
// import {
//     CheckCircle, WarningAmber, Code as CodeIcon,
//     ContentCopy as CopyIcon, ExpandMore, ExpandLess, Close as CloseIcon
// } from '@mui/icons-material';
// import { ComplianceResult } from '../types/compliance';

// interface TechnicalDetailsDrawerProps {
//     open: boolean;
//     onClose: () => void;
//     data: ComplianceResult | null;
// }

// export const TechnicalDetailsDrawer: React.FC<TechnicalDetailsDrawerProps> = ({ open, onClose, data }) => {
//     const [copiedSection, setCopiedSection] = React.useState<string | null>(null);
//     const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
//         background: true,
//         dimensions: false,
//         quality: false,
//         productFill: false
//     });

//     if (!data) return null;

//     const toggleSection = (section: string) => {
//         setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
//     };

//     const copyToClipboard = async (text: string, section: string) => {
//         try {
//             await navigator.clipboard.writeText(text);
//             setCopiedSection(section);
//             setTimeout(() => setCopiedSection(null), 2000);
//         } catch (err) {
//             console.error('Failed to copy:', err);
//         }
//     };

//     const formatDataForCopy = (sectionData: any, sectionName: string) => `${sectionName}:\n${JSON.stringify(sectionData, null, 2)}`;
    
//     const formatAllDataForCopy = () => {
//         const cleanData = {
//             complianceScore: data.complianceScore,
//             backgroundAnalysis: {
//                 backgroundPixels: data.backgroundPixels,
//                 nonWhitePixels: data.nonWhitePixels,
//                 compliancePercentage: data.backgroundPixels > 0 ? ((data.backgroundPixels - data.nonWhitePixels) / data.backgroundPixels * 100).toFixed(2) : 0
//             },
//             dimensions: data.dimensions,
//             quality: data.quality,
//             productFill: data.productFill,
//             isCompliant: data.isCompliant,
//             issuesFound: data.issues?.length || 0
//         };
//         return JSON.stringify(cleanData, null, 2);
//     };

//     const getStatusIcon = (isCompliant: boolean) => isCompliant ? <CheckCircle color="success" fontSize="small" /> : <WarningAmber color="warning" fontSize="small" />;

//     return (
//         <Drawer anchor="right" open={open} onClose={onClose} sx={{ '& .MuiDrawer-paper': { width: 400, maxWidth: '90vw' } }}>
//             <Box sx={{ p: 2 }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <CodeIcon />
//                         <Typography variant="h6">Technical Details</Typography>
//                     </Box>
//                     <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
//                 </Box>
//                 <Alert severity="info" sx={{ mb: 2 }}>Detailed compliance analysis for debugging and optimization</Alert>
//                 <Button fullWidth variant="outlined" startIcon={copiedSection === 'all' ? <CheckCircle /> : <CopyIcon />} onClick={() => copyToClipboard(formatAllDataForCopy(), 'all')} sx={{ mb: 2 }}>
//                     {copiedSection === 'all' ? 'Copied!' : 'Copy All Details'}
//                 </Button>
//                 <Divider sx={{ mb: 2 }} />

//                 {/* Sections for Background, Dimensions, Quality, and Product Fill go here as in the original file */}
                
//             </Box>
//         </Drawer>
//     );
// };