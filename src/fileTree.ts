import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TreeItem } from "vscode";
import { AuthType, createClient } from "webdav";

/**
 * TODO:可以精剪下函数
 */
export class TreeProvider implements vscode.TreeDataProvider<SnippetItem>{

  tree: any;

  private _children: SnippetItem[];
  private _parent: SnippetItem | undefined | null;

  constructor(private stockRoot: string) {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.tree;
    this._children = [];
  }
  public setTreeView(element: any) {
    this.tree = element;

  };
  public getTreeItem(element: TreeItem) {
    return element;
  }

  get parent(): SnippetItem | undefined | null {
    return this._parent;
  }

  get children(): SnippetItem[] {
    return this._children;
  }



  getChildren(element?: SnippetItem): Thenable<SnippetItem[]> {

    if (!this.stockRoot) {
      vscode.window.showInformationMessage('未定义储存路径');
      return Promise.resolve([]);
    }

    if (element) {
      return Promise.resolve(
        this.getDepsFolder(element.fullPath, element)
      );
    } else {
      return Promise.resolve(this.getDepsFolder(this.stockRoot, element));
    }
  }

  private getDepsFiles(stogeFolder: string, element: any): SnippetItem[] {
    const resFolder = fs.readdirSync(stogeFolder);


    var fs = require('fs');
    var path = require('path');
    var walk = function (dir: any, done: { (err: any, res: any): void; (arg0: null, arg1: any[] | undefined): any; }) {
      var results: any[] = [];
      fs.readdir(dir, function (err: any, list: any[]) {
        if (err) {return done(null,err);}
        var i = 0;
        (function next() {
          var file = list[i++];
          if (!file) {return done(null, results);};
          file = path.resolve(dir, file);
          fs.stat(file, function (err: any, stat: { isDirectory: () => any; }) {
            if (stat && stat.isDirectory()) {
              walk(file, function (err: any, res: any) {
                results = results.concat(res);
                next();
              });
            } else {
              results.push(file);
              next();
            }
          });
        })();
      });
    };

    walk();

    console.log(element);

    const toDep = (fileName: string, fullPath: string, isFolder: boolean): SnippetItem | null => {
      if (isFolder) {
        return new SnippetItem(
          fullPath,
          fileName,
          "folder",
          "Group",
          vscode.TreeItemCollapsibleState.Collapsed
        );
      } else {
        let ext = fileName.split(".");
        let icon;
        if (ext.length === 1) {
          icon = "file";
        } else {
          icon = ext[ext.length - 1];
        }
        return new SnippetItem(fullPath, fileName, icon, "Snippet", vscode.TreeItemCollapsibleState.None);
      }
    };

    let _this = this;
    let lists: SnippetItem[] = [];
    let folderLoop: { fileName: string; fullPath: string; isFolder: boolean; }[] = [];
    let fileLoop: { fileName: string; fullPath: string; isFolder: boolean; }[] = [];

    resFolder.forEach(function (fileName: any) {
      let fullPath = path.resolve(stogeFolder, fileName);
      let isFolder = _this.folderExists(fullPath);
      if (isFolder) {
        folderLoop.push({ fileName, fullPath, isFolder: true });
      } else {
        fileLoop.push({ fileName, fullPath, isFolder: false });
      }
    });

    folderLoop.concat(fileLoop).forEach(ele => {
      let { fileName, fullPath, isFolder } = ele;
      let currentItem = toDep(fileName, fullPath, isFolder);
      lists.push(currentItem);
    });

    return lists;
  }

  private getDepsFolder(stogeFolder: string, element: any): SnippetItem[] {

    const resFolder = fs.readdirSync(stogeFolder);

    console.log(element);

    const toDep = (fileName: string, fullPath: string, isFolder: boolean): SnippetItem => {
      if (isFolder) {
        return new SnippetItem(
          fullPath,
          fileName,
          "folder",
          "Group",
          vscode.TreeItemCollapsibleState.Collapsed
        );
      } else {
        let ext = fileName.split(".");
        let icon;
        if (ext.length === 1) {
          icon = "file";
        } else {
          icon = ext[ext.length - 1];
        }
        return new SnippetItem(fullPath, fileName, icon, "Snippet", vscode.TreeItemCollapsibleState.None);
      }
    };

    let _this = this;
    let lists: SnippetItem[] = [];
    let folderLoop: { fileName: string; fullPath: string; isFolder: boolean; }[] = [];
    let fileLoop: { fileName: string; fullPath: string; isFolder: boolean; }[] = [];

    resFolder.forEach(function (fileName) {
      let fullPath = path.resolve(stogeFolder, fileName);
      let isFolder = _this.folderExists(fullPath);
      if (isFolder) {
        folderLoop.push({ fileName, fullPath, isFolder: true });
      } else {
        fileLoop.push({ fileName, fullPath, isFolder: false });
      }
    });

    folderLoop.concat(fileLoop).forEach(ele => {
      let { fileName, fullPath, isFolder } = ele;
      let currentItem = toDep(fileName, fullPath, isFolder);
      lists.push(currentItem);
    });

    return lists;
  }



  getParent(e: SnippetItem) {
    console.log(e);
    return null;
    // return e.parent;
  }



