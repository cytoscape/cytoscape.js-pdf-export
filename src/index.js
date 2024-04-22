import PDFDocument from "pdfkit";
import PdfContext from "./canvas2pdf.js";
import blobStream from "blob-stream";
import saveAs from "file-saver";
import './pdfkit-virtual-files.js'; 


export function pdf() {
  const stream = blobStream();
  const doc = new PDFDocument();
  doc.pipe(stream);

  doc.save()
    // .beginPath()
    .moveTo(100, 150)
    .lineTo(100, 250)
    .lineTo(200, 250)
    .closePath()
    .fillColor('#999999',1)
    .fillOpacity(1)
    .strokeColor('#ff0000',0.5)
    .strokeOpacity(0.5)
    .lineWidth(3)
    .fillAndStroke()
  ;

  stream.on('finish', () => {
    const blob = stream.toBlob("application/pdf");
    saveAs(blob, "pdfkit-example.pdf", true)
  });
  doc.end();
}


export function canvas2pdf() { 
  const stream = blobStream();
  const ctx = new PdfContext(stream, 1000, 1000);

  // wrapObjectFunctions(ctx.doc, (name, obj, args) => console.log(`  ${name}(${Array.from(args)})`));

  // round rectangle
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
  ctx.fill();
  ctx.stroke();
  ctx.scale(0.15810276679841898,0.15810276679841898);
  ctx.translate(2180.5875,2587.4375);

  // round triangle
  // ctx.translate(-4682.467289719626,-4187.644859813084)
  // ctx.scale(9.607476635514018,9.607476635514018)
  // ctx.beginPath()
  // ctx.moveTo(547,483)
  // ctx.arcTo(544,476,540,483,4)
  // ctx.lineTo(526.8944271909999,510.21114561800016)
  // ctx.arcTo(524,516,530.4721359549995,516,4)
  // ctx.lineTo(557.5278640450005,516)
  // ctx.arcTo(564,516,561.1055728090001,510.21114561800016,4)
  // ctx.closePath()
  // ctx.fill()
  // ctx.stroke()

  stream.on('finish', () => {
    const blob = stream.toBlob("application/pdf");
    saveAs(blob, "canvas2pdf-example.pdf", true)
  });
  ctx.end();
}


window.pdf = pdf;
window.canvas2pdf = canvas2pdf;
window.testProxy = testProxy;


// /**
//  * For debug
//  */
// function wrapObjectFunctions(obj, before, after) {
//   var key, value;

//   for (key in obj) {
//     value = obj[key];
//     if (typeof value === "function") {
//       wrapFunction(obj, key, value);
//     }
//   }

//   function wrapFunction(obj, fname, f) {
//     obj[fname] = function() {
//       if (before) {
//         before(fname, this, arguments);
//       }
//       let rv = f.apply(this, arguments); // Calls the original
//       if (after) {
//         after(fname, this, arguments, rv);
//       }
//       return rv;
//     };
//   }
// }