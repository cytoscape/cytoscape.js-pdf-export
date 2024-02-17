import canvas2pdf from "canvas2pdf";
import blobStream from "blob-stream";

import PDFDocument from 'pdfkit';


export function pdfExport(options) {
  console.log("pdf export ???");

  window.PDFDocument = PDFDocument;
  window.blobStream = blobStream;

  const ctx = new canvas2pdf.PdfContext(blobStream());



  // // draw your canvas like you would normally
  // ctx.fillStyle = "yellow";
  // ctx.fillRect(100, 100, 100, 100);
  // // more canvas drawing, etc...

  // // convert your PDF to a Blob and save to file
  // ctx.stream.on("finish", function () {
  //   const blob = ctx.stream.toBlob("application/pdf");
  //   saveAs(blob, "example.pdf", true);
  // });
  // ctx.end();
}

export default pdfExport;