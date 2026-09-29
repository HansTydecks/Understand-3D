import "@fontsource-variable/fredoka";
import "@fontsource-variable/nunito";
import "./styles/global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App";

const root = document.getElementById("root");
if (!root) throw new Error("Element #root fehlt in index.html");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
