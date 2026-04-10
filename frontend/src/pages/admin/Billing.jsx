import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import MergeRoundedIcon from '@mui/icons-material/MergeRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { SOCKET_BASE_URL, getApiUrl } from '../../config/api';

const RS = '\u20B9';
const paymentMethodOptions = [
  { value: 'QR', label: 'QR Code' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CASH', label: 'Cash' },
];
const historyRanges = [
  { value: 'today', label: 'Today' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'all', label: 'All' },
];

const money = (value) => `${RS}${Number(value || 0).toFixed(2)}`;
const createEmptyManualItem = () => ({ menuItemId: '', name: '', quantity: '1', unitPrice: '' });

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getBillFileName = (bill) => {
  const joinedTables = (bill.tableIds || [])
    .map((table) => table.tableNumber)
    .filter(Boolean)
    .join('-');

  return `bill-${joinedTables || 'receipt'}-${bill._id || Date.now()}.html`;
};

const buildBillDownloadMarkup = (bill) => {
  const tableLabel = (bill.tableIds || [])
    .map((table) => `Table ${table.tableNumber}`)
    .join(', ');

  const rows = (bill.lineItems || [])
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${escapeHtml(item.quantity)}</td>
          <td>${escapeHtml(money(item.unitPrice))}</td>
          <td style="text-align:right;">${escapeHtml(money(item.totalPrice))}</td>
        </tr>
      `
    )
    .join('');

  const feedbackMarkup = bill.feedback
    ? `
      <section class="section">
        <h2>Customer Feedback</h2>
        <p><strong>Rating:</strong> ${escapeHtml(`${bill.feedback.rating || 0}/5`)}</p>
        <p><strong>Guest:</strong> ${escapeHtml(bill.feedback.customerName || 'Anonymous')}</p>
        <p><strong>Submitted:</strong> ${escapeHtml(
          new Date(bill.feedback.submittedAt || bill.updatedAt || bill.createdAt).toLocaleString()
        )}</p>
        <p><strong>Comment:</strong> ${escapeHtml(
          bill.feedback.comment || 'The guest submitted a rating without any comment.'
        )}</p>
      </section>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bill Receipt</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 32px;
        background: #f7f3ef;
        color: #1f1a17;
      }
      .receipt {
        max-width: 760px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 20px;
        padding: 32px;
        box-shadow: 0 12px 40px rgba(31, 26, 23, 0.12);
      }
      h1, h2, p {
        margin: 0;
      }
      .header,
      .meta,
      .total-row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: center;
      }
      .meta,
      .summary,
      .section {
        margin-top: 24px;
      }
      .badge {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 999px;
        background: #ffe8d4;
        color: #a34b00;
        font-weight: 700;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 16px;
      }
      th, td {
        padding: 12px 0;
        border-bottom: 1px solid #eadfd6;
        text-align: left;
      }
      .summary p,
      .section p {
        margin-top: 8px;
      }
      .total-row {
        font-size: 20px;
        font-weight: 700;
        margin-top: 12px;
      }
      @media print {
        body {
          padding: 0;
          background: #fff;
        }
        .receipt {
          box-shadow: none;
          border-radius: 0;
          max-width: none;
        }
      }
    </style>
  </head>
  <body>
    <main class="receipt">
      <div class="header">
        <div>
          <h1>Bill Receipt</h1>
          <p>${escapeHtml(tableLabel || 'Table bill')}</p>
        </div>
        <span class="badge">${escapeHtml(bill.paymentStatusLabel || bill.paymentStatus || 'Pending')}</span>
      </div>

      <div class="meta">
        <p><strong>Created:</strong> ${escapeHtml(new Date(bill.createdAt).toLocaleString())}</p>
        <p><strong>Method:</strong> ${escapeHtml(bill.paymentMethod || 'Not selected')}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <section class="summary">
        <p><strong>Subtotal:</strong> ${escapeHtml(money(bill.subtotal))}</p>
        <p><strong>GST (${escapeHtml(bill.gstRate)}%):</strong> ${escapeHtml(money(bill.gstAmount))}</p>
        <p><strong>Service Charge (${escapeHtml(bill.serviceChargeRate)}%):</strong> ${escapeHtml(money(bill.serviceChargeAmount))}</p>
        ${bill.notes ? `<p><strong>Notes:</strong> ${escapeHtml(bill.notes)}</p>` : ''}
        <div class="total-row">
          <span>Total</span>
          <span>${escapeHtml(money(bill.totalAmount))}</span>
        </div>
      </section>

      ${feedbackMarkup}
    </main>
  </body>
