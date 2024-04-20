import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as utils from './utils/global';
import * as syncs from './utils/syncs';

import { SnippetElement, SnippetItem } from './models/snippet';

export class SnippetsProvider
    implements vscode.TreeDataProvider<SnippetElement>, vscode.TreeDragAndDropController<SnippetElement>
{
    dropMimeTypes = ['application/vnd.code.tree.snippet-cat-view'];
    dragMimeTypes = ['text/uri-list'];
    private _onDidChangeTreeData: vscode.EventEmitter<SnippetElement | undefined> = new vscode.EventEmitter<
        SnippetElement | undefined
    >();
    readonly onDidChangeTreeData: vscode.Event<SnippetElement | undefined> = this._onDidChangeTreeData.event;
    public treeExpandList: SnippetElement[];

    /**
     * 树视图 / 展开视图
     */
    public viewTreeMode: boolean; // 树视图 / 展开视图

    /**
     * 储存文件根目录
     */
    stockPath = '';

    /**
     * 是否添加储存目录
     */
    hasRoot = false;
    view: vscode.TreeView<SnippetElement>;

    /**
     * 插件配置项
     */
    snippetCatConfig: any;

    constructor(context: vscode.ExtensionContext) {
        const snippetTreeView = vscode.window.createTreeView('snippet-cat-view', {
            treeDataProvider: this,
            showCollapseAll: true,
            canSelectMany: true,
            dragAndDropController: this
        });

        context.subscriptions.push(snippetTreeView);
        this.view = snippetTreeView;
        this.treeExpandList = [];
        this.viewTreeMode = true; // 树视图 / 展开视图
        this.init();
    }

    /**
     * 必须实现的方法
     * 用于获取节点子级
     */
    getChildren(element?: SnippetElement): Thenable<SnippetElement[] | undefined> {
        this.checkRoot();

        return Promise.resolve(this._getChildren(element));
    }

    // Element 列表
    _getChildren(element?: SnippetElement): SnippetElement[] {
        let folderPath: string;
        if (element) {
            folderPath = element.fullPath;
        } else {
            folderPath = this.stockPath;
        }

        const resFolder = fs.readdirSync(folderPath);
        const tree: SnippetElement[] = [];
        const _this = this;

        let folderList = resFolder.filter(
            (fileName) => fs.lstatSync(path.resolve(folderPath, fileName)).isDirectory() && !fileName.startsWith('.')
        );
        let fileList = resFolder.filter((fileName: string) => !folderList.includes(fileName) && !fileName.startsWith('.'));

        folderList.forEach(function (fileName: any) {
            const fullPath = path.resolve(folderPath, fileName);
            if (_this.viewTreeMode) {
                tree.push(_this._getTreeElement(fullPath, element));
            } else {
                _this._getChildren(element);
            }
        });

        fileList.forEach(function (fileName: any) {
            const fullPath = path.resolve(folderPath, fileName);
            if (_this.viewTreeMode) {
                tree.push(_this._getTreeElement(fullPath, element));
            } else {
                _this.treeExpandList.push(_this._getTreeElement(fullPath, element));
            }
        });
        if (_this.viewTreeMode) {
            return tree;
        } else {
            return this.treeExpandList.sort((el1: SnippetElement, el2: SnippetElement) =>
                path.extname(el1.fullPath).toUpperCase() < path.extname(el2.fullPath).toUpperCase() ? -1 : 1
            );
        }
    }

    public getTreeItem(element: SnippetElement): vscode.TreeItem {
        this.checkRoot();
        return this._getTreeItem(element.fullPath, element);
    }

    getParent(element: SnippetElement): vscode.ProviderResult<SnippetElement> {
        return element.parent;
    }

    _getItem(fullPath: string): SnippetElement {
        let node: SnippetElement | undefined;

        for (let item of this.treeExpandList) {
            if (fullPath === item.fullPath) {
                node = item;
            }
        }

        if (node === undefined) {
            return new SnippetElement(fullPath);
        } else {
            return node;
        }
    }

    _getTreeItem(fullPath: string, element: SnippetElement): SnippetItem {
        const treeElement = this._getTreeElement(fullPath, element);

        return new SnippetItem(
            treeElement,
            treeElement.basename,
            treeElement.isDir ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
        );
    }

    _getTreeElement(fullPath: string, element?: SnippetElement): SnippetElement {
        return new SnippetElement(fullPath, element);
    }

    // Drag and drop
    public async handleDrop(
        target: SnippetElement,
        sources: vscode.DataTransfer,
        token: vscode.CancellationToken
    ): Promise<void> {
        const transferItem = sources.get('application/vnd.code.tree.snippet-cat-view');
        if (!transferItem || !this.viewTreeMode) {
            return;
        }
        const srcTreeElements: SnippetElement[] = transferItem.value;

        srcTreeElements.forEach((el) => {
            fs.rename(el.fullPath, path.join(target ? target.dirPath : this.stockPath, el.basename), function (err) {
                if (err) {
                    throw err;
                }
            });
        });

        this.refresh();
    }

    public async handleDrag(
        source: SnippetElement[],
        treeDataTransfer: vscode.DataTransfer,
        token: vscode.CancellationToken
    ): Promise<void> {
        treeDataTransfer.set('application/vnd.code.tree.snippet-cat-view', new vscode.DataTransferItem(source));
    }

    public setTreeView(element: any) {
        this.treeExpandList = element;
    }

    async saveToStock() {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            const selText = editor.document.getText(editor.selection);
            const languageId = editor.document.languageId;

            Promise.resolve(utils.generateDescription(languageId, selText)).then((data) => {
                let { ext, content } = data;
                const targetPath = path.join(this.stockPath, languageId + '.' + ext);
                utils.addContentToFile(targetPath, '\n' + content + '\n', this);
                vscode.window.showInformationMessage('已添加到:' + targetPath);
            });
        }
    }

    async addStockPath() {
        const _this = this;
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Select Folder',
            canSelectFiles: false,
            canSelectFolders: true
        };

        await vscode.window.showOpenDialog(options).then((fileUri) => {
            if (fileUri && fileUri[0]) {
                this.snippetCatConfig.update('stockPath', fileUri[0].fsPath, vscode.ConfigurationTarget.Global).then(() => {
                    _this.stockPath = fileUri[0].fsPath;
                    _this.hasRoot = true;
                    _this.refresh();
                });
            } else {
                vscode.window.showInformationMessage('用户取消设置');
            }
        });
    }

    async refresh(): Promise<void> {
        this.treeExpandList = [];
        this.checkRoot();
        this._onDidChangeTreeData.fire(undefined);
    }

    init() {
        this.snippetCatConfig = vscode.workspace.getConfiguration('snippet-cat');
        const localPath = this.snippetCatConfig.get('stockPath').toString();
        try {
            var stat = fs.statSync(localPath);
            if (!stat.isDirectory()) {
                this.hasRoot = false;
                throw new Error('请先添加根目录');
            } else {
                this.stockPath = localPath;
                this.hasRoot = true;
                this.refresh();
            }
        } catch (e: any) {
            console.error(e.message);
        }
    }

    viewSwitch() {
        this.viewTreeMode = !this.viewTreeMode;
        this.treeExpandList = [];
        this.refresh();
    }

    click(filePath: string) {
        var openPath = vscode.Uri.parse('file:///' + filePath.split(`\\`).join(`/`)); //A request file path
        vscode.workspace.openTextDocument(openPath).then((doc) => {
            vscode.window.showTextDocument(doc);
        });
    }

    // TODO
    async search() {
        let picks: string[] = [];

        for (const node of utils.getFiles(this.stockPath, false)) {
            picks.push(node);
        }

        let key = await vscode.window.showQuickPick(picks);

        if (key) {
            await this.view.reveal(this._getTreeElement(key), {
                select: true,
                focus: true,
                expand: true
            });
        }
    }

    // 检查是否为最后一个条目(用于删除验证)
    iskLastNode() {
        const files = utils.getFiles(this.stockPath);
        // 如果没有文件, 则创建一个初始文件
        if (files.length === 1) {
            return true;
        }

        return false;
    }

    checkRoot() {
        if (!this.hasRoot) {
            throw new Error('请先添加根目录');
        }
        // 如果有根目录 检查下有没有文件/文件夹 否则无法生成node
        const files = utils.getFiles(this.stockPath);
        // 如果没有文件, 则创建一个初始文件
        if (files.length === 0) {
            var writeStream = fs.createWriteStream(path.join(this.stockPath, 'Getting Start.md'));
            writeStream.write('欢迎使用Snippet Cat\n');
            writeStream.write('你可以用它来储存代码片段\n');
            writeStream.write('也可以用它来写日记/做笔记\n');
            writeStream.write('全局的 就很方便\n');
            writeStream.end();
        }
    }

    async upload() {
        syncs.syncCloud(this, '上传', '云端', 0, this.snippetCatConfig);
    }

    async download() {
        syncs.syncCloud(this, '下载', '本地', 1, this.snippetCatConfig);
    }

    openGroup(e: SnippetElement) {
        utils.revealFileInOS(e.fullPath);
    }

    addGroup(e: SnippetElement) {
        this.checkRoot();

        let folderPath: string;

        // 选中节点就用它的父级文件夹作为目标

        if (e) {
            if (fs.statSync(e.fullPath).isDirectory()) {
                folderPath = e.fullPath;
            } else {
                folderPath = path.dirname(e.fullPath);
            }
        } else {
            folderPath = this.stockPath;
        }

        let iter = this.handleSnippets('请输入文件夹名', '', [0, 0]);
        iter.next().then(
            (data: any) => {
                iter.next([fs.mkdir, path.join(folderPath, data.value)]);
            },
            (err: any) => console.log(err)
        );
    }

    editGroup(e: SnippetElement) {
        let iter = this.handleSnippets('请输入文件夹名', e.basename, [0, e.basename.length]);
        iter.next().then(
            (data: any) => {
                iter.next([fs.rename, e.fullPath, path.join(e.fullPath, '..', data.value)]);
            },
            (err: any) => console.log(err)
        );
    }

    deleteGroup(e: SnippetElement) {
        if (this.iskLastNode()) {
            vscode.window.showWarningMessage('请至少保留一个项目');
            return;
        }

        let iter = this.handleSnippets('确认删除', '确认', [0, 2]);
        iter.next().then(
            (data: any) => {
                iter.next([fs.rmSync, e.fullPath, { recursive: true, force: true }]);
            },
            (err: any) => console.log(err)
        );
    }

    async *handleSnippets(...args: any[]): any {
        let [placeHolder, value, valueSelection] = args;
        let key = await vscode.window.showInputBox({
            placeHolder: placeHolder,
            value: value,
            valueSelection: valueSelection
        });

        if (key !== undefined) {
            let [fun, ...args2] = yield key;
            fun(...args2, (err: any) => {
                if (err) {
                    vscode.window.showErrorMessage(err.toString());
                }
            });
            this.refresh();
        } else {
            throw new Error('用户未确认');
        }
    }

    async addSnippet(e: SnippetElement) {
        let lastExt = this.snippetCatConfig.get('lastFileExt');

        let iter = this.handleSnippets('请输入文件名', '.' + lastExt, [0, 0]);
        iter.next().then(
            (data: any) => {
                let ext = data.value.split('.');

                ext = ext.length > 1 ? ext[1] : '';

                let folderPath: string;

                // 选中节点就用它的父级文件夹作为目标

                if (e) {
                    if (fs.statSync(e.fullPath).isDirectory()) {
                        folderPath = e.fullPath;
                    } else {
                        folderPath = path.dirname(e.fullPath);
                    }
                } else {
                    folderPath = this.stockPath;
                }

                iter.next([fs.writeFileSync, path.join(folderPath, data.value), '']);

                this.snippetCatConfig.update('lastFileExt', ext, vscode.ConfigurationTarget.Global).then(() => {
                    this.snippetCatConfig = vscode.workspace.getConfiguration('snippet-cat');
                });
            },
            (err: any) => console.log(err)
        );
    }

    deleteSnippet(e: SnippetElement) {
        if (this.iskLastNode()) {
            vscode.window.showWarningMessage('请至少保留一个项目');
            return;
        }
        let iter = this.handleSnippets('确认删除', '确认', [0, 2]);
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
        let iter = this.handleSnippets('请输入新文件名', e.basename, [0, endPos]);
        iter.next().then(
            (data: any) => {
                iter.next([fs.rename, e.fullPath, path.join(e.fullPath, '..', data.value)]);
            },
            (err: any) => console.log(err)
        );
    }
}
