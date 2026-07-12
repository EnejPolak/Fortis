export async function startCheckout(options: {
  items: { slug: string; quantity: number }[];
  fromCart?: boolean;
}): Promise<string> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: options.items,
      fromCart: options.fromCart ?? false,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Plačilo ni uspelo.");
  }

  return data.url as string;
}
