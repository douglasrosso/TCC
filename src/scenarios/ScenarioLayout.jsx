import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';

const sections = [
  { id: 'layout-header',    title: 'Cabeçalho do Painel',     color: '#1e3a8a' },
  { id: 'layout-section-1', title: 'Seção A — Métricas',       color: '#f1f5f9' },
  { id: 'layout-section-2', title: 'Seção B — Transações',     color: '#fff' },
  { id: 'layout-section-3', title: 'Seção C — Relatórios',     color: '#f8fafc' },
  { id: 'layout-section-4', title: 'Seção D — Configurações',  color: '#fff' },
];

export default function ScenarioLayout() {
  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        data-testid="layout-header"
        sx={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          color: '#fff',
          py: 3,
          px: 3,
        }}
      >
        <Container maxWidth="md" disableGutters>
          <Typography variant="h5" fontWeight={700}>Cenário: Deslocamento de Layout</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
            Seções empilhadas verticalmente. A mutação insere margem na primeira seção, deslocando as demais.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 3 }}>
        {sections.slice(1).map((sec, i) => (
          <Card
            key={sec.id}
            data-testid={sec.id}
            sx={{ mb: 2, bgcolor: sec.color, borderRadius: 2, border: '1px solid #e2e8f0' }}
          >
            <CardContent sx={{ py: 3 }}>
              <Typography variant="h6" fontWeight={600}>{sec.title}</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3].map((n) => (
                  <Box
                    key={n}
                    sx={{
                      flex: 1,
                      height: 48,
                      bgcolor: i % 2 === 0 ? '#e2e8f0' : '#f1f5f9',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Bloco {n}
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
