import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Alert, Box, Button, Card, Stack, TextField, Typography } from '@mui/material';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import UploadRoundedIcon from '@mui/icons-material/UploadRounded';
import { alpha } from '@mui/material/styles';
import { themeOptions } from '../../theme/adminTheme';
import { getApiUrl } from '../../config/api';

const emptyForm = {
  name: '',
  phone: '',
  address: '',
  logoUrl: '',
  paymentQrUrl: '',
  upiId: '',
  gstRate: '5',
  serviceChargeRate: '0',
  dashboardTheme: 'amber',
};

export default function RestaurantSettings() {
  const { token, restaurant, refreshRestaurant, setRestaurantProfile } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const themeChoices = useMemo(() => Object.values(themeOptions), []);

  useEffect(() => {
    refreshRestaurant();
  }, [token]);

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name || '',
        phone: restaurant.phone || '',
        address: restaurant.address || '',
        logoUrl: restaurant.logoUrl || '',
        paymentQrUrl: restaurant.paymentQrUrl || '',
        upiId: restaurant.upiId || '',
        gstRate: String(restaurant.gstRate ?? 5),
        serviceChargeRate: String(restaurant.serviceChargeRate ?? 0),
        dashboardTheme: restaurant.dashboardTheme || 'amber',
      });
    }
  }, [restaurant]);

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        logoUrl: typeof reader.result === 'string' ? reader.result : current.logoUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handlePaymentQrUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        paymentQrUrl:
          typeof reader.result === 'string' ? reader.result : current.paymentQrUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(getApiUrl('/api/restaurants/current/profile'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const rawBody = await response.text();
      let data = {};

      try {
        data = rawBody ? JSON.parse(rawBody) : {};
      } catch (parseError) {
        data = { message: rawBody || 'Failed to save settings' };
      }

      if (!response.ok) {
        throw new Error(
          response.status === 413
            ? 'Uploaded logo is too large. Please use a smaller image.'
            : data.message || 'Failed to save settings'
        );
      }

      setRestaurantProfile(data);
      setSuccess('Restaurant settings updated.');
    } catch (saveError) {
      setError(saveError.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3.5}>
      <Box>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Settings
        </Typography>
        <Typography variant="subtitle1">
          Manage your restaurant identity, logo, and operations theme from one place.
        </Typography>
      </Box>

      <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 3 }}>
        <Box component="form" onSubmit={handleSave}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <PaletteRoundedIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6">Restaurant Branding</Typography>
            </Stack>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {success ? <Alert severity="success">{success}</Alert> : null}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              <TextField
                label="Restaurant Name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
              <TextField
                label="Phone"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
              <TextField
                label="Address"
                multiline
                minRows={3}
                sx={{ gridColumn: { md: '1 / -1' } }}
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              />
              <TextField
                label="Logo URL"
                sx={{ gridColumn: { md: '1 / -1' } }}
                value={form.logoUrl}
                onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))}
              />
              <TextField
                label="Payment QR Image URL"
                sx={{ gridColumn: { md: '1 / -1' } }}
                value={form.paymentQrUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, paymentQrUrl: event.target.value }))
                }
              />
              <TextField
                label="UPI ID"
                value={form.upiId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, upiId: event.target.value }))
                }
              />
              <TextField
                label="GST %"
                type="number"
                value={form.gstRate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, gstRate: event.target.value }))
                }
              />
              <TextField
                label="Service Charge %"
                type="number"
                value={form.serviceChargeRate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, serviceChargeRate: event.target.value }))
                }
              />
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Button component="label" variant="outlined" startIcon={<UploadRoundedIcon />}>
                Upload Logo
                <input hidden accept="image/*" type="file" onChange={handleLogoUpload} />
              </Button>
              <Button component="label" variant="outlined" startIcon={<UploadRoundedIcon />}>
                Upload Payment QR
                <input hidden accept="image/*" type="file" onChange={handlePaymentQrUpload} />
              </Button>
              <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                Upload your restaurant logo, payment QR image, or paste hosted image URLs above.
              </Typography>
            </Stack>

            <Stack spacing={1.25}>
              <Typography sx={{ fontWeight: 600 }}>Operations Theme</Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: 1.5,
                }}
              >
                {themeChoices.map((option) => {
                  const selected = form.dashboardTheme === option.key;
                  return (
                    <Box
                      key={option.key}
                      component="button"
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, dashboardTheme: option.key }))}
                      sx={{
                        textAlign: 'left',
                        p: 1.75,
                        borderRadius: '16px',
                        border: selected
                          ? `1px solid ${alpha(option.primary, 0.7)}`
                          : '1px solid rgba(255,255,255,0.06)',
                        backgroundColor: selected
                          ? alpha(option.primary, 0.12)
                          : 'rgba(255,255,255,0.02)',
                        color: '#F9F5EF',
                        cursor: 'pointer',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: option.primary,
                          }}
                        />
                        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                          {option.label}
                        </Typography>
                      </Stack>
                      <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                        Apply a dashboard style that matches your restaurant brand.
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Stack>

            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Card>
    </Stack>
  );
}
