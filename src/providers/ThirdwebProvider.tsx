import { ReactNode } from "react";
import { createThirdwebClient } from "thirdweb";
import { ThirdwebProvider } from "thirdweb/react";

export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "",
});

interface Props {
  children: ReactNode;
}

export function ThirdwebProviderWrapper({ children }: Props) {
  return (
    <ThirdwebProvider client={client}>
      {children}
    </ThirdwebProvider>
  );
}
