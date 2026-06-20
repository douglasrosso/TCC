import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function ScenarioFontSwap() {
  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          Cenário: Troca de Fonte
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Página com blocos de texto. A mutação substitui a família de fonte de uma
          seção, alterando métricas tipográficas (largura dos glifos, kerning) sem
          mudar o tamanho nominal da fonte.
        </Typography>

        <Card sx={{ mb: 2.5, border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} data-testid="font-heading" sx={{ mb: 1.5 }}>
              Análise de Performance do Trimestre
            </Typography>
            <Typography variant="body1" data-testid="font-body" sx={{ mb: 2, lineHeight: 1.7 }}>
              Durante o trimestre, o sistema manteve disponibilidade de 99,7% com
              latência média de 134ms. A equipe implementou 47 deploys sem incidentes
              críticos, e o tempo médio de recuperação foi de 12 minutos. O consumo
              de recursos permaneceu dentro dos limites orçamentários planejados,
              com margem de 8% abaixo do teto previsto.
            </Typography>
            <Typography variant="body2" data-testid="font-detail" sx={{ lineHeight: 1.6 }}>
              Os indicadores de satisfação do cliente registraram nota média de 4,3
              em uma escala de 5 pontos, com destaque para os itens de velocidade
              de resposta e clareza das informações apresentadas. O NPS atingiu 62
              pontos, classificado como zona de qualidade.
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
          <Card sx={{ border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Infraestrutura</Typography>
              <Typography variant="body2" data-testid="font-infra" sx={{ lineHeight: 1.6 }}>
                Servidores: 12 instâncias ativas. CPU média: 42%. Memória: 61%.
                Disco: 340 GB utilizados de 1 TB disponível. Rede: 180 Mbps pico.
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Segurança</Typography>
              <Typography variant="body2" data-testid="font-security" sx={{ lineHeight: 1.6 }}>
                Tentativas de acesso bloqueadas: 1.247. Certificados válidos: 100%.
                Última auditoria: aprovada sem ressalvas. Patches pendentes: 0.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}
