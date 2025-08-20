"use client";
import { useFormStatus } from "react-dom";
import React from "react";

export default function PendingProgress({ className = "" }: { className?: string }) {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <div className={className} aria-live="polite" aria-busy="true">
      <div className="progress" role="progressbar" aria-valuetext="Uploading">
        <div className="indeterminate" />
      </div>
    </div>
  );
}


