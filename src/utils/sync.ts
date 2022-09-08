import * as fs from "fs";
import * as path from "path";
import { AuthType, createClient, WebDAVClient } from "webdav";


export async function downloadDepsFiles(loaclFolderPath: string, syncFolderPath: string,client:any) {

  const syncFolder = <any[]>await client.getDirectoryContents(syncFolderPath);
  const syncItems = <string[]>syncFolder.map((x: any) => x.basename);

  syncFolder.forEach(async function (syncFileInfo: any) {
    let syncFullPath = syncFileInfo.filename;
    let syncFileName = syncFileInfo.basename;
    let localFullPath = path.resolve(loaclFolderPath, syncFileName);

    if (syncFileInfo.type !== 'directory') {

      const syncStuts = <any>await client.stat(syncFullPath);
      const syncModTime = new Date(syncStuts.lastmod).getTime();

      let localModTime = 0;
      if (fs.existsSync(localFullPath)) {
        fs.stat(localFullPath, async (err, stat) => {
          localModTime = stat.mtimeMs;
        });
      }

      if (localModTime !== syncModTime) {
        const content =<string> await client.getFileContents(syncFullPath, { format: "text" });
        fs.writeFileSync(localFullPath, content, { encoding: "utf8", flag: "w+", });
      }

    } else {

      if (!fs.existsSync(localFullPath)) {
        fs.mkdir(path.join(localFullPath), err => console.log("文件不存在,已创建"));
      }
      downloadDepsFiles(localFullPath, syncFullPath,client);
    }
  });

  const localItems = fs.readdirSync(loaclFolderPath);

  let diffItems = localItems.filter((x: string) => !syncItems.includes(x));


  diffItems.forEach(async (x: string) => {
    fs.rmSync(path.join(loaclFolderPath, x), { recursive: true, force: true });
  });


}

function folderExists(p: string): boolean {
  if (fs.lstatSync(p).isDirectory()) {
    return true;
  }
  return false;
}

export async function uploadDepsFiles(loaclFolderPath: string, syncFolderPath: string, client: any) {
  const localItems = fs.readdirSync(loaclFolderPath);


  localItems.forEach(async function (localFileName) {
    let localFullPath = path.resolve(loaclFolderPath, localFileName);
    let syncFullPath = path.join(syncFolderPath, localFileName).split(path.sep).join("/");

    let isFolder = folderExists(localFullPath);
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

  let diffItems = syncItems.filter((x: string) => !localItems.includes(x));


  diffItems.forEach(async (x: string) => {
    await client.deleteFile(syncFolderPath + "/" + x);
  });
}