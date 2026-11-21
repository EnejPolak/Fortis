"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { PurchaseBlock } from "@/components/commerce/PurchaseBlock";
import { getParfumBySlug } from "@/data/parfumi";
import { getParfumPriceEur } from "@/lib/parfum-prices";

export type ParfumDetailTab = "opis" | "notes" | "ingredients";

export interface ParfumDetailProps {
  slug: string;
  imageSrc: string;
  name: string;
  brand?: string;
  metaLine1: string;
  metaLine2: string;
  description: string;
  notes?: string;
  ingredients?: string;
}

/** Approximate preview depth (~7–8 lines of body copy, including paragraph spacing). */
const OPIS_PREVIEW_LINES = 8;

function renderNotes(notes: string) {
  const trimmed = notes.trim();
  if (!trimmed) {
    return <p className="parfum-detail-body">Podatki o notah niso na voljo.</p>;
  }

  const hasGroupedNotes =
    /TOP NOTES|MIDDLE NOTES|BASE NOTES|HEART NOTES|VRH|SRCE|BAZA/i.test(trimmed);

  if (!hasGroupedNotes) {
    return <p className="parfum-detail-body whitespace-pre-line">{trimmed}</p>;
  }

  const blocks = trimmed
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="parfum-notes-groups">
      {blocks.map((block) => {
        const [heading, ...rest] = block.split("\n");
        const body = rest.join("\n").trim();
        return (
          <div key={block} className="parfum-notes-group">
            <h3 className="parfum-notes-heading">{heading}</h3>
            {body ? <p className="parfum-detail-body whitespace-pre-line">{body}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

function renderDescription(description: string) {
  const paragraphs: string[] = [];
  let current = "";
  for (const line of description.split("\n")) {
    if (line.trim() === "") {
      if (current.trim()) {
        paragraphs.push(current.trim());
        current = "";
      }
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }
  if (current.trim()) paragraphs.push(current.trim());

  if (paragraphs.length === 0) {
    return <p className="parfum-detail-body whitespace-pre-line">{description}</p>;
  }

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p
          key={`${index}-${paragraph.slice(0, 24)}`}
          className={`parfum-detail-body${index > 0 ? " parfum-detail-body--spaced" : ""} whitespace-pre-line`}
        >
          {paragraph}
        </p>
      ))}
    </>
  );
}

function getPreviewClampPx(el: HTMLElement) {
  const probe =
    (el.querySelector(".parfum-detail-body") as HTMLElement | null) ?? el;
  const style = getComputedStyle(probe);
  const fontSize = parseFloat(style.fontSize) || 16;
  const lineHeight =
    style.lineHeight === "normal" ? fontSize * 1.7 : parseFloat(style.lineHeight) || fontSize * 1.7;
  return lineHeight * OPIS_PREVIEW_LINES;
}

function OpisDescription({ description, slug }: { description: string; slug: string }) {
  const contentId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    setExpanded(false);
    setIsOverflowing(false);
    setMeasured(false);
  }, [slug, description]);

  const measureOverflow = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    // scrollHeight reflects full content even while max-height is applied
    const clampPx = getPreviewClampPx(el);
    setIsOverflowing(el.scrollHeight > clampPx + 1);
    setMeasured(true);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => measureOverflow());

    const el = contentRef.current;
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && el
        ? new ResizeObserver(() => measureOverflow())
        : null;
    if (el && resizeObserver) resizeObserver.observe(el);

    const onResize = () => measureOverflow();
    window.addEventListener("resize", onResize);

    let cancelled = false;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) measureOverflow();
      });
    }

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [measureOverflow, description, slug]);

  const collapse = () => {
    const el = contentRef.current;
    const beforeTop = el?.getBoundingClientRect().top ?? 0;
    setExpanded(false);
    requestAnimationFrame(() => {
      const afterTop = contentRef.current?.getBoundingClientRect().top ?? beforeTop;
      if (afterTop < 72) {
        contentRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    });
  };

  // Collapse until measured (prevents long-text flash); then only if overflowing
  const shouldCollapse = !expanded && (!measured || isOverflowing);

  return (
    <div className="parfum-detail-opis">
      <div
        id={contentId}
        ref={contentRef}
        className={
          shouldCollapse
            ? "parfum-detail-opis-content parfum-detail-opis-content--collapsed"
            : "parfum-detail-opis-content"
        }
      >
        {renderDescription(description)}
      </div>
      {measured && isOverflowing ? (
        <button
          type="button"
          className="parfum-detail-opis-toggle"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => (expanded ? collapse() : setExpanded(true))}
        >
          {expanded ? "Prikaži manj −" : "Preberi celotno zgodbo +"}
        </button>
      ) : null}
    </div>
  );
}

