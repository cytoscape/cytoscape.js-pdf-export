// This is a hackey implementation of AOP, where we can define "advice" that runs before/after methods.

function createAdviceMap() {
  const map = new Map();
  map.add = (key, val) => {
    if(map.has(key)) {
      map.get(key).push(val);
    } else {
      map.set(key, [val]);
    }
  };
  map.getDef = (key) => {
    if(map.has(key))
      return map.get(key);
    return [];
  }
  return map;
}


export function createAOP() {
  const beforeAdvice = createAdviceMap();
  const afterAdvice  = createAdviceMap();
  
  const before = (fnName, f) => {
    const names = Array.isArray(fnName) ? fnName : [fnName];
    names.forEach(n => beforeAdvice.add(n, f));
  };
  
  const after = (fnName, f) => {
    const names = Array.isArray(fnName) ? fnName : [fnName];
    names.forEach(n => afterAdvice.add(n, f));
  };
  
  const wrapFunctions = (obj) => {  // call at end
    for(let fname in obj) {
      if(typeof obj[fname] === 'function') {
        const f = obj[fname];

        const before = beforeAdvice.getDef(fname);
        const after  = afterAdvice.getDef(fname);
        const beforeAll = beforeAdvice.getDef('all');
        const afterAll  = afterAdvice.getDef('all');

        obj[fname] = function(...args) {
          before.forEach(f => f(fname, ...args));
          beforeAll.forEach(f => f(fname, ...args));
          const rv = f.call(obj, ...args);
          afterAll.slice().reverse().forEach(f => f(fname, ...args));
          after.slice().reverse().forEach(f => f(fname, ...args));
          return rv;
        };

      }
    }
  };
  
  const stateMap = new Map();
  
  const advice = (stateName, f) => {
    const rv = f(before, after);
    stateMap.set(stateName, rv);
  };
  
  const state = (stateName) => {
    return stateMap.get(stateName);
  };

  return {
    wrapFunctions,
    advice,
    state
  };
}


