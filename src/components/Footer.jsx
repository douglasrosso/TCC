import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

export default function Footer() {
  return (
    <>
      <Divider sx={{ mt: 4 }} />
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body2" color="text.secondary">
          &copy; 2025 VRT Demo &mdash; Trabalho de Conclusão de Curso
        </Typography>
      </Box>
    </>
  );
}
