import * as vscode from "vscode";
import * as utils from "./global";

export function getConfig() {
  return vscode.workspace.getConfiguration("snippet-cat");
}

export function initStock(srcThis: any) {
  let recordConfig = <string[]>getConfig().get("stockPath");
  let currentMacID = "PID-" + utils.getMAC().replace(/:/g, "");
  let recordID = -1;
  let recordPath = "";
  const _this = srcThis;

  recordConfig.forEach((element: any, index: number) => {
    if (element.split("|")[0] === currentMacID) {
      _this.stockID = recordID = index;
      recordPath = element.split("|")[1];
    }
  });

  if (recordID === -1) {
    recordConfig.forEach((element: any, index: number) => {
      if (element === "") {
        recordID = index;
      }
    });
    if (recordID === -1) {
      recordID = 0;
    }
  }

  return [currentMacID, recordID, recordPath];
}


export async function  *handleSnippets(srcThis: any,...args: any[]): any {
  let [placeHolder, value, valueSelection] = args;
  let key = await vscode.window.showInputBox({ placeHolder: placeHolder, value: value, valueSelection: valueSelection });

  if (key !== undefined) {
    let [fun, ...args2] = yield key;
    fun(...args2, (err: any) => {
      if (err) {
        vscode.window.showErrorMessage(err.toString());
      }
    });
    srcThis.refresh();
  } else {
    throw new Error("用户未确认");
  }
}
