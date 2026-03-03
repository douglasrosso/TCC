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
        borderColor: 'divider',
        bgcolor: '#fff',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        &copy; 2025 VRT Demo &mdash; Trabalho de Conclusão de Curso
      </Typography>
    </Box>
  );
}