export function ParfumDetail({
  slug,
  imageSrc,
  name,
  brand,
  metaLine1,
  metaLine2,
  description,
  notes = "",
  ingredients = "",
}: ParfumDetailProps) {
  const [activeTab, setActiveTab] = useState<ParfumDetailTab>("opis");
  const isSellable = getParfumPriceEur(slug) != null;
  const tabIds = useId();

  const tabs: { id: ParfumDetailTab; label: string }[] = [
    { id: "opis", label: "Opis" },
    { id: "notes", label: "Note" },
    { id: "ingredients", label: "Sestavine" },
  ];

  return (
    <main className="parfum-detail-main min-h-screen w-full">
      <div className="parfum-detail-shell">
        <Link href={`/kolekcija#${slug}`} className="parfum-detail-back">
          <span aria-hidden="true">← </span>Nazaj na kolekcijo
        </Link>

        <div className="parfum-detail-layout">
          <div className="parfum-detail-gallery">
            <div className="parfum-detail-gallery-frame">
              <img
                src={imageSrc}
                alt={`${name}${brand ? ` – ${brand}` : ""}`}
                className="parfum-detail-gallery-img select-none"
              />
            </div>
          </div>

          <aside className="parfum-detail-info">
            <header className="parfum-detail-identity">
              {brand ? <p className="parfum-detail-brand">{brand}</p> : null}
              <h1 className="parfum-detail-name">{name}</h1>
              {isSellable ? (
                metaLine2 ? (
                  <p className="parfum-detail-meta">{metaLine2}</p>
                ) : null
              ) : (
                <p className="parfum-detail-meta">
                  <span>{metaLine1}</span>
                  {metaLine2 ? (
                    <>
                      <span className="parfum-detail-meta-sep" aria-hidden="true">
                        ·
                      </span>
                      <span>{metaLine2}</span>
                    </>
                  ) : null}
                </p>
              )}
              {isSellable ? <PurchaseBlock slug={slug} /> : null}
            </header>

            <div className="parfum-detail-disclosure">
              <div
                className="parfum-detail-tabs"
                role="tablist"
                aria-label="Podrobnosti parfuma"
              >
                {tabs.map((tab) => {
                  const selected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      id={`${tabIds}-${tab.id}`}
                      aria-selected={selected}
                      aria-controls={`${tabIds}-panel-${tab.id}`}
                      tabIndex={selected ? 0 : -1}
                      className={`parfum-detail-tab${selected ? " parfum-detail-tab--active" : ""}`}
                      onClick={() => setActiveTab(tab.id)}
                      onKeyDown={(event) => {
                        const order = tabs.map((t) => t.id);
                        const index = order.indexOf(tab.id);
                        if (event.key === "ArrowRight") {
                          event.preventDefault();
                          setActiveTab(order[(index + 1) % order.length]);
                        }
                        if (event.key === "ArrowLeft") {
                          event.preventDefault();
                          setActiveTab(order[(index - 1 + order.length) % order.length]);
                        }
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div
                className="parfum-detail-text"
                role="tabpanel"
                id={`${tabIds}-panel-${activeTab}`}
                aria-labelledby={`${tabIds}-${activeTab}`}
              >
                {activeTab === "opis" &&
                  (description?.trim() ? (
                    <OpisDescription description={description} slug={slug} />
                  ) : (
                    <p className="parfum-detail-body">Opis ni na voljo.</p>
                  ))}
                {activeTab === "notes" && renderNotes(notes)}
                {activeTab === "ingredients" && (
                  <p className="parfum-detail-inci parfum-detail-body">
                    {ingredients?.trim() || "Seznam sestavin ni na voljo."}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>

        <section className="parfum-detail-visit" aria-labelledby="parfum-visit-heading">
          <div className="parfum-detail-visit-copy">
            <h2 id="parfum-visit-heading" className="parfum-detail-visit-title">
              Odkrijte dišavo v živo.
            </h2>
            <p className="parfum-detail-visit-text">
              Za pomoč pri izbiri smo vam na voljo v ateljeju.
            </p>
          </div>
          <a
            href="https://maps.app.goo.gl/MMEH8JAgXREgUvbY8"
            className="parfum-detail-visit-action"
            target="_blank"
            rel="noopener noreferrer"
          >
            Pokaži lokacijo <span aria-hidden="true">↗</span>
          </a>
        </section>
      </div>
    </main>
  );
}

const DEMO_SLUG = "kinetic-aura";

export function ParfumDetailDemo() {
  const parfum = getParfumBySlug(DEMO_SLUG);
  if (!parfum) return null;
  return <ParfumDetail slug={DEMO_SLUG} {...parfum} />;
}
