const { execSync, spawn } = require("child_process");
const fse = require("fs-extra");
const fs = require("fs");
const path = require("path");
import * as vscode from "vscode";


/**
 * @description: 打开目标文件夹 并选择指定路径的文件
 * @tutorial: https://stackoverflow.com/questions/64320632/node-js-child-process-spawning-explorer-with-select-option-does-not-work-wi
 */
export function revealFileInOS(path: string) {
  spawn(`explorer`, [`/select,"${path}"`], { windowsVerbatimArguments: true });
}

/**
 * @description:运行CMD命令
 * @param runPath :运行路径
 * @param cmd :指令列表
 */
export function runCMD(runPath: string, cmd: string, srcThis: any) {
  let cmdToProgress = cmd.split("|").join(" && ").replace("%time", getTimeStamp());

  try {
    execSync(cmdToProgress, { cwd: runPath });
    srcThis.refresh();
  } catch (e: any) {
    vscode.window.showErrorMessage(e);
  }
  return;
}

/**
 * @description : 获取时间戳
 * @returns :YYYYMMDDHHMMss (string)
 */
export function getTimeStamp() {
  var date = new Date();

  return (
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2)
  );
}

/**
 * @description: 备份文件
 * @param stockPath :储存文件根目录
 */
export function recoveryStock(stockPath: string) {
  const timeStamp = getTimeStamp();
  const tempFolder = path.join(stockPath, "..", timeStamp);
  const recoveryPath = path.join(stockPath, ".recovery");
  if (!fs.existsSync(recoveryPath)) {
    fs.mkdirSync(recoveryPath);
  }
  try {
    fse.copySync(stockPath, tempFolder);
  } catch (err) {
    console.error(err);
  }

  fs.rmSync(path.join(tempFolder, ".recovery"), { recursive: true });
  fse.moveSync(tempFolder, path.join(recoveryPath, timeStamp));
}

export function addContentToFile(trgPath: string, content: string, srcThis: any) {
  fs.writeFile(
    trgPath,
    content,
    {
      encoding: "utf8",
      flag: "a",
    },
    (err: any) => {
      if (err) {
        console.log(err);
      } else {
        srcThis.refresh();
      }
    }
  );
}

export async function generateDescription(languageId: string, selContent: string) {
  const languageList = require("../rules/languageList.json");
  let ext = "txt";

  let content = "";

  if (Object.hasOwn(languageList, languageId)) {
    const lanInfo = languageList[languageId];

    ext = lanInfo["ext"];
    if (ext !== "txt" && ext !== "md") {
      const name =
        (await vscode.window.showInputBox({
          placeHolder: ``,
          value: `未命名函数`,
          valueSelection: [0, 5],
        })) || "未命名函数";
      const description =
        (await vscode.window.showInputBox({
          placeHolder: ``,
          value: `暂无描述`,
          valueSelection: [0, 4],
        })) || "暂无描述";
      if (lanInfo["comments-start"]) {
        content = `${lanInfo["comments-start"]}\n${lanInfo["comments-split"]} @start\n${lanInfo["comments-split"]} @name:${name}\n${lanInfo["comments-split"]} @description::${description}\n${lanInfo["comments-end"]}`;
      }
      content += "\n" + selContent + "\n";
      if (lanInfo["comments-oneline"]) {
        content += `${lanInfo["comments-oneline"]} @end`;
      } else {
        content += `${lanInfo["comments-start"]} @end ${lanInfo["comments-end"]}`;
      }
    }
  }

  if (content === "") {
    content = `${selContent}`;
  }

  return { ext, content };
}


