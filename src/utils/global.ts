
const {exec, spawn} = require("child_process");


export function revealFileInOS(path:string){
  spawn(`explorer`, [
    `/select,"${path}"`
  ], { windowsVerbatimArguments: true });
}

