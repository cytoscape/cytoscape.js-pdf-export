import CanvasEventBuffer from './canvas2event.js';
import PdfEventProcessor from './event2pdf.js';

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
  margin: DEFAULT_MARGIN, // margin in "PostScript points",
  debug: false, // if true will log debug info to the console
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
  if(options.debug) {
    console.log('pdfExport options', options);
  }
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
  const paperDrawWidth  = paperWidth  - (margin * 2);
  const paperDrawHeight = paperHeight - (margin * 2);

  // Fit the network to the paper drawing region
  let scale, width, height;
  if(options.full) {
    scale = Math.min(paperDrawWidth / bb.w, paperDrawHeight / bb.h);
    width  = bb.w;
    height = bb.h;
  } else {
    const [,, containerWidth, containerHeight ] = renderer.findContainerClientCoords();
    scale = Math.min(paperDrawWidth / containerWidth, paperDrawHeight / containerHeight);
    width  = containerWidth;
    height = containerHeight;
  }

  if(options.debug) {
    console.log('paper draw area width/height', paperDrawWidth, paperDrawHeight);
    console.log('network width/height', width, height);
    console.log('scale', scale);
  }

  // Record the calls to the canvas API, but don't actually draw anything yet.
  const eventBuffer = CanvasEventBuffer(options.debug);
  const proxy = eventBuffer.proxy; // The proxy is a stand-in for CanvasRenderingContext2D

  // Initialize the renderer
  const restoreRenderer = initRenderer(cy);
  const zsortedEles = renderer.getCachedZSortedEles();

  // Setup the viewport
  proxy.translate(margin, margin);
  proxy.scale(scale, scale);
  if(options.bg) {
    proxy.background(0, 0, width, height, options.bg);
  }
  proxy.rect(0, 0, width, height);
  proxy.clip();

  if(options.full) {
    proxy.translate(-bb.x1, -bb.y1);
  } else {
    const [ pan, zoom ] = [ cy.pan(), cy.zoom() ];
    proxy.translate(pan.x, pan.y);
    proxy.scale(zoom, zoom);
  }

  // Draw the network (ie record drawing events)
  if(options.includeSvgLayers) {
    const svgLayers = getSvgLayers(cy);
    proxy.drawSvgLayers(svgLayers.bg);
    renderer.drawElements(proxy, zsortedEles);
    proxy.drawSvgLayers(svgLayers.fg);
  } else {
    renderer.drawElements(proxy, zsortedEles);
  }

  proxy.end();
  restoreRenderer();

  // Convert the canvas API 'events'
  if(options.debug) {
    console.log("Canvas events...")
    eventBuffer.events.forEach(evt => console.log(evt));
  }

  eventBuffer.convertEvents();

  if(options.debug) {
    console.log("PDF events...")
    eventBuffer.events.forEach(evt => console.log(evt));
  }

  // Now draw to the PDF context
  const stream = blobStream();
  const ctx = new PdfEventProcessor(stream, paperWidth, paperHeight, options.debug);
  const p = createBlobPromise(ctx);

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



function getSvgLayers(cy) {
  const isTag = (ele, tagName) =>
    ele.tagName && ele.tagName.toLowerCase() === tagName.toLowerCase();

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
