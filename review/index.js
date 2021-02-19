const list = [1, 2, 3, 4];
for (let i = 0; i < list.length; i++) {
  log(list[i]);
}

for (const a of list) {
  log(a);
}

// map/set: https://medium.com/@hongkevin/js-5-es6-map-set-2a9ebf40f96b
// object, map, set: https://codeburst.io/array-vs-set-vs-map-vs-object-real-time-use-cases-in-javascript-es6-47ee3295329b
// object: https://junspapa-itdev.tistory.com/22
const arr = [1, 2, 3];
// for (const a of arr) log(a);

const set = new Set([1, 2, 3]);
// for (const a of set) log(a);

const map = new Map([
  ["a", 1],
  ["b", 2],
  ["c", 3],
]);
// for (const a of map) log(a);

// not interable
const obj = {
  a: 1,
  b: 2,
  c: 3,
};

log("key, value", Object.entries(obj));
log("key", Object.keys(obj));
log("value", Object.values(obj));

// array, set, map은 이터레이터를 반환하는 Symbol.iterator 값을 가진 이터러블이다
// 이터레이터: {value, done}객체를 리턴하는 next()를 가진값
// 이터러블/이터레이터 프로토콜: 이터러블을 for...of, 전개 연산자 등과 함께 동작하도록한 규약
log("arr", arr[Symbol.iterator]().next());
log("set", set[Symbol.iterator]().next());
log("map", map[Symbol.iterator]().next());
log("map.keys", map.keys().next());
log("map.values", map.values().next());
log("map.entries", map.entries().next());

const iterable = {
  //[Symbol.iterator] : function() {}
  [Symbol.iterator]() {
    // console.log(this);
    let i = 3;
    return {
      next() {
        return i === 0 ? { done: true } : { value: i--, done: false };
      },
      [Symbol.iterator]() {
        log(this); // 현재 {next, Symbol.iterator } 객체
        return this;
      },
    };
  },
};

let iterator = iterable[Symbol.iterator]();

console.log(iterator);
for (const a of iterable) log(a);

// 이터레이터의 이터레이터가 자기자신일때 well-formed
for (const a of iterator) log(a);

for (const a of document.querySelectorAll("*")) log(a);

// 전개연산자, 이터러블을 펼쳐준다
const l = [1, 2, 3];
log([...l, ...l, ...[9, 8, 7]]);

clear();

// 제너레이터: 이터레이터이자 이터러블을 생성하는 함수
function* gen() {
  yield 1;
  yield 2;
  yield 3;
}

for (const a of gen()) log(a);

function* odds(l) {
  let n = 1;
  let c = 0;
  while (c++ < l) {
    yield n;
    n += 2;
  }
}

for (const a of odds(10)) log(a);

function* infinity(i = 0) {
  while (true) yield i++;
}

function* limit(l, iter) {
  for (const a of iter) {
    yield a;
    if (a === l) return;
  }
}
function* odds2(l, s) {
  for (const a of limit(l, infinity(s))) {
    if (a % 2) yield a;
  }
}

for (const a of odds2(10, 5)) log(a);

clear();

// for of, 전개 연산자, 구조분해, 나머지 연산자

log(...odds2(10, 1));
log([...odds2(10, 1), ...odds2(20, 1)]);

const [head, ...tail] = odds2(20, 1);
log(head, tail);

const [aa, bb, ...rest] = odds2(20, 1);
log(aa, bb, rest);
