import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { TreeItem } from "vscode";
import { AuthType, createClient } from "webdav";

/**
 * TODO:可以精剪下函数
 */
export class TreeProvider implements vscode.TreeDataProvider<SnippetItem> {
  tree: any;

  private _children: SnippetItem[];
  private _parent: SnippetItem | undefined | null;
  public _folderView: boolean;
  public treeList: SnippetItem[];

  private _onDidChangeTreeData: vscode.EventEmitter<SnippetItem | undefined | null | void> = new vscode.EventEmitter<
  SnippetItem | undefined | null | void
>();
readonly onDidChangeTreeData: vscode.Event<SnippetItem | undefined | null | void> = this._onDidChangeTreeData.event;


  constructor(private stockRoot: string) {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.stockRoot = stockRoot;
    this.treeList = [];
    this.tree;
    this._children = [];
    this._folderView = true;

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

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getChildren(element?: SnippetItem): Thenable<SnippetItem[]> {
    if (!this.stockRoot) {
      vscode.window.showInformationMessage("未定义储存路径");
      return Promise.resolve([]);
    }

    if (this._folderView) {
      if (element) {
        return Promise.resolve(this.getFileView(element.fullPath));
      } else {
        return Promise.resolve(this.getFileView(this.stockRoot));
      }
    }
    return Promise.resolve(this.getFileView(this.stockRoot));
  }

  getFileView(folderPath: string): SnippetItem[] {
    if (this._folderView) {
      return this.getDepsFiles(folderPath);
    }

    this.getDepsFiles(folderPath);
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
    resFolder.forEach(function (fileName: any) {
      let fullPath = path.resolve(folderPath, fileName);
      let isFolder = _this.folderExists(fullPath);
      if (!isFolder) {
        let ext = fileName.split(".");
        let icon = ext.length === 1 ? "file" : ext[ext.length - 1];
        if (_this._folderView) {
          tree.push(new SnippetItem(fullPath, fileName, icon, "Snippet", vscode.TreeItemCollapsibleState.None));
        } else {
          _this.treeList.push(new SnippetItem(fullPath, fileName, icon, "Snippet", vscode.TreeItemCollapsibleState.None));
        }
      } else {
        if (_this._folderView) {
          tree.push(new SnippetItem(fullPath, fileName, "folder", "Group", vscode.TreeItemCollapsibleState.Collapsed));
        }
        _this.getDepsFiles(fullPath);
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

  async upload() {
    const client = createClient("https://drive.yuelili.com/dav", {
      username: "435826135@qq.com",
      password: "VqhY6VQNGLAg8tYitfebxrI02srnqrWr",
    });

    const directoryItems = await client.getDirectoryContents("/");

    console.log(directoryItems);
  }

  async download() {
    const client = createClient("https://drive.yuelili.com/dav", {
      username: "435826135@qq.com",
      password: "VqhY6VQNGLAg8tYitfebxrI02srnqrWr",
    });

    const directoryItems = await client.getDirectoryContents("/");

    console.log(directoryItems);
  }




  async * handleSnippets(...args: any[]): any {
    let [placeHolder, value, valueSelection] = args;
    let key = await vscode.window.showInputBox({ placeHolder: placeHolder, value: value, valueSelection: valueSelection });

    if (key !== undefined) {
      let [fun, ...args2] = yield key;
      fun(...args2, (err: any) => {
        if (err) { vscode.window.showErrorMessage(err.toString()); }
      });
      this.refresh();
    } else {
      throw new Error("用户未确认");
    }
  }

  openGroup(e: any) {
    vscode.commands.executeCommand("revealFileInOS", e.fullPath);
  }

  addGroup(e: SnippetItem) {
    let folderPath = e ? e.fullPath : this.stockRoot;
    let iter = this.handleSnippets("请输入文件夹名", "", [0, 0]);
    iter.next().then((data: any) => {
      iter.next([fs.mkdir, path.join(folderPath, data.value)]);
    }, (err: any) => console.log(err));
  }

  editGroup(e: SnippetItem) {
    let iter = this.handleSnippets("请输入文件夹名", e.label, [0, e.label instanceof String ? e.label.length - 1 : 0]);
    iter.next().then((data: any) => {
      iter.next([fs.rename, e.fullPath, path.join(e.fullPath, "..", data.value)]);
    }, (err: any) => console.log(err));
  }

  deleteGroup(e: any) {
    let iter = this.handleSnippets("确认删除", "确认", [0, 2]);
    iter.next().then((data: any) => {
      iter.next([fs.rmSync, e.fullPath, { recursive: true, force: true }]);
    }, (err: any) => console.log(err));
  }

  ddSnippet(e: any) {
    let iter = this.handleSnippets("请输入文件名", "." + e.label, [0, 0]);
    iter.next().then((data: any) => {
      iter.next([fs.writeFileSync, path.join(e.fullPath, data.value), ""]);
    }, (err: any) => console.log(err));
  }

  deleteSnippet(e: any) {
    let iter = this.handleSnippets("确认删除", "确认", [0, 2]);
    iter.next().then((data: any) => {
      iter.next([fs.rmSync, e.fullPath, { recursive: true, force: true }]);
    }, (err: any) => console.log(err));
  }

  editSnippet(e: any) {
    let endPos = e.icon === "file" ? e.fileName.length : e.fileName.length - e.icon.length - 1;
    let iter = this.handleSnippets("请输入新文件名", e.label, [0, endPos]);
    iter.next().then((data: any) => {
      iter.next([fs.rename, e.fullPath, path.join(e.fullPath, "..", data.value)]);
    }, (err: any) => console.log(err));
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