</html>`;
};

const downloadBill = (bill) => {
  if (!bill || typeof window === 'undefined') return;

  const markup = buildBillDownloadMarkup(bill);
  const blob = new Blob([markup], { type: 'text/html;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = getBillFileName(bill);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

function BillDetailsDialog({ bill, open, onClose, onApproveCash, onMarkPaid, onDownload, submitting }) {
  if (!bill) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { backgroundColor: '#1A1715', borderRadius: '24px' } }}>
      <DialogTitle>
        <Typography variant="h5">Bill Preview</Typography>
        <Typography color="text.secondary">
          {(bill.tableIds || []).map((table) => `Table ${table.tableNumber}`).join(', ')}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Card sx={{ backgroundColor: '#221F1C', borderRadius: '20px', p: 2.5 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography color="text.secondary">
                  Created on {new Date(bill.createdAt).toLocaleString()}
                </Typography>
                <Chip label={bill.paymentStatusLabel || bill.paymentStatus} color={bill.paymentStatus === 'PAID' ? 'success' : bill.paymentStatus === 'AWAITING_APPROVAL' ? 'warning' : 'info'} />
              </Stack>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(bill.lineItems || []).map((item, index) => (
                    <TableRow key={`${item.name}-${index}`}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{money(item.unitPrice)}</TableCell>
                      <TableCell align="right">{money(item.totalPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          </Card>

          <Card sx={{ backgroundColor: '#221F1C', borderRadius: '20px', p: 2.5 }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Subtotal</Typography><Typography>{money(bill.subtotal)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">GST ({bill.gstRate}%)</Typography><Typography>{money(bill.gstAmount)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Service Charge ({bill.serviceChargeRate}%)</Typography><Typography>{money(bill.serviceChargeAmount)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Payment Method</Typography><Typography>{bill.paymentMethod || 'Not selected'}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="h6">Total</Typography><Typography variant="h6" sx={{ color: '#FF8C2B' }}>{money(bill.totalAmount)}</Typography></Stack>
            </Stack>
          </Card>

          <Card sx={{ backgroundColor: '#221F1C', borderRadius: '20px', p: 2.5 }}>
            <Stack spacing={1}>
              <Typography variant="h6">Customer Feedback</Typography>
              {bill.feedback ? (
                <>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography color="text.secondary">Rating</Typography>
                    <Typography sx={{ color: '#FFB067', fontWeight: 700 }}>
                      {'★'.repeat(Number(bill.feedback.rating || 0))}
                      {'☆'.repeat(Math.max(5 - Number(bill.feedback.rating || 0), 0))}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography color="text.secondary">Guest</Typography>
                    <Typography>{bill.feedback.customerName || 'Anonymous'}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography color="text.secondary">Submitted</Typography>
                    <Typography>
                      {new Date(bill.feedback.submittedAt || bill.updatedAt || bill.createdAt).toLocaleString()}
                    </Typography>
                  </Stack>
                  <Typography color="text.secondary">Comment</Typography>
                  <Typography>
                    {bill.feedback.comment || 'The guest submitted a rating without any comment.'}
                  </Typography>
                </>
              ) : (
                <Typography color="text.secondary">
                  No customer feedback has been submitted for this bill yet.
                </Typography>
              )}
            </Stack>
          </Card>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<DownloadRoundedIcon />}
              onClick={() => onDownload(bill)}
            >
              Download Bill
            </Button>
            {bill.paymentStatus === 'AWAITING_APPROVAL' ? (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleRoundedIcon />}
                disabled={submitting}
                onClick={() => onApproveCash(bill)}
              >
                Approve Cash
              </Button>
            ) : null}
            {bill.paymentStatus === 'PENDING' ? (
              <Button
                variant="contained"
                startIcon={<PaymentsRoundedIcon />}
                disabled={submitting}
                onClick={() => onMarkPaid(bill)}
              >
                Mark as Paid
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default function Billing() {
  const { token, restaurant, user, setRestaurantProfile } = useAuth();
  const [tab, setTab] = useState('active');
  const [tables, setTables] = useState([]);
  const [activeBills, setActiveBills] = useState([]);
  const [awaitingApproval, setAwaitingApproval] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyRange, setHistoryRange] = useState('today');
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [gstRate, setGstRate] = useState('5');
  const [serviceChargeRate, setServiceChargeRate] = useState('0');
  const [notes, setNotes] = useState('');
  const [manualTableId, setManualTableId] = useState('');
  const [manualItems, setManualItems] = useState([createEmptyManualItem()]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeBill, setActiveBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const refreshTimerRef = useRef(null);

  const loadOverview = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const response = await fetch(getApiUrl('/api/billing/overview'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load billing overview');
      }

      setTables(data.tables || []);
      setActiveBills(data.activeBills || []);
      setAwaitingApproval(data.awaitingApproval || []);
      setHistory(data.history || []);
      setGstRate(String(data.config?.gstRate ?? restaurant?.gstRate ?? 5));
      setServiceChargeRate(String(data.config?.serviceChargeRate ?? restaurant?.serviceChargeRate ?? 0));
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || 'Failed to load billing overview');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [restaurant?.gstRate, restaurant?.serviceChargeRate, token]);

  const loadHistory = useCallback(async (range) => {
    try {
      const response = await fetch(getApiUrl(`/api/billing/history?range=${range}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ([]));
      if (!response.ok) {
        if (response.status === 404) {
          return;
        }
        throw new Error(data.message || 'Failed to load billing history');
      }
      setHistory(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error(loadError);
    }
  }, [token]);

  const queueRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = window.setTimeout(() => {
      loadOverview(false);
      loadHistory(historyRange);
    }, 250);
  }, [historyRange, loadHistory, loadOverview]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const query = user?.restaurantId ? `?restaurantId=${user.restaurantId}` : '';
        const response = await fetch(getApiUrl(`/api/menu${query}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ([]));
        if (!response.ok) {
          throw new Error('Failed to load menu items');
        }
        setMenuItems(Array.isArray(data) ? data : []);
      } catch (menuError) {
        console.error(menuError);
      }
    };

    loadMenuItems();
  }, [token, user?.restaurantId]);

  useEffect(() => {
    loadHistory(historyRange);
  }, [historyRange, loadHistory]);

  useEffect(() => {
    const socket = io(SOCKET_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('billUpdate', queueRefresh);
    socket.on('paymentRequest', queueRefresh);
    socket.on('newOrder', queueRefresh);
    socket.on('orderStatusUpdate', queueRefresh);
    socket.on('sessionUpdate', queueRefresh);

    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      socket.disconnect();
    };
  }, [queueRefresh]);

  const summary = useMemo(
    () => ({
      active: activeBills.length,
      awaitingApproval: awaitingApproval.length,
      history: history.length,
      collected: history.reduce((sum, bill) => sum + Number(bill.totalAmount || 0), 0),
    }),
    [activeBills, awaitingApproval, history]
  );

  const feedbackBills = useMemo(() => {
    const deduped = new Map();

    [...activeBills, ...awaitingApproval, ...history].forEach((bill) => {
      if (bill?.feedback && bill?._id && !deduped.has(bill._id)) {
        deduped.set(bill._id, bill);
      }
    });

    return Array.from(deduped.values()).sort(
      (left, right) =>
        new Date(right.feedback?.submittedAt || right.updatedAt || right.createdAt).getTime() -
        new Date(left.feedback?.submittedAt || left.updatedAt || left.createdAt).getTime()
    );
  }, [activeBills, awaitingApproval, history]);

  const saveBillingDefaults = async () => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      const response = await fetch(getApiUrl('/api/restaurants/current/profile'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gstRate: Number(gstRate) || 0,
          serviceChargeRate: Number(serviceChargeRate) || 0,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save billing settings');
      }
      setRestaurantProfile(data);
      setSuccess('Billing defaults updated.');
      loadOverview();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || 'Failed to save billing settings');
    } finally {
      setSubmitting(false);
    }
  };

  const generateBill = async (endpoint, tableIds) => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tableIds,
          gstRate: Number(gstRate) || 0,
          serviceChargeRate: Number(serviceChargeRate) || 0,
          paymentMethod,
          notes,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate bill');
      }
      setActiveBill(data);
      setSelectedTableIds([]);
      setSuccess('Bill generated successfully.');
      loadOverview();
      loadHistory(historyRange);
    } catch (billingError) {
      console.error(billingError);
      setError(billingError.message || 'Failed to generate bill');
    } finally {
      setSubmitting(false);
    }
  };

  const updateBillStatus = async (bill, endpoint) => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      const response = await fetch(getApiUrl(endpoint), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update bill');
      }
      setActiveBill(data);
      setSuccess(
        endpoint.includes('approve-cash')
          ? 'Cash payment approved and table released.'
          : 'Bill marked as paid and moved to history.'
      );
      loadOverview();
      loadHistory(historyRange);
    } catch (updateError) {
      console.error(updateError);
      setError(updateError.message || 'Failed to update bill');
    } finally {
      setSubmitting(false);
    }
  };

  const updateManualItem = (index, field, value) => {
    setManualItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleManualMenuItemChange = (index, menuItemId) => {
    const selectedItem = menuItems.find((menuItem) => menuItem._id === menuItemId);

    setManualItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              menuItemId,
              name: selectedItem?.name || '',
              unitPrice:
                selectedItem && Number.isFinite(Number(selectedItem.price))
                  ? String(selectedItem.price)
                  : '',
            }
          : item
      )
    );
  };

  const addManualItem = () => {
    setManualItems((current) => [...current, createEmptyManualItem()]);
  };

  const removeManualItem = (index) => {
    setManualItems((current) =>
      current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const generateManualBill = async () => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      const response = await fetch(getApiUrl('/api/billing/manual'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tableIds: manualTableId ? [manualTableId] : [],
          manualItems: manualItems.map((item) => ({
            menuItemId: item.menuItemId || null,
            name: item.name,
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
          })),
          gstRate: Number(gstRate) || 0,
          serviceChargeRate: Number(serviceChargeRate) || 0,
          paymentMethod,
          notes,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate manual bill');
      }
      setActiveBill(data);
      setManualTableId('');
      setManualItems([createEmptyManualItem()]);
      setSuccess('Manual bill generated successfully.');
      loadOverview();
      loadHistory(historyRange);
    } catch (manualBillingError) {
      console.error(manualBillingError);
      setError(manualBillingError.message || 'Failed to generate manual bill');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedManualTable = tables.find((table) => table._id === manualTableId);
  const hasValidManualItems = manualItems.some(
    (item) => item.menuItemId && Number(item.quantity) > 0 && Number(item.unitPrice) >= 0
  );

  return (
    <Stack spacing={3.5}>
      <Box>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Smart Billing
        </Typography>
        <Typography variant="subtitle1">
          Review live bills, approve cash collections, and track payment history.
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
        <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 2.5 }}><Typography color="text.secondary">Active Bills</Typography><Typography variant="h4">{summary.active}</Typography></Card>
        <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 2.5 }}><Typography color="text.secondary">Awaiting Approval</Typography><Typography variant="h4">{summary.awaitingApproval}</Typography></Card>
        <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 2.5 }}><Typography color="text.secondary">Paid Bills</Typography><Typography variant="h4">{summary.history}</Typography></Card>
        <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 2.5 }}><Typography color="text.secondary">Collected</Typography><Typography variant="h4" sx={{ color: '#FF8C2B' }}>{money(summary.collected)}</Typography></Card>
      </Box>

      <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 3 }}>
        <Stack spacing={2.5}>
          <Typography variant="h6">Tax & Billing Defaults</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="GST %" type="number" value={gstRate} onChange={(event) => setGstRate(event.target.value)} />
            <TextField label="Service Charge %" type="number" value={serviceChargeRate} onChange={(event) => setServiceChargeRate(event.target.value)} />
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select value={paymentMethod} label="Payment Method" onChange={(event) => setPaymentMethod(event.target.value)}>
                {paymentMethodOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <TextField label="Bill Notes" multiline minRows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="outlined" disabled={submitting} onClick={saveBillingDefaults}>
              Save Billing Defaults
            </Button>
          </Stack>
        </Stack>
      </Card>

      <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 3 }}>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', lg: 'center' }}
          >
            <Box>
              <Typography variant="h6" sx={{ mb: 0.75 }}>
                Manual Bill Entry
              </Typography>
              <Typography color="text.secondary">
                Add custom items from the admin dashboard and generate the bill directly for a table.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<ReceiptLongRoundedIcon />}
              disabled={
                submitting ||
                !manualTableId ||
                !hasValidManualItems ||
                Boolean(selectedManualTable?.hasActiveBill)
              }
              onClick={generateManualBill}
            >
              Generate Manual Bill
            </Button>
          </Stack>

          <Autocomplete
            options={tables}
            value={tables.find((table) => table._id === manualTableId) || null}
            onChange={(_, value) => setManualTableId(value?._id || '')}
            getOptionLabel={(option) =>
              `Table ${option.tableNumber}${option.hasActiveBill ? ' - Active bill' : ''}`
            }
            isOptionEqualToValue={(option, value) => option._id === value._id}
            sx={{ maxWidth: 320 }}
            renderInput={(params) => <TextField {...params} label="Search Table" />}
          />

          {selectedManualTable?.hasActiveBill ? (
            <Alert severity="warning">This table already has an active bill.</Alert>
          ) : null}

          <Stack spacing={1.5}>
            {manualItems.map((item, index) => (
              <Stack
                key={`manual-item-${index}`}
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                alignItems={{ md: 'center' }}
              >
                <Autocomplete
                  options={menuItems}
                  value={menuItems.find((menuItem) => menuItem._id === item.menuItemId) || null}
                  onChange={(_, value) => handleManualMenuItemChange(index, value?._id || '')}
                  getOptionLabel={(option) => `${option.name} (${money(option.price)})`}
                  isOptionEqualToValue={(option, value) => option._id === value._id}
                  sx={{ flex: 1.6 }}
                  renderInput={(params) => <TextField {...params} label="Search Menu Item" />}
                />
                <TextField
                  label="Qty"
                  type="number"
                  value={item.quantity}
                  onChange={(event) => updateManualItem(index, 'quantity', event.target.value)}
                  sx={{ width: { xs: '100%', md: 120 } }}
                />
                <TextField
                  label="Unit Price"
                  type="number"
                  value={item.unitPrice}
                  onChange={(event) => updateManualItem(index, 'unitPrice', event.target.value)}
                  sx={{ width: { xs: '100%', md: 160 } }}
                />
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<DeleteOutlineRoundedIcon />}
                  disabled={manualItems.length === 1}
                  onClick={() => removeManualItem(index)}
                >
                  Remove
                </Button>
              </Stack>
            ))}
          </Stack>

          <Stack direction="row" justifyContent="flex-start">
            <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={addManualItem}>
              Add Item
            </Button>
          </Stack>
        </Stack>
      </Card>

      {loading ? (
        <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 5, textAlign: 'center' }}>
          <Typography color="text.secondary">Loading billing desk...</Typography>
        </Card>
      ) : (
        <>
          <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 3 }}>
            <Tabs value={tab} onChange={(_, nextValue) => setTab(nextValue)} textColor="inherit" indicatorColor="secondary" sx={{ mb: 2 }}>
              <Tab value="active" label={`Active Bills (${activeBills.length})`} />
              <Tab value="approval" label={`Awaiting Approval (${awaitingApproval.length})`} />
              <Tab value="history" label="Billing History" />
              <Tab value="feedback" label={`Feedback (${feedbackBills.length})`} />
            </Tabs>

            {tab === 'active' ? (
              activeBills.length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tables</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeBills.map((bill) => (
                      <TableRow key={bill._id}>
                        <TableCell>{(bill.tableIds || []).map((table) => `T${table.tableNumber}`).join(', ')}</TableCell>
                        <TableCell>{bill.paymentMethod || 'Not selected'}</TableCell>
                        <TableCell>{bill.paymentStatusLabel || bill.paymentStatus}</TableCell>
                        <TableCell>{money(bill.totalAmount)}</TableCell>
                        <TableCell>{new Date(bill.createdAt).toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => setActiveBill(bill)}>Open</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color="text.secondary">No active bills right now.</Typography>
              )
            ) : null}

            {tab === 'approval' ? (
              awaitingApproval.length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tables</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Requested</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {awaitingApproval.map((bill) => (
                      <TableRow key={bill._id}>
                        <TableCell>{(bill.tableIds || []).map((table) => `T${table.tableNumber}`).join(', ')}</TableCell>
                        <TableCell>{money(bill.totalAmount)}</TableCell>
                        <TableCell>{new Date(bill.createdAt).toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            color="success"
                            startIcon={<CheckCircleRoundedIcon />}
                            disabled={submitting}
                            onClick={() => updateBillStatus(bill, `/api/payment/approve-cash/${bill._id}`)}
                          >
                            Approve Cash
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color="text.secondary">No cash approvals waiting.</Typography>
              )
            ) : null}

            {tab === 'history' ? (
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <HistoryRoundedIcon sx={{ color: '#22C55E' }} />
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Range</InputLabel>
                    <Select value={historyRange} label="Range" onChange={(event) => setHistoryRange(event.target.value)}>
                      {historyRanges.map((range) => (
                        <MenuItem key={range.value} value={range.value}>{range.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
                {history.length ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tables</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Paid On</TableCell>
                        <TableCell align="right">Bill</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map((bill) => (
                        <TableRow key={bill._id}>
                          <TableCell>{(bill.tableIds || []).map((table) => `T${table.tableNumber}`).join(', ')}</TableCell>
                          <TableCell>{bill.paymentMethod || '-'}</TableCell>
                          <TableCell>{money(bill.totalAmount)}</TableCell>
                          <TableCell>{new Date(bill.paidAt || bill.updatedAt || bill.createdAt).toLocaleString()}</TableCell>
                          <TableCell align="right"><Button size="small" onClick={() => setActiveBill(bill)}>View</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography color="text.secondary">No paid bills for this range.</Typography>
                )}
              </Stack>
            ) : null}

            {tab === 'feedback' ? (
              feedbackBills.length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tables</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Guest</TableCell>
                      <TableCell>Comment</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell align="right">Bill</TableCell>
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
                        <TableCell sx={{ maxWidth: 340 }}>
                          <Typography
                            sx={{
                              maxWidth: 340,
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
                          <Button size="small" onClick={() => setActiveBill(bill)}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color="text.secondary">No customer feedback has been submitted yet.</Typography>
              )
            ) : null}
          </Card>

          <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 3 }}>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between">
              <Box>
                <Typography variant="h6" sx={{ mb: 0.75 }}>Generate Bills</Typography>
                <Typography color="text.secondary">Create single-table or combined bills from ready/completed orders.</Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<MergeRoundedIcon />}
                disabled={submitting || selectedTableIds.length < 2}
                onClick={() => generateBill('/api/billing/combine', selectedTableIds)}
              >
                Combine Tables
              </Button>
            </Stack>

            <Box sx={{ mt: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))', xl: 'repeat(4,minmax(0,1fr))' }, gap: 2.5 }}>
              {tables.map((table) => (
                <Card key={table._id} sx={{ backgroundColor: '#221F1C', borderRadius: '18px', p: 2.25, border: selectedTableIds.includes(table._id) ? '1px solid rgba(255,140,43,0.55)' : '1px solid rgba(255,255,255,0.04)' }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">Table {table.tableNumber}</Typography>
                      <Chip size="small" label={`Cap ${table.capacity || 4}`} sx={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                    </Stack>
                    <Typography color="text.secondary">{table.billableOrderCount} ready/completed order{table.billableOrderCount === 1 ? '' : 's'}</Typography>
                    <Typography sx={{ color: '#FF8C2B', fontWeight: 700 }}>{money(table.billableAmount)}</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant={selectedTableIds.includes(table._id) ? 'contained' : 'outlined'}
                        onClick={() =>
                          setSelectedTableIds((current) =>
                            current.includes(table._id)
                              ? current.filter((id) => id !== table._id)
                              : [...current, table._id]
                          )
                        }
                      >
                        {selectedTableIds.includes(table._id) ? 'Selected' : 'Select'}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<ReceiptLongRoundedIcon />}
                        disabled={submitting || table.billableOrderCount === 0 || table.hasActiveBill}
                        onClick={() => generateBill('/api/billing/generate', [table._id])}
                      >
                        {table.hasActiveBill ? 'Active Bill' : 'Generate'}
                      </Button>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Box>
          </Card>
        </>
      )}

      <BillDetailsDialog
        bill={activeBill}
        open={Boolean(activeBill)}
        onClose={() => setActiveBill(null)}
        onApproveCash={(bill) => updateBillStatus(bill, `/api/payment/approve-cash/${bill._id}`)}
        onMarkPaid={(bill) => updateBillStatus(bill, `/api/billing/mark-paid/${bill._id}`)}
        onDownload={downloadBill}
        submitting={submitting}
      />
    </Stack>
  );
}
