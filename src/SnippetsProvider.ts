import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import * as utils from "./utils/global";
import * as syncs from "./utils/syncs";
import * as configs from "./utils/configs";

import languageList from "../languageList.json";

export class SnippetsProvider implements vscode.TreeDataProvider<SnippetElement>, vscode.TreeDragAndDropController<SnippetElement> {
  dropMimeTypes = ["application/vnd.code.tree.snippet-cat-view"];
  dragMimeTypes = ["text/uri-list"];
  private _onDidChangeTreeData: vscode.EventEmitter<SnippetElement | undefined> = new vscode.EventEmitter<SnippetElement | undefined>();
  readonly onDidChangeTreeData: vscode.Event<SnippetElement | undefined> = this._onDidChangeTreeData.event;
  public treeExpandList: SnippetElement[];
  public viewType: boolean;
  private stockID: number;
  view:any;

  constructor(context: vscode.ExtensionContext) {
    const snippetTreeView = vscode.window.createTreeView("snippet-cat-view", {
      treeDataProvider: this,
      showCollapseAll: true,
      canSelectMany: true,
      dragAndDropController: this,
    });

    context.subscriptions.push(snippetTreeView);
    this.view = snippetTreeView;
    this.treeExpandList = [];
    this.viewType = true;
    this.stockID = -1;
    configs.initStock(this);
  }

  getChildren(element: SnippetElement): Thenable<SnippetElement[]> {
    this.checkRoot();
    return Promise.resolve(this._getChildren(element ? element.fullPath : this.getStockPath()));
  }

  public getTreeItem(element: SnippetElement): vscode.TreeItem {
    const treeItem = this._getTreeItem(element.fullPath);
    return treeItem;
  }

  // getParent(element:SnippetElement){
  //   return this._getTreeElement(path.dirname(element.fullPath));
  // }
  
  _getTreeItem(fullPath: string): SnippetItem {
    const treeElement = this._getTreeElement(fullPath);
    return new SnippetItem(
      treeElement,
      treeElement.basename,
      treeElement.isDir ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    );
  }

  _getTreeElement(fullPath: string): SnippetElement {
    return new SnippetElement(fullPath);
  }

  // Element 列表
  _getChildren(folderPath: string): SnippetElement[] {
    const resFolder = fs.readdirSync(folderPath);
    const tree: SnippetElement[] = [];
    const _this = this;

    let folderList = resFolder.filter(fileName => fs.lstatSync(path.resolve(folderPath, fileName)).isDirectory() && !fileName.startsWith("."));
    let fileList = resFolder.filter((fileName: string) => !folderList.includes(fileName) && !fileName.startsWith("."));

    folderList.forEach(function (fileName: any) {
      const fullPath = path.resolve(folderPath, fileName);
      if (_this.viewType) {
        tree.push(_this._getTreeElement(fullPath));
      }
      _this._getChildren(fullPath);
    });

    fileList.forEach(function (fileName: any) {
      const fullPath = path.resolve(folderPath, fileName);
      if (_this.viewType) {
        tree.push(_this._getTreeElement(fullPath));
      } else {
        _this.treeExpandList.push(_this._getTreeElement(fullPath));
      }
    });
    if (_this.viewType) {
      return tree;
    } else {
      return this.treeExpandList.sort((el1: SnippetElement, el2: SnippetElement) =>
        path.extname(el1.fullPath).toUpperCase() < path.extname(el2.fullPath).toUpperCase() ? -1 : 1
      );
    }
  }

  // Drag and drop
  public async handleDrop(target: SnippetElement, sources: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
    const transferItem = sources.get("application/vnd.code.tree.snippet-cat-view");
    if (!transferItem) {
      return;
    }
    const srcTreeElemtents: SnippetElement[] = transferItem.value;

    srcTreeElemtents.forEach(el => {
      fs.rename(el.fullPath, path.join(target.dirPath, el.basename), function (err) {
        if (err) {
          throw err;
        }
      });
    });

    this.refresh();
  }

  public async handleDrag(source: SnippetElement[], treeDataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
    treeDataTransfer.set("application/vnd.code.tree.snippet-cat-view", new vscode.DataTransferItem(source));
  }

  public setTreeView(element: any) {
    this.treeExpandList = element;
  }

