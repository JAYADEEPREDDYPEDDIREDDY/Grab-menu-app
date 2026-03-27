import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  subscriptionPlan: 'Free',
};

export default function SuperAdminDashboard() {
  const { token } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedCredentials, setGeneratedCredentials] = useState(null);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token]
  );

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/restaurants', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to load restaurants');
      }

      setRestaurants(data);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [token]);

  const handleCreateRestaurant = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    setGeneratedCredentials(null);

    try {
      const res = await fetch('http://localhost:5000/api/restaurants', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create restaurant');
      }

      setRestaurants((current) => [data.restaurant, ...current]);
      setGeneratedCredentials(data.credentials);
      setSuccess(`Restaurant ${data.restaurant.name} created successfully.`);
      setForm(emptyForm);
    } catch (createError) {
      setError(createError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateRestaurant = async (restaurantId, payload, successMessage) => {
    setError('');
    setSuccess('');

    const endpoint = payload.status
      ? `http://localhost:5000/api/restaurants/${restaurantId}/status`
      : `http://localhost:5000/api/restaurants/${restaurantId}/plan`;

    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to update restaurant');
    }

    setRestaurants((current) =>
      current.map((restaurant) => (restaurant._id === data._id ? data : restaurant))
    );
    setSuccess(successMessage);
  };

  return (
    <Stack spacing={3.5}>
      <Box>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Restaurant Management
        </Typography>
        <Typography variant="subtitle1">
          Create restaurants, assign plans, and control access from one portal.
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}
      {generatedCredentials ? (
        <Alert severity="info">
          Generated admin credentials: <strong>{generatedCredentials.username}</strong> /{' '}
          <strong>{generatedCredentials.password}</strong>
        </Alert>
      ) : null}

      <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', p: 3 }}>
        <Box component="form" onSubmit={handleCreateRestaurant}>
          <Stack spacing={2.5}>
            <Typography variant="h6">Add New Restaurant</Typography>
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
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
              <TextField
                label="Phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                required
              />
              <FormControl>
                <InputLabel>Subscription Plan</InputLabel>
                <Select
                  value={form.subscriptionPlan}
                  label="Subscription Plan"
                  onChange={(event) =>
                    setForm({ ...form, subscriptionPlan: event.target.value })
                  }
                >
                  <MenuItem value="Free">Free</MenuItem>
                  <MenuItem value="Pro">Pro</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Address"
                multiline
                minRows={3}
                sx={{ gridColumn: { md: '1 / -1' } }}
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                required
              />
            </Box>

            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Add Restaurant'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Card>

      <Card sx={{ backgroundColor: '#1A1715', borderRadius: '20px', overflow: 'hidden' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Typography variant="h6">All Restaurants</Typography>
        </Box>

        {loading ? (
          <Box sx={{ p: 4, color: 'text.secondary' }}>Loading restaurants...</Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Restaurant</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Admin Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {restaurants.map((restaurant) => (
                <TableRow key={restaurant._id}>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography sx={{ fontWeight: 700 }}>{restaurant.name}</Typography>
                      <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
                        {restaurant.address}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography>{restaurant.email}</Typography>
                      <Typography color="text.secondary">{restaurant.phone}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={restaurant.status}
                      color={restaurant.status === 'active' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={restaurant.subscriptionPlan}
                      sx={{
                        backgroundColor:
                          restaurant.subscriptionPlan === 'Pro'
                            ? 'rgba(255,140,43,0.14)'
                            : 'rgba(255,255,255,0.06)',
                        color:
                          restaurant.subscriptionPlan === 'Pro'
                            ? '#FF9E45'
                            : 'text.primary',
                      }}
                    />
                  </TableCell>
                  <TableCell>{restaurant.adminUsername}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          updateRestaurant(
                            restaurant._id,
                            {
                              status: restaurant.status === 'active' ? 'inactive' : 'active',
                            },
                            `Restaurant ${restaurant.status === 'active' ? 'disabled' : 'enabled'}.`
                          ).catch((updateError) => setError(updateError.message))
                        }
                      >
                        {restaurant.status === 'active' ? 'Disable' : 'Enable'}
                      </Button>
                      <FormControl size="small" sx={{ minWidth: 110 }}>
                        <Select
                          value={restaurant.subscriptionPlan}
                          onChange={(event) =>
                            updateRestaurant(
                              restaurant._id,
                              { subscriptionPlan: event.target.value },
                              `Plan updated to ${event.target.value}.`
                            ).catch((updateError) => setError(updateError.message))
                          }
                        >
                          <MenuItem value="Free">Free</MenuItem>
                          <MenuItem value="Pro">Pro</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}
