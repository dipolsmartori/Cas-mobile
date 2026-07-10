/**
 * 시각 평가(Visual Evaluation) 화면의 동작을 관리하는 컨트롤러입니다.
 * 평가 값 초기화, 비고(Remarks) 조회/저장, 비고 항목 UI 렌더링 및 선택 이벤트를 처리합니다.
 */
Ext.define('CasMobile.view.evaluate.VisualEvaluationContainerController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.visualevaluationcontainer',

    init: async function () {
        const view = this.getView();
        this.remarkEntries = []; // 방어적 초기화

        if (view.getEvaluationValues()) {
            view.setEvaluationValues(view.getEvaluationValues());
        }

        // 서버에서 비고(Remarks) 항목들을 가져와서 목록 구성
        try {
            const remarkSource = await this._getRemarkEntries();
            if (remarkSource && remarkSource.binderView) {
                let remarkStrings = remarkSource.binderView.bd_content;
                if (!remarkStrings || remarkStrings === '') {
                    remarkStrings = '[]';
                }
                this.remarkEntries = JSON.parse(remarkStrings);
                this._setRemarkEntries(this.remarkEntries);
            }
        } catch (err) {
            console.error('Failed to load remark entries', err);
        }
    },

    /**
     * 🆙🆙🆙 서버에서 비고(Remarks) 목록 데이터를 조회 (표준 JSON 반환)
     */
    _getRemarkEntries: function () {
        return new Promise((resolve, reject) => {
            Ext.Ajax.request({
                url: CasMobile.APIs.getFullUrl(CasMobile.APIs.VIEW),
                params: {
                    ca_id: '01',
                    bd_idx: window.siteInfo.remarks
                },
                success: (response) => {
                    try {
                        const data = JSON.parse(response.responseText);
                        resolve(data);
                    } catch (e) {
                        reject(e);
                    }
                },
                failure: (response) => reject(response)
            });
        });
    },

    /**
     * 🆙🆙🆙 비고 항목 데이터를 서버에 저장
     * UPDATE_DATA API는 JSONP 형태(null({...}))와 HTML <pre> 태그가 포함된 특수 포맷을 반환함
     */
    _saveRemarkEntries: function (value) {
        return new Promise((resolve, reject) => {
            Ext.Ajax.request({
                url: CasMobile.APIs.getFullUrl(CasMobile.APIs.UPDATE_DATA),
                method: 'POST',
                params: {
                    ca_id: '01',
                    bd_idx: window.siteInfo.remarks,
                    data_name: 'bd_content',
                    data_val: value
                },
                success: (response) => {
                    try {
                        let text = response.responseText.trim();
                        // 서버에서 반환되는 'null('과 ')'로 감싸진 JSONP 래퍼를 강제로 제거
                        if (text.startsWith('null(') && text.endsWith(')')) {
                            text = text.substring(5, text.length - 1);
                        }

                        // JSON 데이터 내의 문자열 값에 포함된 실제 줄바꿈 문자를 이스케이프 처리하여 파싱 에러 방지
                        text = text.replace(/\n/g, '\\n').replace(/\r/g, '\\r');

                        const data = Ext.decode(text, true);
                        if (!data) {
                            throw new Error('Failed to decode response: ' + text);
                        }

                        // html 필드 내의 <pre> 태그에서 실제 데이터를 파싱하여 remarks 프로퍼티에 할당
                        if (data.html) {
                            const match = data.html.match(/<pre>([\s\S]*)<\/pre>/);
                            if (match) data.remarks = Ext.decode(match[1], true);
                        }
                        resolve(data);
                    } catch (e) {
                        reject(e);
                    }
                },
                failure: (response) => reject(response)
            });
        });
    },

    _setRemarkEntries: function (entries) {
        const me = this;
        const remarkEntryCon = me.getView().down('#remarkEntryCon');
        if (!remarkEntryCon) return;

        remarkEntryCon.removeAll();
        entries.forEach(entry => {
            const unit = me._getRemarkUnit(entry);
            unit.listeners = {
                tap: {
                    element: 'element',
                    fn: () => me._onRemarkUnitTap(entry.et)
                }
            };
            remarkEntryCon.add(unit);
        });
    },

    _getRemarkUnit: function (entry) {
        return {
            xtype: 'component',
            html: entry.et,
            margin: '5 0',
            padding: 10,
            style: 'border: 1px solid #ddd; border-radius: 4px; background: #fff; font-size: 14px; cursor: pointer;'
        };
    },

    _onRemarkUnitTap: function (text) {
        const fldRemark = this.getView().down('#fldRemark');
        const preVal = fldRemark.getValue();
        let val = text;
        if (preVal) {
            val = `${preVal}\n${text}`;
        }
        fldRemark.setValue(val);
    },

    onUpdateRemarkEntries: function () {
        const me = this;

        const remarkListItems = me.remarkEntries.map((entry, index) => {
            return {
                xtype: 'container',
                layout: 'hbox',
                padding: '5 10',
                margin: '5 0',
                style: 'border: 1px solid #eee; border-radius: 8px; background: #f9f9f9;',
                items: [
                    {
                        xtype: 'component',
                        flex: 1,
                        html: entry.et,
                        style: 'font-size: 14px; color: #333; display: flex; align-items: center;'
                    },
                    {
                        xtype: 'button',
                        iconCls: 'x-fa fa-trash',
                        ui: 'decline',
                        handler: () => me._onRemoveRemarkEntry(index, dialog)
                    }
                ]
            };
        });

        const dialog = Ext.create('Ext.Dialog', {
            title: loc.main.manageRemarks || 'Manage Remarks',
            width: 600,
            maxWidth: '80%',
            maxHeight: '80%',
            closable: true,
            layout: 'vbox',
            scrollable: true,
            padding: 15,
            items: [
                {
                    xtype: 'container',
                    itemId: 'remarkListCon',
                    items: remarkListItems
                },
                {
                    xtype: 'textareafield',
                    itemId: 'newRemarkFld',
                    label: loc.main.newRemark || 'New Remark',
                    placeholder: loc.main.remarkPlaceholder || 'Enter new predefined remark...',
                    margin: '20 0 0 0'
                }
            ],
            buttons: [
                {
                    text: loc.main.add || 'Add',
                    ui: 'action',
                    handler: async () => {
                        const fld = dialog.down('#newRemarkFld');
                        const val = fld.getValue();
                        if (val) {
                            me.remarkEntries.push({ et: val });
                            await me._saveRemarkEntries(JSON.stringify(me.remarkEntries));
                            fld.setValue('');
                            dialog.destroy();
                            me._setRemarkEntries(me.remarkEntries);
                            me.onUpdateRemarkEntries(); // Refresh list and reopen dialog
                        }
                    }
                },
                {
                    text: loc.main.close || 'Close',
                    handler: () => dialog.destroy()
                }
            ]
        });
        dialog.show();
    },
    /**
     * Remark entr 삭제
     * @param {*} index 
     * @param {*} dialog 
     */
    _onRemoveRemarkEntry: function (index, dialog) {
        const me = this;

        Ext.Msg.confirm(
            loc.main.warning || 'Warning',
            loc.main.confirmDelete || 'Are you sure you want to delete this remark?',
            async (choice) => {
                if (choice === 'yes') {
                    me.remarkEntries.splice(index, 1);
                    await me._saveRemarkEntries(JSON.stringify(me.remarkEntries));
                    if (dialog) dialog.destroy();
                    me._setRemarkEntries(me.remarkEntries);
                    me.onUpdateRemarkEntries(); // Refresh list and reopen dialog
                }
            }
        );
    },

    onComboSelect: function (combo) {
        const value = combo.getValue();
        const itemId = combo.getItemId();
        if (!itemId) return;

        const index = itemId.charAt(itemId.length - 1);
        const tgIdx = (index === '1') ? '2' : '1';
        const tgFld = combo.up('formpanel').down('#' + itemId.replace(index, '') + tgIdx);

        if (!tgFld) return;

        let newValue;
        if (value === 'D') newValue = 'L';
        else if (value === 'L') newValue = 'D';
        else if (value === 'R') newValue = 'G';
        else if (value === 'G') newValue = 'R';
        else if (value === 'B') newValue = 'Y';
        else if (value === 'Y') newValue = 'B';

        if (newValue) {
            tgFld.setValue(newValue);
        }
    },

    resultSaveHandler: async function () {
        const view = this.getView();
        const form = view.down('formpanel');
        const values = form.getValues();

        if (values.resultVisual === 'NOT') {
            values.resultVisual = '';
        }

        // 모두 저장을 클릭했을 때
        if (view.getDoSubmit() === false) {
            view.fireEvent('saveevaluationresult', values);
            return;
        }


        const sourceRec = form.getRecord();
        if (!sourceRec) return;

        const roundJson = sourceRec.get('roundJson') || [{}];
        // roundJson 업데이트
        for (let key in values) {
            roundJson[key] = values[key];
        }
        view.fireEvent(CasMobile.Events.SAVE_EVALUATION_RESULT, view, sourceRec, roundJson);
    },

    onUploadBtnTap: function (btn) {
        const me = this;
        const L = CasMobile.util.Localization;
        if (!me.uploadMenu) {
            me.uploadMenu = Ext.create('Ext.ActionSheet', {
                items: [
                    {
                        text: L.get('takePhoto') || 'Take Photo',
                        iconCls: 'x-fa fa-camera',
                        handler: function () {
                            me.uploadMenu.hide();
                            me.triggerFileUpload(true);
                        }
                    },
                    {
                        text: L.get('chooseFromGallery') || 'Choose from Gallery',
                        iconCls: 'x-fa fa-images',
                        handler: function () {
                            me.uploadMenu.hide();
                            me.triggerFileUpload(false);
                        }
                    },
                    {
                        text: L.get('cancel') || 'Cancel',
                        ui: 'decline',
                        handler: function () {
                            me.uploadMenu.hide();
                        }
                    }
                ]
            });
            Ext.Viewport.add(me.uploadMenu);
        }
        me.uploadMenu.show();
    },

    triggerFileUpload: function (isCamera) {
        if (!this.fileInput) {
            this.fileInput = document.createElement('input');
            this.fileInput.type = 'file';
            this.fileInput.style.display = 'none';
            this.fileInput.multiple = false;
            this.fileInput.accept = 'image/*';
            this.fileInput.addEventListener('change', this.handleFileUpload.bind(this));
            document.body.appendChild(this.fileInput);
        }

        if (isCamera) {
            this.fileInput.setAttribute('capture', 'camera');
        } else {
            this.fileInput.removeAttribute('capture');
        }

        this.fileInput.click();
    },
    /**
     * 🆙🆙🆙 평가 이미지 업로드
     * @param e
     * @return {Promise<void>}
     */
    handleFileUpload: async function (e) {
        const container = this.getView();
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        formData.append('ca_id', siteInfo.attachedImagesCategory);
        formData.append('file_0', files[0], files[0].name);
        formData.append('group', 0);

        try {
            let upResult = await CasMobile.util.ActorUtil.addUpdate1(formData, container);
            upResult = JSON.parse(upResult);
            const thumbContainer = container.down('#thumbContainer');
            const hiddenField = container.down('#evaluationImage');

            const imageUrl = `${location.origin}/thumb/${upResult.bd_idx[0]}/0`;
            let currentVal = hiddenField.getValue();
            hiddenField.setValue(currentVal ? currentVal + ',' + imageUrl : imageUrl);
            const form = container.down('formpanel');
            const record = form.getRecord();
            let roundJson = record.get('roundJson') || [{}];
            if (!Array.isArray(roundJson)) {
                roundJson = [roundJson];
            }
            if (roundJson[0].img) {
                roundJson[0].img += `,${upResult.bd_idx[0]}/0`;
            }
            else {
                roundJson[0].img = `${upResult.bd_idx[0]}/0`;
            }
            record.set('roundJson', JSON.stringify(roundJson));

            this.addImageThumbnail(thumbContainer, imageUrl);
            const roundCode = `round${roundJson[0].round}`;
            // 🆙🆙🆙 roound 필드에 이미지 링크 저장
            await new Promise((resolve, reject) => {
                Ext.Ajax.request({
                    url: CasMobile.APIs.getFullUrl(CasMobile.APIs.UPDATE_DATA),
                    method: 'POST',
                    params: {
                        bd_idx: record.get('bd_idx'),
                        [roundCode]: JSON.stringify(roundJson)
                    }
                });
            });
        } catch (err) {
            console.error('Upload failed', err);
        }
        e.target.value = '';
    },

    addImageThumbnail: function (thumbnailContainer, imageUrl) {
        if (!imageUrl.includes('/thumb/')) {
            imageUrl = `/thumb/${imageUrl}`;
        }
        thumbnailContainer.add({
            xtype: 'component',
            width: 48,
            height: 32,
            margin: '0 5',
            style: {
                backgroundImage: `url('${imageUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                border: '1px solid #ddd',
                cursor: 'pointer'
            },
            listeners: {
                tap: {
                    element: 'element',
                    fn: function () {
                        const fullSizeUrl = imageUrl.replace('/thumb/', '/file/');

                        // Create and show a premium image viewer dialog
                        const viewer = Ext.create('Ext.Dialog', {
                            title: 'Evaluation Image',
                            closable: true,
                            modal: true,
                            width: '90%',
                            height: '80%',
                            layout: 'fit',
                            hideOnMaskTap: true,
                            showAnimation: {
                                type: 'pop',
                                duration: 250,
                                easing: 'ease-out'
                            },
                            items: [{
                                xtype: 'image',
                                src: fullSizeUrl,
                                style: {
                                    backgroundColor: '#000',
                                    backgroundSize: 'contain',
                                    backgroundRepeat: 'no-repeat'
                                },
                                listeners: {
                                    tap: function () {
                                        viewer.close();
                                    }
                                }
                            }]
                        });
                        viewer.show();
                    }
                }
            }
        });
    }
});
