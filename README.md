cytoscape.js-pdf-export
=======================

Cytoscape.js extension for exporting networks to PDF (using pdfkit).

## License

[MIT](LICENSE)


## Known Limitations

* When setting border opacity for nodes to partially transparent, the border sometimes looks like two rings. 
  This is because the fill part of the node is 1/2 underneath the border, so when the border is transparent t
  he part that's over the fill ends up with a different color than the part that's not over the fill.
  This does not happen with PDF kit (not sure why), the border will look like a solid ring.
