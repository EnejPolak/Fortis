"use client";

type QuantityStepperProps = {
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
  onChange: (next: number) => void;
};

export function QuantityStepper({
  value,
  min = 1,
  max,
  disabled = false,
  id,
  className,
  "aria-label": ariaLabel = "Količina",
  onChange,
}: QuantityStepperProps) {
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div className={["qty-stepper", className].filter(Boolean).join(" ")}>
      <button
        type="button"
        className="qty-stepper-btn"
        aria-label="Zmanjšaj količino"
        disabled={disabled || atMin}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <input
        id={id}
        className="qty-stepper-input"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "") return;
          const n = Number.parseInt(raw, 10);
          if (!Number.isFinite(n)) return;
          onChange(Math.max(min, Math.min(max, n)));
        }}
        onBlur={() => {
          if (value < min) onChange(min);
          if (value > max) onChange(max);
        }}
      />
      <button
        type="button"
        className="qty-stepper-btn"
        aria-label="Povečaj količino"
        disabled={disabled || atMax}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}
