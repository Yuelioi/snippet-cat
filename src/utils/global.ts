
const {exec, spawn} = require("child_process");

/**
 * 打开目标文件夹 并选择
 * https://stackoverflow.com/questions/64320632/node-js-child-process-spawning-explorer-with-select-option-does-not-work-wi
 */
export function revealFileInOS(path:string){
  spawn(`explorer`, [
    `/select,"${path}"`
  ], { windowsVerbatimArguments: true });
}

