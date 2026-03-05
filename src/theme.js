import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#2563eb", light: "#60a5fa", dark: "#1d4ed8" },
    secondary: { main: "#3b82f6", light: "#93c5fd", dark: "#1e40af" },
    success: { main: "#059669", light: "#d1fae5", dark: "#047857" },
    warning: { main: "#d97706", light: "#fef3c7", dark: "#b45309" },
    error: { main: "#dc2626", light: "#fee2e2", dark: "#b91c1c" },
    info: { main: "#0284c7", light: "#e0f2fe", dark: "#0369a1" },
    background: { default: "#fef2f2", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#475569" },
    divider: "#e2e8f0",
  },
  typography: {
    fontFamily: '"Roboto", "Segoe UI", system-ui, sans-serif',
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 600, fontSize: "1.05rem" },
    subtitle1: { fontWeight: 500, color: "#475569" },
    subtitle2: {
      fontWeight: 500,
      fontSize: "0.8rem",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: "#64748b",
    },
    body2: { color: "#475569" },
    caption: { fontSize: "0.78rem" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: "1px solid #e2e8f0",
          boxShadow:
            "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
          "&:hover": {
            boxShadow:
              "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
          },
          transition: "box-shadow 0.2s ease",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#64748b",
          borderBottomColor: "#e2e8f0",
        },
        root: { borderBottomColor: "#f1f5f9", padding: "12px 16px" },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, fontSize: "0.75rem" } },
    },
    MuiAppBar: {
      styleOverrides: { root: { boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.08)" } },
    },
    MuiButton: {
      styleOverrides: { root: { textTransform: "none", fontWeight: 500 } },
    },
  },
});

export default theme;
