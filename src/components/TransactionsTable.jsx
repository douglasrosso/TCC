import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';

const transactions = [
  { id: '#1001', client: 'Ana Silva',       amount: 'R$ 250,00', status: 'Aprovado',  color: 'success' },
  { id: '#1002', client: 'Carlos Souza',    amount: 'R$ 180,00', status: 'Pendente',  color: 'warning' },
  { id: '#1003', client: 'Maria Oliveira',  amount: 'R$ 320,00', status: 'Aprovado',  color: 'success' },
  { id: '#1004', client: 'João Santos',     amount: 'R$ 95,00',  status: 'Cancelado', color: 'error'   },
  { id: '#1005', client: 'Lucia Ferreira',  amount: 'R$ 410,00', status: 'Aprovado',  color: 'success' },
];

export default function TransactionsTable() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Últimas Transações
        </Typography>

        <Table size="small" data-testid="transactions-table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.id}</TableCell>
                <TableCell>{t.client}</TableCell>
                <TableCell>{t.amount}</TableCell>
                <TableCell>
                  <Chip label={t.status} color={t.color} size="small" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
