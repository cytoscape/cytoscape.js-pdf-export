import PDFDocument from "pdfkit";
import PdfContext from "./canvas2pdf";
import { color2tuple } from './colors';
import blobStream from "blob-stream";
import saveAs from "file-saver"; // TODO remove this dependency???
import './pdfkit-virtual-files.js';  // https://github.com/blikblum/pdfkit-webpack-example/issues/1


/**
 * PDF export cytoscape.js extension.
 */
export default function register(cytoscape) {
  if(!cytoscape) { return; }
  cytoscape('core', 'pdf', pdfExport);
};

if(typeof cytoscape !== 'undefined') { // expose to global cytoscape (i.e. window.cytoscape)
  register(cytoscape);
}

// housekeeping to make pdfkit happy
window.PDFDocument = PDFDocument;
window.blobStream = blobStream;


export const defaultOptions = {
  save: false,
  fileName: 'cytoscape.pdf',
  includeSvgLayers: false,
};

export async function pdfExport(options) {
  options = { ...defaultOptions, ...options };
  const cy = this;

  const blob = await drawCanvasImage(cy, options);
  if(options.save) {
    saveAs(blob, options.fileName, true);
  } else {
    return blob;
  }
}


/**
 * Draw on the PDFCanvas
 */
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

    if(options.includeSvgLayers) {
      const svgLayers = getSvgLayers(cy);
      drawSvgLayers(ctx, svgLayers.bg);
      renderer.drawElements(ctx, zsortedEles);
      drawSvgLayers(ctx, svgLayers.fg);
    } else {
      renderer.drawElements(ctx, zsortedEles);
    }

    ctx.scale(1/scale, 1/scale);
    ctx.translate(-translation.x, -translation.y);
  }

  const p = new Promise((resolve, reject) => {
    try {
      ctx.stream.on('finish', () => {
        const blob = ctx.stream.toBlob("application/pdf");
        resolve(blob);
      });
    } catch(err) {
      reject(err);
    }
  });

  ctx.end();
  renderer.path2dEnabled(path2dEnabled);

  return p;
};


function isNumber(obj) {
  return obj != null && typeof obj === typeof 1 && !isNaN(obj);
}

function isTag(ele, tagName) {
  return ele.tagName && ele.tagName.toLowerCase() === tagName.toLowerCase();
}


function getSvgLayers(cy) {
  const bgLayers = [];
  const fgLayers = [];
  const containerDiv = cy.container().children[0];
  if(isTag(containerDiv, 'div')) {
    let bg = true;
    for(const layer of containerDiv.children) {
      if(isTag(layer, 'svg')) {
        (bg ? bgLayers : fgLayers).push(layer);
      } else if(isTag(layer, 'canvas')) {
        bg = false;
      }
    }
  }
  return {
    bg: bgLayers,
    fg: fgLayers
  }
}


function drawSvgLayers(ctx, svgElements) {
  for(const svg of svgElements) {
    const gs = svg.getElementsByTagName('g');
    for(const g of gs) {
      const paths = g.getElementsByTagName('path');
      for(const path of paths) {
        drawSvgPath(ctx, path);
      }
    }
  }
}


function drawSvgPath(ctx, path) {
  const pdfDoc = ctx.doc;

  const setColor = (val, rgbcb, alphacb) => {
    if(typeof val === 'string') {
      const tuple = color2tuple(val);
      if(tuple) {
        const rgb = tuple.slice(0, 3);
        const a = tuple[3];
        rgbcb(rgb);
        if(typeof a !== 'undefined') {
          alphacb(a);
        }
      }
    }
  };

  const setNum = (val, cb) => {
    const num = Number(val);
    if(!isNaN(num)) {
      cb(num);
    }
  };

  const { style } = path;
  if(style) {
    setColor(style.fill, 
      rgb => pdfDoc.fillColor(rgb),
      a   => pdfDoc.fillOpacity(a)
    );
    setColor(style.stroke, 
      rgb => pdfDoc.strokeColor(rgb),
      a   => pdfDoc.strokeOpacity(a)
    );
    setNum(style.strokeWidth, 
      w => pdfDoc.lineWidth(w)
    );
  }
  
  const svgPathStr = path.getAttribute('d');

  pdfDoc.path(svgPathStr);
  pdfDoc.fillAndStroke();
}

