import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { useNavigate } from 'react-router-dom';

const links = [
  { label: 'Início',         active: true  },
  { label: 'Relatórios',     active: false },
  { label: 'Configurações',  active: false },
];

export default function NavBar() {
  const navigate = useNavigate();

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#fff', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
        {/* Logo */}
        <DashboardRoundedIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark', mr: 4 }}>
          VRT Demo
        </Typography>

        {/* Links */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.5, flexGrow: 1 }}>
          {links.map((link) => (
            <Button
              key={link.label}
              size="small"
              sx={{
                color: link.active ? 'primary.main' : 'text.secondary',
                bgcolor: link.active ? 'primary.light' : 'transparent',
                opacity: link.active ? 0.15 : 1,
                fontWeight: link.active ? 600 : 400,
                px: 2,
                borderRadius: 2,
                ...(link.active && {
                  opacity: 1,
                  bgcolor: 'rgba(30, 64, 175, 0.08)',
                }),
              }}
            >
              {link.label}
            </Button>
          ))}
        </Box>

        {/* Ações */}
        <IconButton size="small" sx={{ color: 'text.secondary' }}>
          <NotificationsNoneRoundedIcon fontSize="small" />
        </IconButton>
        <Avatar
          sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 600, ml: 1 }}
        >
          D
        </Avatar>
      </Toolbar>
    </AppBar>
  );
}
