cytoscape.js-pdf-export
=======================

Cytoscape.js extension for exporting networks to PDF (using [PDFkit](https://github.com/foliojs/pdfkit)).

## License

[MIT](LICENSE)

## Dependencies

* Cytoscape.js ^3.28.0
  * Older versions of Cytoscape.js may still work, this is the version used for testing.

## How to use

### Installation
* via npm: `npm install cytoscape-pdf-export`
* via github url...
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

* The options object passed to the `cy.pdf(options)` function is outlined below, with default values.

```js
const options = {
  // If false then only the visible part of the network will be exported.
  // If true then the entire network is exported regardless of the current zoom/pan.
  full: false, 

  // The background color to use, or none if false. 
  // Can be any CSS color value that's accepted by Cytoscape.js
  bg: false,

  // The paper size and orientation
  paperSize: 'LETTER', // can be CUSTOM, LETTER (default), LEGAL, TABLOID, A0, A1, A2, A3, A4, A5
  orientation: 'PORTRAIT', // can be PORTRAIT or LANDSCAPE

  // The width/height to use when paperSize is set to 'CUSTOM'
  width: null,  // paper width  in "PostScript points", 72 units per inch
  height: null, // paper height in "PostScript points", 72 units per inch

  // The margin, default is 52 units which is 3/4 of an inch.
  margin: 52,

  // There is limited support for the cytoscape-layers extension.
  // If this flag is true then any SVG layers registered with the cytoscape-layers 
  // extension will be included in the PDF export.
  includeSvgLayers: false,

  // If true will log debug info to the console.
  debug: false, 

  // The options below are temporary and will be removed in the future.
  save: false, // causes a save-as window to pop up when the PDF is ready to be downloaded 
  fileName: 'cytoscape.pdf', 
};
```


## Fonts

* Fonts are limited to those provided by PDFKit.
  * Courier (normal, bold, oblique)
  * Helvetica (normal, bold, oblique)
  * Times (normal, bold, italic)
  * Times New Roman
  * Symbol
  * ZapfDingbats
* If an unsupported font is specified, it will default to Helvetica.
* 'sans-serif' defaults to Helvetica
* 'serif' defaults to Times New Roman

## Reporting Bugs

* This extension is still very new, there are likely to be bugs. 
  Please report bugs to this GitHub repository issue tracker.

## Known Limitations

* In Cytoscape.js when node border opacity is partially transparent it sometimes sometimes looks like two rings. 
  This is because the fill part of the node is 1/2 underneath the border, so when the border is transparent the 
  part that's over the fill ends up with a different color than the part that's not over the fill.
  This does not happen with PDFkit (not sure why), the border will look like a solid ring.
* When using dashed or dotted edge lines or node borders, the dashes may not line up exactly as they look in Cytoscape.js.
* Fonts are limited to the ones listed above.
