/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Editor, MarkdownView, Notice, Setting } from 'obsidian';

import BetterPaste from '../main';
import { EnhancedEditor } from 'enhanced-editor';
import { SettingTab } from './settingTab';
import { Switch } from 'constant/consisit';

interface SETTINGS {
    autoDelNulLine: boolean
}

export type { SETTINGS as OPTIMIZE_PASTER_SETTINGS }

const settings = {
    autoDelNulLine: true
}



export { settings as optimizePasteSettings }

export class OptimizePasteCore {
    static featureName = "删除文字间一个空行功能"
    constructor(protected plugin: BetterPaste) {
    }
    /** 顶层入口
     * 需要粘贴前的一瞬间调用该函数
     */
    protected DelPasteSpaceLine(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            //Testlog('Paste Event!');
            //Testlog(this.settings.autoDelNulLineSwitch);
            if (!this.plugin.settings.autoDelNulLine) resolve(false)
            let editor = this.plugin.app.workspace.activeEditor?.editor!
            if (!editor) resolve(false)
            let BeforePos = editor.getCursor();
            window.setTimeout(() => {
                let enhancedEditor = new EnhancedEditor(editor)
                let { txt: rawin } = enhancedEditor.GetPasteTxt(BeforePos);
                editor.replaceSelection(this.DelSpaceLineOnce(rawin));
                resolve(true)
            }, 1);
        })
    }
    DelSpaceLineOnce(rawin: string): string {
        const NullLineRegex = /(?<=\n)\n/g;
        return (
            rawin.replace(NullLineRegex, function () {
                return '';
            })
        )
    }
}

export class OptimizePasteController extends OptimizePasteCore {
    clearFuncs: Function[];
    constructor(plugin: BetterPaste) {
        super(plugin);
        console.log('controller construct!!')
        this.Init()
    }
    Init() {
        this.clearFuncs = []
        this.addCommand()
        this.registListener()
        SettingTab.addSettingAdder(containerEl => this.switchAutoDelNulLine(containerEl))
    }
    switchAutoDelNulLine(containerEl: HTMLElement): HTMLElement {
        new Setting(containerEl)
            .setName(`是否启用自动${OptimizePasteCore.featureName}`)
            .addToggle(toggle => {
                toggle
                    .setValue(this.plugin.settings.autoDelNulLine)
                    .onChange(v => {
                        this.plugin.settings.autoDelNulLine = v
                        this.plugin.saveSettings()
                    })
            })
        return containerEl
    }
    die() {
        for (const func of this.clearFuncs) {
            func()
        }
        this.clearFuncs = []
    }
    addCommand() {
        this.plugin.addCommand({
            id: `${OptimizePasteCore.featureName}`,
            name: `${OptimizePasteCore.featureName}`,
            editorCallback: (editor: Editor, view: MarkdownView) => {
                let enhancedEditor = new EnhancedEditor(editor)
                let { startPos, endPos, txt: rawIn } = enhancedEditor.GetMultiLineInSelection()
                editor.replaceRange(this.DelSpaceLineOnce(rawIn), startPos, endPos);
            }
        });
    }
    protected registListener() {
        let clearFunc = () => { this.plugin.app.workspace.off('editor-paste', this.DelPasteSpaceLine.bind(this)) }
        clearFunc()
        this.plugin.app.workspace.on('editor-paste', this.DelPasteSpaceLine.bind(this))
        this.clearFuncs.push(clearFunc)
    }
}