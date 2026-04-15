import PDFDocument from "pdfkit";
import { stringify } from "csv-stringify/sync";

export const toCsv = (records) =>
  stringify(records, {
    header: true
  });

export const toPdfBuffer = (title, rows) =>
  new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 36 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text(title);
    doc.moveDown();

    rows.forEach((row) => {
      doc.fontSize(10).text(Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(" | "));
      doc.moveDown(0.5);
    });

    doc.end();
  });
