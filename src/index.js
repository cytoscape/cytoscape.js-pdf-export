import PDFDocument from "pdfkit";
import blobStream from "blob-stream";
import saveAs from "file-saver";
import './pdfkit-virtual-files.js'; 


export default function pdf() {
  const stream = blobStream();
  const doc = new PDFDocument();
  doc.pipe(stream);

  stream.on('finish', () => {
    const blob = stream.toBlob("application/pdf");
    saveAs(blob, "pdfkit-example.pdf", true)
  });

  doc
    .save()
    // .beginPath()
    .moveTo(100, 150)
    .lineTo(100, 250)
    .lineTo(200, 250)
    .closePath()
    .fill('#FF3300');

  doc.end();
}

window.pdf = pdf;