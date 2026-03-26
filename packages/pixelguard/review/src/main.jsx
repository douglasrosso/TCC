import React from 'react';
import ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ReviewPage from './ReviewPage.jsx';

const darkTheme = createTheme({
  palette: { mode: 'dark' },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <ReviewPage />
    </ThemeProvider>
  </React.StrictMode>,
);
