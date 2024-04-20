import * as vscode from 'vscode';
import * as utils from './global';

/**
 * @param srcThis
 * @param syncInfo 上传|下载
 * @param localInfo 云端|本地
 * @param syncMode 0|1 上传|下载
 */
export async function syncCloud(srcThis: any, syncInfo: string, localInfo: string, syncMode: 0 | 1, snippetCatConfig: any) {
    srcThis.checkRoot();

    let key = await vscode.window.showInputBox({
        placeHolder: `确定${syncInfo}吗,这将覆盖${localInfo}数据`,
        value: `确定${syncInfo}吗,这将覆盖${localInfo}数据`,
        valueSelection: [0, 2]
    });

    if (key) {
        const stockPath = srcThis.stockPath.split('\\').join('/');

        // 仅支持github
        vscode.window.showInformationMessage(`正在使用GITHUB${syncInfo}`);
        let { push, pull } = snippetCatConfig.get('github');

        utils.runCMD(stockPath, [push, pull][syncMode], srcThis);
        vscode.window.showInformationMessage(`${syncInfo}成功!`);
    } else {
        vscode.window.showErrorMessage(`用户取消${syncInfo}`);
    }
}
