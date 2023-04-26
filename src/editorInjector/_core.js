/**
 * @description Add default properties to the editor core;
 * @param {any} editor Editor's core
 * @private
 */
function CoreInjector(editor) {
	// editor root
	this.editor = editor;
	// base
	this.eventManager = editor.eventManager;
	this.history = editor.history;
	this.events = editor.events;
	// environment variables
	this.plugins = editor.plugins;
	this.status = editor.status;
	this.context = editor.context;
	this.options = editor.options;
	this.icons = editor.icons;
	this.lang = editor.lang;
	// window, document, shadowRoot
	this._w = editor._w;
	this._d = editor._d;
	this._shadowRoot = editor._shadowRoot;
}

export default CoreInjector;
