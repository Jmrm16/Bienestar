import React from "react";
import { Spinner } from "@/components/ui/spinner";

export const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/72 backdrop-blur-sm">
      <div className="rounded-2xl border bg-background/95 px-5 py-4 shadow-xl">
        <Spinner size="lg" label="Cargando página..." />
      </div>
    </div>
  );
};
