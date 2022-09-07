
async function* handleSnippets(...args) {

  console.log(args); // ① 初始化的参数 1,2,3

  let value1 = yield args;


  console.log(value1); // ③ { value: [ 1, 2, 3 ], done: false }

  console.log(args); // ④ 初始化的参数 1,2,3

  let value2 = yield 2;
  console.log(value2);

  let value3 = yield 3;
  console.log(value3);
}

function addGroup() {
  let iter = handleSnippets(1,2,3);  //  打印
  let t1 = iter.next(); // 
  console.log(t1); // ② Promise { <pending> }

 
  t1.then(data=>{
    iter.next(data);iter.next(1);
  }); // ③

  



  // t1.then(data=>console.log(data));
  // iter.next().then(data=>
  //   iter.next(data)
  //   );
  // // iter.next(value);
  
  // iter.next();
}

addGroup();