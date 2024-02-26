import PDFDocument from "pdfkit";
import PdfContext from "./canvas2pdf";
import blobStream from "blob-stream";
import saveAs from "file-saver";


// Required by pdfkit webpack config or whatever I dunno
// https://github.com/blikblum/pdfkit-webpack-example/issues/1
import './pdfkit-virtual-files.js';


export default function register(cytoscape) {
  if(!cytoscape) { return; }
  cytoscape('core', 'pdf', pdfExport);
};

if(typeof cytoscape !== 'undefined') { // expose to global cytoscape (i.e. window.cytoscape)
  register(cytoscape);
}

// Housekeeping to make pdfkit happy
window.PDFDocument = PDFDocument;
window.blobStream = blobStream;


export function pdfExport(options) {
  const cy = this;
  // Temporary, the calling code shoudl do the saveAs(...)
  drawCanvasImage(cy, {
    onFinish: blob => saveAs(blob, "example.pdf", true)
  });
}


function isNumber(obj) {
  return obj != null && typeof obj === typeof 1 && !isNaN(obj);
}

function drawCanvasImage(cy, options) {
  const renderer = cy.renderer();
  var eles = cy.mutableElements();
  var bb = eles.boundingBox();
  var ctrRect = renderer.findContainerClientCoords();
  var width  = options.full ? Math.ceil(bb.w) : ctrRect[2];
  var height = options.full ? Math.ceil(bb.h) : ctrRect[3];
  var specdMaxDims = isNumber(options.maxWidth) || isNumber(options.maxHeight);
  var pxRatio = renderer.getPixelRatio();
  var scale = 1;

  const stream = blobStream();
  const ctx = new PdfContext(stream, {
    width,
    height
  });

  // // draw your canvas like you would normally
  // ctx.fillStyle = "yellow";
  // ctx.fillRect(100, 100, 100, 100);
  // // more canvas drawing, etc...


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

    const { onFinish } = options;
    if(onFinish) {
      ctx.stream.on('finish', () => {
        const blob = ctx.stream.toBlob("application/pdf");
        onFinish(blob);
      });
    }

    ctx.end();
  }

};