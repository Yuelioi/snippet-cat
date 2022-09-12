"use strict";

import * as vscode from "vscode";
import { SnippetsProvider } from "./SnippetsProvider";
import { TOCProvider } from "./TOCProvider";

export function activate(context: vscode.ExtensionContext) {
  const snippetProvider = new SnippetsProvider(context);
  const tocProvider = new TOCProvider(context);

  
  context.subscriptions.push(

    // 监听窗口变化
    vscode.window.onDidChangeActiveTextEditor(() => {
   
      tocProvider.refresh();
    }),


    vscode.commands.registerCommand("snippet-cat.main.click", path => snippetProvider.click(path)),
    vscode.commands.registerCommand("snippet-cat.main.viewSwitch", snippetProvider.viewSwitch.bind(snippetProvider)),

    vscode.commands.registerCommand("snippet-cat.main.upload", snippetProvider.upload.bind(snippetProvider)),
    vscode.commands.registerCommand("snippet-cat.main.download", snippetProvider.download.bind(snippetProvider)),
    vscode.commands.registerCommand("snippet-cat.main.refresh", snippetProvider.refresh.bind(snippetProvider)),
    vscode.commands.registerCommand("snippet-cat.main.search", snippetProvider.search.bind(snippetProvider)),
    vscode.commands.registerCommand("snippet-cat.main.addStockPath", snippetProvider.addStockPath.bind(snippetProvider)),

    vscode.commands.registerCommand("snippet-cat.main.addGroup", snippetProvider.addGroup.bind(snippetProvider)),
    vscode.commands.registerCommand("snippet-cat.main.editGroup", snippetProvider.editGroup.bind(snippetProvider)),
    vscode.commands.registerCommand("snippet-cat.main.openGroup", snippetProvider.openGroup.bind(snippetProvider)),
    vscode.commands.registerCommand("snippet-cat.main.deleteGroup", snippetProvider.deleteGroup.bind(snippetProvider)),

    vscode.commands.registerCommand("snippet-cat.main.addSnippet", snippetProvider.addSnippet.bind(snippetProvider)),
    vscode.commands.registerCommand("snippet-cat.main.editSnippet", snippetProvider.editSnippet.bind(snippetProvider)),
    vscode.commands.registerCommand("snippet-cat.main.deleteSnippet", snippetProvider.deleteSnippet.bind(snippetProvider)),



    vscode.commands.registerCommand("snippet-cat.outline.click", tocProvider.click.bind(tocProvider)),
    vscode.commands.registerCommand("snippet-cat.outline.copy", tocProvider.copy.bind(tocProvider)),
    
    vscode.commands.registerCommand("snippet-cat.outline.refresh", tocProvider.refresh.bind(tocProvider))
    // 函数测试用
    // vscode.commands.registerCommand("snippet-cat.outline.test", tocProvider.test.bind(tocProvider)),
  );
}
