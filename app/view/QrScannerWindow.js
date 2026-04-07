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
                // Scanner View
                {
                    xtype: 'component',
                    itemId: 'scannerView',
                    width: 240,
                    style: 'background-color: #000; position: relative;',
                    html: `
                        <div style="display: flex; flex-direction: column; height: 100%; width: 100%;">
                            <div style="flex: 1; overflow: hidden; position: relative;">
                                <div id="qr-reader-el" style="width: 100%; height: 100%;"></div>
                                <div id="qr-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; display: flex; align-items: center; justify-content: center; z-index: 99;">
                                    <div style="width: 200px; height: 200px; border: 3px solid rgba(0, 255, 0, 0.5); box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3); border-radius: 8px;"></div>
                                </div>
                            </div>
                            <div style="height: 60px; background: #333; display: flex; justify-content: center; align-items: center; gap: 8px;">
                                <button id="qr-camera-btn" style="padding: 10px;  background: #fff; color: #333; border: none; border-radius: 4px; font-weight: bold;">
                                    <i class="fas fa-camera"></i> CAMERA
                                </button>
                                <button id="qr-upload-btn" style="padding: 10px; background: #fff; color: #333; border: none; border-radius: 4px; font-weight: bold;">
                                    <i class="fas fa-file-image"></i> UPLOAD
                                </button>
                            </div>
                        </div>
                        <input type="file" id="qr-input-camera" accept="image/*" capture="environment" style="display:none" />
                        <input type="file" id="qr-input-file" accept="image/*" style="display:none" />
                    `,
                    listeners: {
                        painted: function (cmp) {
                            const dialog = cmp.up('dialog');
                            document.getElementById('qr-camera-btn').onclick = () => dialog.triggerInput('qr-input-camera');
                            document.getElementById('qr-upload-btn').onclick = () => dialog.triggerInput('qr-input-file');
                        }
                    }
                },
                // Action View
                {
                    xtype: 'qractioncontainer',
                    itemId: 'resultView',
                    width: 240,
                    style: 'border-left: 1px solid #ccc; background: #fff;'
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
            painted: me.onShow,
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

    onShow: function () {
        console.log('QrScannerWindow: onShow');
        this.loadLibrary().then(() => {
            this.startScanning();
            this.setupFileInputs();
        }).catch(err => {
            console.error('Library Load Error:', err);
        });
    },

    loadLibrary: function () {
        return new Promise((resolve, reject) => {
            if (window.Html5Qrcode) return resolve();
            const script = document.createElement('script');
            script.src = "https://unpkg.com/html5-qrcode";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    setupFileInputs: function () {
        ['qr-input-camera', 'qr-input-file'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.onchange = (e) => {
                    if (e.target.files.length) this.scanImageFile(e.target.files[0]);
                };
            }
        });
    },

    triggerInput: function (id) {
        const input = document.getElementById(id);
        if (input) input.click();
    },

    scanImageFile: function (file) {
        Ext.Viewport.setMasked({ xtype: 'loadmask', message: 'Scanning File...' });
        if (this.qrCodeScanner && this.qrCodeScanner.isScanning) {
            this.qrCodeScanner.stop().then(() => this.doScanFile(file)).catch(() => this.doScanFile(file));
        } else {
            this.doScanFile(file);
        }
    },

    doScanFile: function (file) {
        this.qrCodeScanner.scanFile(file, false)
            .then(text => {
                Ext.Viewport.setMasked(false);
                this.handleScanSuccess(text);
            })
            .catch(err => {
                Ext.Viewport.setMasked(false);
                console.error('File Scan Error:', err);
                Ext.Msg.alert('Notice', 'Could not find QR Code in image.');
            });
    },

    startScanning: function () {
        const me = this;
        const elementId = "qr-reader-el";

        setTimeout(() => {
            const el = document.getElementById(elementId);
            if (!el) {
                console.error('Target element not found:', elementId);
                return;
            }

            try {
                if (me.qrCodeScanner) {
                    if (me.qrCodeScanner.isScanning) return;
                    me.qrCodeScanner.clear();
                }

                const html5QrCode = new Html5Qrcode(elementId);
                me.qrCodeScanner = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                console.log('Starting Camera Scanner...');
                html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    me.handleScanSuccess,
                    (err) => { /* Ignore frequent scanning noise */ }
                ).catch(err => {
                    console.warn('Camera Start Failed:', err);
                });
            } catch (e) {
                console.error('Scanner Init Exception:', e);
            }
        }, 500);
    },

    handleScanSuccess: function (text) {
        const now = Date.now();
        if (this.lastText === text && now - this.lastTime < 2000) return;
        this.lastText = text;
        this.lastTime = now;

        let data = {};
        try {
            data = JSON.parse(text);
            // Normalize JSON data if needed
            if (data.partId) data.partId = data.partId.toString().replace(/\//g, '-');
            if (data.grainCode) data.grainCode = data.grainCode.toString().replace(/\//g, '-');
        } catch (e) {
            const parts = text.split(',');
            if (parts.length >= 4) {
                data = {
                    partId: parts[0].replace(/\//g, '-').trim(),
                    modelId: parts[1].trim(),
                    colorCode: parts[2].trim(),
                    grainCode: parts[3].replace(/\//g, '-').trim()
                };
            } else if (parts.length >= 2) {
                data = {
                    partId: parts[0].replace(/\//g, '-').trim(),
                    grainCode: parts[parts.length - 1].replace(/\//g, '-').trim()
                };
            } else {
                data = {
                    partId: text.replace(/\//g, '-').trim()
                };
            }
        }
        this.down('#resultView').getController().setQrData(data);
    },

    onCloseWindow: async function () {
        const me = this;
        if (me._isCleaningUp) return;
        me._isCleaningUp = true;

        // Cleanup global event listener immediately
        document.removeEventListener('keydown', me.scannerListener);

        if (me.qrCodeScanner) {
            try {
                if (me.qrCodeScanner.isScanning) {
                    await me.qrCodeScanner.stop();
                }
                me.qrCodeScanner.clear();
                me.qrCodeScanner = null;
            } catch (e) {
                // Common to get minor errors during destruction, skip logging unless critical
            }
        }
    }
});
