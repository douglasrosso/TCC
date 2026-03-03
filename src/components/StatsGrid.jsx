import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import SentimentSatisfiedAltRoundedIcon from '@mui/icons-material/SentimentSatisfiedAltRounded';

const stats = [
  { title: 'Usuários Ativos', value: '1.247', delta: '+12%', period: 'vs. mês anterior', Icon: PeopleAltRoundedIcon,                  accent: '#3b82f6', bg: '#eff6ff' },
  { title: 'Pedidos',          value: '3.891', delta: '+8%',  period: 'vs. mês anterior', Icon: ShoppingCartRoundedIcon,               accent: '#8b5cf6', bg: '#f5f3ff' },
  { title: 'Receita',          value: 'R$ 48.520', delta: '+15%', period: 'vs. mês anterior', Icon: AttachMoneyRoundedIcon,             accent: '#059669', bg: '#ecfdf5' },
  { title: 'Satisfação',       value: '94%',   delta: '+2%',  period: 'vs. mês anterior', Icon: SentimentSatisfiedAltRoundedIcon,      accent: '#f59e0b', bg: '#fffbeb' },
];

export default function StatsGrid() {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
      {stats.map((s) => (
        <Box key={s.title} sx={{ flex: '1 1 200px', minWidth: 0 }}>
          <Card data-testid={`stat-${s.title}`} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              {/* Ícone + Título */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.Icon sx={{ fontSize: 22, color: s.accent }} />
                </Box>
                <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
                  {s.title}
                </Typography>
              </Box>

              {/* Valor */}
              <Typography variant="h5" fontWeight={700} sx={{ color: 'text.primary', mb: 0.75 }}>
                {s.value}
              </Typography>

              {/* Delta */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUpRoundedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="caption" fontWeight={600} sx={{ color: 'success.main' }}>
                  {s.delta}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', ml: 0.25 }}>
                  {s.period}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
}
