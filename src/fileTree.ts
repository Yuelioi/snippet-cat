import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TreeItem } from "vscode";

/**
 * TODO:可以精剪下函数
 */
export class TreeProvider implements vscode.TreeDataProvider<SnippetItem>{

  tree: any;
  constructor(private stockRoot: string) {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.tree;
  }
  public setTreeView(element: any) {
    this.tree = element;

  };
  public getTreeItem(element: TreeItem) {
    return element;
  }

  

  getChildren(element?: SnippetItem): Thenable<SnippetItem[]> {

    if (!this.stockRoot) {
      vscode.window.showInformationMessage('未定义储存路径');
      return Promise.resolve([]);
    }

    if (element) {
      return Promise.resolve(
        this.getDepsFolder(element.fullPath)
      );
    } else {
      return Promise.resolve(this.getDepsFolder(this.stockRoot));
    }
  }

  private getDepsFolder(stogeFolder: string): SnippetItem[] {

    const resFolder = fs.readdirSync(stogeFolder);

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
      lists.push(toDep(fileName, fullPath, isFolder));
    });

    return lists;
  }

  private folderExists(p: string): boolean {
    if (fs.lstatSync(p).isDirectory()) {
      return true;
    }
    return false;
  }

  getParent(e: any) {
    return null;
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
    console.log(element);
    this.tree.reveal(element,{select:true,focus: true,expand:true});

  }

  async addGroup() {
    let res = await this.getUserInput("请输入文件夹名", "",[0,0]);
    if (res) {
      fs.mkdir(path.join(this.stockRoot, res), (err) => {
        if (err) {
          this.logError(err);
        }
      });
    }
    this.refresh();
  }
  async editGroup(e: any) {
    let res = await this.getUserInput("请输入文件夹名", e.label,[0,0]);
    if (res) {
      fs.rename(e.fullPath, path.join(e.fullPath, '..', res), (err) => {
        if (err) {
          this.logError(err);
        };
      });
    }
    this.refresh();
  }
  async deleteGroup(e:any) {
    let res = await this.getUserInput("确认删除","确认",[0,0]);
    if (res){
      fs.rmSync(e.fullPath, { recursive: true, force: true });
      this.logInfo("成功删除");
    }else{
      this.logError("删除失败");
    }
    this.refresh();

  }
  async addSnippet(e: any) {
    let res = await this.getUserInput("请输入文件名", "." + e.label,[0,0]);
    if (res) {
      fs.writeFileSync(path.join(e.fullPath,res), '');
    }
    this.refresh();

  }
  async deleteSnippet(e:any) {
    let res = await this.getUserInput("确认删除","确认",[0,0]);
    if (res){
      fs.rmSync(e.fullPath, { recursive: true, force: true });
      this.logInfo("成功删除");
    }else{
      this.logError("删除失败");
    }

  }
  async editSnippet(e:any) {
    let res = await this.getUserInput("请输入文件名", e.label,[0,0]);
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


  async getUserInput(placeHolder: string, value: string,range:[number,number]) {
    let key = await vscode.window.showInputBox({ placeHolder: placeHolder, value: value ,valueSelection:range});
    if (key) {
      return key;
    }
    return "";
  }

  logInfo(message:string){
    vscode.window.showInformationMessage(message);
  }
  logError(err: NodeJS.ErrnoException|any) {
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
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(fullPath, collapsibleState);
    this.label = this.fileName;
    this.tooltip = `${this.fullPath}`;
    this.description = this.fileName;
    this.contextValue = this.fileType;
    if (fileType === "Snippet") {
      this.command = {
        title: "Item Command",
        command: "snippet-cat.click",
        arguments: [this.fullPath]
      };
    }

  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'media', 'icons', 'files', 'light', `${this.icon}.svg`),
    dark: path.join(__filename, '..', '..', 'media', 'icons', 'files', 'dark', `${this.icon}.svg`)
  };
}




