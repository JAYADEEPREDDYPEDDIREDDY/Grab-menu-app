import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';

const tagColors = {
  soon: 'warning',
  live: 'success',
  planned: 'info',
};

export default function AdminPlaceholder({
  title,
  description,
  label = 'Planned',
  tone = 'planned',
}) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="subtitle1">{description}</Typography>
      </Box>

      <Card
        sx={{
          maxWidth: 780,
          backgroundColor: '#1A1715',
          borderRadius: '20px',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Chip
              label={label}
              color={tagColors[tone] || 'info'}
              sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
            />

            <Box>
              <Typography variant="h5" sx={{ mb: 1.5 }}>
                This area is ready for the next admin module
              </Typography>
              <Typography color="text.secondary">
                The new shell, spacing, and dark visual language are already in place, so
                we can add categories, billing flows, and merged-table controls without
                redesigning the admin frame again.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<AutoAwesomeRoundedIcon />}
              sx={{
                alignSelf: 'flex-start',
                borderColor: 'rgba(255,255,255,0.08)',
                color: 'text.primary',
              }}
            >
              Future-ready layout
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
