/**
 * Converted to Modern toolkit.
 */
Ext.define('CasMobile.view.QrActionContainer', {
    extend: 'Ext.Container',
    xtype: 'qractioncontainer',

    requires: [
        'Ext.layout.Box',
        'Ext.Button',
        'Ext.Dialog',
        'Ext.app.ViewController'
    ],

    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    padding: 15,
    style: 'background: #fff;',

    config: {
        mode: 'find'
    },

    items: [
        {
            xtype: 'component',
            itemId: 'statusInfo',
            flex: 1,
            style: 'text-align: center; color: #999; display: flex; align-items: center; justify-content: center;',
            html: 'Scan a QR Code<br>to see details'
        },
        {
            xtype: 'component',
            itemId: 'roundInfo',
            html: '<i class="fas fa-info-circle"></i> 라운드를 선택해 주세요',
            padding: '10 0',
            hidden: true
        },
        {
            xtype: 'container',
            itemId: 'roundContainer',
            layout: 'hbox',
            hidden: true,
            scrollable: 'x',
            margin: '10 0',
            defaults: {
                margin: '0 5 0 0'
            }
        }
    ],

    initialize: function () {
        this.callParent();
        if (this.up('dialog') && this.up('dialog').getMode() === 'add') {
            this.down('#roundInfo').hide();
        }
    },

    controller: {
        setQrData: async function (qr) {
            const view = this.getView();
            const statusInfo = view.down('#statusInfo');
            const roundContainer = view.down('#roundContainer');

            roundContainer.show();

            // Consistently find the main view and home tab
            const mainView = Ext.Viewport.down('app-main');
            const homeTab = mainView.down('#homeTab');
            const grid = homeTab ? homeTab.down('projectgrid') : null;
            const store = grid ? grid.getStore() : null;

            if (!store) {
                console.error('Project store not found. Check if a project is loaded.');
                statusInfo.setHtml('<div style="color: orange; padding: 20px;">Please load a project before scanning.</div>');
                return;
            }

            // Searching both partId and partNumber for maximum compatibility
            let findRecord = store.findRecord('partId', qr.partId, 0, false, true, true);
            if (!findRecord) {
                findRecord = store.findRecord('partNumber', qr.partId, 0, false, true, true);
            }

            console.log('Search Result:', {
                searchedPartId: qr.partId,
                found: !!findRecord,
                storeCount: store.getCount()
            });

            if (!findRecord) {
                statusInfo.setHtml(`<div style="color: red; padding: 20px;">Data not found for Part ID: ${qr.partId}</div>`);
                return;
            }

            const findData = findRecord.getData();
            const dialog = view.up('dialog');
            const mode = dialog.getMode();
            const round = dialog.getRound();
            const targetView = dialog.getTargetView();
            if (mode === 'add' && round) {
                targetView.addEvaluationList(findRecord, round);
                statusInfo.setHtml('<div style="color: green; font-weight: bold;">Added to List!</div>');
            } else {
                const maxRound = findData.c_lastRound || 1;
                roundContainer.removeAll();
                for (let i = 1; i <= maxRound; i++) {
                    roundContainer.add({
                        xtype: 'button',
                        text: i,
                        ui: 'action',
                        width: 50,
                        handler: (btn) => {
                            const selectedRound = parseInt(btn.getText());
                            if (mode === 'find') {
                                // Navigate to the record in the main grid
                                mainView.getController().onQrRecordFound(findRecord, round);
                                dialog.close();
                            } else if (mode === 'add' && targetView) {
                                targetView.addEvaluationList(findRecord, round);
                            }
                        }
                    });
                }
            }

            let infoHtml = `
                <div style="padding: 10px; background: #f9f9f9; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr><td style="color: #888;">Part ID</td><td style="font-weight: bold;">${qr.partId}</td></tr>
                        <tr><td style="color: #888;">Model</td><td>${findData.c_modelName || '-'}</td></tr>
                        <tr><td style="color: #888;">Name</td><td>${findData.c_partName2 || '-'}</td></tr>
                        <tr><td style="color: #888;">Color</td><td>${findData.c_colorCode || '-'}</td></tr>
                    </table>
                </div>`;
            statusInfo.setHtml(infoHtml);
        }
    }
});