  getSelection() {
    return this.tree.selection;

  }

  async click(filePath: any) {
    var openPath = vscode.Uri.parse("file:///" + filePath.split(`\\`).join(`/`)); //A request file path
    vscode.workspace.openTextDocument(openPath).then(doc => {
      vscode.window.showTextDocument(doc);
    });

  }
  async search(element: any) {

    this.tree.reveal(element, { select: true, focus: true, expand: true });
  }
  async upload() {

    const client = createClient(
      "https://drive.yuelili.com/dav",
      {
        username: "435826135@qq.com",
        password: "VqhY6VQNGLAg8tYitfebxrI02srnqrWr"
      }
    );

    const directoryItems = await client.getDirectoryContents("/");

    console.log(directoryItems);
  }

  async download() {

    const client = createClient(
      "https://drive.yuelili.com/dav",
      {
        username: "435826135@qq.com",
        password: "VqhY6VQNGLAg8tYitfebxrI02srnqrWr"
      }
    );

    const directoryItems = await client.getDirectoryContents("/");

    console.log(directoryItems);


    const { unlink, readdir, stat, rmdir } = require('fs').promises;

    async function preParellDeep(dir: string) {
      const statObj = await stat(dir);
      if (statObj.isFile()) {
        await unlink(dir);
      } else {
        let dirs = await readdir(dir);
        dirs = dirs.map((item: string) => preParellDeep(path.join(dir, item)));
        await Promise.all(dirs);
        await rmdir(dir);
      };

    }
    preParellDeep(this.stockRoot);
  }

  async addGroup(e: any) {

    this.getDepsFolder(e.fullPath, e);

    let filePath = e ? e.fullPath : this.stockRoot;

    let res = await this.getUserInput("请输入文件夹名", "", [0, 0]);
    if (res) {
      fs.mkdir(path.join(filePath, res), (err) => {
        if (err) {
          this.logError(err);
        }
      });
    }
    this.refresh();
  }
  async editGroup(e: any) {
    let res = await this.getUserInput("请输入文件夹名", e.label, [0, 0]);
    if (res) {
      fs.rename(e.fullPath, path.join(e.fullPath, '..', res), (err) => {
        if (err) {
          this.logError(err);
        };
      });
    }
    this.refresh();
  }
  async deleteGroup(e: any) {
    let res = await this.getUserInput("确认删除", "确认", [0, 2]);
    if (res === "确认") {
      fs.rmSync(e.fullPath, { recursive: true, force: true });
      this.logInfo("成功删除");
    } else {
      this.logError("删除失败");
    }
    this.refresh();

  }
  async openGroup(e: any) {

    vscode.commands.executeCommand("revealFileInOS", e.fullPath);
  }

  async addSnippet(e: any) {
    let res = await this.getUserInput("请输入文件名", "." + e.label, [0, 0]);
    if (res) {
      fs.writeFileSync(path.join(e.fullPath, res), '');
    }
    this.refresh();

  }
  async deleteSnippet(e: any) {
    let res = await this.getUserInput("确认删除", "确认", [0, 2]);
    if (res === "确认") {
      fs.rmSync(e.fullPath, { recursive: true, force: true });
      this.logInfo("成功删除");
    } else {
      this.logError("删除失败");
    }

  }
  async editSnippet(e: any) {

    let endPos = e.fileName.length;
    if (!(e.icon === "file")) {
      endPos = e.fileName.length - e.icon.length - 1;
    }


    let res = await this.getUserInput("请输入新文件名", e.label, [0, endPos]);
    if (res) {
      fs.rename(e.fullPath, path.join(e.fullPath, '..', res), (err) => {
        if (err) {
          this.logError(err);
        };
      });
    }

  }

  private _onDidChangeTreeData: vscode.EventEmitter<SnippetItem | undefined | null | void> = new vscode.EventEmitter<SnippetItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SnippetItem | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }


  async getUserInput(placeHolder: string, value: string, range: [number, number]) {
    let key = await vscode.window.showInputBox({ placeHolder: placeHolder, value: value, valueSelection: range });
    if (key) {
      return key;
    }
    return "";
  }

  private folderExists(p: string): boolean {
    if (fs.lstatSync(p).isDirectory()) {
      return true;
    }
    return false;
  }

  logInfo(message: string) {
    vscode.window.showInformationMessage(message);
  }
  logError(err: NodeJS.ErrnoException | any) {
    console.error(err);
    vscode.window.showErrorMessage(err.toString());
  }

}



class SnippetItem extends vscode.TreeItem {
  constructor(
    public readonly fullPath: string,
    private fileName: string,
    private icon: string,
    private fileType: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
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
        arguments: [this.fullPath]
      };

      if (!fs.existsSync(path.join(__filename, '..', '..', 'media', 'icons', 'files', 'dark', `${this.icon}.svg`))) {
        this.icon = "file";
      }

    }
    this.iconPath = {
      light: path.join(__filename, '..', '..', 'media', 'icons', 'files', 'light', `${this.icon}.svg`),
      dark: path.join(__filename, '..', '..', 'media', 'icons', 'files', 'dark', `${this.icon}.svg`)
    };
  }
}




