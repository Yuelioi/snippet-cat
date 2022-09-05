function * test(v){
  console.log(v);
  let value1 = yield 1;
  console.log(value1);
  let value2 =  yield 2;
  console.log(value2);
}

var iteration = test("one");

console.log(iteration.next("two"));
console.log(iteration.next("three"));