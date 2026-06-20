import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

const cards = [
  { id: 'identical-card-1', label: 'Uptime',       value: '99.9%',  accent: '#059669' },
  { id: 'identical-card-2', label: 'Latência',      value: '142ms',  accent: '#3b82f6' },
  { id: 'identical-card-3', label: 'Throughput',     value: '1.2k/s', accent: '#8b5cf6' },
  { id: 'identical-card-4', label: 'Taxa de Erro',   value: '0.03%',  accent: '#dc2626' },
  { id: 'identical-card-5', label: 'Conexões',       value: '847',    accent: '#d97706' },
  { id: 'identical-card-6', label: 'Cache Hit',      value: '94%',    accent: '#0284c7' },
];

export default function ScenarioIdentical() {
  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          Cenário: Imagem Idêntica (Controle)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Página totalmente estática sem nenhuma mutação. Baseline e current são
          capturados nas mesmas condições. Testa se alguma técnica gera falso positivo.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2.5 }}>
          {cards.map((c) => (
            <Card
              key={c.id}
              data-testid={c.id}
              elevation={0}
              sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {c.label}
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: c.accent, mt: 1 }}>
                  {c.value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Typography variant="body2" color="text.secondary">
            Área de controle — toda a página é estática. Nenhuma mutação é aplicada.
            Se alguma técnica reportar diferença, trata-se de falso positivo.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
