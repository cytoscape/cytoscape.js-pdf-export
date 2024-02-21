import canvas2pdf from "canvas2pdf";
import blobStream from "blob-stream";

import PDFDocument from 'pdfkit';


export default function pdfExport(options) {
  console.log("pdf export ???");
  const cy = this;

  window.PDFDocument = PDFDocument;
  window.blobStream = blobStream;

  const ctx = new canvas2pdf.PdfContext(blobStream());

  console.log(ctx);

  bufferCanvasImage(cy, ctx, {});
  console.log('after bufferCanvasImage');

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

const isNumber = obj => obj != null && typeof obj === typeof 1 && !isNaN( obj );


function bufferCanvasImage(cy, ctx, options) {
  const renderer = cy.renderer();
  var eles = cy.mutableElements();
  var bb = eles.boundingBox();
  var ctrRect = renderer.findContainerClientCoords();
  var width  = options.full ? Math.ceil( bb.w ) : ctrRect[2];
  var height = options.full ? Math.ceil( bb.h ) : ctrRect[3];
  var specdMaxDims = isNumber( options.maxWidth ) || isNumber( options.maxHeight );
  var pxRatio = renderer.getPixelRatio();
  var scale = 1;

  console.log('bufferCanvasImage');
  console.log(bb);
  console.log(ctrRect);
  console.log(pxRatio);

  if(width > 0 && height > 0) {
    // ctx.clearRect(0, 0, width, height);
    const zsortedEles = renderer.getCachedZSortedEles();

    if(options.full) {
      // TODO
    } else {
      var pan = cy.pan();

      var translation = {
        x: pan.x * scale,
        y: pan.y * scale
      };

      scale *= cy.zoom();

      ctx.translate(translation.x, translation.y);
      ctx.scale(scale, scale);

      renderer.drawElements(ctx, zsortedEles);

      ctx.scale(1/scale, 1/scale);
      ctx.translate(-translation.x, -translation.y);
    }
  }
};