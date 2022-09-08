
/**
 * 打开目标文件夹 并选择
 * https://stackoverflow.com/questions/64320632/node-js-child-process-spawning-explorer-with-select-option-does-not-work-wi
 */
const path = require("path");
const {exec, spawn} = require("child_process");

spawn(`explorer`, [
  `/select,"${path.join(`C:`, `Program Files (x86)`, `Common Files`)}"`
], { windowsVerbatimArguments: true });