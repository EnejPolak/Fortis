export default function ONas() {
  return (
    <section
      style={{
        minHeight: "100vh",
        paddingTop: "200px",
        paddingLeft: "150px",
        paddingRight: "120px",
        position: "relative", 
      }}
    >
      <p
        style={{
          maxWidth: "980px",
          lineHeight: 1.6,
          textAlign: "justify",
          textAlignLast: "left",
          hyphens: "auto",
        }}
      >
        Lan Kraševec je obraz Fortis Niche Atelier in ambasador nišne
        parfumerije z dolgoletnimi izkušnjami profesionalnega svetovanja v svetu
        artisanal dišav. Njegov pristop temelji na zgodbi: kaj parfum pomeni, od
        kod prihaja, in zakaj določena hiša izstopa. Svoje znanje in naravno
        sposobnost pripovedovanja je dokazal tudi na različnih dogodkih, kjer je
        ljudi pritegnil z iskrenimi vpogledi v svet dišav. Fortis je ustanovil z
        idejo ustvariti prostor, kjer se luksuz ne meri v glasnosti, ampak v
        kakovosti izbire, miru in avtentični povezavi z dišavo.
      </p>

      <img
        src="/oNas/LanIntruduction.jpeg"
        alt="Lan introduction"
        style={{
          position: "absolute",
          right: "150px",
          bottom: "60px",
          width: "420px",
          height: "auto",
          objectFit: "cover",
        }}
      />
    </section>
  );
}
