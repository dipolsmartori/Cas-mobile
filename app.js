/*
 * This file launches the application by asking Ext JS to create
 * and launch() the Application class.
 */
Ext.Loader.setConfig({ enabled: true });
Ext.Loader.setPath('CasMobile.unpacked', 'unpacked');

Ext.application({
    extend: 'CasMobile.Application',
    name: 'CasMobile'
});
