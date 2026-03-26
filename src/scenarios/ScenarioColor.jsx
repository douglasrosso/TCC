import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

const cards = [
  { label: 'Informação', desc: 'Sistema operacional', bg: '#3b82f6', id: 'color-card-1' },
  { label: 'Sucesso',    desc: 'Deploy concluído',    bg: '#059669', id: 'color-card-2' },
  { label: 'Alerta',     desc: 'Uso elevado de CPU',  bg: '#d97706', id: 'color-card-3' },
  { label: 'Erro',       desc: 'Timeout na API',      bg: '#dc2626', id: 'color-card-4' },
  { label: 'Neutro',     desc: 'Manutenção prevista',  bg: '#64748b', id: 'color-card-5' },
  { label: 'Destaque',   desc: 'Nova versão',          bg: '#8b5cf6', id: 'color-card-6' },
];

export default function ScenarioColor() {
  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          Cenário: Mudança Sutil de Cor
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Seis cards com cores distintas. A mutação altera levemente o tom de dois cards.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2.5 }}>
          {cards.map((c) => (
            <Card
              key={c.id}
              data-testid={c.id}
              sx={{ bgcolor: c.bg, border: `2px solid ${c.bg}`, borderRadius: 3 }}
            >
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                  {c.label}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
                  {c.desc}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Typography variant="body2" color="text.secondary">
            Área de controle estática — esta seção não é alterada pela mutação e serve
            como referência para verificar se as técnicas detectam apenas as regiões modificadas.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
