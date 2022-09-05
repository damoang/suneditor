'use strict';

import EditorInterface from '../../interface/editor';
import { domUtils } from '../../helper';

const layout = function (editor, target) {
	// plugin bisic properties
	EditorInterface.call(this, editor);
	this.target = target;
	this.title = this.lang.toolbar.layout;
	this.icon = this.icons.layout;

	// create HTML
	const menu = CreateHTML(editor);

	// members
	this.selectedIndex = -1;

	// init
	this.menu.initTarget(target, menu);
	this.eventManager.addEvent(menu.querySelector('ul'), 'click', OnClickMenu.bind(this));
};

layout.type = 'dropdown';
layout.className = '';
layout.prototype = {
	/**
	 * @override core
	 * @param {number} index layout menu index
	 */
	action: function (index) {
		const temp = this.options.layouts[(this.selectedIndex = index)];

		if (temp.html) {
			this.editor.setContent(temp.html);
		} else {
			this.menu.dropdownOff();
			throw Error('[SUNEDITOR.layout.fail] cause : "layouts[i].html not found"');
		}

		this.menu.dropdownOff();
	},

	constructor: layout
};

function OnClickMenu(e) {
	if (!/^BUTTON$/i.test(e.target.tagName)) return false;

	e.preventDefault();
	e.stopPropagation();

	this.action(e.target.getAttribute('data-value') * 1);
}

function CreateHTML(editor) {
	const layoutList = editor.options.layouts;
	if (!layoutList || layoutList.length === 0) {
		throw Error('[SUNEDITOR.plugins.layout.fail] To use the "layout" plugin, please define the "layouts" option.');
	}

	let list = '<div class="se-dropdown se-list-inner">' + '<ul class="se-list-basic">';
	for (let i = 0, len = layoutList.length, t; i < len; i++) {
		t = layoutList[i];
		list += '<li><button type="button" class="se-btn-list" data-value="' + i + '" title="' + t.name + '" aria-label="' + t.name + '">' + t.name + '</button></li>';
	}
	list += '</ul></div>';

	return domUtils.createElement('DIV', { class: 'se-list-layer' }, list);
}

export default layout;