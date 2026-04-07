/**
 * The main application class. An instance of this class is created by app.js when it
 * calls Ext.application(). This is the ideal place to handle application launch and
 * initialization details.
 * cordova build android --release --buildConfig build.json
 */
Ext.define('CasMobile.Application', {
    extend: 'Ext.app.Application',

    name: 'CasMobile',

    quickTips: false,
    platformConfig: {
        desktop: {
            quickTips: true
        }
    },

    requires: [
        'CasMobile.util.Localization',
        'CasMobile.util.ActorUtil',
        'CasMobile.APIs',
        'CasMobile.Events',
        'CasMobile.view.ProjectMenu',
        'CasMobile.view.login.Login',
        'Ext.tab.Panel',
        'Ext.grid.Grid',
        'Ext.data.virtual.Store',
        'Ext.grid.plugin.PagingToolbar',
        'Ext.data.proxy.JsonP',
        'Ext.data.reader.Json',
        'Ext.app.ViewModel',
        'Ext.app.ViewController',
        'Ext.field.ComboBox',
        'Ext.field.Hidden'
    ],

    launch: function () {
        const me = this;
        if (window.history && window.history.pushState) {
            window.addEventListener('popstate', function (event) {
                // Check for open dialogs first to gracefully close them instead of leaving app
                const openDialogs = Ext.ComponentQuery.query('window{isVisible()}:not([isToast]), dialog{isVisible()}, sheet{isVisible()}, message{isVisible()}');
                if (openDialogs.length > 0) {
                    const topDialog = openDialogs[openDialogs.length - 1];
                    if (topDialog.isMessageBox) {
                        topDialog.hide();
                    } else {
                        topDialog.close ? topDialog.close() : topDialog.hide();
                    }
                    return; // Prevent navigating back further when a dialog is simply being dismissed
                }

                if (Ext.Viewport) {
                    const activeItem = Ext.Viewport.getActiveItem();
                    if (activeItem && activeItem.xtype === 'login') {
                        localStorage.removeItem('selectedBrand');
                        window.location.reload();
                    }
                }
            });
        }

        const loading = Ext.get('app-loading');
        if (loading) {
            loading.destroy();
        }

        CasMobile.util.Util.setOnlineStatus();
        // Event to switch to login (Called from Intro screen)
        Ext.on('showlogin', function () {
            me.showLoginView();
        });

        // Listen for Login Success (from Actor.controller.Login)
        // Ensure we load the controller dynamically
        Ext.GlobalEvents.on('gotomainview', function () {
            me.showMainApp();
        });
        // Load actor.json configuration first
        Ext.Ajax.request({
            url: 'actor.json',
            success: function (response) {
                try {
                    window.siteInfo = JSON.parse(response.responseText);
                    window.siteInfo.categories = window.siteInfo[BRAND].categories;
                    delete window.siteInfo.hyundai;
                    delete window.siteInfo.kia;
                    delete window.siteInfo.genesis;
                } catch (e) {
                    console.error('Failed to parse actor.json', e);
                    Ext.Msg.alert('Error', 'Invalid configuration file.');
                    return;
                }
                // Proceed with Localization logic
                CasMobile.util.Localization.load(function () {
                    // Check for saved session
                    const savedUser = localStorage.getItem('casUserInfo');
                    const hasSavedUser = savedUser && savedUser !== 'undefined' && savedUser !== 'null';

                    const brandSelection = document.getElementById('brand-selection');
                    if (brandSelection && brandSelection.style.display !== 'none') {
                        console.log('Brand selection is active. Waiting for user choice...');
                        return; // Do not render the Ext JS application yet.
                    }

                    // If offline, bypass server session check and go straight to main app
                    if (window.isOnline === false) {
                        console.log('Offline mode ??skipping login screen');
                        if (hasSavedUser) {
                            try {
                                window.Actor = window.Actor || {};
                                window.Actor.userInfo = JSON.parse(savedUser);
                            } catch (e) {
                                console.warn('Invalid local user session', e);
                            }
                        }
                        me.showMainApp();
                    }
                    else if (hasSavedUser) {
                        // Online + saved session: Verify with server
                        me.checkSession(function (isValid) {
                            if (isValid) {
                                window.Actor = window.Actor || {};
                                try {
                                    window.Actor.userInfo = JSON.parse(savedUser);
                                    me.showMainApp();
                                } catch (e) {
                                    console.warn('Invalid saved user session', e);
                                    localStorage.removeItem('casUserInfo');
                                    me.showLoginView();
                                }
                            } else {
                                // Session invalid on server ??clear and show Login
                                localStorage.removeItem('casUserInfo');
                                me.showLoginView();
                            }
                        });
                    } else {
                        // Online but no saved session ??show Login
                        me.showLoginView();
                    }
                });
            },
            failure: function () {
                Ext.Msg.alert('Error', 'Failed to load configuration (actor.json).');
            }
        });

        // Handle hardware back button for hybrid apps
        // We attach this listener unconditionally to document. 
        // If not in Cordova, the event won't fire, so it's safe.
        // If in Cordova, this ensures we catch it even if deviceready fired earlier.
        document.addEventListener("backbutton", function (e) {
            e.preventDefault();
            e.stopPropagation();

            // Check for open dialogs/windows
            // Query for floating components that are visible
            const openDialogs = Ext.ComponentQuery.query('window{isVisible()}, dialog{isVisible()}, sheet{isVisible()}, message{isVisible()}');

            if (openDialogs.length > 0) {
                console.log('Closing top dialog');
                // Close the topmost dialog (last in the array usually)
                const topDialog = openDialogs[openDialogs.length - 1];
                if (topDialog.isMessageBox) {
                    topDialog.hide();
                } else {
                    topDialog.close ? topDialog.close() : topDialog.hide();
                }
            } else {
                const activeItem = Ext.Viewport.getActiveItem();
                if (activeItem && activeItem.xtype === 'login') {
                    console.log('Back button pressed on login screen. Returning to launcher.');
                    localStorage.removeItem('selectedBrand');
                    window.location.reload();
                    return;
                }

                // No dialogs open, handle exit confirmation
                const now = new Date().getTime();
                if (me.lastBackPress && (now - me.lastBackPress < 2000)) {
                    console.log('Exiting app');
                    // Exit app
                    if (navigator.app && navigator.app.exitApp) {
                        navigator.app.exitApp();
                    } else if (navigator.device && navigator.device.exitApp) {
                        navigator.device.exitApp();
                    } else if (window.Capacitor) {
                        // Capacitor fallback just in case
                        window.Capacitor.Plugins.App.exitApp();
                    }
                } else {
                    console.log('Waiting for second press to exit');
                    me.lastBackPress = now;
                    Ext.toast('Press back again to exit', 2000);
                }
            }
        }, false);
    },

    /**
     * Checks if the user's session is still valid with the server.
     * @param {Function} callback The function to call after checking the session.
     *                            It will be called with a boolean argument: true if valid, false otherwise.
     */
    checkSession: function (callback) {
        // In a real application, this would make an AJAX request to your server
        // to validate the session token or cookie.
        // For demonstration, we'll simulate a valid session.
        Ext.data.JsonP.request({
            url: CasMobile.APIs.getSessionApi(),
            method: 'GET',
            success: function (response) {
                try {
                    if (response && response.nvm_id !== '') {
                        callback(true);
                    } else {
                        callback(false);
                    }
                } catch (e) {
                    console.error('Failed to parse session check response', e);
                    callback(false);
                }
            },
            failure: function () {
                console.warn('Session check failed due to network error or server issue.');
                callback(false); // Assume invalid on failure
            }
        });
    },

    onAppUpdate: function () {
        Ext.Msg.confirm('Application Update', 'This application has an update, reload?',
            function (choice) {
                if (choice === 'yes') {
                    window.location.reload();
                }
            }
        );
    },

    showLoginView: function () {
        if (window.history && window.history.pushState) {
            // Push history state so browser back arrow can be caught
            if (!window.history.state || window.history.state.cprState !== 'login') {
                window.history.replaceState({ cprState: 'base' }, document.title, window.location.href);
                window.history.pushState({ cprState: 'login' }, document.title, window.location.href);
            }
        }
        Ext.Viewport.removeAll();
        Ext.Viewport.add({ xtype: 'login' });
    },

    /**
     * Loads Main Controller and Shows Main App
     */
    showMainApp: function () {
        // Explicitly load controller and model from unpacked
        // Use variables to hide dependencies from Sencha Cmd build process
        const mainView = 'CasMobile.view.main.Main';

        Ext.require(mainView, function (mainClass) {
            // Pass instances only if they were created successfully
            Ext.Viewport.removeAll();
            Ext.Viewport.add(Ext.create(mainClass));
        });
    }
});
