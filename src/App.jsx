import NavBar from './components/NavBar';
import HeroBanner from './components/HeroBanner';
import StatsGrid from './components/StatsGrid';
import TransactionsTable from './components/TransactionsTable';
import InfoSidebar from './components/InfoSidebar';
import ActivityFeed from './components/ActivityFeed';
import Footer from './components/Footer';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

export default function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <NavBar />
      <HeroBanner />

      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        <StatsGrid />

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            mt: 3,
          }}
        >
          <Box sx={{ flex: '1 1 600px', minWidth: 0 }}>
            <TransactionsTable />
          </Box>
          <Box sx={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <InfoSidebar />
            <ActivityFeed />
          </Box>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
}
