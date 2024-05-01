import CanvasEventBuffer from './canvas2event.js';
import PdfEventProcessor from './event2pdf.js';
import { color2tuple } from './colors';

import PDFDocument from 'pdfkit';
import blobStream from 'blob-stream';
import saveAs from 'file-saver'; // TODO remove this dependency?
import './pdfkit-virtual-files.js';  // https://github.com/blikblum/pdfkit-webpack-example/issues/1


// Sizes are in "PostScript points", 72 points per inch
const PAPER_SIZES = {
  LETTER: [612, 792],
  LEGAL: [612, 1008],
  TABLOID: [792, 1224], 
  A0: [2384, 3370],
  A1: [1684, 2384],
  A2: [1191, 1684],
  A3: [842, 1190],
  A4: [595, 842],
  A5: [420, 595],
};
const UNITS_PER_INCH = 72;
const DEFAULT_PAPER_SIZE = 'LETTER';
const DEFAULT_MARGIN = UNITS_PER_INCH * 0.75;


/**
 * Options for the pdf() function.
 */
export const defaultOptions = {
  save: false, // TODO remove this, its only here for now because its convenient
  fileName: 'cytoscape.pdf',
  includeSvgLayers: false,
  full: false,
  bg: false, // HEX color code
  paperSize: DEFAULT_PAPER_SIZE, // one of the values in the PAPER_SIZES enum, or 'CUSTOM'
  orientation: 'portrait', // 'portrait' or 'landscape'
  width: null,  // paper width  in "PostScript points", 72 units per inch
  height: null, // paper height in "PostScript points", 72 units per inch
  margin: DEFAULT_MARGIN, // margin in "PostScript points"
};


/**
 * Register pdf() function as a cytoscape.js extension.
 */
export default function register(cytoscape) {
  if(!cytoscape) { return; }
  cytoscape('core', 'pdf', pdfExport);
};

// expose to global cytoscape (i.e. window.cytoscape)
if(typeof cytoscape !== 'undefined') { 
  register(cytoscape);
}

// housekeeping to make pdfkit happy
window.PDFDocument = PDFDocument;
window.blobStream = blobStream;


/**
 * The main entrypoint.
 */
export async function pdfExport(options) {
  options = { ...defaultOptions, ...options };
  console.log('pdfExport', options);
  const cy = this;

  const blob = await createPdfBlob(cy, options);
  if(options.save) {
    saveAs(blob, options.fileName, true);
  } else {
    return blob;
  }
}


/**
 * Prepare the cytoscape.js canvas renderer for drawing to PDF.
 */
function initRenderer(cy) {
  const renderer = cy.renderer();
  const allEles = cy.elements();

  // Some caches need to be cleared.
  allEles.dirtyBoundingBoxCache();
  allEles.dirtyCompoundBoundsCache();
  allEles.dirtyStyleCache();

  // Cached Path2D objects are used for clipping, pdfkit doesn't support that.
  const paths = new Map();
  for(const ele of allEles) {
    paths.set(ele.id(), ele.rscratch('pathCache'));
  }
  allEles.removeRscratch('pathCache'); 

  // pdfkit doesn't support Path2D
  const path2dEnabled = renderer.path2dEnabled();
  renderer.path2dEnabled(false);

  return function restore() {
    for(const ele of allEles) {
      ele.rscratch('pathCache', paths.get(ele.id()));
    }
    renderer.path2dEnabled(path2dEnabled);
  };
}


function getPaperSize(options) {
  if(options.paperSize === 'CUSTOM') {
    if(options.width > 0 && options.height > 0) {
      return [ options.width, options.height ];
    }
    console.warn(`paperSize=CUSTOM but valid width/height not provided, using ${DEFAULT_PAPER_SIZE} instead`);
    return PAPER_SIZES[DEFAULT_PAPER_SIZE];
  }

  let size = PAPER_SIZES[options.paperSize] || PAPER_SIZES[DEFAULT_PAPER_SIZE];
  if(options.orientation === 'landscape' || options.orientation === 'LANDSCAPE') {
    return size.reverse();
  }
  return size;
}


/**
 * Create the PDF.
 */
function createPdfBlob(cy, options) {
  const renderer = cy.renderer();
  const eles = cy.mutableElements();
  const bb = eles.boundingBox();

  const { margin } = options;
  const [ paperWidth, paperHeight ] = getPaperSize(options);
  const width  = paperWidth  - (margin * 2);
  const height = paperHeight - (margin * 2);

  const [,, networkWidth, networkHeight ] = renderer.findContainerClientCoords();
  const imageScale = Math.min(width / networkWidth, height / networkHeight);

  console.log('bb', bb);
  console.log('paper width/height', paperWidth, paperWidth);
  console.log('draw width/height (minus margins)', width, height);
  console.log('network width/height', networkWidth, networkHeight);
  console.log('imageScale', imageScale);

  // Record the calls to the canvas API, but don't actually draw anything yet.
  const eventBuffer = CanvasEventBuffer();
  const proxy = eventBuffer.proxy; // The proxy is a stand-in for CanvasRenderingContext2D

  const restoreRenderer = initRenderer(cy);
  const zsortedEles = renderer.getCachedZSortedEles();

  proxy.translate(margin, margin);
  proxy.scale(imageScale, imageScale);
  if(options.bg) {
    proxy.background(0, 0, networkWidth, networkHeight, options.bg);
  }
  proxy.rect(0, 0, networkWidth, networkHeight);
  proxy.clip();


  if(options.full) {
    // TODO
    // proxy.translate(-bb.x1 * scale, -bb.y1 * scale);
    // proxy.scale(scale, scale);

    // renderer.drawElements(proxy, zsortedEles);

    // proxy.scale(1/scale, 1/scale );
    // proxy.translate(bb.x1 * scale, bb.y1 * scale);
  } else {
    var pan = cy.pan();
    var translation = { x: pan.x, y: pan.y };
    const scale = cy.zoom();

    proxy.translate(translation.x, translation.y);
    proxy.scale(scale, scale);

    renderer.drawElements(proxy, zsortedEles);

    proxy.scale(1/scale, 1/scale);
    proxy.translate(-translation.x, -translation.y);
  }

  proxy.end();
  restoreRenderer();

  // Convert the canvas API 'events'
  console.log("Canvas events...")
  eventBuffer.events.forEach(evt => console.log(evt));
  eventBuffer.convertEvents();
  console.log("PDF events...")
  eventBuffer.events.forEach(evt => console.log(evt));

  // Now draw to the PDF context
  const stream = blobStream();
  const ctx = new PdfEventProcessor(stream, paperWidth, paperHeight);
  const p = createBlobPromise(ctx);

  // TODO this is not going to work, needs to be called inside of the translate/scale setup
  // if(options.includeSvgLayers) {
  //   const svgLayers = getSvgLayers(cy);
  //   drawSvgLayers(ctx, svgLayers.bg);
  //   eventBuffer.runDrawEvents(ctx);
  //   drawSvgLayers(ctx, svgLayers.fg);
  // } else {
  //   eventBuffer.runDrawEvents(ctx);
  // }

  eventBuffer.runDrawEvents(ctx);

  return p;
};


function createBlobPromise(ctx) {
  return new Promise((resolve, reject) => {
    try {
      ctx.stream.on('finish', () => {
        const blob = ctx.stream.toBlob("application/pdf");
        resolve(blob);
      });
    } catch(err) {
      reject(err);
    }
  });
}

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

