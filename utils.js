const drawConsole = (className) => {
  const element = document.getElementsByClassName(className);
  return function draw() {
    Array.prototype.slice.call(arguments).forEach((arg) => {
      const p = document.createElement("p");
      p.innerHTML = arg;
      element[0].appendChild(p);
    });
  };
};

const map = (f, iter) => {
  let res = [];
  for (const a of iter) {
    res.push(f(a));
  }
  return res;
};

const filter = (fn, iter) => {
  let res = [];
  for (const a of iter) {
    if (fn(a)) res.push(a);
  }
  return res;
};

const reduce = (fn, acc, iter) => {
  if (!iter) {
    iter = acc[Symbol.iterator]();
    acc = iter.next().value;
  }
  for (const n of iter) {
    acc = fn(acc, n);
  }
  return acc;
};

console.log("loaded");
