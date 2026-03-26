import { alpha, createTheme } from '@mui/material/styles';

export const adminTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF8C2B',
      light: '#FFB56B',
      dark: '#D96E12',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2563EB',
    },
    success: {
      main: '#16A34A',
    },
    warning: {
      main: '#FBBF24',
    },
    info: {
      main: '#3B82F6',
    },
    error: {
      main: '#EF4444',
    },
    background: {
      default: '#12100E',
      paper: '#1A1715',
    },
    text: {
      primary: '#F9F5EF',
      secondary: '#A1A1AA',
    },
    divider: 'rgba(255,255,255,0.05)',
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: '"Inter", "Poppins", "Segoe UI", sans-serif',
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      color: '#A1A1AA',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(circle at top right, rgba(255,140,43,0.08), transparent 28%), linear-gradient(180deg, #1E1B18 0%, #12100E 100%)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'rgba(28, 24, 21, 0.95)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(18px)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 18px 45px rgba(0, 0, 0, 0.24)',
          border: '1px solid rgba(255,255,255,0.05)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 46,
          boxShadow: 'none',
        },
        containedPrimary: {
          background: 'linear-gradient(180deg, #FF9F47 0%, #FF8C2B 100%)',
          '&:hover': {
            background: 'linear-gradient(180deg, #FFAA5E 0%, #FF8C2B 100%)',
            boxShadow: '0 14px 28px rgba(255, 140, 43, 0.2)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: '#221F1C',
        },
        notchedOutline: {
          borderColor: 'rgba(255,255,255,0.06)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        },
        head: {
          color: '#A1A1AA',
          fontWeight: 700,
        },
      },
    },
  },
});

export const adminSurfaces = {
  page: 'linear-gradient(180deg, #1E1B18 0%, #12100E 100%)',
  sidebar: 'rgba(28, 24, 21, 0.92)',
  panel: '#1A1715',
  card: '#221F1C',
  cardHover: '#2A2521',
  border: 'rgba(255,255,255,0.05)',
  glow: alpha('#FF8C2B', 0.18),
};
