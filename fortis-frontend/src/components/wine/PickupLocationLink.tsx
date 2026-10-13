import type { ReactNode } from "react";
import {
  PICKUP_ADDRESS_LABEL,
  PICKUP_MAP_URL,
} from "@/lib/checkout";

type PickupLocationLinkProps = {
  className?: string;
  children?: ReactNode;
};

export function PickupLocationLink({ className, children }: PickupLocationLinkProps) {
  return (
    <a
      href={PICKUP_MAP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children ?? PICKUP_ADDRESS_LABEL}
    </a>
  );
}
