
import * as fs from "fs";

let documentText = fs.readFileSync("H:\\Snippets\\Snippet Cat\\JAVASCRIPT\\1.js",{encoding:"utf8"}).toString();


let mStart: any, mContent, mSpace;

const regStart = /(.+\s|\s)*?.+@start/;
const regContent = /(?<=@start\s)(.+\s|\s)+?(?=.+@end)/gm;
const regSpace = /(.+@end\s)(.*\s|\s)*?.*@start/gm;

function getRegContens(reg: RegExp, content: any) {
  let res = [];
  let m;
  while ((m = reg.exec(content)) !== null) {
    if (m.index === content.lastIndex) {
      content.lastIndex++;
    }

    res.push(m[0]);
  }
  return res;
}

mStart = regStart.exec(documentText) !== null ? (regStart.exec(documentText) as any)[0] : "";
mContent = getRegContens(regContent, documentText);
mSpace = getRegContens(regSpace, documentText);
console.log(mStart, mContent, mSpace);