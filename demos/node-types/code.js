/* global document, window, fetch, cytoscape */

(function(){
  var toJson = function(res){ return res.json(); };

  const cy = cytoscape({
    container: document.getElementById('cy'),

    layout: {
      name: 'grid'
    },

    style: fetch('cy-style.json').then(toJson),

    elements: fetch('data.json').then(toJson)
  });

  cy.ready(() => {
    window.pdf = () => cy.pdf();
  });

  window.cy = cy;
})();