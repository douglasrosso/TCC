import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function HeroBanner() {
  return (
    <Box
      sx={{
        bgcolor: 'primary.dark',
        color: '#fff',
        px: 3,
        py: 4,
      }}
    >
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Painel de Controle
      </Typography>
      <Typography variant="body1" sx={{ opacity: 0.8 }}>
        Visão geral do sistema de monitoramento
      </Typography>
    </Box>
  );
}
