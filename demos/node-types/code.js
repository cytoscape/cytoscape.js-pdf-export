/* global document, window, fetch, cytoscape */

(function(){
  var toJson = function(res){ return res.json(); };

  const cy = window.cy = cytoscape({
    container: document.getElementById('cy'),

    layout: {
      name: 'grid'
    },

    style: fetch('cy-style.json').then(toJson),

    elements: fetch('data-2.json').then(toJson)
  });

  cy.ready(() => {
    window.pdf = () => cy.pdf({ save: true });
  });
})();