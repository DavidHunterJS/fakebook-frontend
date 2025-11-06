import React from 'react';
import {
    Card, Grid, LinearProgress, Paper, Typography
} from '@mui/material';

interface UserData {
    checksUsed: number;
    checksTotal: number;
    fixesUsed: number;
    fixesTotal: number;
}

interface UsageStatsProps {
    userData: UserData;
}

const DetailItem: React.FC<{ label: string, value: string | number, isError?: boolean }> = ({ label, value, isError = false }) => (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f7fafc' }}>
        <Typography fontSize={12} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={0.5}>
            {label}
        </Typography>
        <Typography fontSize={18} fontWeight={600} color={isError ? 'error.main' : 'text.primary'}>
            {value}
        </Typography>
    </Paper>
);

export const UsageStats: React.FC<UsageStatsProps> = ({ userData }) => (
    <Grid container spacing={2} mb={3}>
        <Grid size={{xs:12,sm:6}}>
            <Card sx={{ p: 2, bgcolor: '#f7fafc' }}>
                <Typography fontSize={12} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={1}>
                    Compliance Checks
                </Typography>
                <Typography fontSize={18} fontWeight={600} color="text.primary" mb={1}>
                    {userData.checksUsed} / {userData.checksTotal}
                </Typography>
                <LinearProgress 
                    variant="determinate" 
                    value={(userData.checksUsed / userData.checksTotal) * 100}
                    sx={{ 
                        height: 4, 
                        borderRadius: 2,
                        bgcolor: 'divider',
                        '& .MuiLinearProgress-bar': { bgcolor: '#667eea' }
                    }}
                />
            </Card>
        </Grid>
        <Grid size={{xs:12,sm:6}}>
            <Card sx={{ p: 2, bgcolor: '#f7fafc' }}>
                <Typography fontSize={12} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={1}>
                    Image Fixes
                </Typography>
                <Typography fontSize={18} fontWeight={600} color="text.primary" mb={1}>
                    {userData.fixesUsed} / {userData.fixesTotal}
                </Typography>
                <LinearProgress 
                    variant="determinate" 
                    value={(userData.fixesUsed / userData.fixesTotal) * 100}
                    sx={{ 
                        height: 4, 
                        borderRadius: 2,
                        bgcolor: 'divider',
                        '& .MuiLinearProgress-bar': { bgcolor: 'success.main' }
                    }}
                />
            </Card>
        </Grid>
    </Grid>
);