interface HeroTaglineProps {
  text: string;
}

export function HeroTagline({ text }: HeroTaglineProps) {
  return (
    <p
      style={{
        fontFamily: "Libre Baskerville, serif",
        fontStyle: "italic",
        lineHeight: "140%",
        letterSpacing: "2%",
        color: "#9FA3A7",
        opacity: 0.9,
      }}
      className="text-center text-sm sm:text-base md:text-lg lg:text-xl"
    >
      {text}
    </p>
  );
}
