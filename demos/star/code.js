console.log(document.getElementById('cy'));

const cy = cytoscape({
  container: document.getElementById('cy'), // container to render in

  layout: {
    name: 'cose',
  },
  style: [
    {
      selector: 'node',
      style: {
        label: 'data(id)',
        'text-valign': 'center',
        color: '#000000',
        'background-color': '#3a7ecf',
        'font-family': 'Helvetica'
      },
    },
    {
      selector: 'edge',
      style: {
        width: 2,
        'line-color': '#3a7ecf',
        opacity: 0.5,
      },
    },
  ],
  elements: {
    nodes: [
      { data: { id: 'n1', weight: 1 } },
      { data: { id: 'n2', weight: 2 } },
      { data: { id: 'n3', weight: 3 } },
      { data: { id: 'n4', weight: 4 } },
      { data: { id: 'n5', weight: 5 } },
    ],
    edges: [
      { data: { source: 'n1', target: 'n2', directed: 'false' } },
      { data: { source: 'n1', target: 'n3', directed: 'false' } },
      { data: { source: 'n1', target: 'n4', directed: 'false' } },
      { data: { source: 'n1', target: 'n5', directed: 'false' } },
      { data: { source: 'n2', target: 'n3', directed: 'false' } },
      { data: { source: 'n2', target: 'n4', directed: 'false' } },
      { data: { source: 'n2', target: 'n5', directed: 'false' } },
      { data: { source: 'n3', target: 'n4', directed: 'false' } },
      { data: { source: 'n3', target: 'n5', directed: 'false' } },
      { data: { source: 'n4', target: 'n5', directed: 'false' } },
    ],
  },
});

cy.ready(() => {
  window.pdf = () => cy.pdf({ bg: '#000', save: true });
});

