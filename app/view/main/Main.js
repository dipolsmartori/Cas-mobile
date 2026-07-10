Ext.define('CasMobile.view.main.Main', {
    extend: 'Ext.tab.Panel',
    xtype: 'app-main',
    controller: 'maincontroller',
    viewModel: 'mainmodel',
    requires: [
        'CasMobile.view.main.MainController',
        'CasMobile.view.main.MainModel',
        'CasMobile.view.ProjectMenu',
        'Ext.MessageBox',
        'Ext.layout.Box',
        'Ext.layout.Center',
        'CasMobile.util.Util',
        'CasMobile.util.Localization',
        'CasMobile.view.schedule.Schedule',
        'Ext.Dialog'
    ],

    defaults: {
        tab: {
            iconAlign: 'top',
            width: 80,
            minHeight: 60,
        }
    },

    tabBarPosition: 'bottom',

    listeners: {
        painted: 'onMainViewPainted',
        beforeactiveitemchange: 'onBeforeActiveItemChange'
    },

    items: [
        {
            xtype: 'toolbar',
            docked: 'top',
            itemId: 'mainToolbar',
            title: 'CPR MOBILE',
            items: [
                { // 프로젝트 선택 버튼 메뉴
                    iconCls: 'x-fa fa-bars',
                    handler: 'onShowProjectMenu'
                },
                { xtype: 'spacer', flex: 1 },
                {
                    xtype: 'component',
                    itemId: 'networkStatus',
                    width: 16,
                    height: 16,
                    margin: '0 10 0 0',
                    style: {
                        borderRadius: '50%',
                        backgroundColor: navigator.onLine ? '#4CAF50' : '#F44336',
                        border: '1px solid white'
                    },
                    listeners: {
                        painted: function (cmp) {
                            // Store the initial network status so we can detect changes
                            cmp.lastKnownStatus = navigator.onLine;
                            var appVersion = Ext.manifest.version;
                            var currentVersion;
                            fetch(CasMobile.APIs.getFullUrl(CasMobile.APIs.LIST_C) + '?ca_id=0151')
                                .then(function (response) { return response.json(); })
                                .then(function (res) {
                                    currentVersion = res.binderListBeanList[0].bd_subject;

                                    // 현재 버전과 서버 버전이 다르면 다운로드 버튼에 빨간색 NEW 표시
                                    if (appVersion !== currentVersion) {
                                        var mainView = cmp.up('app-main');
                                        if (mainView) {
                                            var L = CasMobile.util.Localization;
                                            var hideVersion = localStorage.getItem('cas-hide-update-version');

                                            // "다음 버전까지 보지 않기"가 체크되지 않았고, 아직 이 세션에서 다이얼로그를 보여주지 않았을 때만 다이얼로그 표시
                                            if (hideVersion !== currentVersion && !cmp._updateDialogShown) {
                                                cmp._updateDialogShown = true;
                                                console.log('Creating Update Dialog...');
                                                var dialog = Ext.create('Ext.Dialog', {
                                                    title: L.get('notice'),
                                                    closable: true,
                                                    width: 300,
                                                    autoHide: false,
                                                    items: [{
                                                        xtype: 'container',
                                                        padding: 20,
                                                        html: L.get('newVersionAvailable'),
                                                        items: [{
                                                            xtype: 'checkbox',
                                                            itemId: 'chkHideVersion',
                                                            boxLabel: L.get('hideUntilNextVersion'),
                                                            margin: '20 0 0 0',
                                                            style: 'font-size: 14px;'
                                                        }]
                                                    }],
                                                    buttons: [{
                                                        text: L.get('main.download'),
                                                        ui: 'action',
                                                        handler: function () {
                                                            if (dialog.down('#chkHideVersion').getChecked()) {
                                                                localStorage.setItem('cas-hide-update-version', currentVersion);
                                                            }
                                                            dialog.hide();
                                                            mainView.getController().onDownloadApk();
                                                        }
                                                    }, {
                                                        text: L.get('main.close'),
                                                        handler: function () {
                                                            if (dialog.down('#chkHideVersion').getChecked()) {
                                                                localStorage.setItem('cas-hide-update-version', currentVersion);
                                                            }
                                                            dialog.hide();
                                                        }
                                                    }]
                                                });
                                                dialog.show();
                                            }

                                            var mainMenuBtn = mainView.down('#mainMenuButton');
                                            if (mainMenuBtn) {
                                                if (typeof mainMenuBtn.setBadgeText === 'function') {
                                                    mainMenuBtn.setBadgeText('N');
                                                }
                                                var menu = mainMenuBtn.getMenu();
                                                if (menu) {
                                                    var btnDownloadApk = menu.down('#btnDownloadApk');
                                                    if (btnDownloadApk) {
                                                        if (typeof btnDownloadApk.setBadgeText === 'function') {
                                                            btnDownloadApk.setBadgeText('new');
                                                        } else {
                                                            if (!document.getElementById('cas-badge-style')) {
                                                                var style = document.createElement('style');
                                                                style.id = 'cas-badge-style';
                                                                style.innerHTML = '.cas-new-badge .x-text-el::after, .cas-new-badge .x-innerhtml::after { content: "new"; background: #F44336; color: white; border-radius: 10px; padding: 2px 6px; font-size: 10px; margin-left: 5px; font-weight: bold; vertical-align: text-top; }';
                                                                document.head.appendChild(style);
                                                            }
                                                            btnDownloadApk.addCls('cas-new-badge');
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                });


                            var updateNetworkStatus = function () {
                                // Use the utility function to check real connectivity
                                var currentStatus = CasMobile.util.Util.setOnlineStatus(cmp);

                                // Check if status changed
                                if (cmp.lastKnownStatus !== undefined && cmp.lastKnownStatus !== currentStatus) {
                                    // Update immediately so we don't spam dialogs
                                    cmp.lastKnownStatus = currentStatus;

                                    var L = CasMobile.util.Localization;
                                    var msg = currentStatus
                                        ? L.get('networkRestored')
                                        : L.get('networkLost');

                                    Ext.Msg.confirm(
                                        L.get('main.warning') || 'Notice',
                                        msg + ' ' + (L.get('restartAppConfirm') || 'Do you want to restart the app?'),
                                        function (choice) {
                                            if (choice === 'yes') {
                                                localStorage.removeItem('selectedBrand');
                                                localStorage.removeItem('casUserInfo');
                                                var isMobile = window.cordova || window.location.protocol === 'file:';
                                                if (isMobile) {
                                                    window.location.reload();
                                                } else {
                                                    window.location.href = window.location.pathname;
                                                }
                                            }
                                        }
                                    );
                                } else {
                                    cmp.lastKnownStatus = currentStatus;
                                }
                                return currentStatus;
                            };

                            // Initial check
                            updateNetworkStatus();

                            // Optional: Poll periodically to catch cases where the browser event doesn't fire
                            var intervalId = setInterval(updateNetworkStatus, 10000); // Check every 10 seconds

                            // Also attach standard DOM events for instant reaction
                            window.addEventListener('online', updateNetworkStatus);
                            window.addEventListener('offline', updateNetworkStatus);

                            // Store reference to remove listener later if needed
                            cmp.updateNetworkStatus = updateNetworkStatus;
                            cmp.intervalId = intervalId;
                        },
                        destroy: function (cmp) {
                            if (cmp.intervalId) {
                                clearInterval(cmp.intervalId);
                            }
                            if (cmp.updateNetworkStatus) {
                                window.removeEventListener('online', cmp.updateNetworkStatus);
                                window.removeEventListener('offline', cmp.updateNetworkStatus);
                            }
                        }
                    }
                },
                {
                    itemId: 'mainMenuButton',
                    iconCls: 'x-fa fa-ellipsis-v',
                    arrow: false, // Hide the default arrow trigger
                    menu: [
                        {
                            xtype: 'component',
                            itemId: 'evaluationHeader',
                            html: '' // Set in initialize
                        },
                        { // 육안평가
                            itemId: 'btnVisualEval',
                            text: 'Visual Evaluation', // Fallback (overridden in initialize)
                            iconCls: 'x-fa fa-clipboard-check',
                            handler: 'onVisualEvaluation'
                        },
                        {
                            xtype: 'component',
                            itemId: 'offlineHeader',
                            html: '', // Set in initialize
                        },
                        { // 오프라인용 데이터 다운로드
                            itemId: 'btnDownloadOffline',
                            text: 'Download Offline', // Fallback (overridden in initialize)
                            iconCls: 'x-fa fa-download',
                            handler: 'onDownloadOfflineData'
                        },
                        { // 오프라인용 데이터 삭제
                            itemId: 'btnClearOffline',
                            text: 'Clear offline', // Fallback
                            iconCls: 'x-fa fa-trash',
                            handler: 'onClearOfflineData'
                        },
                        { // 오프라인 평가결과 엑셀 다운로드
                            itemId: 'btnExcelDownloadOffline',
                            text: 'Save offline data to excel',
                            iconCls: 'x-fa fa-file-excel',
                            hidden: true,
                            handler: 'onExcelDownloadOfflineData'
                        },
                        { // 오프라인 데이터 불러오기
                            itemId: 'btnUpdateToServer',
                            text: 'Load offline data', // Fallback
                            iconCls: 'x-fa fa-cloud-upload-alt',
                            handler: 'onUpdateToServer'
                        },
                        {
                            xtype: 'component',
                            html: '<div style="border-top: 1px solid #ddd; border-bottom: 1px solid #cecece; color: #555; margin: 5px 0 5px 0;"></div>'
                        },
                        { // QR CDOD
                            text: 'QR CODE',
                            itemId: 'qrCodeForUser',
                            iconCls: 'x-fa fa-qrcode',
                            hidden: window.Actor.userInfo.nv_level > 4,
                            handler: 'onScanQRCode'
                        },
                        { // 앱 다운로드
                            itemId: 'btnDownloadApk',
                            text: 'Download App', // Fallback
                            iconCls: 'x-fab fa-android',
                            hidden: false,
                            handler: 'onDownloadApk'
                        },
                        { // 로그아웃
                            itemId: 'btnLogout',
                            text: 'Logout', // Fallback
                            iconCls: 'x-fa fa-sign-out-alt'
                        }
                    ]
                }
            ],
            listeners: {
                painted: function (tb) {
                    const mainView = tb.up('app-main');
                    const controller = mainView && mainView.getController();
                    if (controller && controller.updateMainTitle) {
                        controller.updateMainTitle();
                    }
                }
            }
        },
        {
            xtype: 'panel',
            title: 'Home',
            itemId: 'homeTab',
            iconCls: 'x-fa fa-home',
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            html: '<div style="padding: 20px;">Welcome to CAS Mobile</div>'
        }, {
            xtype: 'panel',
            title: 'Visual Evaluation',
            itemId: 'visualEvalTab',
            iconCls: 'x-fa fa-clipboard-check',
            layout: 'center',
            items: [{
                xtype: 'button',
                text: 'Start Visual Evaluation',
                ui: 'action',
                padding: '10 20',
                handler: 'onVisualEvaluation'
            }]
        }, {
            xtype: 'panel',
            itemId: 'statisticsTab',
            iconCls: 'x-fa fa-chart-bar',
            layout: 'fit',
            scrollable: true,
            items: [{
                xtype: 'component',
                itemId: 'statisticsContent',
                cls: 'cas-statistics-content',
                html: '<div class="cas-statistics-empty">Select a project to view statistics.</div>'
            }]
        }, {
            xtype: 'cas-schedule',
            itemId: 'scheduleTab',
            iconCls: 'x-fa fa-calendar-alt'
        }, {
            xtype: 'panel',
            itemId: 'settingsTab',
            iconCls: 'x-fa fa-cog',
            hidden: true,
            items: [

            ]
        }
    ],

    initialize: function () {
        this.callParent();
        var me = this;
        var L = CasMobile.util.Localization;

        // Localize tab titles
        var homeTab = me.down('#homeTab');
        if (homeTab) homeTab.setTitle(L.get('menu.home'));

        var statsTab = me.down('#statisticsTab');
        if (statsTab) statsTab.setTitle(L.get('main.statistics'));

        var scheduleTab = me.down('#scheduleTab');
        if (scheduleTab) scheduleTab.setTitle(L.get('schedule'));

        var settingsTab = me.down('#settingsTab');
        if (settingsTab) settingsTab.setTitle(L.get('menu.settings'));

        var doLogout = function (isAuto) {
            if (isAuto === undefined) isAuto = false;
            var executeLogout = function () {
                var logoutFrame = Ext.getBody().createChild({
                    tag: 'iframe',
                    cls: 'x-hidden',
                    id: 'iFrame',
                    name: 'iFrame',
                    isReady: false
                });
                var logout = function logoutApp() {
                    localStorage.removeItem('selectedBrand');
                    localStorage.removeItem('casUserInfo');
                    var isMobile = window.cordova || window.location.protocol === 'file:';
                    console.log('isMobile', isMobile, window.location.pathname);
                    if (isMobile) {
                        window.location.reload();
                    } else {
                        // Strip subdomain if present (e.g., ko.smartori.com -> smartori.com)
                        var host = window.location.hostname;
                        var hostParts = host.split('.');
                        if (hostParts.length > 2 && !/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
                            hostParts.shift();
                            var baseHost = hostParts.join('.');
                            window.location.href = window.location.protocol + '//' + baseHost + window.location.pathname + '?logout=true';
                        } else {
                            window.location.href = window.location.pathname + '?logout=true';
                        }
                    }
                };
                logoutFrame.dom.src = CasMobile.APIs.getFullUrl(CasMobile.APIs.LOGOUT);
                setTimeout(logout, 500);
            };

            var isOnline = CasMobile.util.Util.setOnlineStatus();
            if (isAuto === true && isOnline) {
                // 1분(60초) 후 응답이 없으면 자동으로 로그아웃 처리하기 위한 타이머
                var autoLogoutTimer = setTimeout(function () {
                    if (Ext.Msg.isVisible()) {
                        Ext.Msg.hide();
                        executeLogout();
                    }
                }, 60000);

                Ext.Msg.confirm(
                    L.get('login.logout') || 'Logout',
                    L.get('main.autoLogoutConfirm') || 'You have been idle for a while. Do you want to logout?',
                    function (choice) {
                        // 사용자가 응답을 하면 타이머를 제거
                        clearTimeout(autoLogoutTimer);
                        if (choice === 'yes') {
                            executeLogout();
                        } else {
                            // 사용자가 계속 로그인을 유지하기로 선택한 경우
                            if (me._resetIdleTimerCallback) {
                                me._resetIdleTimerCallback();
                            }
                        }
                    }
                );
            } else {
                executeLogout();
            }
        };

        var menuBtn = this.down('#mainMenuButton');
        // 상황에 따라 오른쪽 메뉴 보이기/숨기기
        if (menuBtn) {
            var menu = menuBtn.getMenu();
            if (menu) {
                var isMobile = !!(window.cordova || window.location.protocol === 'file:');

                var btnEval = menu.down('#btnVisualEval');
                if (btnEval) {
                    btnEval.setText(L.get('visualEvaluation'));
                    btnEval.setHidden(Actor.userInfo.nv_level < 5);
                }

                var btnDown = menu.down('#btnDownloadOffline');
                if (btnDown) {
                    btnDown.setText(L.get('upload.downloadOffline'));
                    btnDown.setHidden(!isMobile || !window.isOnline || Actor.userInfo.nv_level < 5);
                }

                var btnClear = menu.down('#btnClearOffline');
                if (btnClear) {
                    btnClear.setText(L.get('upload.clearOffline'));
                    btnClear.setHidden(!isMobile || Actor.userInfo.nv_level < 5);
                }

                var btnExcelDownloadOffline = menu.down('#btnExcelDownloadOffline');
                if (btnExcelDownloadOffline) {
                    btnExcelDownloadOffline.setText(L.get('upload.exportOfflineExcel') || 'Save offline data to excel');
                    btnExcelDownloadOffline.setHidden(!isMobile || !window.isOnline);
                }

                var btnUpdate = menu.down('#btnUpdateToServer');
                if (btnUpdate) {
                    btnUpdate.setText(L.get('upload.loadOfflineData'));
                    btnUpdate.setHidden(!isMobile || !window.isOnline || Actor.userInfo.nv_level < 5);
                }

                var btnLogout = menu.down('#btnLogout');
                if (btnLogout) {
                    btnLogout.setText(L.get('login.logout'));
                    btnLogout.setHidden(!window.isOnline);
                    btnLogout.setHandler(doLogout);
                }

                var visualEvalTab = this.down('#visualEvalTab');
                if (visualEvalTab) {
                    visualEvalTab.setTitle(L.get('visualEvaluation'));
                }

                var evalHeader = menu.down('#evaluationHeader');
                if (evalHeader) {
                    evalHeader.setHtml('<div style="background-color: #f0f0f0; border-top: 1px solid #cecece; border-bottom: 1px solid #ddd; padding: 5px; text-align: center; font-weight: bold; font-size: 11px; color: #555; margin-top: 5px;">' + L.get('evaluationHeader').toUpperCase() + '</div>');
                }

                var btnQrCodeForUser = menu.down('#qrCodeForUser');
                if (btnQrCodeForUser) {
                    btnQrCodeForUser.setText(L.get('qrCodeForUser'));
                }

                var offHeader = menu.down('#offlineHeader');
                if (offHeader) {
                    offHeader.setHtml('<div style="background-color: #f0f0f0; border-top: 1px solid #cecece; border-bottom: 1px solid #ddd; padding: 5px; text-align: center; font-weight: bold; font-size: 11px; color: #555; margin-top: 5px;">' + L.get('offlineHeader').toUpperCase() + '</div>');
                    offHeader.setHidden(!isMobile || Actor.userInfo.nv_level < 5);
                }

                var btnDownloadApk = menu.down('#btnDownloadApk');
                if (btnDownloadApk) {
                    btnDownloadApk.setText(L.get('downloadApk') || 'Download App');
                }

            }
        }

        //  사용자 활동을 체크하여  siteInfo.logoutTime동안 활동이 없으면 자동 로그아웃
        if (window.siteInfo && window.siteInfo.logoutTime) {
            var logoutTimeMs = window.siteInfo.logoutTime * 60 * 1000;
            var idleTimer;

            var resetIdleTimer = function () {
                if (idleTimer) {
                    clearTimeout(idleTimer);
                }
                idleTimer = setTimeout(function () {
                    doLogout(true);
                }, logoutTimeMs);
            };

            // Expose the reset timer locally for the confirmation dialog
            this._resetIdleTimerCallback = resetIdleTimer;

            var events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

            var onUserAction = function () {
                resetIdleTimer();
            };

            events.forEach(function (event) {
                document.addEventListener(event, onUserAction, { capture: true, passive: true });
            });

            this.on('destroy', function () {
                if (idleTimer) {
                    clearTimeout(idleTimer);
                }
                events.forEach(function (event) {
                    document.removeEventListener(event, onUserAction, { capture: true, passive: true });
                });
            });

            resetIdleTimer();
        }
    }
});
