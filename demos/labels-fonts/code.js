const samples = [
  { id: 'courier-normal', label: 'Courier\nnormal', family: 'Courier', weight: 'normal', style: 'normal', x: 90, y: 80 },
  { id: 'courier-bold', label: 'Courier\nbold', family: 'Courier', weight: 'bold', style: 'normal', x: 290, y: 80 },
  { id: 'courier-oblique', label: 'Courier\noblique', family: 'Courier', weight: 'normal', style: 'oblique', x: 490, y: 80 },
  { id: 'courier-bold-oblique', label: 'Courier\nbold oblique', family: 'Courier', weight: 'bold', style: 'oblique', x: 690, y: 80 },

  { id: 'helvetica-normal', label: 'Helvetica\nnormal', family: 'Helvetica', weight: 'normal', style: 'normal', x: 90, y: 220 },
  { id: 'helvetica-bold', label: 'Helvetica\nbold', family: 'Helvetica', weight: 'bold', style: 'normal', x: 290, y: 220 },
  { id: 'helvetica-oblique', label: 'Helvetica\noblique', family: 'Helvetica', weight: 'normal', style: 'oblique', x: 490, y: 220 },
  { id: 'helvetica-bold-oblique', label: 'Helvetica\nbold oblique', family: 'Helvetica', weight: 'bold', style: 'oblique', x: 690, y: 220 },

  { id: 'times-normal', label: 'Times\nnormal', family: 'Times', weight: 'normal', style: 'normal', x: 90, y: 360 },
  { id: 'times-bold', label: 'Times\nbold', family: 'Times', weight: 'bold', style: 'normal', x: 290, y: 360 },
  { id: 'times-italic', label: 'Times\nitalic', family: 'Times', weight: 'normal', style: 'italic', x: 490, y: 360 },
  { id: 'times-bold-italic', label: 'Times\nbold italic', family: 'Times', weight: 'bold', style: 'italic', x: 690, y: 360 },

  { id: 'times-new-roman', label: 'Times New Roman', family: 'Times New Roman', weight: 'normal', style: 'normal', x: 90, y: 500 },
];

const cy = cytoscape({
  container: document.getElementById('cy'),
  style: [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'font-size': '18px',
        'font-family': 'data(family)',
        'font-weight': 'data(weight)',
        'font-style': 'data(style)',
        'text-wrap': 'wrap',
        'text-max-width': '180px',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': '#111827',
        'background-color': '#e5e7eb',
        'border-width': 1,
        'border-color': '#6b7280',
        'width': 180,
        'height': 78,
        'shape': 'roundrectangle'
      }
    }
  ],
  elements: {
    nodes: samples.map(sample => ({
      data: {
        id: sample.id,
        label: sample.label,
        family: sample.family,
        weight: sample.weight,
        style: sample.style,
      },
      position: { x: sample.x, y: sample.y }
    })),
    edges: []
  },
  layout: {
    name: 'preset',
    fit: true,
    padding: 30,
    animate: false
  }
});

cy.ready(() => {
  cy.fit();

  window.pdf = () => cy.pdf({
    save: true,
    fileName: 'cytoscape-fonts.pdf',
    bg: '#ffffff'
  });

  const exportBtn = document.getElementById('export');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (window.pdf) {
        window.pdf();
      }
    });
  }
});
