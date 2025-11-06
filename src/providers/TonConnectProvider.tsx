import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ReactNode } from 'react';

// This manifest is taken from the example app and should be replaced with your own
const manifestUrl = "https://coral-electoral-eagle-264.mypinata.cloud/ipfs/bafkreifrendqtimtbuvfnnclfv6ert33yrvb4jdvjyxk6gxg4zqupdtize";

interface TonConnectProviderProps {
  children: ReactNode;
}

export function TonConnectProvider({ children }: TonConnectProviderProps) {
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
    </TonConnectUIProvider>
  );
}
