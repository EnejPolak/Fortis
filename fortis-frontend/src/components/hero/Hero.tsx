import Image from "next/image";
import { HeroTagline } from "./HeroTagline";

export function Hero() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 pt-20 sm:items-start sm:px-6 sm:pt-24 md:pt-28 lg:pt-32"
      style={{ backgroundColor: "#0f0f0f" }}
    >
      <div className="flex w-full max-w-[1012px] -translate-y-16 flex-col items-center gap-0 sm:translate-y-0">
        <div className="relative z-0 w-full shrink-0" style={{ aspectRatio: "1012 / 680" }}>
          <Image
            src="/fortis.png"
            alt="Fortis Logo"
            width={1012}
            height={680}
            priority
            className="h-full w-full object-contain"
          />
        </div>
        <div className="relative z-10 mt-[-24px] w-full px-2 sm:mt-[-28px] md:mt-[-32px]">
          <HeroTagline text='"Not all armor is steel some lingers on skin"' />
        </div>
      </div>
    </div>
  );
}
