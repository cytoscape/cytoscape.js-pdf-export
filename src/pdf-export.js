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

function wrapObjectFunctions(obj, before, after) {
  var key, value;

  for (key in obj) {
    value = obj[key];
    if (typeof value === "function") {
      wrapFunction(obj, key, value);
    }
  }

  function wrapFunction(obj, fname, f) {
    obj[fname] = function() {
      var rv;
      if (before) {
        before(fname, this, arguments);
      }
      rv = f.apply(this, arguments); // Calls the original
      if (after) {
        after(fname, this, arguments, rv);
      }
      return rv;
    };
  }
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

  if(width <= 0 || height <= 0) {
    return;
  }

  const stream = blobStream();
  const ctx = new PdfContext(stream, width, height);

  wrapObjectFunctions(ctx, (name, obj, args) => console.log(`${name}(${Array.from(args)})`));

  if(options.bg) {
    ctx.background(options.bg);
  }

  // pdfkit doesn't support Path2D
  const path2dEnabled = renderer.path2dEnabled();
  renderer.path2dEnabled(false);

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

  if(options.onFinish) {
    ctx.stream.on('finish', () => {
      const blob = ctx.stream.toBlob("application/pdf");
      options.onFinish(blob);
    });
  }

  ctx.end();

  renderer.path2dEnabled(path2dEnabled);
};