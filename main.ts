/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { OPTIMIZE_PASTER_SETTINGS, OptimizePasteController, optimizePasteSettings } from 'src/optimizePaste';

import { SettingTab } from 'src/settingTab';

interface PLUGIN_SETTINGS extends OPTIMIZE_PASTER_SETTINGS {

}

const DEFAULT_SETTINGS: PLUGIN_SETTINGS = Object.assign({

}, optimizePasteSettings)

export default class BetterPaste extends Plugin {
	settings: PLUGIN_SETTINGS;
	optimizePasteController: OptimizePasteController;

	async onload() {
		await this.loadSettings();
		this.init()
	}
	init() {
		this.optimizePasteController = new OptimizePasteController(this)
		this.addSettingTab(new SettingTab(this))
	}

	onunload() {
		this.optimizePasteController.die()
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}