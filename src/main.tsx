import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./docs/App";
import "./lib/halo.css";
import "./docs/docs.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
