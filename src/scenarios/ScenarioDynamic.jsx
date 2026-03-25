import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';

const staticCards = [
  { title: 'Servidor A', status: 'Operacional', color: '#059669' },
  { title: 'Servidor B', status: 'Operacional', color: '#059669' },
  { title: 'Servidor C', status: 'Operacional', color: '#059669' },
];

export default function ScenarioDynamic() {
  const now = new Date();
  const time = now.toLocaleTimeString('pt-BR');
  const date = now.toLocaleDateString('pt-BR');
  const visitors = Math.floor(Math.random() * 9000 + 1000);
  const cpu = Math.floor(Math.random() * 60 + 20);
  const memory = Math.floor(Math.random() * 40 + 40);
  const requests = Math.floor(Math.random() * 800 + 100);

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          Cenário: Conteúdo Dinâmico
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Página com seções estáticas e uma coluna dinâmica (hora, contadores aleatórios).
          Sem congelamento, cada captura produz valores diferentes na área dinâmica.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 2.5 }}>
          {/* Coluna estática (esquerda) */}
          <Box>
            <Card sx={{ mb: 2, border: '1px solid #e2e8f0' }} data-testid="dynamic-static-1">
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
                  Status dos Servidores
                </Typography>
                {staticCards.map((s, i) => (
                  <Box key={s.title}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                      <Typography variant="body2" fontWeight={500}>{s.title}</Typography>
                      <Typography variant="body2" sx={{ color: s.color, fontWeight: 600 }}>
                        {s.status}
                      </Typography>
                    </Box>
                    {i < staticCards.length - 1 && <Divider />}
                  </Box>
                ))}
              </CardContent>
            </Card>

            <Card sx={{ border: '1px solid #e2e8f0' }} data-testid="dynamic-static-2">
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  Configuração Fixa
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  Região: sa-east-1. Instâncias: 3 réplicas ativas.
                  Balanceador: round-robin. Timeout: 30 segundos.
                  Cache: habilitado (TTL 300s). SSL: TLS 1.3.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Coluna dinâmica (direita) */}
          <Box>
            <Card sx={{ mb: 2, border: '1px solid #e2e8f0' }} data-testid="dynamic-live">
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
                  Dados em Tempo Real
                </Typography>

                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Data</Typography>
                  <Typography variant="h6" fontWeight={700} data-testid="dyn-date">{date}</Typography>
                </Box>
                <Divider />
                <Box sx={{ my: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Hora</Typography>
                  <Typography variant="h6" fontWeight={700} data-testid="dyn-time">{time}</Typography>
                </Box>
                <Divider />
                <Box sx={{ my: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Visitantes</Typography>
                  <Typography variant="h6" fontWeight={700} data-testid="dyn-visitors">{visitors}</Typography>
                </Box>
                <Divider />
                <Box sx={{ my: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">CPU</Typography>
                  <Typography variant="h6" fontWeight={700} data-testid="dyn-cpu">{cpu}%</Typography>
                </Box>
                <Divider />
                <Box sx={{ my: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Memória</Typography>
                  <Typography variant="h6" fontWeight={700} data-testid="dyn-memory">{memory}%</Typography>
                </Box>
                <Divider />
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Requisições/s</Typography>
                  <Typography variant="h6" fontWeight={700} data-testid="dyn-requests">{requests}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
