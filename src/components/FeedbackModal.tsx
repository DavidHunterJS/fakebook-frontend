// components/FeedbackModal.tsx
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, FormControlLabel, Radio, RadioGroup,
  TextField, Box, Typography, CircularProgress
} from '@mui/material';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  imageId?: string;
  complianceData: any; // Your ComplianceResult type
}

interface FeedbackData {
  detectionAccuracy: 'correct' | 'partial' | 'wrong';
  canFix: 'yes' | 'maybe' | 'no';
  wouldPay: 'yes' | 'maybe' | 'no';
  priceRange: 'under5' | '5to10' | '10to20' | 'over20';
  additionalComments: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  open, 
  onClose, 
  imageId,
  complianceData 
}) => {
  const [feedback, setFeedback] = useState<FeedbackData>({
    detectionAccuracy: 'correct',
    canFix: 'yes',
    wouldPay: 'yes',
    priceRange: 'under5',
    additionalComments: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          feedback,
          complianceData,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // You might want to show an error message to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={600}>
          Quick Feedback (30 seconds)
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          
          {/* Question 1 */}
          <FormControl>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              1. Did the tool correctly identify issues with your image?
            </Typography>
            <RadioGroup
              value={feedback.detectionAccuracy}
              onChange={(e) => setFeedback(prev => ({ ...prev, detectionAccuracy: e.target.value as any }))}
            >
              <FormControlLabel value="correct" control={<Radio />} label="Yes, exactly right" />
              <FormControlLabel value="partial" control={<Radio />} label="Partially - missed some things" />
              <FormControlLabel value="wrong" control={<Radio />} label="No, it was wrong" />
            </RadioGroup>
          </FormControl>

          {/* Question 2 */}
          <FormControl>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              2. Do you know how to fix the issues identified?
            </Typography>
            <RadioGroup
              value={feedback.canFix}
              onChange={(e) => setFeedback(prev => ({ ...prev, canFix: e.target.value as any }))}
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes, I can fix these myself" />
              <FormControlLabel value="maybe" control={<Radio />} label="Not really, would need help" />
              <FormControlLabel value="no" control={<Radio />} label="No idea where to start" />
            </RadioGroup>
          </FormControl>

          {/* Question 3 */}
          <FormControl>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              3. Would you pay for automatic fixing of these issues?
            </Typography>
            <RadioGroup
              value={feedback.wouldPay}
              onChange={(e) => setFeedback(prev => ({ ...prev, wouldPay: e.target.value as any }))}
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes, definitely" />
              <FormControlLabel value="maybe" control={<Radio />} label="Maybe, depends on price" />
              <FormControlLabel value="no" control={<Radio />} label="No, I'll fix manually" />
            </RadioGroup>
          </FormControl>

          {/* Question 4 - Only show if they would pay */}
          {(feedback.wouldPay === 'yes' || feedback.wouldPay === 'maybe') && (
            <FormControl>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                4. If yes, what's a fair price per image fix?
              </Typography>
              <RadioGroup
                value={feedback.priceRange}
                onChange={(e) => setFeedback(prev => ({ ...prev, priceRange: e.target.value as any }))}
              >
                <FormControlLabel value="under5" control={<Radio />} label="Under $5" />
                <FormControlLabel value="5to10" control={<Radio />} label="$5-$10" />
                <FormControlLabel value="10to20" control={<Radio />} label="$10-$20" />
                <FormControlLabel value="over20" control={<Radio />} label="Over $20" />
              </RadioGroup>
            </FormControl>
          )}

          {/* Question 5 */}
          <FormControl>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              5. Anything else we should know?
            </Typography>
            <TextField
              multiline
              rows={3}
              placeholder="Any additional thoughts, suggestions, or feedback..."
              value={feedback.additionalComments}
              onChange={(e) => setFeedback(prev => ({ ...prev, additionalComments: e.target.value }))}
              fullWidth
            />
          </FormControl>

        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Skip
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={isSubmitting}
          sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
        >
          {isSubmitting ? <CircularProgress size={20} /> : 'Submit Feedback'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};