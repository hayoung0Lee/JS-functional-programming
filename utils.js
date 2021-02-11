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

// 어떤 인자가 promise면 풀어서 전달해주는 함수
const convertPromise = (a, f) => (a instanceof Promise ? a.then(f) : f(a));

// log(add(add(add(add(add(0, 1, 1), 2), 3), 4), 5)); 이렇게 되길 기대하는 함수
// curry를 적용해서 실행할 함수를 만들었고, fn, acc, iter라는 인자를 나중에 넘겨줘야한다.
const reduceF = (acc, a, f) => {
  // then 의 두번째 인자로 reject하는 경우를 처리할 수 있다.
  return a instanceof Promise
    ? a.then(
        (a) => f(acc, a),
        (e) => (e === nop ? acc : Promise.reject(e))
      )
    : f(acc, a);
};

const head = (iter) =>
  convertPromise(take(1, iter), ([h]) => {
    return h;
  });

const reduce = curry((fn, acc, iter) => {
  if (!iter) {
    return reduce(fn, head((iter = acc[Symbol.iterator]())), iter);
  }
  // for (const n of iter) {
  // let cur;
  // while (!(cur = iter.next()).done) {
  //   const n = cur.value;
  //   acc = acc instanceof Promise ? acc.then((acc) => fn(acc, n)) : fn(acc, n); // 이부분이 promise가 되는 순간이 있다
  //   // 중간에 promise가 들어오면 계속 연속적으로 promise체인에 걸린다
  //   // 이렇게 되면 불필요한 load가 생길 수 있다
  // }
  iter = iter[Symbol.iterator]();
  return convertPromise(acc, function recur(acc) {
    let cur;
    while (!(cur = iter.next()).done) {
      // 여기서 꺼낸애는 promise인 상태로 있어버린다.
      // const n = cur.value;
      // acc = fn(acc, n);
      // nop을 풀고, promise 를 풀ㅇㅓ내는걸 함수로 따로 뗀다 ->  문제 정리가 쉬워진다
      acc = reduceF(acc, cur.value, fn);
      // 첫번째와 promise가 전달된다.
      if (acc instanceof Promise) return acc.then(recur);
    }
    return acc;
    // 이렇게 되면 promis가 아닌애들은 하나의 while문, 하나의 콜스택 내에서 동작한다
  });
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

  return (function recur() {
    let cur;
    while (!(cur = iter.next()).done) {
      const a = cur.value;
      // a가 promise인 경우가 있다.
      if (a instanceof Promise) {
        // promise를 반환한다
        return (
          a
            .then((a) => ((res.push(a), res).length == l ? res : recur()))
            // nop인 경우에는 그냥 넘어가고, 이거말고 다른 에러면 reject를 띄운다
            .catch((err) => (err === nop ? recur() : Promise.reject(err)))
        );
      }
      res.push(a);
      if (res.length === l) return res;
    }
    return res;
  })();
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
  for (const a of iter) {
    yield convertPromise(a, f);
  }
});

const nop = Symbol("nop");

L.filter = curry(function* (f, iter) {
  for (const a of iter) {
    const b = convertPromise(a, f); // then은 다시 promise를 반환한다.
    // log(b); // b가 promise로 오면 무조건 promise라 통과되는거고 아직 값이 반영이 안된다
    // then을 통해서 값을 풀어낸다. 아니면 안흘러가도록 kleslie 컴포지션을 활용한다
    if (b instanceof Promise)
      yield b.then((b) => (b ? a : Promise.reject(nop)));
    else if (b) yield a;
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

// 지연된 함수열을 병렬적으로 평가하기
// Concurrency
// 비동기가 일어나느걸 기다리지않고, 다 실행해버린다
function noop() {}
const catchNoop = (arr) => (
  arr.forEach((a) => (a instanceof Promise ? a.catch(noop) : a)), arr
);

const C = {};
C.reduce = curry((f, acc, iter) => {
  // console.log("creduce", [...acc]);
  // reject이 된후에 catch가 되면 error자체는 잘 catch가 되지만, error로그는 찍혀버린다.
  // const iter2 = catchNoop(iter ? [...iter] : [...acc]);
  // catch를한 promise를 전달하는 것이 아니라, 일단 여기서 임시로 catch를 해서 error가 나지 않도록 하는것이다.
  // 이렇게 미리 catch를 달아놔서 같은 콜스택에서 catch만 처리하고,실제로는 catch는 붙어있지않은 promise를 전달
  return iter
    ? reduce(f, acc, catchNoop([...iter]))
    : reduce(f, catchNoop([...acc]));
});

C.take = curry((l, iter) => take(l, catchNoop([...iter])));

C.takeAll = C.take(Infinity);

C.map = curry(pipe(L.map, C.takeAll));

C.filter = curry(pipe(L.filter, C.takeAll));
