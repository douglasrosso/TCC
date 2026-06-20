import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';

const cards = [
  { id: 'comp-card-1', label: 'Usuários',    value: '1.247',      icon: PeopleAltRoundedIcon,     accent: '#3b82f6', bg: '#eff6ff' },
  { id: 'comp-card-2', label: 'Pedidos',      value: '3.891',      icon: ShoppingCartRoundedIcon,  accent: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'comp-card-3', label: 'Receita',      value: 'R$ 48.520',  icon: AttachMoneyRoundedIcon,   accent: '#059669', bg: '#ecfdf5' },
  { id: 'comp-card-4', label: 'Crescimento',  value: '+15%',       icon: TrendingUpRoundedIcon,    accent: '#d97706', bg: '#fffbeb' },
  { id: 'comp-card-5', label: 'Bugs Abertos', value: '23',         icon: BugReportRoundedIcon,     accent: '#64748b', bg: '#f1f5f9' },
  { id: 'comp-card-6', label: 'Latência',     value: '142 ms',     icon: SpeedRoundedIcon,         accent: '#0284c7', bg: '#e0f2fe' },
];

export default function ScenarioComponent() {
  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          Cenário: Alteração Localizada de Componente
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Grade de seis cards independentes. A mutação altera o conteúdo e o estilo
          de apenas um card, mantendo os demais inalterados.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2.5 }}>
          {cards.map((c) => (
            <Card
              key={c.id}
              data-testid={c.id}
              sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: c.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <c.icon sx={{ fontSize: 22, color: c.accent }} />
                  </Box>
                  <Typography variant="subtitle2" className="card-label">
                    {c.label}
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} className="card-value">
                  {c.value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Typography variant="body2" color="text.secondary">
            Área de controle estática — esta seção permanece inalterada e serve como
            referência para verificar a capacidade de isolamento das técnicas.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
