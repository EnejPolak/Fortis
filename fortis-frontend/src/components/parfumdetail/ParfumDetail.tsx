"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getParfumBySlug } from "@/data/parfumi";

export type ParfumDetailTab = "name" | "notes" | "ingredients";

export interface ParfumDetailProps {
  imageSrc: string;
  name: string;
  metaLine1: string;
  metaLine2: string;
  description: string;
  notes?: string;
  ingredients?: string;
}

export function ParfumDetail({
  imageSrc,
  name,
  metaLine1,
  metaLine2,
  description,
  notes = "",
  ingredients = "",
}: ParfumDetailProps) {
  const [activeTab, setActiveTab] = useState<ParfumDetailTab>("name");

  return (
    <main className="min-h-screen w-full flex items-start pt-20">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-y-12 items-start lg:grid-cols-[1fr_520px] lg:gap-x-16 lg:items-start">
          {/* Levi stolpec – slika parfuma na sredino po višini */}
          <div className="flex justify-end items-center min-h-[calc(100vh-6rem)] lg:justify-end">
            <div
              className="w-[520px] h-[520px]"
              style={{ transform: "translateX(-120px) translateY(4rem)" }}
            >
              <img
                src={imageSrc}
                alt={name}
                className="w-full h-full object-contain select-none"
              />
            </div>
          </div>

          {/* Desni stolpec – nazaj na kolekcijo (absolute, ne vpliva na gumbe), nato gumbe in vsebina */}
          <aside
            className="flex flex-col w-full max-w-[520px] lg:w-[520px] relative pt-10"
            style={{ marginTop: "20rem", marginLeft: "7rem" }}
          >
            {/* Samostojen gumb – position absolute, premik le njega, ne 3 gumbov */}
            <div className="absolute left-0" style={{ top: "-9rem" }}>
              <Link
                href="/kolekcija"
                className="text-sm font-medium text-[var(--foreground)] hover:opacity-70 transition-opacity"
              >
                Nazaj na kolekcijo
              </Link>
            </div>

            {/* 3 gumbe v isti vrstici: Aura | Notes | Ingredients */}
            <div
              className="flex flex-wrap items-center gap-x-28 gap-y-2 shrink-0"
              style={{ marginBottom: activeTab === "notes" ? "0.5rem" : "0" }}
            >
              <button
                type="button"
                onClick={() => setActiveTab("name")}
                className={`text-sm font-medium text-left transition-colors ${
                  activeTab === "name"
                    ? "text-[var(--foreground)]"
                    : "text-[var(--foreground)] opacity-50 hover:opacity-70"
                }`}
              >
                {name}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={`text-sm font-medium text-left transition-colors ${
                  activeTab === "notes"
                    ? "text-[var(--foreground)]"
                    : "text-[var(--foreground)] opacity-50 hover:opacity-70"
                }`}
              >
                Note
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ingredients")}
                className={`text-sm font-medium text-left transition-colors ${
                  activeTab === "ingredients"
                    ? "text-[var(--foreground)]"
                    : "text-[var(--foreground)] opacity-50 hover:opacity-70"
                }`}
              >
                Sestavine
              </button>
            </div>

            {/* Vsebina pod gumbi – večji odmik samo pri Notes, pri ostalih zavihkih manjši */}
            <div
              className="parfum-detail-text min-w-0 max-w-sm min-h-[14rem] flex-shrink-0"
              style={{ marginTop: activeTab === "notes" ? "0.5rem" : "0" }}
            >
              {activeTab === "name" && (
                <>
                  <p className="text-[var(--foreground)] opacity-80 mb-1">
                    {metaLine1}
                  </p>
                  <p className="text-[var(--foreground)] opacity-80 mb-4">
                    {metaLine2}
                  </p>
                  {description ? (
                    (() => {
                      const parts = description.split("\n");
                      if (parts.length >= 2) {
                        return (
                          <>
                            <p className="text-[var(--foreground)] leading-relaxed">
                              {parts[0]}
                            </p>
                            <p className="text-[var(--foreground)] leading-relaxed mt-4">
                              {parts.slice(1).join("\n")}
                            </p>
                          </>
                        );
                      }
                      return (
                        <p className="text-[var(--foreground)] leading-relaxed whitespace-pre-line">
                          {description}
                        </p>
                      );
                    })()
                  ) : null}
                </>
              )}
              {activeTab === "notes" && (
                <p className="text-[var(--foreground)] leading-relaxed whitespace-pre-line">
                  {notes || "—"}
                </p>
              )}
              {activeTab === "ingredients" && (
                <p className="text-[var(--foreground)] leading-relaxed">
                  {ingredients || "—"}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

const DEMO_SLUG = "kinetic-aura";

export function ParfumDetailDemo() {
  const parfum = getParfumBySlug(DEMO_SLUG);
  if (!parfum) return null;
  return <ParfumDetail {...parfum} />;
}
