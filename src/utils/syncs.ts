import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as utils from "./global";
import * as configs from "./configs";
import * as syncs from "./syncs";
import { AuthType, createClient, WebDAVClient } from "webdav";

export async function downloadDepsFiles(loaclFolderPath: string, syncFolderPath: string, client: any) {
  const syncFolder = <any[]>await client.getDirectoryContents(syncFolderPath);
  const syncItems = <string[]>syncFolder.map((x: any) => x.basename);

  syncFolder.forEach(async function (syncFileInfo: any) {
    let syncFullPath = syncFileInfo.filename;
    let syncFileName = syncFileInfo.basename;
    let localFullPath = path.resolve(loaclFolderPath, syncFileName);

    if (syncFileInfo.type !== "directory") {
      const syncStuts = <any>await client.stat(syncFullPath);
      const syncModTime = new Date(syncStuts.lastmod).getTime();

      let localModTime = 0;
      if (fs.existsSync(localFullPath)) {
        fs.stat(localFullPath, async (err, stat) => {
          localModTime = stat.mtimeMs;
        });
      }

      if (localModTime !== syncModTime) {
        const content = <string>await client.getFileContents(syncFullPath, { format: "text" });
        fs.writeFileSync(localFullPath, content, { encoding: "utf8", flag: "w+" });
      }
    } else {
      if (!fs.existsSync(localFullPath)) {
        fs.mkdir(path.join(localFullPath), err => console.log("文件不存在,已创建"));
      }
      downloadDepsFiles(localFullPath, syncFullPath, client);
    }
  });

  const localItems = fs.readdirSync(loaclFolderPath);
  const diffItems = localItems.filter((x: string) => !syncItems.includes(x));

  diffItems.forEach(async (x: string) => {
    fs.rmSync(path.join(loaclFolderPath, x), { recursive: true, force: true });
  });
}

export async function uploadDepsFiles(loaclFolderPath: string, syncFolderPath: string, client: any) {
  const localItems = fs.readdirSync(loaclFolderPath);

  localItems.forEach(async function (localFileName) {
    let localFullPath = path.resolve(loaclFolderPath, localFileName);
    let syncFullPath = path.join(syncFolderPath, localFileName).split(path.sep).join("/");

    let isFolder = fs.lstatSync(localFullPath).isDirectory();
    if (!isFolder) {
      console.log("正在上传" + localFullPath);
      fs.stat(localFullPath, async (err, stat) => {
        let syncModTime = 0;
        const localModTime = stat.mtimeMs;

        if ((await client.exists(syncFullPath)) === true) {
          const syncStuts = await client.stat(syncFullPath);
          syncModTime = new Date(syncStuts.lastmod).getTime();
        }

        if (localModTime !== syncModTime) {
          fs.readFile(localFullPath, "utf8", async function (err, data) {
            await client.putFileContents(syncFullPath, data, { overwrite: true });
          });
        }
      });
    } else {
      if ((await client.exists(syncFullPath)) === false) {
        await client.createDirectory(syncFullPath);
      }
      uploadDepsFiles(localFullPath, syncFullPath, client);
    }
  });

  const syncRes = await client.getDirectoryContents(syncFolderPath);
  const syncItems = syncRes.map((x: any) => x.basename);
  const diffItems = syncItems.filter((x: string) => !localItems.includes(x));

  diffItems.forEach(async (x: string) => {
    await client.deleteFile(syncFolderPath + "/" + x);
  });
}

/**
 * @param srcThis
 * @param syncInfo 上传|下载
 * @param localInfo 云端|本地
 * @param syncMode 0|1 上传|下载
 */
export async function syncCloud(srcThis: any, syncInfo: string, localInfo: string, syncMode: 0 | 1) {
  srcThis.checkRoot();

  let key = await vscode.window.showInputBox({
    placeHolder: `确定${syncInfo}吗,这将覆盖${localInfo}数据`,
    value: `确定${syncInfo}吗,这将覆盖${localInfo}数据`,
    valueSelection: [0, 2],
  });

  if (key) {
    vscode.window.showInformationMessage("正在备份中");
    const stockPath = srcThis.getStockPath().split("\\").join("/");

    utils.recoveryStock(stockPath);
    vscode.window.showInformationMessage("备份成功");
    const sysnModel = configs.getConfig().get("sysnModel");

    if (sysnModel === "github") {
      vscode.window.showInformationMessage(`正在使用GITHUB${syncInfo}`);
      let { push, pull } = <any>configs.getConfig().get("github");

      utils.runCMD(stockPath, [push, pull][syncMode], srcThis);
    } else if (sysnModel === "webdav") {
      let { url, username, password } = <any>configs.getConfig().get("webdav");
      const client = createClient(url, {
        username: username,
        password: password,
      });

      try {
        if ((await client.exists("/Snippet Cat")) === false) {
          await client.createDirectory("/Snippet Cat");
        }

        vscode.window.showInformationMessage(`正在使用WEBDAV${syncInfo}`);
        if (syncMode === 0) {
          await syncs.uploadDepsFiles(stockPath, "/Snippet Cat", client);
          vscode.window.showInformationMessage("${syncInfo}完毕");
        } else {
          await syncs.downloadDepsFiles(stockPath, "/Snippet Cat", client);
          vscode.window.showInformationMessage("${syncInfo}完毕");
          srcThis.refresh();
        }

      } catch (e: any) {
        vscode.window.showErrorMessage(e.message);
      }
    }
  } else {
    vscode.window.showErrorMessage(`用户取消${syncInfo}`);
  }
}
