"use client";
import { Download } from "lucide-react";
import { Button } from "./ui/button";
export function PrintButton() {
  return (
    <Button className="print-hide" variant="outline" onClick={() => window.print()}>
      <Download size={17} />
      Salvar como PDF
    </Button>
  );
}
