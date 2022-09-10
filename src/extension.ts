"use strict";

import * as vscode from "vscode";
import { TreeProvider } from "./fileTree";

export function activate(context: vscode.ExtensionContext) {
  const treeProvider = new TreeProvider(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("snippet-cat.click", path => treeProvider.click(path)),
    vscode.commands.registerCommand("snippet-cat.viewSwitch", treeProvider.viewSwitch.bind(treeProvider)),

    vscode.commands.registerCommand("snippet-cat.upload", treeProvider.upload.bind(treeProvider)),
    vscode.commands.registerCommand("snippet-cat.download", treeProvider.download.bind(treeProvider)),
    vscode.commands.registerCommand("snippet-cat.refresh", treeProvider.refresh.bind(treeProvider)),
    vscode.commands.registerCommand("snippet-cat.search", treeProvider.search.bind(treeProvider)),
    vscode.commands.registerCommand("snippet-cat.addStockPath", treeProvider.addStockPath.bind(treeProvider)),

    vscode.commands.registerCommand("snippet-cat.addGroup", treeProvider.addGroup.bind(treeProvider)),
    vscode.commands.registerCommand("snippet-cat.editGroup", treeProvider.editGroup.bind(treeProvider)),
    vscode.commands.registerCommand("snippet-cat.openGroup", treeProvider.openGroup.bind(treeProvider)),
    vscode.commands.registerCommand("snippet-cat.deleteGroup", treeProvider.deleteGroup.bind(treeProvider)),

    vscode.commands.registerCommand("snippet-cat.addSnippet", treeProvider.addSnippet.bind(treeProvider)),
    vscode.commands.registerCommand("snippet-cat.editSnippet", treeProvider.editSnippet.bind(treeProvider)),
    vscode.commands.registerCommand("snippet-cat.deleteSnippet", treeProvider.deleteSnippet.bind(treeProvider))
  );
}
