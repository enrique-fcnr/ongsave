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

export function CertificatePrintButton() {
  return (
    <Button
      className="print-hide"
      variant="outline"
      onClick={() => {
        document.body.classList.add("print-certificate");
        window.addEventListener(
          "afterprint",
          () => document.body.classList.remove("print-certificate"),
          { once: true },
        );
        window.print();
      }}
    >
      <Download size={17} />
      Salvar certificado em PDF
    </Button>
  );
}
