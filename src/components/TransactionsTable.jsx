import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';

const transactions = [
  { id: '#1001', client: 'Ana Silva',       email: 'ana@email.com',    amount: 'R$ 250,00', status: 'Aprovado',  color: 'success', initials: 'AS', avatarBg: '#dbeafe' },
  { id: '#1002', client: 'Carlos Souza',    email: 'carlos@email.com', amount: 'R$ 180,00', status: 'Pendente',  color: 'warning', initials: 'CS', avatarBg: '#fef3c7' },
  { id: '#1003', client: 'Maria Oliveira',  email: 'maria@email.com',  amount: 'R$ 320,00', status: 'Aprovado',  color: 'success', initials: 'MO', avatarBg: '#d1fae5' },
  { id: '#1004', client: 'João Santos',     email: 'joao@email.com',   amount: 'R$ 95,00',  status: 'Cancelado', color: 'error',   initials: 'JS', avatarBg: '#fee2e2' },
  { id: '#1005', client: 'Lucia Ferreira',  email: 'lucia@email.com',  amount: 'R$ 410,00', status: 'Aprovado',  color: 'success', initials: 'LF', avatarBg: '#ede9fe' },
];

export default function TransactionsTable() {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box>
            <Typography variant="h6">Últimas Transações</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              5 transações mais recentes do sistema
            </Typography>
          </Box>
          <Chip label="Hoje" size="small" variant="outlined" sx={{ fontWeight: 500 }} />
        </Box>

        <TableContainer>
          <Table size="small" data-testid="transactions-table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id} sx={{ '&:last-child td': { borderBottom: 0 }, '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500} sx={{ color: 'text.secondary' }}>
                      {t.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 600, bgcolor: t.avatarBg, color: 'text.primary' }}>
                        {t.initials}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{t.client}</Typography>
                        <Typography variant="caption" color="text.secondary">{t.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>{t.amount}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={t.status}
                      color={t.color}
                      size="small"
                      variant="outlined"
                      sx={{ minWidth: 80 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
