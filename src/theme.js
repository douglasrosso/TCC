import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary:   { main: '#2563eb', dark: '#1d4ed8' },
    secondary: { main: '#64748b' },
    success:   { main: '#16a34a' },
    warning:   { main: '#d97706' },
    error:     { main: '#dc2626' },
    background: { default: '#f1f5f9' },
  },
  typography: {
    fontFamily: '"Roboto", "Segoe UI", system-ui, sans-serif',
  },
  shape: { borderRadius: 8 },
});

export default theme;
