import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export default function HeroBanner() {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
        color: '#fff',
        py: { xs: 3, sm: 4 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />}
          sx={{ mb: 2 }}
        >
          <Link underline="hover" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Início</Link>
          <Typography sx={{ color: '#fff', fontSize: '0.85rem' }}>Dashboard</Typography>
        </Breadcrumbs>

        <Typography variant="h3" fontWeight={800} sx={{ mb: 1, letterSpacing: '-0.5px' }}>
          Painel Administrativo
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', maxWidth: 600, fontSize: '1.05rem', lineHeight: 1.6 }}>
          Acompanhe métricas, transações e a saúde geral do sistema em tempo real.
        </Typography>
      </Container>
    </Box>
  );
}
