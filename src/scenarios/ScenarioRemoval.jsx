import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

const cards = [
  { id: 'removal-card-1', label: 'Dashboard',    desc: 'Painel principal com gráficos e KPIs',           accent: '#3b82f6', bg: '#eff6ff' },
  { id: 'removal-card-2', label: 'Usuários',      desc: 'Gestão de contas e permissões de acesso',        accent: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'removal-card-3', label: 'Transações',    desc: 'Histórico e acompanhamento de operações',        accent: '#059669', bg: '#ecfdf5' },
  { id: 'removal-card-4', label: 'Relatórios',    desc: 'Geração e exportação de relatórios periódicos',  accent: '#d97706', bg: '#fffbeb' },
  { id: 'removal-card-5', label: 'Configurações', desc: 'Parâmetros do sistema e integrações externas',   accent: '#64748b', bg: '#f1f5f9' },
  { id: 'removal-card-6', label: 'Suporte',       desc: 'Central de atendimento e tickets abertos',       accent: '#0284c7', bg: '#e0f2fe' },
];

export default function ScenarioRemoval() {
  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          Cenário: Remoção de Elemento
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Grade com seis cards de menu. A mutação oculta completamente um card,
          testando se as técnicas detectam a ausência e localizam a posição afetada.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2.5 }}>
          {cards.map((c) => (
            <Card
              key={c.id}
              data-testid={c.id}
              elevation={0}
              sx={{ border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: c.bg }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: c.accent }}>
                  {c.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.5 }}>
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
