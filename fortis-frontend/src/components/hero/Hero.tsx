import Image from "next/image";
import { HeroTagline } from "./HeroTagline";

export function Hero() {
  return (
    <div className="flex min-h-screen items-start justify-center pt-32" style={{ backgroundColor: "#0f0f0f" }}>
      <div className="flex flex-col items-center gap-0">
        <div style={{ width: "1012px", height: "680px" }} className="relative z-0">
          <Image
            src="/fortis.png"
            alt="Fortis Logo"
            width={1012}
            height={680}
            priority
            className="w-full h-full object-contain"
          />
        </div>
        <div className="relative z-10" style={{ marginTop: "-32px" }}>
          <HeroTagline text='"Not all armor is steel some lingers on skin"' />
        </div>
      </div>
    </div>
  );
}
