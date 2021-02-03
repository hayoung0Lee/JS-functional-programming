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

// 함수를 인자로 주면, 해당 함수에 대한 인자를 기다리는 함수를 반환
// 인자가 하나만 들어오면 더 들어올때까지 기다리는 함수를 반환
// 인자가 두개 이상 한꺼번에 잘들어오면 바로 함수 실행
const curry = (f) => {
  // 커리 함수에 map, filter, reduce를 넣어서 아래의 함수를 반환한다.
  return (a, ..._) => {
    return _.length ? f(a, ..._) : (..._) => f(a, ..._);
  };
};

// log(add(add(add(add(add(0, 1, 1), 2), 3), 4), 5)); 이렇게 되길 기대하는 함수
// curry를 적용해서 실행할 함수를 만들었고, fn, acc, iter라는 인자를 나중에 넘겨줘야한다.
const reduce = curry((fn, acc, iter) => {
  if (!iter) {
    iter = acc[Symbol.iterator]();
    acc = iter.next().value;
  } else {
    iter = iter[Symbol.iterator]();
  }
  // for (const n of iter) {
  let cur;
  while (!(cur = iter.next()).done) {
    const n = cur.value;
    acc = fn(acc, n);
  }

  return acc;
});

const go = (...args) => {
  // 커링 되어있어서 이제 인자만 넘겨주면된다
  return reduce(
    //
    (a, f) => f(a),
    //
    args
  );
  //
};

// 함수를 여러개 받고, 그다음에 시작하는 인자를 준다
// 함수들이 나열되어있는 합성된 함수를 만드는 함수
const pipe = (f, ...fs) => {
  return (...as) => go(f(...as), ...fs);
};

// 몇개를 받을지를 주고, 그 갯수만큼만 원소를 받는다
const take = curry((l, iter) => {
  let res = [];
  // for (const a of iter) {
  iter = iter[Symbol.iterator]();
  let cur;
  while (!(cur = iter.next()).done) {
    const a = cur.value;
    res.push(a);
    if (res.length === l) return res;
  }

  return res;
});

// 범위만큼의 숫자를출력
const range = (l) => {
  let i = -1;
  let res = [];
  while (++i < l) {
    res.push(i);
  }
  return res;
};

const join = curry((sep = ",", iter) =>
  reduce((a, b) => `${a}${sep}${b}`, iter)
);

const find = curry((f, iter) =>
  go(
    // iter
    iter,
    L.filter(f),
    take(1),
    ([a]) => a
  )
);

// Lazy evaluation
const L = {};
L.range = function* (l) {
  let i = -1;
  while (++i < l) {
    yield i;
  }
};

L.map = curry(function* (f, iter) {
  for (const a of iter) yield f(a);
});

L.filter = curry(function* (f, iter) {
  for (const a of iter) {
    if (f(a)) yield a;
  }
});

L.entries = function* (obj) {
  for (const k in obj) yield [k, obj[k]];
};

const isIterable = (a) => a && a[Symbol.iterator];

L.flatten = function* (iter) {
  for (const a of iter) {
    if (isIterable(a)) {
      // for (const b of a) yield b;
      // for (const b of a) yield b 과 yield *iterable은 같다
      yield* a;
    } else {
      yield a;
    }
  }
};

L.deepFlat = function* f(iter) {
  for (const a of iter) {
    if (isIterable(a)) {
      yield* f(a);
    } else {
      yield a;
    }
  }
};

const takeAll = take(Infinity);

// 즉시 평가하는 flatten
const flatten = pipe(L.flatten, takeAll);

L.flatMap = curry(pipe(L.map, L.flatten));

const flatMap = curry(pipe(L.map, flatten));

// iterable에 함수를 각각 다 실행하는것
// 인자 두개는 나중에 따로 받을 수가 있게 되었다
// const map = curry((f, iter) => {
//   let res = [];
//   // for (const a of iter) {
//   //   res.push(f(a));
//   // }

//   iter = iter[Symbol.iterator]();
//   let cur;
//   while (!(cur = iter.next()).done) {
//     const a = cur.value;
//     res.push(f(a));
//   }
//   return res;
// });

// map을 L.map으로 바꾸기
const map = curry(pipe(L.map, takeAll));

// 이터러블에 함수를 실행해서통과된것만 넣는것
// 인자는 나중에 따로 받는다.
// const filter = curry((fn, iter) => {
//   let res = [];
//   // for (const a of iter) {
//   iter = iter[Symbol.iterator]();
//   let cur;
//   while (!(cur = iter.next()).done) {
//     const a = cur.value;
//     if (fn(a)) res.push(a);
//   }
//   return res;
// });

// filter를 L.filter로 바꾸기
const filter = curry(pipe(L.filter, takeAll));
