import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  CssBaseline,
  Divider,
  Drawer,
  Stack,
  ThemeProvider,
  Typography,
} from '@mui/material';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { alpha } from '@mui/material/styles';
import { adminSurfaces, adminTheme } from '../theme/adminTheme';

const drawerWidth = 260;

function SidebarLink({ active, icon: Icon, label, to }) {
  return (
    <Box
      component={NavLink}
      to={to}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2.25,
        py: 1.6,
        borderRadius: '18px',
        textDecoration: 'none',
        color: active ? '#FFFFFF' : '#C9B9A6',
        background: active
          ? 'linear-gradient(180deg, #FF9E45 0%, #FF8C2B 100%)'
          : 'transparent',
        boxShadow: active ? '0 18px 35px rgba(255, 140, 43, 0.22)' : 'none',
      }}
    >
      <Icon sx={{ fontSize: 21 }} />
      <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{label}</Typography>
    </Box>
  );
}

export default function SuperAdminLayout({ children }) {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', background: adminSurfaces.page, color: 'text.primary' }}>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <Stack sx={{ height: '100%' }}>
            <Box sx={{ p: 3.5 }}>
              <Stack direction="row" spacing={1.75} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '16px',
                    display: 'grid',
                    placeItems: 'center',
                    background:
                      'linear-gradient(180deg, rgba(255,140,43,0.95) 0%, rgba(255,140,43,0.72) 100%)',
                    boxShadow: `0 16px 34px ${alpha('#FF8C2B', 0.22)}`,
                  }}
                >
                  <ShieldRoundedIcon sx={{ color: '#111111', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>
                    Lumina
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: '#D3B38C',
                    }}
                  >
                    Super Admin
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Divider />

            <Stack spacing={1.1} sx={{ px: 2.5, py: 3 }}>
              <SidebarLink
                to="/super-admin"
                label="Restaurants"
                icon={StorefrontRoundedIcon}
                active={location.pathname === '/super-admin'}
              />
            </Stack>

            <Box sx={{ mt: 'auto', px: 2.5, pb: 3 }}>
              <Box
                component="button"
                onClick={logout}
                sx={{
                  width: '100%',
                  border: 0,
                  outline: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2.25,
                  py: 1.6,
                  borderRadius: '18px',
                  color: '#FF6B6B',
                  background: 'transparent',
                }}
              >
                <LogoutRoundedIcon sx={{ fontSize: 21 }} />
                <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Exit Portal</Typography>
              </Box>
            </Box>
          </Stack>
        </Drawer>

        <Box component="main" sx={{ ml: `${drawerWidth}px`, minHeight: '100vh', p: { xs: 3, md: 4 } }}>
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              pointerEvents: 'none',
              background:
                'radial-gradient(circle at 88% 8%, rgba(255,140,43,0.10), transparent 18%)',
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
