/**
 * Converted to Modern toolkit.
 */
Ext.define('CasMobile.view.QrScannerWindow', {
    extend: 'Ext.Dialog',
    xtype: 'qrscannerwindow',

    title: 'QR Code Scanner',
    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    closable: true,

    config: {
        mode: 'find',
        targetView: null,
        round: null
    },

    requires: [
        'CasMobile.view.QrActionContainer'
    ],

    items: [
        {
            xtype: 'container',
            flex: 1,
            layout: 'hbox',
            items: [
                // Scanner Status View
                {
                    xtype: 'component',
                    itemId: 'scannerView',
                    width: 240,
                    style: 'background-color: #f5f5f5; border-right: 1px solid #ddd;',
                    html: `
                        <div style="display: flex; flex-direction: column; height: 100%; width: 100%; align-items: center; justify-content: center; text-align: center; padding: 20px;">
                            <div style="font-size: 48px; color: #2e7d32; margin-bottom: 20px;">
                                <i class="fas fa-barcode"></i>
                            </div>
                            <div style="font-weight: bold; font-size: 16px; color: #333;">Hardware Scanner Active</div>
                            <div style="font-size: 13px; color: #666; margin-top: 10px;">Please scan a barcode using your device scanner.</div>
                        </div>
                    `
                },
                // Action View
                {
                    xtype: 'qractioncontainer',
                    itemId: 'resultView',
                    width: 240,
                    style: 'background: #fff;'
                }
            ]
        }
    ],

    initialize: function () {
        this.callParent();
        const me = this;

        // Scope binding
        me.handleScanSuccess = me.handleScanSuccess.bind(me);

        me.on({
            hide: me.onCloseWindow,
            destroy: me.onCloseWindow,
            scope: me
        });

        // Physical Scanner Support (Zebra, etc.)
        me.scannerBuffer = '';
        me.lastKeyTime = 0;
        me.scannerListener = (e) => {
            if (e.key === 'Enter') {
                if (me.scannerBuffer.length > 0) {
                    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                        me.handleScanSuccess(me.scannerBuffer);
                    }
                    me.scannerBuffer = '';
                }
                return;
            }
            if (e.key.length > 1) return;
            const now = Date.now();
            if (now - me.lastKeyTime > 50) me.scannerBuffer = '';
            me.scannerBuffer += e.key;
            me.lastKeyTime = now;
        };
        document.addEventListener('keydown', me.scannerListener);
    },

    handleScanSuccess: function (text) {
        const now = Date.now();
        if (this.lastText === text && now - this.lastTime < 2000) return;
        this.lastText = text;
        this.lastTime = now;

        const data = CasMobile.util.Util.parseQrData(text);
        this.down('#resultView').getController().setQrData(data);
    },

    onCloseWindow: function () {
        const me = this;
        if (me._isCleaningUp) return;
        me._isCleaningUp = true;
        document.removeEventListener('keydown', me.scannerListener);
    }
});
