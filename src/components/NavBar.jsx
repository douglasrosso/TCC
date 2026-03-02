import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

const links = ['Início', 'Relatórios', 'Configurações'];

export default function NavBar() {
  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
          VRT Demo
        </Typography>

        <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
          {links.map((label) => (
            <Button key={label} color="inherit" size="small">
              {label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
