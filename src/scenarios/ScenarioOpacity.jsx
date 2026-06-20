import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

const cards = [
  { id: 'opacity-card-1', label: 'Servidor Principal', value: '99.8%', bg: '#3b82f6' },
  { id: 'opacity-card-2', label: 'Banco de Dados',     value: '97.2%', bg: '#8b5cf6' },
  { id: 'opacity-card-3', label: 'Cache Redis',         value: '100%',  bg: '#059669' },
  { id: 'opacity-card-4', label: 'Fila de Mensagens',   value: '95.1%', bg: '#d97706' },
  { id: 'opacity-card-5', label: 'CDN',                 value: '99.9%', bg: '#0284c7' },
  { id: 'opacity-card-6', label: 'API Gateway',         value: '98.7%', bg: '#dc2626' },
];

export default function ScenarioOpacity() {
  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          Cenário: Opacidade e Transparência
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Seis cards com fundos coloridos sólidos. A mutação reduz a opacidade de três
          cards para 0.92, alterando muitos pixels de forma sutil e uniforme.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2.5 }}>
          {cards.map((c) => (
            <Card
              key={c.id}
              data-testid={c.id}
              sx={{ bgcolor: c.bg, borderRadius: 3, border: `2px solid ${c.bg}` }}
            >
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                  {c.label}
                </Typography>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, mt: 1 }}>
                  {c.value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Typography variant="body2" color="text.secondary">
            Área de controle estática — não é alterada pela mutação.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
