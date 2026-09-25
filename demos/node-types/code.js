/* global document, window, fetch, cytoscape */

(function(){
  var toJson = function(res){ return res.json(); };

  const cy = window.cy = cytoscape({
    container: document.getElementById('cy'),

    layout: {
      name: 'grid'
    },

    style: fetch('cy-style.json').then(toJson),

    elements: fetch('data.json').then(toJson)
  });

  cy.ready(() => {
    window.pdf = () => cy.pdf({
      save: true,
      fileName: 'cytoscape-node-types.pdf'
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
})();