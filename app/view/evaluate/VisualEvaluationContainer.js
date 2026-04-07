/**
 * Container holding the Visual Evaluation Form logic in Modern Toolkit.
 */
Ext.define('CasMobile.view.evaluate.VisualEvaluationContainer', {
    extend: 'Ext.Container',
    xtype: 'visualevaluationcontainer',

    requires: [
        'Ext.field.Display',
        'Ext.form.Panel',
        'Ext.field.ComboBox',
        'Ext.field.Hidden',
        'CasMobile.view.evaluate.VisualEvaluationField',
        'CasMobile.view.evaluate.VisualEvaluationContainerController',
        'CasMobile.util.Localization'
    ],

    // Modern Ext pattern uses "controller"
    // If you have 'CasMobile.view.evaluate.VisualEvaluationContainerController', 
    // it usually maps to 'controller.visualevaluationcontainer' logic internally based on its alias.
    controller: 'visualevaluationcontainer',
    viewModel: {
        data: {}
    },
    layout: {
        type: 'vbox'
    },

    config: {
        evaluationValues: null,
        doSubmit: true
    },

    initialize: function () {
        const me = this;
        // In mobile, we check siteInfo or global for manufacturer
        const manufacturer = window.siteInfo ? window.siteInfo.customer : 'hyundai';
        const visualItems = me._buildVisualItems(manufacturer);

        me.setItems([
            {
                xtype: 'component',
                itemId: 'roundInfo',
                html: 'Apply Evaluation Result', // Fallback
                height: 40,
                style: 'font-weight: bold; background: #eee; padding: 10px; border-bottom: 1px solid #ccc;'
            },
            {
                xtype: 'container',
                itemId: 'imageList',
                layout: {
                    type: 'hbox',
                    align: 'center'
                },
                padding: '10',
                items: [
                    { // UPLOAD IMAGE
                        xtype: 'button',
                        disabled: true,
                        itemId: 'btnUploadImage',
                        text: 'UPLOAD IMAGE',
                        ui: 'action',
                        margin: '0 10 0 0',
                        handler: 'onUploadBtnTap'
                    },
                    {
                        xtype: 'container',
                        itemId: 'thumbContainer',
                        layout: {
                            type: 'hbox'
                        },
                        flex: 1,
                        scrollable: 'x'
                    }
                ]
            },
            {
                xtype: 'formpanel',
                itemId: 'visualForm',
                flex: 1,
                scrollable: true,
                padding: 10,
                disabled: true,
                items: [
                    {
                        xtype: 'container',
                        layout: 'hbox',
                        defaults: {
                            xtype: 'combobox',
                            labelAlign: 'top',
                            flex: 1
                        },
                        items: [
                            {
                                label: 'STATUS',
                                name: 'resultVisual',
                                options: ['PASS', 'CLOSE', 'FAIL', 'NOT'],
                                bind: {
                                    value: '{resultVisual}'
                                }
                            },
                            {
                                label: 'TYPE',
                                margin: '0 0 0 8',
                                name: 'type',
                                options: ['A', 'B', 'C', 'NONE'],
                                bind: {
                                    value: '{type}'
                                }
                            }
                        ]
                    },
                    ...visualItems,
                    {
                        xtype: 'textareafield',
                        itemId: 'fldRemark',
                        label: 'Remarks',
                        labelAlign: 'top',
                        name: 'remarksVisual',
                        bind: {
                            value: '{remarksVisual}'
                        },
                        maxRows: 5
                    },
                    {
                        xtype: 'hiddenfield',
                        itemId: 'evaluationImage',
                        name: 'img'
                    },
                    {
                        xtype: 'container',
                        itemId: 'remarkEntryCon',
                        layout: 'vbox',
                        defaults: {
                            margin: '5 0 0 0'
                        }
                    }
                ]
            },
            {
                xtype: 'container',
                docked: 'bottom',
                layout: {
                    type: 'hbox',
                    pack: 'center'
                },
                padding: 10,
                items: [
                    { // 저장
                        xtype: 'button',
                        itemId: 'btnSaveResult',
                        text: 'Save', // Fallback
                        ui: 'action',
                        width: 120,
                        disabled: true,
                        handler: 'resultSaveHandler'
                    },
                    {//  리셋
                        xtype: 'button',
                        itemId: 'btnResetResult',
                        text: 'Reset', // Fallback
                        ui: 'back',
                        margin: '0 0 0 10',
                        width: 120,
                        handler: function (btn) {
                            const container = btn.up('visualevaluationcontainer');
                            const form = container.down('formpanel');
                            const fldEvaluationImage = container.down('#evaluationImage');
                            const imgValue = fldEvaluationImage.getValue();
                            form.reset();
                            fldEvaluationImage.setValue(imgValue);
                        }
                    }
                ]
            }
        ]);

        me.callParent(arguments);

        const L = CasMobile.util.Localization;
        const roundInfo = me.down('#roundInfo');
        if (roundInfo) roundInfo.setHtml(L.get('applyEvaluationResult'));

        const btnSave = me.down('#btnSaveResult');
        if (btnSave) btnSave.setText(L.get('menu.save'));

        const btnReset = me.down('#btnResetResult');
        if (btnReset) btnReset.setText(L.get('main.reset'));
    },

    _buildVisualItems: function (manufacturer) {
        if (BRAND === 'kia') {
            return [
                {
                    xtype: 'container',
                    layout: 'hbox',
                    margin: '10 0',
                    defaults: {
                        xtype: 'combobox',
                        labelAlign: 'top',
                        flex: 1
                    },
                    items: [
                        {
                            label: 'DL',
                            options: ['L+', 'L-', 'D+', 'D-'],
                            name: 'dlVisual1',
                            itemId: 'dlVisual1',
                            bind: { value: '{dlVisual1}' },
                            listeners: { select: 'onComboSelect' }
                        },
                        {
                            label: 'Da',
                            options: ['R+', 'R-', 'G+', 'G-'],
                            name: 'daVisual1',
                            itemId: 'daVisual1',
                            bind: { value: '{daVisual1}' },
                            listeners: { select: 'onComboSelect' }
                        },
                        {
                            label: 'Db',
                            options: ['B+', 'B-', 'Y+', 'Y-'],
                            name: 'dbVisual1',
                            itemId: 'dbVisual1',
                            bind: { value: '{dbVisual1}' },
                            listeners: { select: 'onComboSelect' }
                        }
                    ]
                }
            ];
        } else {
            return [
                {
                    xtype: 'container',
                    layout: 'hbox',
                    margin: '10 0 0 0',
                    defaults: {
                        xtype: 'combobox',
                        labelAlign: 'top',
                        flex: 1
                    },
                    items: [
                        {
                            label: 'DL',
                            options: ['L', 'D'],
                            name: 'dlVisual1',
                            itemId: 'dlVisual1',
                            bind: { value: '{dlVisual1}' },
                            listeners: { select: 'onComboSelect' }
                        },
                        {
                            label: 'Da',
                            options: ['R', 'G'],
                            name: 'daVisual1',
                            itemId: 'daVisual1',
                            bind: { value: '{daVisual1}' },
                            listeners: { select: 'onComboSelect' }
                        },
                        {
                            label: 'Db',
                            options: ['B', 'Y'],
                            name: 'dbVisual1',
                            itemId: 'dbVisual1',
                            bind: { value: '{dbVisual1}' },
                            listeners: { select: 'onComboSelect' }
                        }
                    ]
                },
                {
                    xtype: 'component',
                    margin: '10 0',
                    html: '<div style="text-align: center;"><i class="fas fa-arrow-down"></i></div>'
                },
                {
                    xtype: 'container',
                    layout: 'hbox',
                    margin: '0 0 10 0',
                    defaults: {
                        xtype: 'combobox',
                        labelAlign: 'top',
                        flex: 1
                    },
                    items: [
                        {
                            label: 'DL',
                            options: ['L', 'D'],
                            name: 'dlVisual2',
                            itemId: 'dlVisual2',
                            bind: { value: '{dlVisual2}' },
                            listeners: { select: 'onComboSelect' }
                        },
                        {
                            label: 'Da',
                            options: ['R', 'G'],
                            name: 'daVisual2',
                            itemId: 'daVisual2',
                            bind: { value: '{daVisual2}' },
                            listeners: { select: 'onComboSelect' }
                        },
                        {
                            label: 'Db',
                            options: ['B', 'Y'],
                            name: 'dbVisual2',
                            itemId: 'dbVisual2',
                            bind: { value: '{dbVisual2}' },
                            listeners: { select: 'onComboSelect' }
                        }
                    ]
                }
            ];
        }
    },

    setEvaluationValues: function (record) {
        const roundJson = record.get('roundJson');
        const form = this.down('formpanel');
        form.setRecord(record);
        // Title 생성
        let roundInfo = `<div style="font-weight: bold; font-size: 16px;">${record.get('modelName')} / ${record.get('partName')} / R${record.get('round')}</div>`;
        this.down('#roundInfo').setHtml(roundInfo);

        const thumbContainer = this.down('#thumbContainer');
        thumbContainer.removeAll();
        if (roundJson.img) {
            const imageArray = roundJson.img.split(',');
            imageArray.forEach(item => {
                this.getController().addImageThumbnail(thumbContainer, item);
            });
        }
        //
        form.setValues(roundJson);
        form.setDisabled(false);
        this.down('#btnUploadImage').setDisabled(false);
        this.down('#btnSaveResult').setDisabled(false);
    }
});
