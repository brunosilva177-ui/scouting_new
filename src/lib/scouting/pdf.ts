/** Criação de PDF (A4 horizontal) a partir das páginas do deck de apresentação. */
export async function createDeckPdf(container: HTMLElement, fileName: string) {
  const [{ toJpeg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);

  const pages = Array.from(container.querySelectorAll<HTMLElement>("[data-deck-page]"));
  if (!pages.length) throw new Error("Não foi possível encontrar as páginas do relatório.");

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    page.classList.add("deck-capture");
    const rect = page.getBoundingClientRect();
    const img = await toJpeg(page, {
      quality: 0.92,
      pixelRatio: 2,
      backgroundColor: "#0a1428",
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
      cacheBust: true,
      style: { margin: "0", transform: "none", boxSizing: "border-box" },
    });

    page.classList.remove("deck-capture");
    if (i > 0) pdf.addPage("a4", "landscape");
    pdf.addImage(img, "JPEG", 0, 0, pw, ph, undefined, "FAST");
  }

  pdf.save(fileName);
}
