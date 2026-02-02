import Image from "next/image";

export function Introduction() {
  return (
    <section className="relative w-full py-12 md:py-20">
      {/* Na telefonu: samo slika mobileIntruduction.png */}
      <div className="block w-full md:hidden">
        <Image
          src="/mobileIntruduction.png"
          alt="Fortis ni moda. Je namen."
          width={1080}
          height={1350}
          className="h-auto w-full object-cover object-top"
          sizes="100vw"
        />
      </div>
      {/* Na desktopu: lan.jpeg + besedilo ob sliki */}
      <div className="hidden md:flex" style={{ marginLeft: "386px", gap: "96px" }}>
        <div style={{ 
          width: "496px",
          height: "661px"
        }}>
          <Image
            src="/lan.jpeg"
            alt="Fortis Introduction"
            width={496}
            height={661}
            className="w-full h-full object-cover"
          />
        </div>
        <div style={{ 
          marginTop: "80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <div style={{ 
            width: "364px",
            height: "90px",
            fontFamily: "Libre Baskerville, serif",
            fontWeight: "bold",
            fontSize: "40px",
            lineHeight: "45px",
            letterSpacing: "6%",
            color: "#fcfcfc",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center"
          }}>
            <div>Fortis ni moda.</div>
            <div>Je namen.</div>
          </div>
          <div style={{
            marginTop: "30px",
            fontFamily: "Libre Baskerville, serif",
            color: "#a9a9a9",
            opacity: 0.6,
            textAlign: "center"
          }}>
            Ne ustvarjeno za trende
          </div>
          <div style={{
            marginTop: "40px",
            width: "250px",
            fontFamily: "Libre Baskerville, serif",
            color: "#a9a9a9",
            opacity: 0.75,
            textAlign: "justify"
          }}>
            Fortis ni za vsak okus. In to je namen. To niso parfumi za všečke, niti za množico. So za tiste, ki jim tišina bolj pristaja kot razlaga. Če ga razumeš takoj verjetno ni zate.
          </div>
        </div>
      </div>
    </section>
  );
}
