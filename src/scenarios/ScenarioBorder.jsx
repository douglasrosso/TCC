import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

const cards = [
  { id: 'border-card-1', label: 'Entrada',     value: '3.240',   borderColor: '#3b82f6' },
  { id: 'border-card-2', label: 'Processamento', value: '2.891', borderColor: '#8b5cf6' },
  { id: 'border-card-3', label: 'Saída',        value: '3.102',   borderColor: '#059669' },
  { id: 'border-card-4', label: 'Erros',        value: '47',      borderColor: '#dc2626' },
  { id: 'border-card-5', label: 'Timeout',      value: '12',      borderColor: '#d97706' },
  { id: 'border-card-6', label: 'Retry',        value: '89',      borderColor: '#64748b' },
];

export default function ScenarioBorder() {
  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          Cenário: Borda Fina
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Cards com bordas coloridas de 2px. A mutação altera a cor da borda de dois
          cards, afetando poucos pixels mas alterando a identidade visual do componente.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2.5 }}>
          {cards.map((c) => (
            <Card
              key={c.id}
              data-testid={c.id}
              elevation={0}
              sx={{
                border: `2px solid ${c.borderColor}`,
                borderRadius: 2,
                bgcolor: '#fff',
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {c.label}
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: c.borderColor, mt: 1 }}>
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
