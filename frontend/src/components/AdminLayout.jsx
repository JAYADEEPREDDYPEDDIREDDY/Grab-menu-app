import { NavLink, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Avatar,
  Box,
  Chip,
  CssBaseline,
  Divider,
  Drawer,
  Stack,
  ThemeProvider,
  Typography,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import { alpha } from '@mui/material/styles';
import { createAdminTheme, getAdminSurfaces, themeOptions } from '../theme/adminTheme';

const drawerWidth = 240;

const navItems = [
  { label: 'Live Orders', path: '/admin', icon: DashboardRoundedIcon },
  { label: 'Analytics', path: '/admin/analytics', icon: InsightsRoundedIcon },
  { label: 'Menu Items', path: '/admin/menu', icon: RestaurantMenuRoundedIcon },
  { label: 'Categories', path: '/admin/categories', icon: CategoryRoundedIcon },
  { label: 'Import Menu', path: '/admin/menu/import', icon: UploadFileRoundedIcon },
  { label: 'Tables & QR', path: '/admin/tables', icon: QrCode2RoundedIcon },
  { label: 'Billing', path: '/admin/billing', icon: ReceiptLongRoundedIcon },
  { label: 'Settings', path: '/admin/settings', icon: PaletteRoundedIcon },
];

function SidebarLink({ active, icon: Icon, label, to, primaryColor }) {
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
          ? `linear-gradient(180deg, ${alpha(primaryColor, 0.92)} 0%, ${primaryColor} 100%)`
          : 'transparent',
        boxShadow: active ? `0 18px 35px ${alpha(primaryColor, 0.22)}` : 'none',
        transition: 'all 180ms ease',
        '&:hover': {
          background: active
            ? `linear-gradient(180deg, ${alpha(primaryColor, 0.88)} 0%, ${primaryColor} 100%)`
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
  const { logout, restaurant } = useAuth();
  const location = useLocation();
  const themeKey = restaurant?.dashboardTheme || 'amber';
  const surfaces = useMemo(() => getAdminSurfaces(themeKey), [themeKey]);
  const theme = useMemo(() => createAdminTheme(themeKey), [themeKey]);
  const activeTheme = themeOptions[themeKey] || themeOptions.amber;
  const restaurantName = restaurant?.name || 'Restaurant Portal';
  const initials = restaurantName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'RP';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: surfaces.page,
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
              <Stack spacing={1.75}>
                <Stack direction="row" spacing={1.75} alignItems="center">
                  {restaurant?.logoUrl ? (
                    <Avatar
                      src={restaurant.logoUrl}
                      alt={restaurantName}
                      variant="rounded"
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backgroundColor: '#221F1C',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '16px',
                        display: 'grid',
                        placeItems: 'center',
                        background: `linear-gradient(180deg, ${alpha(activeTheme.primary, 0.95)} 0%, ${alpha(activeTheme.primary, 0.72)} 100%)`,
                        boxShadow: `0 16px 34px ${alpha(activeTheme.primary, 0.22)}`,
                      }}
                    >
                      <Typography sx={{ color: '#111111', fontWeight: 800, fontSize: 18 }}>
                        {initials}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: 700,
                        lineHeight: 1.1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {restaurantName}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 12,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: activeTheme.accent,
                      }}
                    >
                      Restaurant Admin
                    </Typography>
                  </Box>
                </Stack>

                <Chip
                  size="small"
                  icon={<StorefrontRoundedIcon sx={{ color: `${activeTheme.primary} !important` }} />}
                  label={restaurant?.subscriptionPlan ? `${restaurant.subscriptionPlan} plan` : 'Operations dashboard'}
                  sx={{
                    alignSelf: 'flex-start',
                    backgroundColor: alpha(activeTheme.primary, 0.12),
                    color: '#F9F5EF',
                    '& .MuiChip-label': {
                      px: 1.2,
                    },
                  }}
                />
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
                  primaryColor={activeTheme.primary}
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
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Current Theme</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                    {activeTheme.label}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: alpha(activeTheme.primary, 0.14),
                    color: activeTheme.primary,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <PaletteRoundedIcon fontSize="small" />
                </Box>
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
              background: surfaces.shellAccent,
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
