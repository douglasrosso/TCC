import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';

const links = [
  { label: 'Início',         active: true  },
  { label: 'Relatórios',     active: false },
  { label: 'Configurações',  active: false },
];

export default function NavBar() {
  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#0f172a', color: '#fff', borderBottom: '1px solid', borderColor: 'rgba(255,255,255,0.08)' }}>
      <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
        {/* Logo */}
        <DashboardRoundedIcon sx={{ color: '#60a5fa', mr: 1, fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', mr: 4 }}>
          VRT Demo
        </Typography>

        {/* Links */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.5, flexGrow: 1 }}>
          {links.map((link) => (
            <Button
              key={link.label}
              size="small"
              sx={{
                color: link.active ? '#60a5fa' : 'rgba(255,255,255,0.6)',
                fontWeight: link.active ? 600 : 400,
                px: 2,
                borderRadius: 2,
                ...(link.active && {
                  bgcolor: 'rgba(96,165,250,0.15)',
                }),
              }}
            >
              {link.label}
            </Button>
          ))}
        </Box>

        {/* Ações */}
        <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          <NotificationsNoneRoundedIcon fontSize="small" />
        </IconButton>
        <Avatar
          sx={{ width: 32, height: 32, bgcolor: '#2563eb', fontSize: '0.85rem', fontWeight: 600, ml: 1 }}
        >
          D
        </Avatar>
      </Toolbar>
    </AppBar>
  );
}
