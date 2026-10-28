import React from "react";
import { createRoot } from "react-dom/client";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Bundler } from "./Bundler";

const theme = createTheme({
  palette: {
    primary: { main: "#F77F00", contrastText: "#fff" },
    secondary: { main: "#FCBF49" },
    success: { main: "#6FAF4F", contrastText: "#fff" },
    background: { default: "#f5e9d8" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 20 } },
    },
  },
});

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <Bundler />
    </ThemeProvider>
  </React.StrictMode>,
);
