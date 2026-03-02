import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

const stats = [
  { title: 'Usuários Ativos', value: '1.247', delta: '+12% este mês' },
  { title: 'Pedidos',          value: '3.891', delta: '+8% este mês'  },
  { title: 'Receita',          value: 'R$ 48.520', delta: '+15% este mês' },
  { title: 'Satisfação',       value: '94%',   delta: '+2% este mês'  },
];

export default function StatsGrid() {
  return (
    <Grid container spacing={2}>
      {stats.map((s) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={s.title}>
          <Card data-testid={`stat-${s.title}`}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {s.title}
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary" sx={{ my: 0.5 }}>
                {s.value}
              </Typography>
              <Typography variant="caption" color="success.main">
                {s.delta}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
