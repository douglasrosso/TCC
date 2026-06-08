import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        textAlign: 'center',
        py: 3,
        px: 2,
        mt: 'auto',
        borderTop: '1px solid',
        borderColor: 'rgba(255,255,255,0.08)',
        bgcolor: '#0f172a',
      }}
    >
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
        &copy; 2025 VRT Demo &mdash; Trabalho de Conclusão de Curso
      </Typography>
    </Box>
  );
}
