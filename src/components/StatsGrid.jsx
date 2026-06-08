import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import SentimentSatisfiedAltRoundedIcon from '@mui/icons-material/SentimentSatisfiedAltRounded';

const stats = [
  { title: 'Usuários Ativos', value: '1.247', delta: '+12%', period: 'vs. mês anterior', Icon: PeopleAltRoundedIcon,                  accent: '#3b82f6', bg: '#eff6ff' },
  { title: 'Pedidos',          value: '3.891', delta: '+8%',  period: 'vs. mês anterior', Icon: ShoppingCartRoundedIcon,               accent: '#8b5cf6', bg: '#f5f3ff' },
  { title: 'Receita',          value: 'R$ 48.520', delta: '+15%', period: 'vs. mês anterior', Icon: AttachMoneyRoundedIcon,             accent: '#0284c7', bg: '#e0f2fe' },
  { title: 'Satisfação',       value: '94%',   delta: '+2%',  period: 'vs. mês anterior', Icon: SentimentSatisfiedAltRoundedIcon,      accent: '#f59e0b', bg: '#fffbeb' },
];

export default function StatsGrid() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
      {stats.map((s) => (
        <Card
          key={s.title}
          data-testid={`stat-${s.title}`}
          elevation={0}
          sx={{ borderLeft: `4px solid ${s.accent}`, borderRadius: 2, bgcolor: '#fff' }}
        >
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            {/* Ícone + Título */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.Icon sx={{ fontSize: 24, color: s.accent }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                {s.title}
              </Typography>
            </Box>

            {/* Valor */}
            <Typography variant="h4" fontWeight={800} sx={{ color: s.accent, mb: 1 }}>
              {s.value}
            </Typography>

            <Divider sx={{ mb: 1 }} />

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
      ))}
    </Box>
  );
}
