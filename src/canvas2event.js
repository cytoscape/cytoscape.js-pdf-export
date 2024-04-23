
// Canvas API methods that we will support
const canvasMethods = new Set([
  'background', 'end', 'save', 'restore', 'scale', 'rotate', 'translate',
  'transform', 'beginPath', 'lineTo', 'moveTo', 'arcTo', 'closePath', 
  'stroke', 'fill', 'ellipse', 'rect', 'arc', 'bezierCurveTo', 'quadraticCurveTo',
  'adjustTextX', 'adjustTextY', 'fillText', 'strokeText', 'clip',
  'drawImage', 
]);


/**
 * Records calls to the canvas API (made by cytoscape.js) and saves 
 * them as an array of 'event' objects.
 * 
 * The array of events can then be converted into a form that can be
 * used to draw to PDF instead of canvas.
 */
export default function CanvasEventBuffer() {

  const events = [];

  // TODO: verify these defaults
  const propertyState = {
    font: "10px Helvetica",
    textBaseline: "alphabetic",
    textAlign: "left",
    fillStyle: null,
    strokeStyle: null, 
    lineWidth: null,
    lineCap: null,
    lineJoin: null,
    globalAlpha: null
  };

  // The proxy is a stand-in for CanvasRenderingContext2D.
  // Instead of drawing to the screen, it records calls to the canvas API and
  // remembers them as 'event' objects.
  const proxy = new Proxy({}, {
    get(target, prop) {
      console.log('get', prop);
      if(canvasMethods.has(prop)) {
        return (...args) => {
          events.push({ prop, type: 'method', args });
        }
      } else if(propertyState.hasOwnProperty(prop)) {
        const value = propertyState[prop];
        //events.push({ type: 'get', prop, value }); // do we need 'get' events?
        return value;
      } else {
        console.log('get unsupported canvas property: ' + prop);
      }
    },
    set(target, prop, value) {
      if(propertyState.hasOwnProperty(prop)) {
        console.log('set', prop);
        propertyState[prop] = value;
        events.push({ prop, type: 'set', value });
      } else {
        console.log('set unsupported canvas property: ' + prop);
      }
      return true;
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


/**
 * Converts cytoscape.js canvas drawing "Events" into a form that is acceptible
 * for drawing to PDF.
 * 
 * This is the reason why we are using an array of 'event' objects.
 * We can look ahead in the array and convert events into a format that is acceptable
 * for PDF.
 * 
 * For example PDF does not support calling fill() then stroke(), it has to be converted
 * into one call to fillAndStroke(). But fill() and stroke() might not be next to each
 * other, we need to search ahead for the call to stroke() that corresponds to a fill().
 */
function convertEvents(events) {
  let savedPath = [];
  const point = { px: 0, py: 0 };
  let nextStrokeNeedsPath = false;

  // Using a loop counter because we can look ahead or back in the buffer
  for(let i = 0; i < events.length; i++) {
    const event = events[i];
    if(event === null)
      continue;
    const { prop } = event;

    /**
     * Sometimes cy.js calls beginPath() and then immediatley calls lineTo() which doesn't work with pdfkit.
     * Need to replace the the first call to lineTo() with a call to moveTo().
     */
    if(prop === 'beginPath') {
      // TODO: need to scan ahead for 'lineTo', it might not be right after the 'beginPath'
      if(events[i+1].prop === 'lineTo') {
        events[i+1] = { ...events[i+1], prop: 'moveTo' };
      }
    }

    // If we encounter a beginPath(), ..., endPath() sequence then save the path.
    if(prop === 'beginPath') {
      savedPath = [];
      let j = i + 1;
      while(j < events.length && events[j].prop !== 'closePath') {
        savedPath.push(events[j++]);
      }
    }

    // PDF does not support calling fill() then calling stroke()
    // Either fill()-stroke() needs to be repliaced with a call to fillAndStroke()
    // or the path needs to be replayed before the call to stroke.
    if(prop === 'fill') {
      if(events[i+1].prop === 'stroke') { // easy case, replace fill then stroke with a fillAndStroke
        events[i] = { ...event, prop: 'fillAndStroke' };
        events[i+1] = null;
        nextStrokeNeedsPath = false;
      } else { // otherwise we will duplicate the path before the stroke
        nextStrokeNeedsPath = true;
      }
    }

    if(prop === 'stroke') {
      if(nextStrokeNeedsPath) {
        events.splice(i, 0, 
          { prop: 'beginPath', type: 'method', args: [] },
          ...savedPath,
          { prop: 'closePath', type: 'method', args: [] },
        );
      }
      nextStrokeNeedsPath = false;
    }

    /**
     * Remember the (x,y) point where calls to various drawing methods end up.
     * Pass the point to the arcTo() function.
     */
    if(['lineTo', 'moveTo'].includes(prop)) {
      const [ x, y ] = event.args;
      point.px = x;
      point.py = y;
    }
    if(prop === 'arcTo') {
      event.args.push(point.px, point.py);
    }
    if(['arcTo', 'bezierCurveTo', 'quadraticCurveTo'].includes(prop)) {
      const [ x, y ] = event.args;
      point.px = x;
      point.py = y;
    }
  }

}