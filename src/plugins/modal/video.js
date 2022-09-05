'use strict';

import { Modal, Figure, FileManager, ModalAnchorEditor } from '../../modules';
import modal from '../modules/modal';
import mediaContainer from '../modules/mediaContainer';
import resizing from '../modules/resizing';
import fileManager from '../modules/fileManager';

export default {
    name: 'video',
    type: 'modal',
    add: function (core) {
        core.addModule([modal, mediaContainer, resizing, fileManager]);

        const options = core.options;
        const context = core.context;
        const contextVideo = context.video = {
            _infoList: [], // @override fileManager
            _infoIndex: 0, // @override fileManager
            _uploadFileLength: 0, // @override fileManager
            focusElement: null, // @override modal // This element has focus when the modal is opened.
            sizeUnit: options._videoSizeUnit,
            _align: 'none',
            _floatClassRegExp: '__se__float\\-[a-z]+',
            _youtubeQuery: options.youtubeQuery,
            _videoRatio: (options.videoRatio * 100) + '%',
            _defaultRatio: (options.videoRatio * 100) + '%',
            _linkValue: '',
            // @require @override mediaContainer
            _element: null,
            _cover: null,
            _container: null,
            // @override resizing properties
            inputX: null,
            inputY: null,
            _element_w: 1,
            _element_h: 1,
            _element_l: 0,
            _element_t: 0,
            _defaultSizeX: '100%',
            _defaultSizeY: (options.videoRatio * 100) + '%',
            _origin_w: options.videoWidth === '100%' ? '' : options.videoWidth,
            _origin_h: options.videoHeight === '56.25%' ? '' : options.videoHeight,
            _proportionChecked: true,
            _resizing: options.videoResizing,
            _resizeDotHide: !options.videoHeightShow,
            _rotation: options.videoRotation,
            _alignHide: !options.videoAlignShow,
            _onlyPercentage: options.videoSizeOnlyPercentage,
            _ratio: false,
            _ratioX: 1,
            _ratioY: 1,
            _captionShow: false
        };

        /** video modal */
        let video_modal = this.setModal(core);
        contextVideo.modal = video_modal;
        contextVideo.videoInputFile = video_modal.querySelector('._se_video_file');
        contextVideo.videoUrlFile = video_modal.querySelector('.se-input-url');
        contextVideo.focusElement = contextVideo.videoUrlFile || contextVideo.videoInputFile;
        contextVideo.preview = video_modal.querySelector('.se-link-preview');

        /** add event listeners */
        video_modal.querySelector('form').addEventListener('submit', this.submit.bind(core));
        if (contextVideo.videoInputFile) video_modal.querySelector('.se-modal-files-edge-button').addEventListener('click', this._removeSelectedFiles.bind(contextVideo.videoInputFile, contextVideo.videoUrlFile, contextVideo.preview));
        if (contextVideo.videoInputFile && contextVideo.videoUrlFile) contextVideo.videoInputFile.addEventListener('change', this._fileInputChange.bind(contextVideo));
        if (contextVideo.videoUrlFile) contextVideo.videoUrlFile.addEventListener('input', this._onLinkPreview.bind(contextVideo.preview, contextVideo, options.linkProtocol));

        contextVideo.proportion = {};
        contextVideo.videoRatioOption = {};
        contextVideo.inputX = {};
        contextVideo.inputY = {};
        if (options.videoResizing) {
            contextVideo.proportion = video_modal.querySelector('._se_video_check_proportion');
            contextVideo.videoRatioOption = video_modal.querySelector('.se-video-ratio');
            contextVideo.inputX = video_modal.querySelector('._se_video_size_x');
            contextVideo.inputY = video_modal.querySelector('._se_video_size_y');
            contextVideo.inputX.value = options.videoWidth;
            contextVideo.inputY.value = options.videoHeight;

            contextVideo.inputX.addEventListener('keyup', this.setInputSize.bind(core, 'x'));
            contextVideo.inputY.addEventListener('keyup', this.setInputSize.bind(core, 'y'));

            contextVideo.inputX.addEventListener('change', this.setRatio.bind(core));
            contextVideo.inputY.addEventListener('change', this.setRatio.bind(core));
            contextVideo.proportion.addEventListener('change', this.setRatio.bind(core));
            contextVideo.videoRatioOption.addEventListener('change', this.setVideoRatio.bind(core));

            video_modal.querySelector('.se-modal-btn-revert').addEventListener('click', this.sizeRevert.bind(core));
        }

        /** append html */
        context.modal.modal.appendChild(video_modal);

        /** empty memory */
        video_modal = null;
    },

    /** modal */
    setModal: function (core) {
        const option = core.options;
        const lang = core.lang;
        const modal = core.util.createElement('DIV');

        modal.className = 'se-modal-content';
        modal.style.display = 'none';
        let html = '' +
            '<form method="post" enctype="multipart/form-data">' +
                '<div class="se-modal-header">' +
                    '<button type="button" data-command="close" class="se-btn se-modal-close" title="' + lang.modalBox.close + '" aria-label="' + lang.modalBox.close + '">' +
                        core.icons.cancel +
                    '</button>' +
                    '<span class="se-modal-title">' + lang.modalBox.videoBox.title + '</span>' +
                '</div>' +
                '<div class="se-modal-body">';

                if (option.videoFileInput) {
                    html += '' +
                        '<div class="se-modal-form">' +
                            '<label>' + lang.modalBox.videoBox.file + '</label>' +
                            '<div class="se-modal-form-files">' +
                                '<input class="se-input-form _se_video_file" type="file" accept="' + option.videoAccept + '"' + (option.videoMultipleFile ? ' multiple="multiple"' : '') + '/>' +
                                '<button type="button" data-command="filesRemove" class="se-btn se-modal-files-edge-button se-file-remove" title="' + lang.controller.remove + '" aria-label="' + lang.controller.remove + '">' + core.icons.cancel + '</button>' +
                            '</div>' +
                        '</div>' ;
                }
    
                if (option.videoUrlInput) {
                    html += '' +
                        '<div class="se-modal-form">' +
                            '<label>' + lang.modalBox.videoBox.url + '</label>' +
                            '<input class="se-input-form se-input-url" type="text" />' +
                            '<pre class="se-link-preview"></pre>' +
                        '</div>';
                }

            if (option.videoResizing) {
                const ratioList = option.videoRatioList || [{name: '16:9', value: 0.5625}, {name: '4:3', value: 0.75}, {name: '21:9', value: 0.4285}];
                const ratio = option.videoRatio;
                const onlyPercentage = option.videoSizeOnlyPercentage;
                const onlyPercentDisplay = onlyPercentage ? ' style="display: none !important;"' : '';
                const heightDisplay = !option.videoHeightShow ? ' style="display: none !important;"' : '';
                const ratioDisplay = !option.videoRatioShow ? ' style="display: none !important;"' : '';
                const onlyWidthDisplay = !onlyPercentage && !option.videoHeightShow && !option.videoRatioShow ? ' style="display: none !important;"' : '';
                html += '' +
                    '<div class="se-modal-form">' +
                        '<div class="se-modal-size-text">' +
                            '<label class="size-w">' + lang.modalBox.width + '</label>' +
                            '<label class="se-modal-size-x">&nbsp;</label>' +
                            '<label class="size-h"' + heightDisplay + '>' + lang.modalBox.height + '</label>' +
                            '<label class="size-h"' + ratioDisplay + '>(' + lang.modalBox.ratio + ')</label>' +
                        '</div>' +
                        '<input class="se-input-control _se_video_size_x" placeholder="100%"' + (onlyPercentage ? ' type="number" min="1"' : 'type="text"') + (onlyPercentage ? ' max="100"' : '') + '/>' +
                        '<label class="se-modal-size-x"' + onlyWidthDisplay + '>' + (onlyPercentage ? '%' : 'x') + '</label>' +
                        '<input class="se-input-control _se_video_size_y" placeholder="' + (option.videoRatio * 100) + '%"' + (onlyPercentage ? ' type="number" min="1"' : 'type="text"') + (onlyPercentage ? ' max="100"' : '') + heightDisplay + '/>' +
                        '<select class="se-input-select se-video-ratio" title="' + lang.modalBox.ratio + '" aria-label="' + lang.modalBox.ratio + '"' + ratioDisplay + '>';
                            if (!heightDisplay) html += '<option value=""> - </option>';
                            for (let i = 0, len = ratioList.length; i < len; i++) {
                                html += '<option value="' + ratioList[i].value + '"' + (ratio.toString() === ratioList[i].value.toString() ? ' selected' : '') + '>' + ratioList[i].name + '</option>';
                            }
                        html += '</select>' +
                        '<button type="button" title="' + lang.modalBox.revertButton + '" aria-label="' + lang.modalBox.revertButton + '" class="se-btn se-modal-btn-revert" style="float: right;">' + core.icons.revert + '</button>' +
                    '</div>' +
                    '<div class="se-modal-form se-modal-form-footer"' + onlyPercentDisplay + onlyWidthDisplay + '>' +
                        '<label><input type="checkbox" class="se-modal-btn-check _se_video_check_proportion" checked/>&nbsp;' + lang.modalBox.proportion + '</label>' +
                    '</div>';
            }

            html += '' +
                '</div>' +
                '<div class="se-modal-footer">' +
                    '<div' + (option.videoAlignShow ? '' : ' style="display: none"') + '>' +
                        '<label><input type="radio" name="suneditor_video_radio" class="se-modal-btn-radio" value="none" checked>' + lang.modalBox.basic + '</label>' +
                        '<label><input type="radio" name="suneditor_video_radio" class="se-modal-btn-radio" value="left">' + lang.modalBox.left + '</label>' +
                        '<label><input type="radio" name="suneditor_video_radio" class="se-modal-btn-radio" value="center">' + lang.modalBox.center + '</label>' +
                        '<label><input type="radio" name="suneditor_video_radio" class="se-modal-btn-radio" value="right">' + lang.modalBox.right + '</label>' +
                    '</div>' +
                    '<button type="submit" class="se-btn-primary" title="' + lang.modalBox.submitButton + '" aria-label="' + lang.modalBox.submitButton + '"><span>' + lang.modalBox.submitButton + '</span></button>' +
                '</div>' +
            '</form>';

        modal.innerHTML = html;

        return modal;
    },

    _fileInputChange: function () {
        if (!this.videoInputFile.value) {
            this.videoUrlFile.removeAttribute('disabled');
            this.preview.style.textDecoration = '';
        } else {
            this.videoUrlFile.setAttribute('disabled', true);
            this.preview.style.textDecoration = 'line-through';
        }
    },

    _removeSelectedFiles: function (urlInput, preview) {
        this.value = '';
        if (urlInput) {
            urlInput.removeAttribute('disabled');
            preview.style.textDecoration = '';
        }
    },

    _onLinkPreview: function (context, protocol, e) {
        const value = e.target.value.trim();
        if (/^<iframe.*\/iframe>$/.test(value)) {
            context._linkValue = value;
            this.textContent = '<IFrame :src=".."></IFrame>';
        } else {
            context._linkValue = this.textContent = !value ? '' : (protocol && value.indexOf('://') === -1 && value.indexOf('#') !== 0) ? protocol + value : value.indexOf('://') === -1 ? '/' + value : value;
        }
    },

    _setTagAttrs: function (element) {
        element.setAttribute('controls', true);

        const attrs = this.options.videoTagAttrs;
        if (!attrs) return;

        for (let key in attrs) {
            if (!attrs.hasOwnProperty(key)) continue;
            element.setAttribute(key, attrs[key]);
        }
    },

    createVideoTag: function () {
        const videoTag = this.util.createElement('VIDEO');
        this.plugins.video._setTagAttrs.call(this, videoTag);
        return videoTag;
    },

    _setIframeAttrs: function (element) {
        element.frameBorder = '0';
        element.allowFullscreen = true;

        const attrs = this.options.videoIframeAttrs;
        if (!attrs) return;

        for (let key in attrs) {
            if (!attrs.hasOwnProperty(key)) continue;
            element.setAttribute(key, attrs[key]);
        }
    },

    createIframeTag: function () {
        const iframeTag = this.util.createElement('IFRAME');
        this.plugins.video._setIframeAttrs.call(this, iframeTag);
        return iframeTag;
    },

    /**
     * @override @Required fileManager
     */
    fileTags: ['iframe', 'video'],

    /**
     * @override core, resizing, fileManager
     * @description It is called from core.component.select
     * @param {Element} element Target element
     */
    select: function (element) {
        this.plugins.video.onModifyMode.call(this, element, this.plugins.resizing.call_controller_resize.call(this, element, 'video'));
    },

    /**
     * @override fileManager, resizing
     */
    destroy: function (element) {
        const frame = element || this.context.video._element;
        const container = this.context.video._container;
        const dataIndex = frame.getAttribute('data-index') * 1;
        let focusEl = (container.previousElementSibling || container.nextElementSibling);

        const emptyDiv = container.parentNode;
        this.util.removeItem(container);
        this.plugins.video.init.call(this);

        if (emptyDiv !== this.context.element.wysiwyg) this.util.removeAllParents(emptyDiv, function (current) { return current.childNodes.length === 0; }, null);

        // focus
        this.focusEdge(focusEl);

        // event
        this.plugins.fileManager.deleteInfo.call(this, 'video', dataIndex, this.events.onVideoUpload);

        // history stack
        this.history.push(false);
    },

    /**
     * @Required @override modal
     */
    on: function (update) {
        const contextVideo = this.context.video;

        if (!update) {
            contextVideo.inputX.value = contextVideo._origin_w = this.options.videoWidth === contextVideo._defaultSizeX ? '' : this.options.videoWidth;
            contextVideo.inputY.value = contextVideo._origin_h = this.options.videoHeight === contextVideo._defaultSizeY ? '' : this.options.videoHeight;
            contextVideo.proportion.disabled = true;
            if (contextVideo.videoInputFile && this.options.videoMultipleFile) contextVideo.videoInputFile.setAttribute('multiple', 'multiple');
        } else {
            if (contextVideo.videoInputFile && this.options.videoMultipleFile) contextVideo.videoInputFile.removeAttribute('multiple');
        }

        if (contextVideo._resizing) {
            this.plugins.video.setVideoRatioSelect.call(this, contextVideo._origin_h || contextVideo._defaultRatio);
        }
    },

    /**
     * @Required @override modal
     */
    open: function () {
        this.plugins.modal.open.call(this, 'video', 'video' === this.currentControllerName);
    },
    
    setVideoRatio: function (e) {
        const contextVideo = this.context.video;
        const value = e.target.options[e.target.selectedIndex].value;

        contextVideo._defaultSizeY = contextVideo._videoRatio = !value ? contextVideo._defaultSizeY : (value * 100) + '%';
        contextVideo.inputY.placeholder = !value ? '' : (value * 100) + '%';
        contextVideo.inputY.value = '';
    },

    /**
     * @override resizing
     * @param {string} xy 'x': width, 'y': height
     * @param {KeyboardEvent} e Event object
     */
    setInputSize: function (xy, e) {
        if (e && e.keyCode === 32) {
            e.preventDefault();
            return;
        }

        const contextVideo = this.context.video;
        this.plugins.resizing._module_setInputSize.call(this, contextVideo, xy);

        if (xy === 'y') {
            this.plugins.video.setVideoRatioSelect.call(this, e.target.value || contextVideo._defaultRatio);
        }
    },

    /**
     * @override resizing
     */
    setRatio: function () {
        this.plugins.resizing._module_setRatio.call(this, this.context.video);
    },

    submit: function (e) {
        const contextVideo = this.context.video;
        const videoPlugin = this.plugins.video;

        e.preventDefault();
        e.stopPropagation();

        contextVideo._align = contextVideo.modal.querySelector('input[name="suneditor_video_radio"]:checked').value;

        try {
            if (contextVideo.videoInputFile && contextVideo.videoInputFile.files.length > 0) {
                this.openLoading();
                videoPlugin.submitAction.call(this, this.context.video.videoInputFile.files);
            } else if (contextVideo.videoUrlFile && contextVideo._linkValue.length > 0) {
                this.openLoading();
                videoPlugin.setup_url.call(this, contextVideo._linkValue);
            }
        } catch (error) {
            this.closeLoading();
            throw Error('[SUNEDITOR.video.submit.fail] cause : "' + error.message + '"');
        } finally {
            this.plugins.modal.close.call(this);
        }

        return false;
    },

    submitAction: function (fileList) {
        if (fileList.length === 0) return;

        let fileSize = 0;
        let files = [];
        for (let i = 0, len = fileList.length; i < len; i++) {
            if (/video/i.test(fileList[i].type)) {
                files.push(fileList[i]);
                fileSize += fileList[i].size;
            }
        }

        const limitSize = this.options.videoUploadSizeLimit;
        if (limitSize > 0) {
            let infoSize = 0;
            const videosInfo = this.context.video._infoList;
            for (let i = 0, len = videosInfo.length; i < len; i++) {
                infoSize += videosInfo[i].size * 1;
            }

            if ((fileSize + infoSize) > limitSize) {
                this.closeLoading();
                const err = '[SUNEDITOR.videoUpload.fail] Size of uploadable total videos: ' + (limitSize/1000) + 'KB';
                if (typeof this.events.onVideoUploadError !== 'function' || this.events.onVideoUploadError(err, { 'limitSize': limitSize, 'currentSize': infoSize, 'uploadSize': fileSize })) {
                    this.notice.open(err);
                }
                return;
            }
        }

        const contextVideo = this.context.video;
        contextVideo._uploadFileLength = files.length;

        const info = {
            inputWidth: contextVideo.inputX.value,
            inputHeight: contextVideo.inputY.value,
            align: contextVideo._align,
            isUpdate: this.context.modal.updateModal,
            element: contextVideo._element
        };

        if (typeof this.events.onVideoUploadBefore === 'function') {
            const result = this.events.onVideoUploadBefore(files, info, function (data) {
                if (data && this._w.Array.isArray(data.result)) {
                    this.plugins.video.register.call(this, info, data);
                } else {
                    this.plugins.video.upload.call(this, info, data);
                }
            }.bind(this));

            if (typeof result === 'undefined') return;
            if (!result) {
                this.closeLoading();
                return;
            }
            if (typeof result === 'object' && result.length > 0) files = result;
        }

        this.plugins.video.upload.call(this, info, files);
    },

    error: function (message, response) {
        this.closeLoading();
        if (typeof this.events.onVideoUploadError !== 'function' || this.events.onVideoUploadError(message, response)) {
            this.notice.open(message);
            throw Error('[SUNEDITOR.plugin.video.error] response: ' + message);
        }
    },

    upload: function (info, files) {
        if (!files) {
            this.closeLoading();
            return;
        }
        if (typeof files === 'string') {
            this.plugins.video.error.call(this, files, null);
            return;
        }

        const videoUploadUrl = this.options.videoUploadUrl;
        const filesLen = this.context.modal.updateModal ? 1 : files.length;

        // server upload
        if (typeof videoUploadUrl === 'string' && videoUploadUrl.length > 0) {
            const formData = new FormData();
            for (let i = 0; i < filesLen; i++) {
                formData.append('file-' + i, files[i]);
            }
            this.plugins.fileManager.upload.call(this, videoUploadUrl, this.options.videoUploadHeader, formData, this.plugins.video.callBack_videoUpload.bind(this, info), this.events.onVideoUploadError);
        } else {
            throw Error('[SUNEDITOR.videoUpload.fail] cause : There is no "videoUploadUrl" option.');
        }
    },

    callBack_videoUpload: function (info, xmlHttp) {
        if (typeof this.events.videoUploadHandler === 'function') {
            this.events.videoUploadHandler(xmlHttp, info);
        } else {
            const response = JSON.parse(xmlHttp.responseText);
            if (response.errorMessage) {
                this.plugins.video.error.call(this, response.errorMessage, response);
            } else {
                this.plugins.video.register.call(this, info, response);
            }
        }
    },

    register: function (info, response) {
        const fileList = response.result;
        const videoTag = this.plugins.video.createVideoTag.call(this);

        for (let i = 0, len = fileList.length, file; i < len; i++) {
            file = { name: fileList[i].name, size: fileList[i].size };
            this.plugins.video.create_video.call(this, (info.isUpdate ? info.element : videoTag.cloneNode(false)), fileList[i].url, info.inputWidth, info.inputHeight, info.align, file, info.isUpdate);
        }

        this.closeLoading();
    },

    setup_url: function (url) {
        try {
            const contextVideo = this.context.video;
            if (!url) url = contextVideo._linkValue;
            if (!url) return false;

            /** iframe source */
            if (/^<iframe.*\/iframe>$/.test(url)) {
                const oIframe = (new this._w.DOMParser()).parseFromString(url, 'text/html').querySelector('iframe');
                url = oIframe.src;
                if (url.length === 0) return false;
            }
            
            /** youtube */
            if (/youtu\.?be/.test(url)) {
                if (!/^http/.test(url)) url = 'https://' + url;
                url = url.replace('watch?v=', '');
                if (!/^\/\/.+\/embed\//.test(url)) {
                    url = url.replace(url.match(/\/\/.+\//)[0], '//www.youtube.com/embed/').replace('&', '?&');
                }

                if (contextVideo._youtubeQuery.length > 0) {
                    if (/\?/.test(url)) {
                        const splitUrl = url.split('?');
                        url = splitUrl[0] + '?' + contextVideo._youtubeQuery + '&' + splitUrl[1];
                    } else {
                        url += '?' + contextVideo._youtubeQuery;
                    }
                }
            } else if (/vimeo\.com/.test(url)) {
                if (url.endsWith('/')) {
                    url = url.slice(0, -1);
                }
                url = 'https://player.vimeo.com/video/' + url.slice(url.lastIndexOf('/') + 1);
            }

            this.plugins.video.create_video.call(this, this.plugins.video[(!/youtu\.?be/.test(url) && !/vimeo\.com/.test(url) ? "createVideoTag" : "createIframeTag")].call(this), url, contextVideo.inputX.value, contextVideo.inputY.value, contextVideo._align, null, this.context.modal.updateModal);
        } catch (error) {
            throw Error('[SUNEDITOR.video.upload.fail] cause : "' + error.message + '"');
        } finally {
            this.closeLoading();
        }
    },

    create_video: function (oFrame, src, width, height, align, file, isUpdate) {
        this.context.resizing._resize_plugin = 'video';
        const contextVideo = this.context.video;
        
        let cover = null;
        let container = null;
        let init = false;

        /** update */
        if (isUpdate) {
            oFrame = contextVideo._element;
            if (oFrame.src !== src) {
                init = true;
                const isYoutube = /youtu\.?be/.test(src);
                const isVimeo = /vimeo\.com/.test(src);
                if ((isYoutube || isVimeo) && !/^iframe$/i.test(oFrame.nodeName)) {
                    const newTag = this.plugins.video.createIframeTag.call(this);
                    newTag.src = src;
                    oFrame.parentNode.replaceChild(newTag, oFrame);
                    contextVideo._element = oFrame = newTag;
                } else if (!isYoutube && !isVimeo && !/^videoo$/i.test(oFrame.nodeName)) {
                    const newTag = this.plugins.video.createVideoTag.call(this);
                    newTag.src = src;
                    oFrame.parentNode.replaceChild(newTag, oFrame);
                    contextVideo._element = oFrame = newTag;
                } else {
                    oFrame.src = src;
                }
            }
            container = contextVideo._container;
            cover = this.util.getParentElement(oFrame, 'FIGURE');
        }
        /** create */
        else {
            init = true;
            oFrame.src = src;
            contextVideo._element = oFrame;
            const figure = Figure.CreateContainer(oFrame, 'se-video-container');
            cover = figure.cover;
            container = figure.container;
        }

        /** rendering */
        contextVideo._cover = cover;
        contextVideo._container = container;

        const size = this.plugins.resizing.getSize(oFrame);
        const inputUpdate = (size.w !== (width || contextVideo._defaultSizeX)) || (size.h !== (height || contextVideo._videoRatio));
        const changeSize = !isUpdate || inputUpdate;

        if (contextVideo._resizing) {
            this.context.video._proportionChecked = contextVideo.proportion.checked;
            oFrame.setAttribute('data-proportion', contextVideo._proportionChecked);
        }

        // size
        let isPercent = false;
        if (changeSize) {
            isPercent = this.plugins.video.applySize.call(this);
        }

        // align
        if (!(isPercent && align === 'center')) {
            this.plugins.video.setAlign.call(this, null, oFrame, cover, container);
        }

        let changed = true;
        if (!isUpdate) {
            changed = this.component.insert(container, false, false, !this.options.mediaAutoSelect);
            if (!this.options.mediaAutoSelect) {
                const line = this.format.addLine(container, null);
                if (line) this.setRange(line, 0, line, 0);
            }
        } else if (contextVideo._resizing && this.context.resizing._rotateVertical && changeSize) {
            this.plugins.resizing.setTransform.call(this, oFrame, null, null);
        }

        if (changed) {
            if (init) {
                this.plugins.fileManager.setInfo.call(oFrame, file);
            }
            if (isUpdate) {
                this.component.select(oFrame, 'video');
                // history stack
                this.history.push(false);
            }
        }

        this.context.resizing._resize_plugin = '';
    },

    _update_videoCover: function (oFrame) {
        if (!oFrame) return;

        const contextVideo = this.context.video;
        
        if (/^video$/i.test(oFrame.nodeName)) this.plugins.video._setTagAttrs.call(this, oFrame);
        else this.plugins.video._setIframeAttrs.call(this, oFrame);
        
        let existElement = (this.format.isBlock(oFrame.parentNode) || this.util.isWysiwygDiv(oFrame.parentNode)) ? 
            oFrame : this.format.getLine(oFrame) || oFrame;

        const prevFrame = oFrame;
        contextVideo._element = oFrame = oFrame.cloneNode(true);
        const figure = Figure.CreateContainer(oFrame, 'se-video-container');
        const cover = contextVideo._cover = figure.cover;
        const container = contextVideo._container = figure.container;

        try {
            const figcaption = existElement.querySelector('figcaption');
            let caption = null;
            if (!!figcaption) {
                caption = this.util.createElement('DIV');
                caption.innerHTML = figcaption.innerHTML;
                this.util.removeItem(figcaption);
            }

            // size
            const size = (oFrame.getAttribute('data-size') || oFrame.getAttribute('data-origin') || '').split(',');
            this.plugins.video.applySize.call(this, (size[0] || prevFrame.style.width || prevFrame.width || ''), (size[1] || prevFrame.style.height || prevFrame.height || ''));

            // align
            const format = this.format.getLine(prevFrame);
            if (format) contextVideo._align = format.style.textAlign || format.style.float;
            this.plugins.video.setAlign.call(this, null, oFrame, cover, container);

            if (this.util.isListCell(existElement)) {
                const refer = this.util.getParentElement(prevFrame, function (current) { return current.parentNode === existElement; });
                existElement.insertBefore(container, refer);
                this.util.removeItem(prevFrame);
                this.util.removeEmptyNode(refer, null);
            } else if (this.util.isFormatElement(existElement)) {
                const refer = this.util.getParentElement(prevFrame, function (current) { return current.parentNode === existElement; });
                existElement = this.util.splitElement(existElement, refer);
                existElement.parentNode.insertBefore(container, existElement);
                this.util.removeItem(prevFrame);
                this.util.removeEmptyNode(existElement, null);
                if (existElement.children.length === 0) existElement.innerHTML = this.util.removeWhiteSpace(existElement.innerHTML);
            } else {
                existElement.parentNode.replaceChild(container, existElement);
            }

            if (!!caption) existElement.parentNode.insertBefore(caption, container.nextElementSibling);
        } catch (error) {
            console.warn('[SUNEDITOR.video.error] Maybe the video tag is nested.', error);
        }

        this.plugins.fileManager.setInfo.call(oFrame, null);
        this.plugins.video.init.call(this);
    },

    /**
     * @Required @override fileManager, resizing
     */
    onModifyMode: function (element, size) {
        const contextVideo = this.context.video;
        contextVideo._element = element;
        const figure = Figure.GetContainer(element);
        contextVideo._cover = figure.cover;
        contextVideo._container = figure.container;
        contextVideo._align = element.style.float || element.getAttribute('data-align') || 'none';
        element.style.float = '';

        if (size) {
            contextVideo._element_w = size.w;
            contextVideo._element_h = size.h;
            contextVideo._element_t = size.t;
            contextVideo._element_l = size.l;
        }

        let origin = contextVideo._element.getAttribute('data-size') || contextVideo._element.getAttribute('data-origin');
        let w, h;
        if (origin) {
            origin = origin.split(',');
            w = origin[0];
            h = origin[1];
        } else if (size) {
            w = size.w;
            h = size.h;
        }

        contextVideo._origin_w = w || element.style.width || element.width || '';
        contextVideo._origin_h = h || element.style.height || element.height || '';
    },

    /**
     * @Required @override fileManager, resizing
     */
    openModify: function (notOpen) {
        const contextVideo = this.context.video;

        if (contextVideo.videoUrlFile) contextVideo._linkValue = contextVideo.preview.textContent = contextVideo.videoUrlFile.value = (contextVideo._element.src || (contextVideo._element.querySelector('source') || '').src || '');
        (contextVideo.modal.querySelector('input[name="suneditor_video_radio"][value="' + contextVideo._align + '"]') || contextVideo.modal.querySelector('input[name="suneditor_video_radio"][value="none"]')).checked = true;

        if (contextVideo._resizing) {
            this.plugins.resizing._module_setModifyInputSize.call(this, contextVideo, this.plugins.video);
            
            const y = contextVideo._videoRatio = this.plugins.resizing.getsize(this._element);
            const ratioSelected = this.plugins.video.setVideoRatioSelect.call(this, y);
            if (!ratioSelected) contextVideo.inputY.value = contextVideo._onlyPercentage ? this.util.getNumber(y, 2) : y;
        }

        if (!notOpen) this.plugins.modal.open.call(this, 'video', true);
    },
    
    setVideoRatioSelect: function (value) {
        let ratioSelected = false;
        const contextVideo = this.context.video;
        const ratioOptions = contextVideo.videoRatioOption.options;

        if (/%$/.test(value) || contextVideo._onlyPercentage) value = (this.util.getNumber(value, 2) / 100) + '';
        else if (!this.util.isNumber(value) || (value * 1) >= 1) value = '';

        contextVideo.inputY.placeholder = '';
        for (let i = 0, len = ratioOptions.length; i < len; i++) {
            if (ratioOptions[i].value === value) {
                ratioSelected = ratioOptions[i].selected = true;
                contextVideo.inputY.placeholder = !value ? '' : (value * 100) + '%';
            }
            else ratioOptions[i].selected = false;
        }

        return ratioSelected;
    },

    /**
     * @override fileManager
     */
    checkFileInfo: function () {
        this.plugins.fileManager.checkInfo.call(this, 'video', ['iframe', 'video'], this.events.onVideoUpload, this.plugins.video._update_videoCover.bind(this), true);
    },

    /**
     * @override fileManager
     */
    resetFileInfo: function () {
        this.plugins.fileManager.resetInfo.call(this, 'video', this.events.onVideoUpload);
    },

    /**
     * @override fileManager
     */
    applySize: function (w, h) {
        const contextVideo = this.context.video;

        if (!w) w = contextVideo.inputX.value || this.options.videoWidth;
        if (!h) h = contextVideo.inputY.value || this.options.videoHeight;
        
        if (contextVideo._onlyPercentage || /%$/.test(w) || !w) {
            this.plugins.video.setPercent.call(this, (w || '100%'), (h || (/%$/.test(contextVideo._videoRatio) ? contextVideo._videoRatio : contextVideo._defaultRatio)));
            return true;
        } else if ((!w || w === 'auto') && (!h || h === 'auto')) {
            this.plugins.video.setAutoSize.call(this);
        } else {
            this.plugins.video.setSize.call(this, w, (h || contextVideo._videoRatio || contextVideo._defaultRatio), false);
        }

        return false;
    },

    /**
     * @override resizing
     */
    sizeRevert: function () {
        this.plugins.resizing._module_sizeRevert.call(this, this.context.video);
    },

    /**
     * @override resizing
     */
    setSize: function (w, h, notResetPercentage, direction) {
        const contextVideo = this.context.video;
        const onlyW = /^(rw|lw)$/.test(direction);
        const onlyH = /^(th|bh)$/.test(direction);

        if (!onlyH) w = this.util.getNumber(w, 0);
        if (!onlyW) h = this.util.isNumber(h) ? h + contextVideo.sizeUnit : !h ? '' : h;
        w = w ? w + contextVideo.sizeUnit : '';

        if (!onlyH) contextVideo._element.style.width = w;
        if (!onlyW) contextVideo._cover.style.paddingBottom = contextVideo._cover.style.height = h;

        if (!onlyH && !/%$/.test(w)) {
            contextVideo._cover.style.width = w;
            contextVideo._container.style.width = '';
        }

        if (!onlyW && !/%$/.test(h)) {
            contextVideo._element.style.height = h;
        } else {
            contextVideo._element.style.height = '';
        }

        if (!notResetPercentage) contextVideo._element.removeAttribute('data-percentage');

        // save current size
        this.plugins.resizing._module_saveCurrentSize.call(this, contextVideo);
    },

    /**
     * @override resizing
     */
    setAutoSize: function () {
        this.plugins.video.setPercent.call(this, 100, this.context.video._defaultRatio);
    },

    /**
     * @override resizing
     */
    setOriginSize: function (dataSize) {
        const contextVideo = this.context.video;
        contextVideo._element.removeAttribute('data-percentage');

        this.plugins.resizing.deleteTransform.call(this, contextVideo._element);
        this.plugins.video.deletePercent.call(this);

        const originSize = ((dataSize ? contextVideo._element.getAttribute('data-size') : '') || contextVideo._element.getAttribute('data-origin') || '').split(',');
        
        if (originSize) {
            const w = originSize[0];
            const h = originSize[1];

            if (contextVideo._onlyPercentage || (/%$/.test(w) && (/%$/.test(h) || !/\d/.test(h)))) {
                this.plugins.video.setPercent.call(this, w, h);
            } else {
                this.plugins.video.setSize.call(this, w, h);
            }

            // save current size
            this.plugins.resizing._module_saveCurrentSize.call(this, contextVideo);
        }
    },

    /**
     * @override resizing
     */
    setPercent: function (w, h) {
        const contextVideo = this.context.video;
        h = !!h && !/%$/.test(h) && !this.util.getNumber(h, 0) ? this.util.isNumber(h) ? h + '%' : h : this.util.isNumber(h) ? h + contextVideo.sizeUnit : (h || contextVideo._defaultRatio);

        contextVideo._container.style.width = this.util.isNumber(w) ? w + '%' : w;
        contextVideo._container.style.height = '';
        contextVideo._cover.style.width = '100%';
        contextVideo._cover.style.height = h;
        contextVideo._cover.style.paddingBottom = h;
        contextVideo._element.style.width = '100%';
        contextVideo._element.style.height = '100%';
        contextVideo._element.style.maxWidth = '';

        if (contextVideo._align === 'center') this.plugins.video.setAlign.call(this, null, null, null, null);
        contextVideo._element.setAttribute('data-percentage', w + ',' + h);

        // save current size
        this.plugins.resizing._module_saveCurrentSize.call(this, contextVideo);
    },

    /**
     * @override resizing
     */
    deletePercent: function () {
        const contextVideo = this.context.video;
        
        contextVideo._cover.style.width = '';
        contextVideo._cover.style.height = '';
        contextVideo._cover.style.paddingBottom = '';
        contextVideo._container.style.width = '';
        contextVideo._container.style.height = '';

        this.util.removeClass(contextVideo._container, this.context.video._floatClassRegExp);
        this.util.addClass(contextVideo._container, '__se__float-' + contextVideo._align);

        if (contextVideo._align === 'center') this.plugins.video.setAlign.call(this, null, null, null, null);
    },

    /**
     * @override resizing
     */
    setAlign: function (align, element, cover, container) {
        const contextVideo = this.context.video;
        
        if (!align) align = contextVideo._align;
        if (!element) element = contextVideo._element;
        if (!cover) cover = contextVideo._cover;
        if (!container) container = contextVideo._container;

        if (align && align !== 'none') {
            cover.style.margin = 'auto';
        } else {
            cover.style.margin = '0';
        }

        if (/%$/.test(element.style.width) && align === 'center') {
            container.style.minWidth = '100%';
            cover.style.width = container.style.width;
            cover.style.height = cover.style.height;
            cover.style.paddingBottom = !/%$/.test(cover.style.height) ? cover.style.height : this.util.getNumber((this.util.getNumber(cover.style.height, 2) / 100) * this.util.getNumber(cover.style.width, 2), 2) + '%';
        } else {
            container.style.minWidth = '';
            cover.style.width = this.context.resizing._rotateVertical ? (element.style.height || element.offsetHeight) : (element.style.width || '100%');
            cover.style.paddingBottom = cover.style.height;
        }

        if (!this.util.hasClass(container, '__se__float-' + align)) {
            this.util.removeClass(container, contextVideo._floatClassRegExp);
            this.util.addClass(container, '__se__float-' + align);
        }
        
        element.setAttribute('data-align', align);
    },

    /**
     * @override modal
     */
    init: function () {
        const contextVideo = this.context.video;
        if (contextVideo.videoInputFile) contextVideo.videoInputFile.value = '';
        if (contextVideo.videoUrlFile) contextVideo._linkValue = contextVideo.preview.textContent = contextVideo.videoUrlFile.value = '';
        if (contextVideo.videoInputFile && contextVideo.videoUrlFile) {
            contextVideo.videoUrlFile.removeAttribute('disabled');
            contextVideo.preview.style.textDecoration = '';
        }

        contextVideo._origin_w = this.options.videoWidth;
        contextVideo._origin_h = this.options.videoHeight;
        contextVideo.modal.querySelector('input[name="suneditor_video_radio"][value="none"]').checked = true;
        
        if (contextVideo._resizing) {
            contextVideo.inputX.value = this.options.videoWidth === contextVideo._defaultSizeX ? '' : this.options.videoWidth;
            contextVideo.inputY.value = this.options.videoHeight === contextVideo._defaultSizeY ? '' : this.options.videoHeight;
            contextVideo.proportion.checked = true;
            contextVideo.proportion.disabled = true;
            this.plugins.video.setVideoRatioSelect.call(this, contextVideo._defaultRatio);
        }
    }
};