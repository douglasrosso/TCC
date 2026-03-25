import NavBar from './components/NavBar';
import HeroBanner from './components/HeroBanner';
import StatsGrid from './components/StatsGrid';
import TransactionsTable from './components/TransactionsTable';
import InfoSidebar from './components/InfoSidebar';
import ActivityFeed from './components/ActivityFeed';
import Footer from './components/Footer';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

import ScenarioColor from './scenarios/ScenarioColor';
import ScenarioLayout from './scenarios/ScenarioLayout';
import ScenarioTypography from './scenarios/ScenarioTypography';
import ScenarioDynamic from './scenarios/ScenarioDynamic';
import ScenarioComponent from './scenarios/ScenarioComponent';
import ScenarioOpacity from './scenarios/ScenarioOpacity';
import ScenarioShadow from './scenarios/ScenarioShadow';
import ScenarioMicroShift from './scenarios/ScenarioMicroShift';
import ScenarioBorder from './scenarios/ScenarioBorder';
import ScenarioRemoval from './scenarios/ScenarioRemoval';
import ScenarioFontSwap from './scenarios/ScenarioFontSwap';
import ScenarioIdentical from './scenarios/ScenarioIdentical';

const SCENARIOS = {
  '/scenario-color': ScenarioColor,
  '/scenario-layout': ScenarioLayout,
  '/scenario-typography': ScenarioTypography,
  '/scenario-dynamic': ScenarioDynamic,
  '/scenario-component': ScenarioComponent,
  '/scenario-opacity': ScenarioOpacity,
  '/scenario-shadow': ScenarioShadow,
  '/scenario-microshift': ScenarioMicroShift,
  '/scenario-border': ScenarioBorder,
  '/scenario-removal': ScenarioRemoval,
  '/scenario-fontswap': ScenarioFontSwap,
  '/scenario-identical': ScenarioIdentical,
};

export default function App() {
  const ScenarioPage = SCENARIOS[window.location.pathname];
  if (ScenarioPage) return <ScenarioPage />;

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
