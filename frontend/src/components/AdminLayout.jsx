import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  Stack,
  ThemeProvider,
  Typography,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import { alpha } from '@mui/material/styles';
import { adminSurfaces, adminTheme } from '../theme/adminTheme';

const drawerWidth = 240;

const navItems = [
  { label: 'Live Orders', path: '/admin', icon: DashboardRoundedIcon },
  { label: 'Menu Items', path: '/admin/menu', icon: RestaurantMenuRoundedIcon },
  { label: 'Categories', path: '/admin/categories', icon: CategoryRoundedIcon },
  { label: 'Tables & QR', path: '/admin/tables', icon: QrCode2RoundedIcon },
  { label: 'Billing', path: '/admin/billing', icon: ReceiptLongRoundedIcon },
];

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
        transition: 'all 180ms ease',
        '&:hover': {
          background: active
            ? 'linear-gradient(180deg, #FFAA59 0%, #FF8C2B 100%)'
            : 'rgba(255,255,255,0.03)',
          transform: 'translateX(2px)',
        },
      }}
    >
      <Icon sx={{ fontSize: 21 }} />
      <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{label}</Typography>
    </Box>
  );
}

export default function AdminLayout({ children }) {
  const { logout } = useAuth();
  const location = useLocation();
  const [appearanceOn] = useState(true);

  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: adminSurfaces.page,
          color: 'text.primary',
        }}
      >
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
                  <StorefrontRoundedIcon sx={{ color: '#111111', fontSize: 24 }} />
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
                    Admin Panel
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Divider />

            <Stack spacing={1.1} sx={{ px: 2.5, py: 3 }}>
              {navItems.map(({ icon, label, path }) => (
                <SidebarLink
                  key={path}
                  to={path}
                  icon={icon}
                  label={label}
                  active={location.pathname === path}
                />
              ))}
            </Stack>

            <Box sx={{ mt: 'auto' }}>
              <Divider />
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 3.5, py: 3 }}
              >
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Appearance</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                    {appearanceOn ? 'Dark premium mode' : 'Muted mode'}
                  </Typography>
                </Box>
                <IconButton
                  sx={{
                    width: 40,
                    height: 40,
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#F2E8D8',
                  }}
                >
                  <DarkModeRoundedIcon />
                </IconButton>
              </Stack>
              <Box sx={{ px: 2.5, pb: 3 }}>
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
                    transition: 'all 180ms ease',
                    '&:hover': {
                      background: 'rgba(239, 68, 68, 0.08)',
                    },
                  }}
                >
                  <LogoutRoundedIcon sx={{ fontSize: 21 }} />
                  <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Exit Admin</Typography>
                </Box>
              </Box>
            </Box>
          </Stack>
        </Drawer>

        <Box
          component="main"
          sx={{
            ml: `${drawerWidth}px`,
            minHeight: '100vh',
            p: { xs: 3, md: 4 },
          }}
        >
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
