import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Card, Chip, Dialog, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import ReviewsRoundedIcon from '@mui/icons-material/ReviewsRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';

const downloadFeedback = (bill) => {
  if (!bill?.feedback || typeof window === 'undefined') return;

  const content = `Guest: ${bill.feedback.customerName || 'Anonymous'}
Rating: ${bill.feedback.rating || 0}/5
Tables: ${(bill.tableIds || []).map((table) => `Table ${table.tableNumber}`).join(', ')}
Items Ordered: ${(bill.lineItems || []).length
    ? bill.lineItems.map((item) => `${item.quantity}x ${item.name}`).join(', ')
    : 'No item details available.'}
Submitted: ${new Date(
    bill.feedback.submittedAt || bill.updatedAt || bill.createdAt
  ).toLocaleString()}

Comment:
${bill.feedback.comment || 'No written feedback.'}
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `feedback-${bill._id || Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

function FeedbackDetailsDialog({ bill, open, onClose }) {
  if (!bill) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { backgroundColor: '#1A1715', borderRadius: '24px' } }}>
      <DialogTitle>
        <Typography variant="h5">Feedback Details</Typography>
        <Typography color="text.secondary">
          {(bill.tableIds || []).map((table) => `Table ${table.tableNumber}`).join(', ')}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5}>
          <Card sx={{ backgroundColor: '#221F1C', borderRadius: '18px', p: 2.5 }}>
            <Stack spacing={1}>
              <Typography sx={{ color: '#FFB067', fontWeight: 700 }}>
                {'★'.repeat(Number(bill.feedback?.rating || 0))}
                {'☆'.repeat(Math.max(5 - Number(bill.feedback?.rating || 0), 0))}
              </Typography>
              <Typography><strong>Guest:</strong> {bill.feedback?.customerName || 'Anonymous'}</Typography>
              <Typography>
                <strong>Items Ordered:</strong>{' '}
                {(bill.lineItems || []).length
                  ? bill.lineItems.map((item) => `${item.quantity}x ${item.name}`).join(', ')
                  : 'No item details available.'}
              </Typography>
              <Typography><strong>Submitted:</strong> {new Date(bill.feedback?.submittedAt || bill.updatedAt || bill.createdAt).toLocaleString()}</Typography>
              <Typography><strong>Comment:</strong></Typography>
              <Typography color="text.secondary">
                {bill.feedback?.comment || 'Rating only'}
              </Typography>
            </Stack>
          </Card>

          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<DownloadRoundedIcon />}
              onClick={() => downloadFeedback(bill)}
            >
              Download Feedback
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default function Feedback() {
  const { token } = useAuth();
  const [feedbackBills, setFeedbackBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(getApiUrl('/api/billing/overview'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load feedback');
      }

      const combinedBills = [
        ...(data.activeBills || []),
        ...(data.awaitingApproval || []),
        ...(data.history || []),
      ];

      const deduped = new Map();
      combinedBills.forEach((bill) => {
        if (bill?._id && bill?.feedback && !deduped.has(bill._id)) {
          deduped.set(bill._id, bill);
        }
      });

      setFeedbackBills(
        Array.from(deduped.values()).sort(
          (left, right) =>
            new Date(right.feedback?.submittedAt || right.updatedAt || right.createdAt).getTime() -
            new Date(left.feedback?.submittedAt || left.updatedAt || left.createdAt).getTime()
        )
      );
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const averageRating = useMemo(() => {
    if (!feedbackBills.length) return 0;
    return (
      feedbackBills.reduce((sum, bill) => sum + Number(bill.feedback?.rating || 0), 0) /
      feedbackBills.length
    );
  }, [feedbackBills]);

  return (
    <Stack spacing={3.5}>
      <Box>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Customer Feedback
        </Typography>
        <Typography variant="subtitle1">
          Review ratings and comments from guests in one dedicated page.
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 2.5 }}>
          <Typography color="text.secondary">Feedback Entries</Typography>
          <Typography variant="h4">{feedbackBills.length}</Typography>
        </Card>
        <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 2.5 }}>
          <Typography color="text.secondary">Average Rating</Typography>
          <Typography variant="h4">{averageRating.toFixed(1)} / 5</Typography>
        </Card>
      </Box>

      <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <ReviewsRoundedIcon sx={{ color: '#FF8C2B' }} />
            <Typography variant="h6">Feedback List</Typography>
          </Stack>
          <Chip label={`${feedbackBills.length} total`} sx={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        </Stack>

        {loading ? (
          <Typography color="text.secondary">Loading feedback...</Typography>
        ) : feedbackBills.length ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tables</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Guest</TableCell>
                <TableCell>Items Ordered</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {feedbackBills.map((bill) => (
                <TableRow key={bill._id}>
                  <TableCell>{(bill.tableIds || []).map((table) => `T${table.tableNumber}`).join(', ')}</TableCell>
                  <TableCell sx={{ color: '#FFB067', fontWeight: 700 }}>
                    {'★'.repeat(Number(bill.feedback?.rating || 0))}
                    {'☆'.repeat(Math.max(5 - Number(bill.feedback?.rating || 0), 0))}
                  </TableCell>
                  <TableCell>{bill.feedback?.customerName || 'Anonymous'}</TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography
                      sx={{
                        maxWidth: 320,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {(bill.lineItems || []).length
                        ? bill.lineItems.map((item) => `${item.quantity}x ${item.name}`).join(', ')
                        : 'No item details available.'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>
                    <Typography
                      sx={{
                        maxWidth: 360,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {bill.feedback?.comment || 'Rating only'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(bill.feedback?.submittedAt || bill.updatedAt || bill.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => setSelectedBill(bill)}>View</Button>
                      <Button size="small" onClick={() => downloadFeedback(bill)}>
                        Download
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography color="text.secondary">
            No customer feedback has been submitted yet.
          </Typography>
        )}
      </Card>

      <FeedbackDetailsDialog
        bill={selectedBill}
        open={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
      />
    </Stack>
  );
}
