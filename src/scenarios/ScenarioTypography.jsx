import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function ScenarioTypography() {
  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          Cenário: Variação Tipográfica
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Página com blocos de texto em diferentes tamanhos. A mutação altera o tamanho
          da fonte em 0.5 px, produzindo diferenças de anti-aliasing.
        </Typography>

        <Card sx={{ mb: 2.5, border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} data-testid="typo-heading" sx={{ mb: 1.5 }}>
              Relatório de Desempenho do Sistema
            </Typography>
            <Typography variant="body1" data-testid="typo-body" sx={{ mb: 2, lineHeight: 1.7 }}>
              O sistema processou 12.480 requisições durante o período de análise,
              com tempo médio de resposta de 142 milissegundos. A taxa de erros
              manteve-se abaixo de 0,3%, dentro do limite operacional estabelecido.
              O consumo de memória permaneceu estável em 68% da capacidade alocada.
            </Typography>
            <Typography variant="body2" data-testid="typo-detail" sx={{ lineHeight: 1.6 }}>
              A distribuição de carga entre os três servidores apresentou variação de
              4% no pico, indicando balanceamento adequado. O cache atingiu taxa de
              acerto de 91%, e o banco de dados registrou 847 consultas por segundo
              com latência de 23 milissegundos no percentil 95.
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
          <Card sx={{ border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Métricas de entrada</Typography>
              <Typography variant="body2" data-testid="typo-metrics-1" sx={{ lineHeight: 1.6 }}>
                Requisições por segundo: 208. Tamanho médio do payload: 4,2 KB.
                Conexões simultâneas: 1.240. Banda utilizada: 312 Mbps.
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Métricas de saída</Typography>
              <Typography variant="body2" data-testid="typo-metrics-2" sx={{ lineHeight: 1.6 }}>
                Respostas 2xx: 97,8%. Respostas 4xx: 1,9%. Respostas 5xx: 0,3%.
                Tempo até primeiro byte: 34 ms. Tempo de renderização: 89 ms.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Card sx={{ mt: 2.5, border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Observações</Typography>
            <Typography variant="caption" data-testid="typo-caption" sx={{ lineHeight: 1.5, display: 'block' }}>
              Os dados acima referem-se ao intervalo de 00:00 às 23:59 do dia de referência.
              Valores de latência representam o percentil 95. O limite de alerta para taxa
              de erros está configurado em 1,0%. O sistema opera em três réplicas ativas
              com failover automático. A janela de manutenção é de 02:00 às 04:00.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
