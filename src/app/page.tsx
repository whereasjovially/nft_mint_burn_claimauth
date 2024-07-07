import { Main } from "@/components/main";
import { WalletProvider } from "@/proivders";
import Image from "next/image";

export default function Home() {
  return (
    <WalletProvider>
      <Main/>
    </WalletProvider>
  );
}
