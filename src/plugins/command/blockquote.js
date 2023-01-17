import EditorDependency from '../../dependency';
import { domUtils } from '../../helper';

const Blockquote = function (editor, target) {
	EditorDependency.call(this, editor);
	// plugin basic properties
	this.target = target;
	this.title = this.lang.tag_blockquote;
	this.icon = this.icons.blockquote;

	// members
	this.quoteTag = domUtils.createElement('BLOCKQUOTE');
};

Blockquote.key = 'blockquote';
Blockquote.type = 'command';
Blockquote.className = '';
Blockquote.prototype = {
	/**
	 * @override core
	 */
	active: function (element) {
		if (element && /blockquote/i.test(element.nodeName)) {
			domUtils.addClass(this.target, 'active');
			return true;
		}

		domUtils.removeClass(this.target, 'active');
		return false;
	},

	/**
	 * @override core
	 */
	action: function () {
		const currentBlockquote = domUtils.getParentElement(this.selection.getNode(), 'blockquote');

		if (currentBlockquote) {
			this.format.removeBlock(currentBlockquote, null, null, false, false);
		} else {
			this.format.applyBlock(this.quoteTag.cloneNode(false));
		}
	},

	constructor: Blockquote
};

export default Blockquote;
