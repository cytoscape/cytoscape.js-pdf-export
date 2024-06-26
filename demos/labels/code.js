/* global fetch, cytoscape, document, window */

(function(){
  let cy = window.cy = cytoscape({
    container: document.getElementById('cy'),

    layout: {
      name: 'grid',
      cols: 3
    },

    style: fetch('cy-style.json').then(function(res){
      return res.json();
    }),

    elements: [
      { data: { label: 'top left' }, classes: 'top-left' },
      { data: { label: 'top center' }, classes: 'top-center' },
      { data: { label: 'top right' }, classes: 'top-right' },

      { data: { label: 'center left' }, classes: 'center-left' },
      { data: { label: 'center center' }, classes: 'center-center' },
      { data: { label: 'center right' }, classes: 'center-right' },

      { data: { label: 'bottom left' }, classes: 'bottom-left' },
      { data: { label: 'bottom center' }, classes: 'bottom-center' },
      { data: { label: 'bottom right' }, classes: 'bottom-right' },

      { data: { label: 'multiline manual\nfoo\nbar\nbaz' }, classes: 'multiline-manual' },
      { data: { label: 'multiline auto foo bar baz' }, classes: 'multiline-auto' },
      { data: { label: 'outline' }, classes: 'outline' },

      { data: { id: 'ar-src' } },
      { data: { id: 'ar-tgt' } },
      { data: { source: 'ar-src', target: 'ar-tgt', label: 'autorotate (move my nodes)' }, classes: 'autorotate' },
      { data: { label: 'background' }, classes: 'background' }
    ]
  });

  cy.ready(() => {
    window.pdf = () => cy.pdf({ save: true });
  });

})();