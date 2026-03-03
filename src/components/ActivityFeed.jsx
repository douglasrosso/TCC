import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

const events = [
  { icon: CheckCircleOutlineRoundedIcon, color: '#059669', bg: '#ecfdf5', text: 'Deploy v2.1.0 concluído', time: '2 min atrás' },
  { icon: WarningAmberRoundedIcon,       color: '#d97706', bg: '#fffbeb', text: 'Latência elevada na API',  time: '15 min atrás' },
  { icon: InfoOutlinedIcon,              color: '#0284c7', bg: '#e0f2fe', text: 'Backup automático realizado', time: '1h atrás' },
  { icon: ErrorOutlineRoundedIcon,       color: '#dc2626', bg: '#fee2e2', text: 'Falha no job de e-mail',    time: '3h atrás' },
];

export default function ActivityFeed() {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: 2.5 } }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Atividade Recente</Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {events.map((ev, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                p: 1.25,
                borderRadius: 2,
                bgcolor: '#f8fafc',
              }}
            >
              <Avatar sx={{ width: 30, height: 30, bgcolor: ev.bg }}>
                <ev.icon sx={{ fontSize: 17, color: ev.color }} />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={500} sx={{ lineHeight: 1.3 }}>
                  {ev.text}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {ev.time}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
