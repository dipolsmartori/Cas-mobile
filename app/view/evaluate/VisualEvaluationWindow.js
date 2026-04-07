/**
 * Converted from Classic Ext.window.Window to Modern Ext.Dialog.
 */
Ext.define('CasMobile.view.evaluate.VisualEvaluationWindow', {
    extend: 'Ext.Dialog',
    xtype: 'visualevaluationwindow',

    requires: [
        'Ext.grid.Grid',
        'CasMobile.view.evaluate.VisualEvaluationWindowController',
        'CasMobile.view.evaluate.VisualEvaluationContainer',
        'CasMobile.util.Localization'
    ],

    controller: 'visualevaluationwindowcontroller',

    config: {
        maxRound: 1
    },

    title: 'Visual Evaluation', // Fallback, updated in initialize
    closable: true,
    closeAction: 'destroy',
    preventRefocus: true,

    header: {
        items: [
            {
                xtype: 'button',
                text: 'Minimize',
                iconCls: 'x-fa fa-chevron-down',
                ui: 'round',
                handler: 'onMinimize',
                margin: '0 5'
            }
        ]
    },

    // Modern toolkit uses width/height strings or numbers
    width: '95%',
    height: '95%',

    layout: 'vbox',

    // bodyPadding in Classic is applied via padding in Modern
    padding: 10,

    items: [
        {
            xtype: 'toolbar',
            docked: 'top',
            items: [
                {
                    xtype: 'button',
                    iconCls: 'x-fa fa-qrcode',
                    text: 'QR CODE',
                    ui: 'action',
                    itemId: 'btnQrCode',
                    listeners: {
                        painted: 'onQrButtonPainted'
                    }
                }
            ]
        },
        {
            xtype: 'component',
            itemId: 'explLabel',
            html: 'Select items to evaluate.', // Fallback, updated in initialize
            padding: '10 15',
            style: 'background: #f8f9fa; font-size: 13px; color: #666; border-radius: 4px; margin-bottom: 10px;'
        },
        {
            xtype: 'container',
            flex: 1,
            layout: 'hbox',
            items: [
                {
                    xtype: 'grid',
                    itemId: 'evaluationGrid',
                    flex: 1.4,
                    style: 'border: 1px solid #eee; border-radius: 8px; overflow: hidden;',
                    selectable: false,
                    scrollable: {
                        direction: 'both',
                        directionLock: true
                    },
                    columns: [
                        {
                            xtype: 'checkcolumn',
                            dataIndex: 'checked',
                            headerCheckbox: true,
                            width: 70,
                            menuDisabled: true
                        },
                        {
                            dataIndex: 'modelName',
                            text: 'MODEL',
                            width: 110,
                            fixed: true,
                        },
                        {
                            dataIndex: 'round',
                            text: 'ROUND',
                            align: 'center',
                            width: 80,
                        },
                        {
                            dataIndex: 'partName',
                            text: 'PART',
                            flex: 1,
                        },
                        { // row 삭제 버튼
                            width: 60,
                            align: 'center',
                            dataIndex: 'bd_idx', // Just to have something
                            cell: {
                                encodeHtml: false
                            },
                            renderer: function () {
                                // controller onGridChildTap에서 작동
                                return '<i class="x-fa fa-trash-alt remove-item-icon" style="color: #666; cursor: pointer;"></i>';
                            }
                        }
                    ],
                    listeners: {
                        childtap: 'onGridChildTap'
                    }
                },
                { // 평가결과 입력 패널
                    xtype: 'visualevaluationcontainer',
                    itemId: 'evaluationContainer',
                    flex: 1,
                    margin: '0 0 0 15',
                    style: 'border: 1px solid #eee; border-radius: 8px; background: #fff;',
                    listeners: {
                        [CasMobile.Events.SAVE_EVALUATION_RESULT]: 'onSaveEvaluationResult'
                    }
                }
            ]
        },
        {
            xtype: 'toolbar',
            docked: 'bottom',
            layout: {
                type: 'hbox',
                pack: 'center'
            },
            defaults: {
                minWidth: 150
            },
            items: [
                {// 모두 저장
                    itemId: 'btnSaveAll',
                    text: 'Save All', // Fallback, updated in initialize
                    iconCls: 'x-fa fa-save',
                    ui: 'action',
                    handler: 'batchProcessHandler'
                },
                {//
                    itemId: 'btnClose',
                    text: 'Close', // Fallback, updated in initialize
                    margin: '0 0 0 10',
                    iconCls: 'x-fa fa-times',
                    ui: 'back',
                    handler: function (btn) {
                        btn.up('dialog').destroy();
                    }
                }
            ]
        }
    ],

    /**
     * Helper method to interact with the controller
     */
    addEvaluationList: function (record, round) {
        const roundJson = record.get('round' + round) || { round, }
        this.getController().addEvaluationList(record, roundJson);
    },

    initialize: function () {
        this.callParent();
        const L = CasMobile.util.Localization;
        this.setTitle(L.get('visualEvaluation'));

        const expl = this.down('#explLabel');
        if (expl) expl.setHtml(L.get('explVisualEval'));

        const btnSave = this.down('#btnSaveAll');
        if (btnSave) btnSave.setText(L.get('saveAll'));

        const btnClose = this.down('#btnClose');
        if (btnClose) btnClose.setText(L.get('main.close'));
    }
});