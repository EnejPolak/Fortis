"use client";

import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { ParfumDetail } from "@/components/parfumdetail/ParfumDetail";
import { getParfumBySlug } from "@/data/parfumi";

export default function ParfumPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : null;

  if (!slug) {
    notFound();
  }

  const parfum = getParfumBySlug(slug);
  if (!parfum) {
    notFound();
  }

  return (
    <ParfumDetail
      slug={slug}
      imageSrc={parfum.imageSrc}
      name={parfum.name}
      metaLine1={parfum.metaLine1}
      metaLine2={parfum.metaLine2}
      description={parfum.description}
      notes={parfum.notes}
      ingredients={parfum.ingredients}
    />
  );
}
