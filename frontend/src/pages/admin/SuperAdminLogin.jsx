import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CssBaseline,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
} from '@mui/material';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import { adminTheme } from '../../theme/adminTheme';
import { getApiUrl } from '../../config/api';

export default function SuperAdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/admin/super/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      login(data);
      navigate('/super-admin');
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          px: 2,
          background:
            'radial-gradient(circle at top left, rgba(255,140,43,0.14), transparent 25%), linear-gradient(180deg, #1E1B18 0%, #12100E 100%)',
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 480,
            backgroundColor: '#1A1715',
            borderRadius: '24px',
            p: 4,
          }}
        >
          <Stack spacing={3}>
            <Stack spacing={2} alignItems="center" textAlign="center">
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '20px',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'linear-gradient(180deg, #FF9E45 0%, #FF8C2B 100%)',
                }}
              >
                <ShieldRoundedIcon sx={{ color: '#111111', fontSize: 30 }} />
              </Box>
              <Box>
                <Typography variant="h4">Lumina Super Admin</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Manage restaurants, plans, and platform access.
                </Typography>
              </Box>
            </Stack>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Box component="form" onSubmit={handleLogin}>
              <Stack spacing={2}>
                <TextField
                  label="Username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <Button variant="contained" type="submit" disabled={loading} sx={{ mt: 1 }}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </Stack>
            </Box>

            <Typography align="center" sx={{ color: 'text.secondary', fontSize: 13 }}>
              Demo credentials: superadmin / superadmin123
            </Typography>
          </Stack>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
