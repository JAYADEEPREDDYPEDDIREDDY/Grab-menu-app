import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import {
  Alert,
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

function BillDetailsDialog({ bill, open, onClose, onApproveCash, onMarkPaid, submitting }) {
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

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="flex-end">
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
  const { token, restaurant, setRestaurantProfile } = useAuth();
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

      {loading ? (
        <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 5, textAlign: 'center' }}>
          <Typography color="text.secondary">Loading billing desk...</Typography>
        </Card>
      ) : (
        <>
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

          <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 3 }}>
            <Tabs value={tab} onChange={(_, nextValue) => setTab(nextValue)} textColor="inherit" indicatorColor="secondary" sx={{ mb: 2 }}>
              <Tab value="active" label={`Active Bills (${activeBills.length})`} />
              <Tab value="approval" label={`Awaiting Approval (${awaitingApproval.length})`} />
              <Tab value="history" label="Billing History" />
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
          </Card>
        </>
      )}

      <BillDetailsDialog
        bill={activeBill}
        open={Boolean(activeBill)}
        onClose={() => setActiveBill(null)}
        onApproveCash={(bill) => updateBillStatus(bill, `/api/payment/approve-cash/${bill._id}`)}
        onMarkPaid={(bill) => updateBillStatus(bill, `/api/billing/mark-paid/${bill._id}`)}
        submitting={submitting}
      />
    </Stack>
  );
}