  saveToStock() {
    let editor = vscode.window.activeTextEditor;
    if (editor) {
      const selText = editor.document.getText(editor.selection);

      const languageId = editor.document.languageId;
      let ext = "txt";
      if (Object.hasOwn(languageList, languageId)) {
        ext = languageList[languageId as keyof typeof languageList];
      }
      const targetPath = path.join(this.getStockPath(), languageId + "." + ext);
      utils.addContentToFile(targetPath, "\n" + selText + "\n",this);

      vscode.window.showInformationMessage("已添加到:" + targetPath);
    }
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

  async refresh(): Promise<void> {
    this._onDidChangeTreeData.fire(undefined);
  }

  viewSwitch() {
    this.viewType = !this.viewType;
    this.treeExpandList = [];
    this.refresh();
  }

  click(filePath: string) {
    
    var openPath = vscode.Uri.parse("file:///" + filePath.split(`\\`).join(`/`)); //A request file path
    vscode.workspace.openTextDocument(openPath).then(doc => {
      vscode.window.showTextDocument(doc);
    });
  }

  // TODO
  search() {
    console.log(111);
    this.view.reveal();
    this.view.reveal(this._getTreeElement("E:\\Project\\Snippet Cat\\PHP\\1.PHP"), { select: true, focus: true, expand: true });
    // this.treeExpandList.reveal(element, { select: true, focus: true, expand: true });
  }

  checkRoot() {
    if (this.stockID === -1) {
      throw new Error("请先添加根目录");
    }
  }

  async upload() {
    syncs.syncCloud(this, "上传", "云端", 0);
  }

  async download() {
    syncs.syncCloud(this, "下载", "本地", 1);
  }

  openGroup(e: SnippetElement) {
    utils.revealFileInOS(e.fullPath);
  }

  addGroup(e: SnippetElement) {
    
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

  editGroup(e: SnippetElement) {
    let iter = configs.handleSnippets(this, "请输入文件夹名", e.basename, [0, e.basename.length]);
    iter.next().then(
      (data: any) => {
        iter.next([fs.rename, e.fullPath, path.join(e.fullPath, "..", data.value)]);
      },
      (err: any) => console.log(err)
    );
  }

  deleteGroup(e: SnippetElement) {
    let iter = configs.handleSnippets(this, "确认删除", "确认", [0, 2]);
    iter.next().then(
      (data: any) => {
        iter.next([fs.rmSync, e.fullPath, { recursive: true, force: true }]);
      },
      (err: any) => console.log(err)
    );
  }

  async addSnippet(e: SnippetElement) {
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

  deleteSnippet(e: SnippetElement) {
    let iter = configs.handleSnippets(this, "确认删除", "确认", [0, 2]);
    iter.next().then(
      (data: any) => {
        iter.next([fs.rmSync, e.fullPath, { recursive: true, force: true }]);
      },
      (err: any) => console.log(err)
    );
  }

  editSnippet(e: SnippetElement) {
    
    let ext = path.extname(e.fullPath);
    let endPos = e.basename.length - ext.length;
    let iter = configs.handleSnippets(this, "请输入新文件名", e.basename, [0, endPos]);
    iter.next().then(
      (data: any) => {
        iter.next([fs.rename, e.fullPath, path.join(e.fullPath, "..", data.value)]);
      },
      (err: any) => console.log(err)
    );
  }
}

class SnippetElement {
  basename: string;
  isDir: boolean;
  fullPath: string;
  dirPath: string;
  constructor(fullPath: string) {
    this.fullPath = fullPath;
    this.basename = path.basename(fullPath);
    this.isDir = fs.lstatSync(fullPath).isDirectory();
    this.dirPath = this.isDir ? fullPath : path.dirname(fullPath);
  }
}

class SnippetItem extends vscode.TreeItem {
  constructor(element: SnippetElement, label: string, collapsibleState: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
    this.label = element.basename;
    this.id = this.tooltip = element.fullPath;
    this.contextValue = element.isDir ? "Group" : "Snippet";

    let icon = "folder";
    if (this.contextValue === "Snippet") {
      this.command = {
        title: "Item Command",
        command: "snippet-cat.main.click",
        arguments: [element.fullPath],
      };
      icon = path.extname(element.fullPath).replace(".", "");

      if (!fs.existsSync(path.join(__filename, "..", "..", "media", "icons", "files", "dark", `${icon}.svg`))) {
        icon = "file";
      }
    }

    this.iconPath = {
      light: path.join(__filename, "..", "..", "media", "icons", "files", "light", `${icon}.svg`),
      dark: path.join(__filename, "..", "..", "media", "icons", "files", "dark", `${icon}.svg`),
    };
  }
}
