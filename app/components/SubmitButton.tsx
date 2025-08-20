"use client";
import { useFormStatus } from "react-dom";
import React from "react";

type SubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
  small?: boolean;
};

export default function SubmitButton(props: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const { label, pendingLabel, variant = "primary", small = false, className = "", children, ...rest } = props;
  const classes = [
    "button",
    variant === "secondary" ? "secondary" : "",
    variant === "danger" ? "danger" : "",
    small ? "small" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={pending} {...rest}>
      {pending ? (
        <>
          <span className="spinner" aria-hidden />
          <span>{pendingLabel || label || children || "Saving..."}</span>
        </>
      ) : (
        <>{label || children}</>
      )}
    </button>
  );
}


