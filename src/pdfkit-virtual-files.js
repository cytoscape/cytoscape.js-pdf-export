// the fs here is not node fs but the provided virtual one
import fs from 'fs';

function registerBinaryFiles(ctx) {
  ctx.keys().forEach(key => {
    // extracts "./" from beginning of the key
    fs.writeFileSync(key.substring(2), ctx(key));
  });
}

function registerAFMFonts(ctx) {
  ctx.keys().forEach(key => {
    const match = key.match(/([^/]*\.afm$)/);
    if (match) {
      // afm files must be stored on data path
      fs.writeFileSync(`data/${match[0]}`, ctx(key));
    }
  });
}

// register all files found in assets folder (relative to src)
//registerBinaryFiles(require.context('./static-assets', true));

// register AFM fonts distributed with pdfkit
// is good practice to register only required fonts to avoid the bundle size increase too much
registerAFMFonts(require.context('pdfkit/js/data', false, /Helvetica.*\.afm$/));


// the content file is returned as is (webpack is configured to load *.afm files as asset/source)
// register files imported directly
// https://github.com/blikblum/pdfkit-webpack-example/issues/1
import CourierBold from 'pdfkit/js/data/Courier-Bold.afm';
import CourierBoldOblique from 'pdfkit/js/data/Courier-BoldOblique.afm';
import CourierOblique from 'pdfkit/js/data/Courier-Oblique.afm';
import Courier from 'pdfkit/js/data/Courier.afm';
import HelveticaBold from 'pdfkit/js/data/Helvetica-Bold.afm';
import HelveticaBoldOblique from 'pdfkit/js/data/Helvetica-BoldOblique.afm';
import HelveticaOblique from 'pdfkit/js/data/Helvetica-Oblique.afm';
import Helvetica from 'pdfkit/js/data/Helvetica.afm';
import Symbol from 'pdfkit/js/data/Symbol.afm';
import TimesBold from 'pdfkit/js/data/Times-Bold.afm';
import TimesBoldItalic from 'pdfkit/js/data/Times-BoldItalic.afm';
import TimesItalic from 'pdfkit/js/data/Times-Italic.afm';
import TimesRoman from 'pdfkit/js/data/Times-Roman.afm';
import ZapfDingbats from 'pdfkit/js/data/ZapfDingbats.afm';

fs.writeFileSync('data/Courier-Bold.afm', CourierBold);
fs.writeFileSync('data/Courier-BoldOblique.afm', CourierBoldOblique);
fs.writeFileSync('data/Courier-Oblique.afm', CourierOblique);
fs.writeFileSync('data/Courier.afm', Courier);
fs.writeFileSync('data/Helvetica-Bold.afm', HelveticaBold);
fs.writeFileSync('data/Helvetica-BoldOblique.afm', HelveticaBoldOblique);
fs.writeFileSync('data/Helvetica-Oblique.afm', HelveticaOblique);
fs.writeFileSync('data/Helvetica.afm', Helvetica);
fs.writeFileSync('data/Symbol.afm', Symbol);
fs.writeFileSync('data/Times-Bold.afm', TimesBold);
fs.writeFileSync('data/Times-BoldItalic.afm', TimesBoldItalic);
fs.writeFileSync('data/Times-Italic.afm', TimesItalic);
fs.writeFileSync('data/Times-Roman.afm', TimesRoman);
fs.writeFileSync('data/ZapfDingbats.af', ZapfDingbats);

