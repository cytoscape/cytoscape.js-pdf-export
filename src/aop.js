// This is a super-basic implementation of AOP, where we can define "advice" that runs before/after methods.

function createAdviceMap() {
  const map = new Map();

  map.add = (key, val) => {
    if(map.has(key))
      map.get(key).push(val);
    else
      map.set(key, [val]);
  };

  map.getDef = (key) => {
    return map.has(key) ? map.get(key) : [];
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

function isFunction(obj, fname) {
  return !isAccessor(obj, fname) && typeof obj[fname] === 'function';
}

function isAccessor(obj, fname) {
  const desc = Object.getOwnPropertyDescriptor(obj, fname);
  return desc && desc.configurable && 'get' in desc && 'set' in desc;
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

  const callbacks = {
    before: (names, f) => setAdvice(names, beforeAdvice, f),
    after:  (names, f) => setAdvice(names, afterAdvice,  f),
    beforeAll: (f) => setAdvice(allNames, beforeAdvice, f),
    afterAll:  (f) => setAdvice(allNames, afterAdvice,  f),
    beforeAllExcept: (names, f) => setAdvice(() => minus(allNames, names), beforeAdvice, f),
    afterAllExcept:  (names, f) => setAdvice(() => minus(allNames, names), afterAdvice,  f),
  }

  const wrapFunctions = (obj) => {  // call at end
    // we have to defer setting the advice on functions until after we know the function names
    for(const fname in obj) {
      if(isFunction(obj, fname) || isAccessor(obj, fname)) {
        allNames.push(fname);
      }
    }

    deferredAdviceSetters.forEach(f => f());

    for(const fname in obj) {
      const before = beforeAdvice.getDef(fname);
      const after  = afterAdvice .getDef(fname);
      const runBefore = (fname, ...args) => before.forEach(f => f(fname, ...args));
      const runAfter  = (fname, ...args) => after.slice().reverse().forEach(f => f(fname, ...args));

      if(isFunction(obj, fname)) {
        const f = obj[fname];

        obj[fname] = function(...args) {
          runBefore(fname, ...args);
          const rv = f.call(obj, ...args);
          runAfter(fname, ...args);
          return rv;
        };
      } 
      else if(isAccessor(obj, fname)) {
        const desc = Object.getOwnPropertyDescriptor(obj, fname);
        const getter = desc.get;
        const setter = desc.set;

        Object.defineProperty(obj, fname, {
          ...desc,
          get: function () {
            runBefore(fname);
            const rv = getter.call(obj);
            runAfter(fname);
            return rv;
          },
          set: function(value) {
            runBefore(fname, value);
            const rv = setter.call(obj, value);
            runAfter(fname, value);
            return rv;
          },
        });
      }
    }
  };
  
  const advice = (stateName, f) => {
    const rv = f(callbacks);
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


