interface HeroTaglineProps {
  text: string;
}

export function HeroTagline({ text }: HeroTaglineProps) {
  return (
    <p
      style={{
        fontFamily: "Libre Baskerville, serif",
        fontStyle: "italic",
        fontSize: "20px",
        lineHeight: "140%",
        letterSpacing: "2%",
        color: "#9FA3A7",
        opacity: 0.9,
      }}
      className="text-center"
    >
      {text}
    </p>
  );
}
