cytoscape.js-pdf-export
=======================

Cytoscape.js extension for exporting networks to PDF (using PDFkit).

## License

[MIT](LICENSE)

## Dependencies

* Cytoscape.js ^3.28.0
  * Older versions of Cytoscape.js may still work, this is the version used for testing.

## How to use

### Installation
* (TODO) via npm: `npm install cytoscape-pdf-export`
* (TEMPORARY) via github url...

```json
"dependencies": {
  "cytoscape-pdf-export": "cytoscape/cytoscape.js-pdf-export#release/0.0.2",
}
```

### Importing
```js
import cytoscape from 'cytoscape';
import pdf from 'cytoscape-pdf-export';

cytoscape.use(pdf);
```

### Using

* This extension adds a function to the cy object: `cy.pdf(options)`
* It works similar to the `cy.png(...)` function in core cytoscape.js.

```js
const blobPromise = cy.pdf({
  paperSize: 'LETTER',
  orientation: 'LANDSCAPE',
});
const blob = await blobPromise;
saveAs(blob, 'network.pdf', true);
```

### Options

* The options object passed to the pdf(options) function is outlined below, with default values.

```js
const options = {
  // If false then only the visible part of the network will be exported.
  // If true then the entire network is exported regardless of the current zoom/pan.
  full: false, 

  // The background color to use, or none if false. 
  // Can be any CSS color value that's already accepted by Cytoscape.js
  bg: false,

  // The paper size, see below for accepted values for these options.
  paperSize: 'LETTER', 
  orientation: 'PORTRAIT',

  // The width/height to use when the paperSize is set to 'CUSTOM'
  width: null,  // paper width  in "PostScript points", 72 units per inch
  height: null, // paper height in "PostScript points", 72 units per inch

  // The margin, default is 52 units which represents 3/4 of an inch.
  margin: 52,

  // There is limited support for the cytoscape-layers extension.
  // If this flag is true then any SVG layers registered with the cytoscape-layers 
  // extension will be included in the PDF export.
  includeSvgLayers: false,

  // If true will log debug info to the console.
  debug: false, 

  // The options below are temporary and will likely be removed in the future.
  save: false, // causes a save-as window to pop-up when the PDF is ready to be downloaded 
  fileName: 'cytoscape.pdf', 
};
```

* Paper sizes:
  * Currently supported paper sizes are:
    * CUSTOM, LETTER (default), LEGAL, TABLOID, A0, A1, A2, A3, A4, A5
    * In PORTRAIT or LANDSCAPE orientation
    * CUSTOM requires specifying your own width and height in "Postscript Points" (72 units per inch)
  * Margins default to 3/4 inch

## Fonts

* Supported Fonts:
  * Fonts are limited to those provided by PDFKit.
    * Courier (normal, bold, oblique)
    * Helvetica (normal, bold, oblique)
    * Times (normal, bold, italic)
    * Times New Roman
    * Symbol
    * ZapfDingbats
  * If an unsupported font is found, it will default to Helvetica.
  * 'sans-serif' defaults to Helvetica
  * 'serif' defaults to Times New Roman

## Reporting Bugs

* This extension is still very new, there are likely to be bugs. 
  Please report bugs to this GitHub repository issue tracker.

## Known Limitations

* In Cytoscape.js when a node border opacity is partially transparent it sometimes sometimes looks like two rings. 
  This is because the fill part of the node is 1/2 underneath the border, so when the border is transparent the 
  part that's over the fill ends up with a different color than the part that's not over the fill.
  This does not happen with PDFkit (not sure why), the border will look like a solid ring.
* When using dashed or dotted edge lines or node borders, the dashes may not line up exactly as they look in Cytoscape.js.
