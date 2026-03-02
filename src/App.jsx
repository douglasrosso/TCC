import NavBar from './components/NavBar';
import HeroBanner from './components/HeroBanner';
import StatsGrid from './components/StatsGrid';
import TransactionsTable from './components/TransactionsTable';
import InfoSidebar from './components/InfoSidebar';
import Footer from './components/Footer';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';

export default function App() {
  return (
    <>
      <NavBar />
      <HeroBanner />

      <Container maxWidth="lg" sx={{ my: 3 }}>
        <StatsGrid />

        <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TransactionsTable />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoSidebar />
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </>
  );
}
