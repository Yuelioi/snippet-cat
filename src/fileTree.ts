import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { TreeItem } from "vscode";
import { AuthType, createClient, WebDAVClient } from "webdav";
import * as utils from "./utils/global";
import * as sync from "./utils/sync";

import getMAC from 'getmac';

/**
 * 
 */
export class TreeProvider implements vscode.TreeDataProvider<SnippetItem> {
  tree: any;

  private _children: SnippetItem[];
  private _parent: SnippetItem | undefined | null;
  public _folderView: boolean;
  private _onDidChangeTreeData: vscode.EventEmitter<SnippetItem | undefined | null | void> = new vscode.EventEmitter<
    SnippetItem | undefined | null | void>();
  public treeList: SnippetItem[];
  private stockID: number;

  readonly onDidChangeTreeData: vscode.Event<SnippetItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.treeList = [];
    this.tree;
    this._children = [];
    this._folderView = true;
    this.stockID = -1;
    this.initStockPath();

  }

  public setTreeView(element: any) {
    this.tree = element;
  }

  public getTreeItem(element: TreeItem) {
    return element;
  }

  get parent(): SnippetItem | undefined | null {
    return this._parent;
  }

  get children(): SnippetItem[] {
    return this._children;
  }

  getConfig() {
    return vscode.workspace.getConfiguration('snippet-cat');
  }


  initStockPath() {
    let currentMacID = "PID-" + getMAC().replace(/:/g, "");
    let recordID = -1;
    let recordPath = "";
    let recordConfig = <string[]>this.getConfig().get("stockPath");
    const _this = this;

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

  getStockPath() {
    if (this.stockID !== -1) {
      const stockConfig = <string[]>this.getConfig().get("stockPath");
      return stockConfig[this.stockID].split("|")[1];
    } else {
      return "";
    }
  }

  async addStockPath() {
    let [currentMacID, recordID, recordPath] = this.initStockPath();
    let recordConfig = <string[]>this.getConfig().get("stockPath");
    const options: vscode.OpenDialogOptions = {
      canSelectMany: false,
      openLabel: 'Select',
      canSelectFiles: false,
      canSelectFolders: true
    };

    await vscode.window.showOpenDialog(options).then(fileUri => {
      if (fileUri && fileUri[0]) {
        recordConfig[<number>recordID] = currentMacID + "|" + fileUri[0].fsPath;
        this.stockID = <number>recordID;
        this.getConfig().update("stockPath",
          recordConfig
          , vscode.ConfigurationTarget.Global).then(() => {
          });
        this.refresh();
      } else {
        vscode.window.showInformationMessage("用户取消设置");
      }
    });

  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getChildren(element?: SnippetItem): Thenable<SnippetItem[]> {
    this.checkRoot();

    if (this._folderView) {
      if (element) {
        return Promise.resolve(this.getFileView(element.fullPath));
      } else {
        return Promise.resolve(this.getFileView(this.getStockPath()));
      }
    }
    return Promise.resolve(this.getFileView(this.getStockPath()));
  }

  getFileView(stockPath: string): SnippetItem[] {
    if (this._folderView) {
      return this.getDepsFiles(stockPath);
    }

    this.getDepsFiles(stockPath);
    return this.treeList;
  }

  private folderExists(p: string): boolean {
    if (fs.lstatSync(p).isDirectory()) {
      return true;
    }
    return false;
  }

  getDepsFiles(folderPath: string) {
    const resFolder = fs.readdirSync(folderPath);
    let tree: SnippetItem[] = [];
    let _this = this;

    const folderList = resFolder.filter(fileName => _this.folderExists(path.resolve(folderPath, fileName)));
    const fileList = resFolder.filter((x: string) => !folderList.includes(x));

    folderList.forEach(function (fileName: any) {
      let fullPath = path.resolve(folderPath, fileName);
      if (_this._folderView) {
        tree.push(new SnippetItem(fullPath, fileName, "folder", "Group", vscode.TreeItemCollapsibleState.Collapsed));
      }
      _this.getDepsFiles(fullPath);

    });

    fileList.forEach(function (fileName: any) {
      let fullPath = path.resolve(folderPath, fileName);
      let ext = fileName.split(".");
      let icon = ext.length === 1 ? "file" : ext[ext.length - 1];
      if (_this._folderView) {
        tree.push(new SnippetItem(fullPath, fileName, icon, "Snippet", vscode.TreeItemCollapsibleState.None));
      } else {
        _this.treeList.push(new SnippetItem(fullPath, fileName, icon, "Snippet", vscode.TreeItemCollapsibleState.None));
      }
    });

    return tree;
  }

  getParent(e: SnippetItem) {
    return null;
  }

  getSelection() {
    return this.tree.selection;
  }

  viewSwitch() {
    this._folderView = !this._folderView;
    this.treeList = [];
    this.refresh();
  }

  click(filePath: any) {
    var openPath = vscode.Uri.parse("file:///" + filePath.split(`\\`).join(`/`)); //A request file path
    vscode.workspace.openTextDocument(openPath).then(doc => {
      vscode.window.showTextDocument(doc);
    });
  }

  search(element: any) {
    this.tree.reveal(element, { select: true, focus: true, expand: true });
  }

  checkRoot() {
    if (this.stockID === -1) {
      throw new Error("请先添加根目录");
    }
  }


  async upload() {

    this.checkRoot();

    let key = await vscode.window.showInputBox({ placeHolder: "确定上传吗,这将覆盖云端数据", value: "确定上传吗,这将覆盖云端数据", valueSelection: [0, 2] });
    if (key) {

      const sysnModel = this.getConfig().get("sysnModel");

      if (sysnModel === "github") {
        let githubConfig = <any>this.getConfig().get("github");
        let { push } = githubConfig;
        utils.runCMD(this.getStockPath(), push);
      }

      else if (sysnModel === "webdav") {
        let webdavConfig = <any>this.getConfig().get("webdav");
        let { url, username, password } = webdavConfig;
        const client = createClient(url, {
          username: username,
          password: password,
        });

        try {
          if ((await client.exists("/Snippet Cat")) === false) {
            await client.createDirectory("/Snippet Cat");
          }
          vscode.window.showInformationMessage("正在使用WEBDAV上传");
          sync.uploadDepsFiles(this.getStockPath(), "/Snippet Cat", client);
          vscode.window.showInformationMessage("上传完毕");
          this.refresh();
        } catch (e: any) {
          vscode.window.showInformationMessage(e.message);
        }
      }

    } else {
      vscode.window.showErrorMessage("用户取消上传");
    }
  }


  async download() {
    this.checkRoot();
    let key = await vscode.window.showInputBox({ placeHolder: "", value: "确定下载吗,这将覆盖本地数据", valueSelection: [0, 2] });
    
    if (key) {
      const sysnModel = this.getConfig().get("sysnModel");

      if (sysnModel === "github") {
        let githubConfig = <any>this.getConfig().get("github");
        let { pull } = githubConfig;
        utils.runCMD(this.getStockPath(), pull);

      } else {
        let webdavConfig = <any>this.getConfig().get("webdav");
        let { url, username, password } = webdavConfig;
        const client = createClient(url, {
          username: username,
          password: password,
        });

        try {
          await client.exists("/Snippet Cat");
          if ((await key === "确定下载吗,这将覆盖本地数据")) {
            vscode.window.showInformationMessage("开始使用WEBDAV下载");
            sync.downloadDepsFiles(this.getStockPath(), "/Snippet Cat", client);
            vscode.window.showInformationMessage("下载完毕");
          } else {
            vscode.window.showInformationMessage("用户取消下载");
          }
          this.refresh();
        } catch (e) {
          vscode.window.showInformationMessage("连接出错,请核对webdav设置");
        }
      }
    } else {
      vscode.window.showErrorMessage("用户取消下载");
    }
  }

  async *handleSnippets(...args: any[]): any {
    let [placeHolder, value, valueSelection] = args;
    let key = await vscode.window.showInputBox({ placeHolder: placeHolder, value: value, valueSelection: valueSelection });

    if (key !== undefined) {
      let [fun, ...args2] = yield key;
      fun(...args2, (err: any) => {
        if (err) {
          vscode.window.showErrorMessage(err.toString());
        }
      });
      this.refresh();
    } else {
      throw new Error("用户未确认");
    }
  }

  openGroup(e: any) {
    utils.revealFileInOS(e.fullPath);
  }

  addGroup(e: SnippetItem) {
    this.checkRoot();
    let folderPath = e ? e.fullPath : this.getStockPath();
    let iter = this.handleSnippets("请输入文件夹名", "", [0, 0]);
    iter.next().then(
      (data: any) => {
        iter.next([fs.mkdir, path.join(folderPath, data.value)]);
      },
      (err: any) => console.log(err)
    );
  }

  editGroup(e: SnippetItem) {
    let iter = this.handleSnippets("请输入文件夹名", e.label, [0, e.label instanceof String ? e.label.length - 1 : 0]);
    iter.next().then(
      (data: any) => {
        iter.next([fs.rename, e.fullPath, path.join(e.fullPath, "..", data.value)]);
      },
      (err: any) => console.log(err)
    );
  }

  deleteGroup(e: any) {
    let iter = this.handleSnippets("确认删除", "确认", [0, 2]);
    iter.next().then(
      (data: any) => {
        iter.next([fs.rmSync, e.fullPath, { recursive: true, force: true }]);
      },
      (err: any) => console.log(err)
    );
  }

  async addSnippet(e: any) {
    let lastExt = await this.getConfig().get("lastFileExt");

    let iter = this.handleSnippets("请输入文件名", "." + lastExt, [0, 0]);
    iter.next().then(
      (data: any) => {

        let ext = data.value.split(".");
        ext = ext.length > 1 ? ext[1] : "";

        iter.next([fs.writeFileSync, path.join(e.fullPath, data.value), ""]);
        this.getConfig().update("lastFileExt",
          ext, vscode.ConfigurationTarget.Global).then(() => {
          });
      },
      (err: any) => console.log(err)
    );


  }

  deleteSnippet(e: any) {
    let iter = this.handleSnippets("确认删除", "确认", [0, 2]);
    iter.next().then(
      (data: any) => {
        iter.next([fs.rmSync, e.fullPath, { recursive: true, force: true }]);
      },
      (err: any) => console.log(err)
    );
  }

  editSnippet(e: any) {
    let endPos = e.icon === "file" ? e.fileName.length : e.fileName.length - e.icon.length - 1;
    let iter = this.handleSnippets("请输入新文件名", e.label, [0, endPos]);
    iter.next().then(
      (data: any) => {
        iter.next([fs.rename, e.fullPath, path.join(e.fullPath, "..", data.value)]);
      },
      (err: any) => console.log(err)
    );
  }
}

class SnippetItem extends vscode.TreeItem {
  constructor(
    public readonly fullPath: string,
    private fileName: string,
    private icon: string,
    private fileType: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(fullPath, collapsibleState);
    this.label = this.fileName;
    this.tooltip = `${this.fullPath}`;
    this.description = this.fileName;
    this.contextValue = this.fileType;
    this.icon = this.icon;
    if (fileType === "Snippet") {
      this.command = {
        title: "Item Command",
        command: "snippet-cat.click",
        arguments: [this.fullPath],
      };

      if (!fs.existsSync(path.join(__filename, "..", "..", "media", "icons", "files", "dark", `${this.icon}.svg`))) {
        this.icon = "file";
      }
    }
    this.iconPath = {
      light: path.join(__filename, "..", "..", "media", "icons", "files", "light", `${this.icon}.svg`),
      dark: path.join(__filename, "..", "..", "media", "icons", "files", "dark", `${this.icon}.svg`),
    };
  }
}
