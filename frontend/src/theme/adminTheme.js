import { alpha, createTheme } from '@mui/material/styles';

export const themeOptions = {
  amber: {
    key: 'amber',
    label: 'Amber Glow',
    primary: '#FF8C2B',
    light: '#FFB56B',
    dark: '#D96E12',
    accent: '#D3B38C',
    page:
      'radial-gradient(circle at top right, rgba(255,140,43,0.10), transparent 28%), linear-gradient(180deg, #1E1B18 0%, #12100E 100%)',
    shell:
      'radial-gradient(circle at 88% 8%, rgba(255,140,43,0.10), transparent 18%)',
  },
  emerald: {
    key: 'emerald',
    label: 'Emerald Lounge',
    primary: '#22C55E',
    light: '#5EE18A',
    dark: '#15803D',
    accent: '#A6D7B2',
    page:
      'radial-gradient(circle at top right, rgba(34,197,94,0.10), transparent 28%), linear-gradient(180deg, #171D1A 0%, #0E1310 100%)',
    shell:
      'radial-gradient(circle at 88% 8%, rgba(34,197,94,0.10), transparent 18%)',
  },
  ocean: {
    key: 'ocean',
    label: 'Ocean Night',
    primary: '#3B82F6',
    light: '#72A8FF',
    dark: '#1D4ED8',
    accent: '#A5C3F7',
    page:
      'radial-gradient(circle at top right, rgba(59,130,246,0.10), transparent 28%), linear-gradient(180deg, #161A22 0%, #0D1016 100%)',
    shell:
      'radial-gradient(circle at 88% 8%, rgba(59,130,246,0.10), transparent 18%)',
  },
  rose: {
    key: 'rose',
    label: 'Rose Velvet',
    primary: '#F43F5E',
    light: '#FF7B92',
    dark: '#BE123C',
    accent: '#E5A8B5',
    page:
      'radial-gradient(circle at top right, rgba(244,63,94,0.10), transparent 28%), linear-gradient(180deg, #201518 0%, #130C0E 100%)',
    shell:
      'radial-gradient(circle at 88% 8%, rgba(244,63,94,0.10), transparent 18%)',
  },
};

const getThemePreset = (themeKey = 'amber') => themeOptions[themeKey] || themeOptions.amber;

export const getAdminSurfaces = (themeKey = 'amber') => {
  const preset = getThemePreset(themeKey);

  return {
    page: preset.page,
    sidebar: alpha('#1C1815', 0.92),
    panel: '#1A1715',
    card: '#221F1C',
    cardHover: '#2A2521',
    border: 'rgba(255,255,255,0.05)',
    glow: alpha(preset.primary, 0.18),
    shellAccent: preset.shell,
    primary: preset.primary,
    accent: preset.accent,
  };
};

export const createAdminTheme = (themeKey = 'amber') => {
  const preset = getThemePreset(themeKey);

  return createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: preset.primary,
        light: preset.light,
        dark: preset.dark,
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
            background: preset.page,
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
            background: `linear-gradient(180deg, ${preset.light} 0%, ${preset.primary} 100%)`,
            '&:hover': {
              background: `linear-gradient(180deg, ${alpha(preset.light, 0.96)} 0%, ${preset.primary} 100%)`,
              boxShadow: `0 14px 28px ${alpha(preset.primary, 0.2)}`,
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
};

export const adminTheme = createAdminTheme('amber');
export const adminSurfaces = getAdminSurfaces('amber');
