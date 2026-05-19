import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

const cards = [
  { id: 'shadow-card-1', label: 'Relatórios',    desc: '24 pendentes',   accent: '#3b82f6' },
  { id: 'shadow-card-2', label: 'Notificações',  desc: '8 novas',        accent: '#8b5cf6' },
  { id: 'shadow-card-3', label: 'Alertas',        desc: '3 críticos',     accent: '#dc2626' },
  { id: 'shadow-card-4', label: 'Tarefas',        desc: '12 em andamento', accent: '#059669' },
  { id: 'shadow-card-5', label: 'Deploys',        desc: '5 hoje',         accent: '#d97706' },
  { id: 'shadow-card-6', label: 'Incidentes',     desc: '0 abertos',      accent: '#64748b' },
];

export default function ScenarioShadow() {
  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          Cenário: Sombra e Elevação
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Cards planos sem sombra. A mutação adiciona box-shadow em três cards,
          produzindo diferenças graduais nos pixels ao redor das bordas.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2.5 }}>
          {cards.map((c) => (
            <Card
              key={c.id}
              data-testid={c.id}
              elevation={0}
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                borderTop: `3px solid ${c.accent}`,
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: c.accent }}>
                  {c.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {c.desc}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Typography variant="body2" color="text.secondary">
            Área de controle estática — permanece inalterada pela mutação.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
