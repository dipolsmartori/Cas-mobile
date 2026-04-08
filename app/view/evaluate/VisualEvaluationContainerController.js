/**
 * Controller for VisualEvaluationContainer functionality
 */
Ext.define('CasMobile.view.evaluate.VisualEvaluationContainerController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.visualevaluationcontainer',

    init: async function () {
        const view = this.getView();
        if (view.getEvaluationValues()) {
            view.setEvaluationValues(view.getEvaluationValues());
        }
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
