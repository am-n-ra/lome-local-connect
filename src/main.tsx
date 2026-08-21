import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { V2Shell } from "./components/v2/V2Shell";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <V2Shell />
  </StrictMode>,
);
