import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';

const sections = [
  { id: 'micro-header', title: 'Painel de Controle', isHeader: true },
  { id: 'micro-section-1', title: 'Estatísticas Gerais' },
  { id: 'micro-section-2', title: 'Atividade Recente' },
  { id: 'micro-section-3', title: 'Configurações do Sistema' },
  { id: 'micro-section-4', title: 'Logs de Auditoria' },
];

export default function ScenarioMicroShift() {
  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Box
        data-testid="micro-header"
        sx={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#fff',
          py: 3,
          px: 3,
        }}
      >
        <Container maxWidth="md" disableGutters>
          <Typography variant="h5" fontWeight={700}>
            Cenário: Micro-deslocamento (1px)
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
            Seções empilhadas. A mutação desloca a primeira seção em apenas 1px,
            testando a sensibilidade mínima de cada técnica.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 3 }}>
        {sections.filter(s => !s.isHeader).map((sec, i) => (
          <Card
            key={sec.id}
            data-testid={sec.id}
            sx={{ mb: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}
          >
            <CardContent sx={{ py: 3 }}>
              <Typography variant="h6" fontWeight={600}>{sec.title}</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4].map((n) => (
                  <Box
                    key={n}
                    sx={{
                      flex: 1,
                      height: 40,
                      bgcolor: i % 2 === 0 ? '#f1f5f9' : '#e2e8f0',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {n}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Container>
    </Box>
  );
}
