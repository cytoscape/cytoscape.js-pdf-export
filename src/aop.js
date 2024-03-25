// This is a super-basic implementation of AOP, where we can define "advice" that runs before/after methods.

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


function array(x) {
  return Array.isArray(x) ? x : [x];
}

function minus(allNames, names) {
  const namesArray = array(names);
  return allNames.filter(n => !namesArray.includes(n));
}


export function createAOP() {
  const beforeAdvice = createAdviceMap();
  const afterAdvice  = createAdviceMap();
  const allNames = [];
  const stateMap = new Map();
  
  const deferredAdviceSetters = [];

  const setAdvice = (names, advice, f) => {
    deferredAdviceSetters.push(() => {
      const ns = (typeof names === 'function') ? names() : names;
      array(ns).forEach(n => advice.add(n, f));
    });
  };

  const adviceCallbacks = {
    before: (names, f) => setAdvice(names, beforeAdvice, f),
    after:  (names, f) => setAdvice(names, afterAdvice,  f),
    beforeAll: (f) => setAdvice(allNames, beforeAdvice, f),
    afterAll:  (f) => setAdvice(allNames, afterAdvice,  f),
    beforeAllExcept: (names, f) => setAdvice(() => minus(allNames, names), beforeAdvice, f),
    afterAllExcept:  (names, f) => setAdvice(() => minus(allNames, names), afterAdvice,  f),
  }

  const wrapFunctions = (obj) => {  // call at end
    for(let fname in obj) {
      if(typeof obj[fname] === 'function') {
        allNames.push(fname);
      }
    }

    // we have to defer setting the advice on functions until after we know the function names
    deferredAdviceSetters.forEach(f => f());

    for(let fname in obj) {
      if(typeof obj[fname] === 'function') {
        const f = obj[fname];
        const before = beforeAdvice.getDef(fname);
        const after  = afterAdvice.getDef(fname);

        obj[fname] = function(...args) {
          before.forEach(f => f(fname, ...args));
          console.log("calling " + fname);
          const rv = f.call(obj, ...args);
          after.slice().reverse().forEach(f => f(fname, ...args));
          return rv;
        };

      }
    }
  };
  
  const advice = (stateName, f) => {
    const rv = f(adviceCallbacks);
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


