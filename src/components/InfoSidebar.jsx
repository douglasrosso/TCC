import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const infoItems = [
  { label: 'Data Atual',   id: 'current-date',  dynamic: true,  Icon: CalendarTodayRoundedIcon, accent: '#3b82f6' },
  { label: 'Hora',         id: 'current-time',  dynamic: true,  Icon: AccessTimeRoundedIcon,    accent: '#8b5cf6' },
  { label: 'Visitas Hoje', id: 'visit-counter', dynamic: true,  Icon: VisibilityRoundedIcon,    accent: '#059669' },
  { label: 'Versão',       value: '2.1.0',      dynamic: false, Icon: InfoOutlinedIcon,         accent: '#64748b' },
];

function getDynamicValue(id) {
  if (id === 'current-date')    return new Date().toLocaleDateString('pt-BR');
  if (id === 'current-time')    return new Date().toLocaleTimeString('pt-BR');
  if (id === 'visit-counter')   return String(Math.floor(Math.random() * 500 + 100));
  return '--';
}

export default function InfoSidebar() {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: 2.5 } }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Informações do Sistema</Typography>

        {infoItems.map((item, i) => (
          <Box key={item.label}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: `${item.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.Icon sx={{ fontSize: 18, color: item.accent }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                  {item.label}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  id={item.id}
                  data-testid={item.id}
                  sx={{ lineHeight: 1.3 }}
                >
                  {item.dynamic ? getDynamicValue(item.id) : item.value}
                </Typography>
              </Box>
            </Box>
            {i < infoItems.length - 1 && <Divider />}
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
