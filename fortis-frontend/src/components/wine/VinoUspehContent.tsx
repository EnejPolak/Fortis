"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartProvider";

export function VinoUspehContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const status = searchParams.get("redirect_status");

  useEffect(() => {
    if (status === "succeeded" || !status) {
      clearCart();
    }
  }, [status, clearCart]);

  const failed = status === "failed";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "6rem 1.5rem 8rem",
        textAlign: "center",
        background: "#0f0f0f",
      }}
    >
      <p
        style={{
          fontFamily: '"JMH Typewriter", "Courier New", monospace',
          fontSize: "0.75rem",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "#b8956a",
          marginBottom: "1rem",
        }}
      >
        Fortis Selection
      </p>
      <h1
        style={{
          fontSize: "clamp(2rem, 6vw, 3rem)",
          fontWeight: 500,
          marginBottom: "1rem",
          color: "#fcfcfc",
        }}
      >
        {failed ? "Plačilo ni uspelo" : "Hvala za nakup"}
      </h1>
      <p
        style={{
          maxWidth: "32rem",
          lineHeight: 1.6,
          color: "rgba(237, 237, 237, 0.78)",
          marginBottom: "2rem",
        }}
      >
        {failed
          ? "Plačilo ni bilo zaključeno. Poskusite znova ali nas kontaktirajte."
          : "Vaše plačilo je bilo uspešno. Stripe vam pošlje potrdilo na email. Kmalu vas bomo kontaktirali glede prevzema ali dostave."}
      </p>
      <Link
        href={failed ? "/placilo" : "/"}
        style={{
          padding: "0.85rem 2rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontSize: "0.9rem",
          color: "#0f0f0f",
          background: "#b8956a",
          textDecoration: "none",
        }}
      >
        {failed ? "Poskusi znova" : "Nazaj na domov"}
      </Link>
    </main>
  );
}
