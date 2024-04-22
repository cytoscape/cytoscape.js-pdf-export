
// Canvas API methods that we will support
const canvasMethods = new Set([
  'background', 'end', 'save', 'restore', 'scale', 'rotate', 'translate',
  'transform', 'beginPath', 'lineTo', 'moveTo', 'arcTo', 'closePath', 
  'stroke', 'fill', 'ellipse', 'rect', 'arc', 'bezierCurveTo', 'quadraticCurveTo',
  'adjustTextX', 'adjustTextY', 'fillText', 'strokeText', 'clip',
  'drawImage', 
]);

// Canvas API properties we will support
const canvasProperties = new Set([
  'font', 'textBaseline', 'textAlign', 'fillStyle', 'strokeStyle', 'lineWidth',
  'lineCap', 'lineJoin', 'globalAlpha', 'imageSmoothingEnabled'
]);



export function EventBuffer() {

  const events = [];

  const proxy = new Proxy({}, {
    get(target, prop) {
      if(canvasMethods.has(prop)) {
        return (...args) => {
          events.push({ type: 'method', prop, args });
        }
      } else if(canvasProperties.has(prop)) {
        const obj = {};
        Object.defineProperty(obj, prop, {
          get: () => { 
            events.push({ type: 'get', prop });
          },
          set: (value) => {
            events.push({ type: 'set', prop, value });
          },
        });
      } else {
        console.log('Unsupported canvas API property: ' + prop);
      }
    }
  })

  const convert = () => convertEvents(events);

  const runEvents = ctx => {
    for(const event of events) {
      if(event === null)
        continue;
      console.log(event);
      if(event.type === 'method') {
        ctx[event.prop](...event.args);
      } else if(event.type === 'set') {
        ctx[event.prop] = event.value;
      }
    }
  };

  return {
    proxy,
    events,
    convert,
    runEvents,
  }
};


function convertEvents(events) {
  let savedPath = [];
  const point = { px: 0, py: 0 };

  // Using a loop counter because we can look ahead or back in the buffer
  for(let i = 0; i < events.length; i++) {
    const event = events[i];
    if(event === null)
      continue;

    /**
     * Sometimes cy.js calls beginPath() and then immediatley calls lineTo() which doesn't work with pdfkit.
     * Need to translate the the 'first' call to lineTo() into a call to moveTo().
     */
    if(event.prop === 'beginPath') {
      // TODO: need to scan ahead for 'lineTo', it might not be right after the 'beginPath'
      if(events[i+1].prop === 'lineTo') {
        events[i+1] = { ...events[i+1], prop: 'moveTo' };
      }
    }

    // If we encounter a beginPath(), ..., endPath() sequence then save the path.
    if(event.prop === 'beginPath') {
      savedPath = [];
      let j = i + 1;
      while(j < events.length && events[j].prop !== 'closePath') {
        savedPath.push(events[j++]);
      }
    }

    // TODO detect a fill and stroke??
    // easy case, replace fill then stroke with a fillAndStroke
    if(event.prop === 'fill' && events[i+1].prop === 'stroke') {
      events[i] = { ...event, prop: 'fillAndStroke' };
      events[i+1] = null;
    }

    /**
     * Remember the x/y point where calls to various drawing methods end up.
     * Pass the point to the arcTo() function.
     */
    if(['lineTo', 'moveTo'].includes(event.prop)) {
      const [ x, y ] = event.args;
      point.px = x;
      point.py = y;
      console.log('saved point 1', point);
    }
    if(event.prop === 'arcTo') {
      console.log('arcTo adding arguments', point);
      event.args.push(point.px, point.py);
    }
    if(['arcTo', 'bezierCurveTo', 'quadraticCurveTo'].includes(event.prop)) {
      const [ x, y ] = event.args;
      point.px = x;
      point.py = y;
      console.log('saved point 2', point);
    }
  }

}