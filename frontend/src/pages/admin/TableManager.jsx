import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';

export default function TableManager() {
  const { token, user } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTableNum, setNewTableNum] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTables = async () => {
    try {
      setError('');
      const res = await fetch(`http://localhost:5000/api/tables?domainUrl=${encodeURIComponent(window.location.origin)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load tables');
      }
      setTables(data);
    } catch (error) {
      console.error(error);
      setError(error.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [token]);

  const getTableQrLink = (table) =>
    `${window.location.origin}/menu?table=${table.tableNumber}&restaurant=${user?.restaurantId || table.restaurantId}`;

  const handleAddTable = async (event) => {
    event.preventDefault();
    const parsedNumber = Number.parseInt(newTableNum, 10);
    if (!Number.isInteger(parsedNumber) || parsedNumber < 1) {
      setError('Please enter a valid table number greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');
      const res = await fetch('http://localhost:5000/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tableNumber: parsedNumber,
          domainUrl: window.location.origin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add table');
      }
      setNewTableNum('');
      setTables((current) =>
        [...current, data].sort((left, right) => left.tableNumber - right.tableNumber)
      );
      setSuccess(`Table ${parsedNumber} added successfully.`);
    } catch (error) {
      console.error(error);
      setError(error.message || 'Failed to add table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this table definition?')) return;
    try {
      setError('');
      setSuccess('');
      const res = await fetch(`http://localhost:5000/api/tables/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete table');
      }
      const deletedTable = tables.find((table) => table._id === id);
      setTables((current) => current.filter((table) => table._id !== id));
      setSuccess(
        deletedTable
          ? `Table ${deletedTable.tableNumber} removed successfully.`
          : 'Table removed successfully.'
      );
    } catch (error) {
      console.error(error);
      setError(error.message || 'Failed to delete table');
    }
  };

  const printQR = (table) => {
    const printContent = document.getElementById(`qr-table-${table.tableNumber}`).innerHTML;
    const qrLink = getTableQrLink(table);
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.write(`
      <html><head><title>Print QR - Table ${table.tableNumber}</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:Inter,Segoe UI,sans-serif;">
        <h2>Table ${table.tableNumber}</h2>
        <div style="margin:20px;padding:20px;border:2px solid #000;display:inline-block;">${printContent}</div>
        <p>Scan to view menu and order</p>
        <p style="max-width:460px;word-break:break-all;text-align:center;">${qrLink}</p>
        <script>window.print(); window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <Stack spacing={3.5}>
      <Box>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Tables & QR
        </Typography>
        <Typography variant="subtitle1">
          Generate and manage QR codes for each physical table.
        </Typography>
      </Box>

      <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 3 }}>
        <Box component="form" onSubmit={handleAddTable}>
          <Stack spacing={2.5}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {success ? <Alert severity="success">{success}</Alert> : null}

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-end">
            <TextField
              label="Table Number"
              type="number"
              value={newTableNum}
              onChange={(event) => {
                setNewTableNum(event.target.value);
                if (error) setError('');
                if (success) setSuccess('');
              }}
              inputProps={{ min: 1 }}
              required
              sx={{ minWidth: { xs: '100%', md: 260 } }}
            />
              <Button
                type="submit"
                variant="contained"
                startIcon={
                  isSubmitting ? <CircularProgress size={18} color="inherit" /> : <AddRoundedIcon />
                }
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add table'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Card>

      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          Loading tables...
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 3,
          }}
        >
          {tables.length === 0 ? (
            <Card
              sx={{
                gridColumn: '1 / -1',
                backgroundColor: '#1A1715',
                borderRadius: '20px',
                p: 4,
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                No tables yet
              </Typography>
              <Typography color="text.secondary">
                Add your first table to generate its QR code.
              </Typography>
            </Card>
          ) : null}
          {tables.map((table) => (
            <Card
              key={table._id}
              sx={{
                backgroundColor: '#1A1715',
                borderRadius: '20px',
                p: 3,
                position: 'relative',
              }}
            >
              <IconButton
                onClick={() => handleDelete(table._id)}
                sx={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  color: '#EF4444',
                }}
              >
                <DeleteRoundedIcon />
              </IconButton>

              <Stack spacing={2.5} alignItems="center" textAlign="center">
                <Typography variant="h6">Table {table.tableNumber}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  QR now points to this restaurant's menu directly.
                </Typography>

                <Box
                  id={`qr-table-${table.tableNumber}`}
                  sx={{
                    p: 2,
                    borderRadius: '18px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <QRCodeSVG value={table.qrCodeData} size={150} level="H" />
                </Box>

                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: 12,
                    width: '100%',
                    wordBreak: 'break-all',
                  }}
                >
                  {getTableQrLink(table)}
                </Typography>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PrintRoundedIcon />}
                  onClick={() => printQR(table)}
                >
                  Print QR
                </Button>
              </Stack>
            </Card>
          ))}
        </Box>
      )}
    </Stack>
  );
}
