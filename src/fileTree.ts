import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { TreeItem } from "vscode";

import * as utils from "./utils/global";
import * as syncs from "./utils/syncs";
import * as configs from "./utils/configs";

/**
 *
 */
export class TreeProvider implements vscode.TreeDataProvider<SnippetItem> {
  tree: any;
  public treeList: SnippetItem[];

  private _children: SnippetItem[];
  private _parent: SnippetItem | undefined | null;
  public _folderView: boolean;
  private _onDidChangeTreeData: vscode.EventEmitter<SnippetItem | undefined | null | void> = new vscode.EventEmitter<
    SnippetItem | undefined | null | void
  >();

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
    configs.initStock(this);
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

  getStockPath() {
    if (this.stockID !== -1) {
      const stockConfig = <string[]>configs.getConfig().get("stockPath");
      return stockConfig[this.stockID].split("|")[1];
    } else {
      return "";
    }
  }

  async addStockPath() {
    let [currentMacID, recordID, recordPath] = configs.initStock(this);
    let recordConfig = <string[]>configs.getConfig().get("stockPath");
    const options: vscode.OpenDialogOptions = {
      canSelectMany: false,
      openLabel: "Select",
      canSelectFiles: false,
      canSelectFolders: true,
    };

    await vscode.window.showOpenDialog(options).then(fileUri => {
      if (fileUri && fileUri[0]) {
        recordConfig[<number>recordID] = currentMacID + "|" + fileUri[0].fsPath;
        this.stockID = <number>recordID;
        configs
          .getConfig()
          .update("stockPath", recordConfig, vscode.ConfigurationTarget.Global)
          .then(() => {});
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

  getDepsFiles(folderPath: string) {
    const resFolder = fs.readdirSync(folderPath);
    let tree: SnippetItem[] = [];
    let _this = this;

    let folderList = resFolder.filter(fileName => fs.lstatSync(path.resolve(folderPath, fileName)).isDirectory());
    const fileList = resFolder.filter((x: string) => !folderList.includes(x));
    folderList = folderList.filter(fileName => !fileName.startsWith("."));

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
    syncs.syncByGithub(this, "上传", "云端", 0);
  }

  async download() {
    syncs.syncByGithub(this, "下载", "本地", 1);
  }

  openGroup(e: any) {
    utils.revealFileInOS(e.fullPath);
  }

  addGroup(e: SnippetItem) {
    this.checkRoot();
    let folderPath = e ? e.fullPath : this.getStockPath();

    let iter = configs.handleSnippets(this, "请输入文件夹名", "", [0, 0]);
    iter.next().then(
      (data: any) => {
        iter.next([fs.mkdir, path.join(folderPath, data.value)]);
      },
      (err: any) => console.log(err)
    );
  }

  editGroup(e: SnippetItem) {
    let iter = configs.handleSnippets(this, "请输入文件夹名", e.label, [0, e.label instanceof String ? e.label.length - 1 : 0]);
    iter.next().then(
      (data: any) => {
        iter.next([fs.rename, e.fullPath, path.join(e.fullPath, "..", data.value)]);
      },
      (err: any) => console.log(err)
    );
  }

  deleteGroup(e: any) {
    let iter = configs.handleSnippets(this, "确认删除", "确认", [0, 2]);
    iter.next().then(
      (data: any) => {
        iter.next([fs.rmSync, e.fullPath, { recursive: true, force: true }]);
      },
      (err: any) => console.log(err)
    );
  }

  async addSnippet(e: any) {
    let lastExt = await configs.getConfig().get("lastFileExt");

    let iter = configs.handleSnippets(this, "请输入文件名", "." + lastExt, [0, 0]);
    iter.next().then(
      (data: any) => {
        let ext = data.value.split(".");
        ext = ext.length > 1 ? ext[1] : "";

        iter.next([fs.writeFileSync, path.join(e.fullPath, data.value), ""]);
        configs
          .getConfig()
          .update("lastFileExt", ext, vscode.ConfigurationTarget.Global)
          .then(() => {});
      },
      (err: any) => console.log(err)
    );
  }

  deleteSnippet(e: any) {
    let iter = configs.handleSnippets(this, "确认删除", "确认", [0, 2]);
    iter.next().then(
      (data: any) => {
        iter.next([fs.rmSync, e.fullPath, { recursive: true, force: true }]);
      },
      (err: any) => console.log(err)
    );
  }

  editSnippet(e: any) {
    let endPos = e.icon === "file" ? e.fileName.length : e.fileName.length - e.icon.length - 1;
    let iter = configs.handleSnippets(this, "请输入新文件名", e.label, [0, endPos]);
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
