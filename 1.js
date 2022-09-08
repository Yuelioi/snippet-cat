
// async function* handleSnippets(...args) {

//   console.log(args); // ① 初始化的参数 1,2,3
//   let value1 = yield args;
//   console.log(value1); // ③ { value: [ 1, 2, 3 ], done: false }
//   console.log(args); // ④ 初始化的参数 1,2,3
//   let value2 = yield 2;
//   console.log(value2);
//   let value3 = yield 3;
//   console.log(value3);
// }

// function addGroup() {
//   let iter = handleSnippets(1,2,3);  //  打印
//   let t1 = iter.next(); // 
//   console.log(t1); // ② Promise { <pending> }


//   t1.then(data=>{
//     iter.next(data);iter.next(1);
//   }); // ③
// }


import { AuthType, createClient } from "webdav";

import fs from "fs";
import path from "path";

import child_process from "child_process";


const client = createClient(

  "https://drive.yuelili.com/dav",

  {
    username: "435826135@qq.com",
    password: "VqhY6VQNGLAg8tYitfebxrI02srnqrWr"
  }
);



if (await client.exists("/Snippet Cat") === false) {
  await client.createDirectory("/Snippet Cat");
}

function folderExists(p) {
  if (fs.lstatSync(p).isDirectory()) {
    return true;
  }
  return false;
}


async function downloadDepsFiles(loaclFolderPath, syncFolderPath) {

  const syncFolder = await client.getDirectoryContents(syncFolderPath);


  syncFolder.forEach(async function (syncFileInfo) {
    let syncFullPath = syncFileInfo.filename;
    let syncFileName = syncFileInfo.basename;
    let localFullPath = path.resolve(loaclFolderPath, syncFileName);

    if (syncFileInfo.type !== 'directory') {

      const syncStuts = await client.stat(syncFullPath);
      const syncModTime = new Date(syncStuts.lastmod).getTime();

      let localModTime = 0;
      if (fs.existsSync(localFullPath)) {
        fs.stat(localFullPath, async (err, stat) => {
          localModTime = stat.mtimeMs;
        });
      }

      if (localModTime !== syncModTime) {
        const content = await client.getFileContents(syncFullPath, { format: "text" });
        fs.writeFileSync(localFullPath, content, { encoding: "utf8", flag: "w+", });
      }

    } else {

      if (!fs.existsSync(localFullPath)) {
        fs.mkdir(path.join(localFullPath), err => console.log("文件不存在,已创建"));
      }
      downloadDepsFiles(localFullPath, syncFullPath);
    }
  });
}

// downloadDepsFiles("H:/Snippets/Snippet Cat", "/Snippet Cat");

// child_process.exec('start "" "c:\\"');
import getMAC, { isMAC } from 'getmac';

let macID = "PID-" + getMAC().replaceAll(":","");

console.log(macID);






// Fetch the computer's MAC address for a specific interface


// Validate that an address is a MAC address



// fs.readFile("H:\\Snippets\\Snippet Cat\\aab.txt", 'utf8', async function (err, data) {
//   // console.log(data);
//   await client.putFileContents("/Snippet Cat/aab.txt", "111222");
// });

// client.putFileContents("/Snippet Cat/aab.txt", "133");
// await client.createDirectory("/Snippet Cat/php");


// if (await client.exists("/Snippet Cat/aab.txt") === true) {
//   const stat = await client.stat("/Snippet Cat/aab.txt");
//   console.log(new Date(stat.lastmod).getTime());
// }

// let stuts = fs.stat("H:\\Snippets\\Snippet Cat\\aab.txt", (err, stat) => {
//   console.log(stat.mtimeMs);
// });

