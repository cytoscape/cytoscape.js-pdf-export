import PDFDocument from "pdfkit";
import PdfContext from "./canvas2pdf.js";
import blobStream from "blob-stream";
import saveAs from "file-saver";
import './pdfkit-virtual-files.js'; 


export function pdf() {
  const stream = blobStream();
  const doc = new PDFDocument();
  doc.pipe(stream);

  doc
    .save()
    // .beginPath()
    .moveTo(100, 150)
    .lineTo(100, 250)
    .lineTo(200, 250)
    .closePath()
    .fill('#FF3300');

  stream.on('finish', () => {
    const blob = stream.toBlob("application/pdf");
    saveAs(blob, "pdfkit-example.pdf", true)
  });
  doc.end();
}


export function canvas2pdf() { 
  const stream = blobStream();
  const ctx = new PdfContext(stream, 1000, 1000);

  ctx.translate(-2180.5875,-2587.4375);
  ctx.scale(6.325,6.325);
  ctx.beginPath();
  ctx.moveTo(409.5,476);
  ctx.arcTo(429.5,476,429.5,496,8);
  ctx.arcTo(429.5,516,409.5,516,8);
  ctx.arcTo(389.5,516,389.5,496,8);
  ctx.arcTo(389.5,476,409.5,476,8);
  ctx.lineTo(409.5, 476);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.scale(0.15810276679841898,0.15810276679841898);
  ctx.translate(2180.5875,2587.4375);

  stream.on('finish', () => {
    const blob = stream.toBlob("application/pdf");
    saveAs(blob, "canvas2pdf-example.pdf", true)
  });
  ctx.end();
}


window.pdf = pdf;
window.canvas2pdf = canvas2pdf;
