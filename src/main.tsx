import { Buffer } from 'buffer';
window.Buffer = Buffer;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { TonConnectProvider } from "@providers/TonConnectProvider";
import { ThirdwebProviderWrapper } from "@providers/ThirdwebProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TonConnectProvider>
      <ThirdwebProviderWrapper>
        <App />
      </ThirdwebProviderWrapper>
    </TonConnectProvider>
  </StrictMode>
);
