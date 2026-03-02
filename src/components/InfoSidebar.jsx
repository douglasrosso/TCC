import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';

const infoItems = [
  { label: 'Data Atual', id: 'current-date',    dynamic: true  },
  { label: 'Hora',       id: 'current-time',    dynamic: true  },
  { label: 'Visitas Hoje', id: 'visit-counter', dynamic: true  },
  { label: 'Versão',     value: '2.1.0',        dynamic: false },
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
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Informações
        </Typography>
        <Divider sx={{ mb: 1 }} />

        {infoItems.map((item, i) => (
          <Box key={item.label}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {item.label}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={600}
                id={item.id}
                data-testid={item.id}
              >
                {item.dynamic ? getDynamicValue(item.id) : item.value}
              </Typography>
            </Box>
            {i < infoItems.length - 1 && <Divider />}
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
