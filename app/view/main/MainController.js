Ext.define('CasMobile.view.main.MainController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.maincontroller',

    isOffline: false,

    init: function () {
        var me = this;
        me.isOffline = !window.isOnline;

        CasMobile.app.on('projectselected', this.onProjectSelected, this);

        if (!me.isOffline) {
            me.showStartPopups();
        }

        document.addEventListener('deviceready', function () {
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.notification && window.cordova.plugins.notification.local) {
                window.cordova.plugins.notification.local.on('click', function (notification) {
                    var scheduleView = me.getView().down('cas-schedule');
                    if (scheduleView) {
                        me.getView().setActiveItem(scheduleView);
                        var data = notification.data;
                        if (typeof data === 'string') {
                            try { data = JSON.parse(data); } catch (e) { }
                        }
                        if (data && data.itemStr) {
                            var ctrl = scheduleView.getController();
                            if (ctrl && ctrl.openPopupEventAsync) {
                                try {
                                    var item = JSON.parse(data.itemStr);
                                    ctrl.openPopupEventAsync(item);
                                } catch (e) {
                                    console.error('Failed to parse popup notification data', e);
                                }
                            }
                        }
                    }
                });
            }
        }, false);
    },

    onBeforeActiveItemChange: function (container, toValue, fromValue) {
        // 비주얼 평가 탭 클릭 시 팝업을 띄우고 홈 탭으로 이동하도록 처리 (기능적 숏컷)
        if (toValue && toValue.getItemId() === 'visualEvalTab') {
            this.onVisualEvaluation();

            var homeTab = container.down('#homeTab');
            if (homeTab && fromValue !== homeTab) {
                container.setActiveItem(homeTab);
            }
            return false;
        }
    },

    showStartPopups: function () {
        var me = this;
        var categories = [
            { categoryId: window.siteInfo.categories.calendar['public'], params: {} },
            { categoryId: window.siteInfo.categories.calendar['private'], params: { participant: '|' + window.Actor.userInfo.nv_id + '|' } },
            { categoryId: window.siteInfo.categories.calendar['private'], params: { participant: '|' + window.Actor.userInfo.nv_group + '|' } }
        ];

        var popupCount = 0;
        categories.forEach(function (cat) {
            var requestParams = Ext.apply({
                popup: 'yes',
                ca_order: 2,
                ca_id: cat.categoryId
            }, cat.params);

            var url = CasMobile.APIs.getFullUrl(CasMobile.APIs.LIST_C);
            Ext.Ajax.request({
                url: url,
                method: 'GET',
                params: requestParams,
                success: function (response) {
                    try {
                        var data = JSON.parse(response.responseText);
                        if (data && data.binderListBeanList) {
                            data.binderListBeanList.forEach(function (item) {
                                if (me.getCookieValue('notice_' + item.bd_idx) === '1') {
                                    return;
                                }
                                var duration = parseInt(item.c_duration, 10) || 7;
                                var durationMs = duration * 24 * 60 * 60 * 1000;
                                var startDate = new Date(item.c_start) || new Date(item.bd_regdate);
                                if (new Date() - startDate < durationMs) {
                                    me.createModernPopup(item, popupCount++);
                                }
                            });
                        }
                    } catch (e) {
                        console.error('Failed to fetch popup data:', e);
                    }
                },
                failure: function (e) {
                    console.error('Failed to fetch popups', e);
                }
            });
        });
    },

    getCookieValue: function (name) {
        var localVal = window.localStorage.getItem(name);
        if (localVal && localVal === '1') {
            var expires = window.localStorage.getItem(name + '_expires');
            if (!expires || new Date() < new Date(expires)) {
                return '1';
            } else {
                window.localStorage.removeItem(name);
                window.localStorage.removeItem(name + '_expires');
            }
        }
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) return match[2];
        return '';
    },

    setCookieValue: function (name, value, days) {
        var date = new Date();
        date.setDate(date.getDate() + days);
        document.cookie = name + '=' + value + '; path=/; expires=' + date.toGMTString() + ';';
        window.localStorage.setItem(name, value);
        window.localStorage.setItem(name + '_expires', date.toISOString());
    },

    createModernPopup: function (item, index) {
        var me = this;
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.notification && window.cordova.plugins.notification.local) {
            var div = document.createElement('div');
            div.innerHTML = item.bd_content;
            var text = div.textContent || div.innerText || '';
            text = text.replace(/\s+/g, ' ').trim();

            var scheduleNotification = function () {
                window.cordova.plugins.notification.local.schedule({
                    id: parseInt(item.bd_idx, 10),
                    title: item.bd_subject,
                    text: text,
                    foreground: true,
                    data: { itemStr: JSON.stringify(item) }
                });
            };

            window.cordova.plugins.notification.local.hasPermission(function (granted) {
                if (granted) {
                    scheduleNotification();
                } else {
                    window.cordova.plugins.notification.local.requestPermission(function (res) {
                        if (res) scheduleNotification();
                    });
                }
            });
        }

        var loc = CasMobile.util.Localization;
        var dialog = Ext.create('Ext.Dialog', {
            title: item.bd_subject,
            layout: 'fit',
            width: '90%',
            maxWidth: 600,
            height: '60%',
            closable: true,
            maximizable: false,
            margin: (index * 20) + ' 0 0 ' + (index * 20),
            scrollable: true,
            bodyPadding: 20,
            items: [{ xtype: 'component', html: item.bd_content }],
            bbar: ['->', {
                xtype: 'checkbox',
                boxLabel: loc.get('main.hideIn24') || 'Do not show again for 24 hours',
                margin: '0 10 0 0',
                listeners: {
                    change: function (field, newValue) {
                        dialog.hideFor24Hours = newValue;
                    }
                }
            }, {
                    text: loc.get('main.close') || 'Close',
                    handler: function () {
                        dialog.close();
                    }
                }],
            listeners: {
                close: function () {
                    if (dialog.hideFor24Hours) {
                        me.setCookieValue('notice_' + item.bd_idx, '1', 1);
                    }
                }
            }
        });
        dialog.show();
    },

    destroy: function () {
        CasMobile.app.un('projectselected', this.onProjectSelected, this);
        this.callParent();
    },

    onProjectSelected: function (params, callback) {
        var me = this;
        var homeTab = me.getView().down('#homeTab');
        if (!homeTab) return;

        me.getView().setActiveItem(homeTab);
        me.isOffline = !window.isOnline;

        if (me.isOffline) {
            console.warn('Offline mode – loading cached project data');
            me.loadProjectFromCache(params).then(function () {
                if (callback) callback();
            });
            return;
        }

        homeTab.setHtml('');
        homeTab.setMasked({ xtype: 'loadmask' });

        me.getMaxRound(params.datasetId).then(function (maxRound) {
            me._createRoundButtons(homeTab, maxRound);

            if (homeTab.down('projectgrid')) {
                homeTab.down('projectgrid').destroy();
            }

            var grid = Ext.create('CasMobile.view.project.ProjectGrid', {
                flex: 1,
                params: params,
                maxRound: maxRound
            });

            homeTab.add(grid);
            var store = grid.getStore();
            store.getProxy().setExtraParams(params);
            store.load({
                callback: function () {
                    homeTab.setMasked(false);
                    if (callback) callback();
                }
            });
        }).catch(function (err) {
            console.error('Error in onProjectSelected:', err);
            homeTab.setMasked(false);
            if (callback) callback();
        });
    },

    loadProjectFromCache: function (params) {
        var me = this;
        var homeTab = me.getView().down('#homeTab');
        if (!homeTab) return Promise.resolve();

        homeTab.setHtml('');
        homeTab.setLayout({ type: 'vbox', align: 'stretch' });
        homeTab.setMasked({ xtype: 'loadmask', message: 'Loading Offline Data...' });

        return me.getOfflineProjectData(params.datasetId || params.ca_id).then(function (result) {
            if (!result) {
                homeTab.setMasked(false);
                return;
            }

            var maxRound = result.maxRound;
            var data = result.data;

            me._createRoundButtons(homeTab, maxRound);
            if (homeTab.down('projectgrid')) {
                homeTab.down('projectgrid').destroy();
            }

            homeTab.add({
                xtype: 'projectgrid',
                flex: 1,
                params: params,
                maxRound: maxRound,
                store: {
                    type: 'store',
                    data: data,
                    proxy: 'memory',
                    pageSize: data.length,
                    fields: [
                        'bd_idx', 'bd_subject', 'bd_data', 'partNumber', 'assyTrim', 'partName2',
                        'assemblyCo', 'rawMaterialCo', 'gross', 'iiiObs', 'dl', 'da', 'db', 'de', 'mi',
                        'dlVisual1', 'daVisual1', 'dbVisual1', 'remarksVisual', 'resultVisual',
                        'round1', 'round2', 'round3', 'round4', 'round5', 'round6', 'round7', 'round8', 'round9', 'round10', 'round11', 'round12', 'round13',
                        'isUpdatedOffline'
                    ]
                }
            });
            homeTab.setMasked(false);
        }).catch(function (err) {
            console.error('Error loading project from cache:', err);
            homeTab.setMasked(false);
            Ext.Msg.alert('Offline Error', 'Failed to load cached data.');
        });
    },

    _createRoundButtons: function (tab, maxRound) {
        var me = this;
        if (maxRound <= 0) return;

        var container = tab.down('#roundBtnContainer');
        if (container) container.destroy();

        var color = window.isOnline ? siteInfo.onlineColor : siteInfo.offlineColor;
        var items = [{
            xtype: 'component',
            width: 40,
            height: 40,
            itemId: 'selectedRound',
            style: {
                backgroundColor: color,
                borderRadius: '20px',
                marginRight: '20px',
                color: 'white',
                fontSize: '18px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            },
            html: maxRound
        }];

        var switchRound = function (btn) {
            var grid = tab.down('projectgrid');
            if (!grid) return;

            var r = btn.round;
            var label = btn.up().down('#selectedRound');
            if (label) label.setHtml(r);

            grid.query('column').forEach(function (col) {
                var colRound = col.round;
                if (colRound) {
                    col.setHidden(colRound !== r);
                }
            });

            Ext.defer(function () {
                var scroller = grid.getScrollable();
                if (scroller) {
                    var y = scroller.getPosition().y;
                    var maxX = scroller.getMaxPosition().x;
                    scroller.scrollTo(maxX, y, { animation: true });
                }
            }, 150);
        };

        for (var i = 1; i <= maxRound; i++) {
            items.push({
                xtype: 'button',
                text: i.toString(),
                round: i,
                ui: 'action',
                margin: '0 5',
                width: 40,
                height: 40,
                cls: 'round-btn',
                handler: switchRound
            });
        }

        if (Actor.userInfo.nv_level > 4) {
            items.push({
                xtype: 'button',
                iconCls: 'x-fa fa-plus',
                ui: 'action',
                margin: '0 5',
                width: 40,
                height: 40,
                cls: 'round-btn',
                handler: function (btn) {
                    var grid = tab.down('projectgrid');
                    if (!grid) return;
                    var newRound = maxRound + 1;
                    var store = grid.getStore();
                    if (!store) return;

                    var records = store.getRange() || [];
                    records.forEach(function (rec) {
                        rec.set('round' + newRound, { round: newRound });
                    });

                    me._createRoundButtons(tab, newRound);
                    grid.setMaxRound(newRound);
                    grid.buildColumns(newRound);

                    Ext.defer(function () {
                        var buttons = tab.query('button');
                        var nextBtn = buttons.find(function (b) { return b.round === newRound; });
                        if (nextBtn) switchRound(nextBtn);
                    }, 100);
                }
            });
        }

        tab.insert(0, {
            xtype: 'container',
            itemId: 'roundBtnContainer',
            width: '100%',
            layout: { type: 'hbox', pack: 'center', align: 'center' },
            padding: '10 0 10 0',
            items: items
        });
    },

    getMaxRound: function (datasetId) {
        return new Promise(function (resolve) {
            if (!window.siteInfo || !window.siteInfo.categories) {
                resolve(0);
                return;
            }
            var url = CasMobile.APIs.getFullUrl(CasMobile.APIs.COLS_DATA_SUM);
            Ext.Ajax.request({
                url: url,
                method: 'GET',
                params: {
                    ca_id: window.siteInfo.categories.evaluationDataCategory,
                    cols_idx: 4656,
                    search_val: datasetId,
                    sum_cols_idx: 4600
                },
                success: function (response) {
                    try {
                        var data = Ext.decode(response.responseText);
                        var max = (data && data[0] && data[0].calc) ? data[0].calc.max : 0;
                        resolve(max);
                    } catch (e) {
                        console.error('Error parsing max round logic:', e);
                        resolve(0);
                    }
                },
                failure: function (e) {
                    console.error('MaxRound fetch failed', e);
                    resolve(0);
                }
            });
        });
    },

    onQrRecordFound: function (record, roundInfo) {
        var me = this;
        var mainView = me.getView();
        var grid = mainView.down('projectgrid');
        if (!grid || !record) return;

        if (roundInfo) {
            var round = (typeof roundInfo === 'object') ? roundInfo.round : roundInfo;
            var container = mainView.down('#roundBtnContainer');
            if (container) {
                var btns = container.query('button');
                var btn = btns.find(function (b) { return b.round === round; });
                if (btn && btn.getHandler()) {
                    btn.getHandler().call(btn, btn);
                }
            }
        }
        grid.setSelection(record);
        grid.ensureVisible(record);
    },

    onVisualEvaluation: function () {
        var view = Ext.ComponentQuery.query('visualevaluationwindow');
        if (view && view.length > 0) {
            view[0].show();
            return;
        }

        var homeTab = this.getView().down('#homeTab');
        var grid = homeTab.down('projectgrid');
        if (!grid) {
            Ext.Msg.alert('Notice', CasMobile.util.Localization.get('main.selectProject'));
            return;
        }
        var maxRound = grid.getMaxRound();
        Ext.create('CasMobile.view.evaluate.VisualEvaluationWindow', { maxRound: maxRound }).show();
    },

    onDownloadOfflineData: function () {
        var me = this;
        var grid = me.getView().down('projectgrid');
        if (!grid) {
            Ext.Msg.alert('Notice', loc.selectProjectFirst);
            return;
        }

        var store = grid.getStore();
        var proxy = store.getProxy();
        var url = proxy.url;
        var params = Ext.apply({ page_size: 2000 }, proxy.extraParams);

        var fetchProject = new Promise(function (resolve, reject) {
            Ext.Ajax.request({
                url: url,
                method: 'GET',
                params: params,
                withCredentials: true,
                success: function (res) {
                    var data = Ext.decode(res.responseText);
                    if (data && data.binderList) resolve(data.binderList);
                    else reject('Invalid project data');
                },
                failure: function (err) { reject(err); }
            });
        });

        var fetchCars = new Promise(function (resolve) {
            var carStore = Ext.getStore('carModelStore');
            if (carStore && carStore.isLoaded() && carStore.getCount() > 0) {
                resolve(carStore.getRange().map(function (r) { return r.getData(); }));
            } else {
                var tempStore = Ext.create('CasMobile.store.CarModels', { autoLoad: false });
                tempStore.load({
                    callback: function (recs, op, success) {
                        if (success) resolve(recs.map(function (r) { return r.getData(); }));
                        else resolve([]);
                        tempStore.destroy();
                    }
                });
            }
        });

        Promise.all([fetchProject, fetchCars]).then(function (results) {
            var binderList = results[0];
            var carModels = results[1];
            var datasetId = params.datasetId || params.ca_id;
            var gridParams = grid.params || {};

            var dbReq = indexedDB.open('CasOfflineDB', 2);
            dbReq.onupgradeneeded = function (e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains('evaluations')) {
                    db.createObjectStore('evaluations', { keyPath: '_compositeId' });
                }
            };
            dbReq.onsuccess = function (e) {
                var db = e.target.result;
                var tx = db.transaction(['evaluations'], 'readwrite');
                var store = tx.objectStore('evaluations');

                // Clear existing for this tab
                var cursorReq = store.openCursor();
                cursorReq.onsuccess = function (evt) {
                    var cursor = evt.target.result;
                    if (cursor) {
                        if (cursor.value._tabId === datasetId) cursor.delete();
                        cursor.continue();
                    }
                };

                binderList.forEach(function (row) {
                    row._tabId = datasetId;
                    row._compositeId = datasetId + '_' + row.bd_idx;
                    store.put(row);
                });
            };

            var cacheReq = indexedDB.open('CasMobileCache', 3);
            cacheReq.onsuccess = function (e) {
                var db = e.target.result;
                var tx = db.transaction(['gridData'], 'readwrite');
                var store = tx.objectStore('gridData');
                var cacheObj = {
                    projectName: gridParams.projectName || 'Unknown Project',
                    idStr: gridParams.idStr || datasetId,
                    ca_id: gridParams.ca_id || window.siteInfo.categories.evaluationDataCategory,
                    dataByBdIdx: binderList,
                    timestamp: (new Date()).getTime()
                };
                store.put(cacheObj, datasetId);
                if (carModels.length > 0) store.put(carModels, 'car_models');

                Ext.Msg.alert(CasMobile.util.Localization.get('main.success') || 'Success',
                    (CasMobile.util.Localization.get('upload.offlineDataSaved') || 'Offline data saved for ') + cacheObj.projectName);
            };
        }).catch(function (err) {
            console.error('Offline download failed:', err);
            Ext.Msg.alert('Error', 'Download failed: ' + err);
        });
    },

    onUpdateToServer: function () {
        var me = this;
        var loc = CasMobile.util.Localization;
        var mainView = me.getView();
        if (!window.isOnline) {
            Ext.Msg.alert(loc.get('main.warning'), loc.get('errors.networkConnection'));
            return;
        }

        var dbReq = indexedDB.open('CasMobileCache', 3);
        dbReq.onsuccess = function (e) {
            var db = e.target.result;
            var tx = db.transaction(['gridData'], 'readonly');
            var store = tx.objectStore('gridData');
            var getAll = store.getAll();
            var getKeys = store.getAllKeys();

            Promise.all([
                new Promise(function (r) { getAll.onsuccess = function (ev) { r(ev.target.result); }; }),
                new Promise(function (r) { getKeys.onsuccess = function (ev) { r(ev.target.result); }; })
            ]).then(function (results) {
                var dataList = results[0];
                var keyList = results[1];
                var syncList = [];

                for (var i = 0; i < dataList.length; i++) {
                    var key = keyList[i];
                    if (key === 'car_models') continue;
                    var item = dataList[i];
                    var records = Array.isArray(item) ? item : item.dataByBdIdx;
                    var pendingCount = 0;
                    if (records) {
                        pendingCount = records.filter(function (r) { return r.isUpdatedOffline; }).length;
                    }
                    if (pendingCount > 0) {
                        var dateStr = '';
                        if (item.timestamp) {
                            var d = new Date(item.timestamp);
                            dateStr = d.getFullYear().toString().slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + ('0' + d.getDate()).slice(-2);
                        }
                        syncList.push({
                            key: key,
                            records: records,
                            projectName: item.projectName || 'Unknown',
                            syncCount: pendingCount,
                            savedDate: dateStr,
                            ca_id: item.ca_id
                        });
                    }
                }

                if (syncList.length === 0) {
                    Ext.Msg.alert(loc.get('main.notice'), loc.get('upload.noNewOfflineDataSync'));
                    return;
                }

                me.showSyncDialog(syncList);
            });
        };
    },

    showSyncDialog: function (syncList) {
        var me = this;
        var loc = CasMobile.util.Localization;
        var store = Ext.create('Ext.data.Store', { data: syncList });

        var dialog = Ext.create('Ext.Dialog', {
            title: loc.get('main.selectProject') || 'Select Project',
            layout: 'fit',
            width: 500,
            height: '70%',
            closable: true,
            items: [{
                xtype: 'grid',
                store: store,
                columns: [
                    { text: 'Project', dataIndex: 'projectName', flex: 1 },
                    { text: 'Date', dataIndex: 'savedDate', width: 100, align: 'center' },
                    {
                        text: 'Pending',
                        dataIndex: 'syncCount',
                        width: 100,
                        align: 'center',
                        renderer: function (v) { return '<span style="color:red;font-weight:bold;">' + v + '</span>'; }
                    }
                ],
                listeners: {
                    itemtap: function (g, index, target, record) {
                        dialog.destroy();
                        me.startSync(record.getData());
                    }
                }
            }],
            buttons: [{ text: loc.get('main.cancel'), handler: function () { dialog.destroy(); } }]
        });
        dialog.show();
    },

    startSync: function (projectData) {
        var me = this;
        var loc = CasMobile.util.Localization;
        var view = me.getView();
        view.setMasked({ xtype: 'loadmask', message: loc.get('upload.syncingOfflineData') });

        var successCount = 0;
        var failCount = 0;
        var records = projectData.records.filter(function (r) { return r.isUpdatedOffline; });
        var total = records.length;

        if (total === 0) {
            view.setMasked(false);
            return;
        }

        var processSync = function (index) {
            if (index >= total) {
                view.setMasked(false);
                var callback = function () {
                    var grid = view.down('projectgrid');
                    if (grid && grid.params) me.onProjectSelected(grid.params);
                };
                if (failCount === 0) {
                    Ext.Msg.alert(loc.get('main.success'), (loc.get('upload.syncSuccess') || 'Successfully synced {0}').replace('{0}', successCount), callback);
                } else {
                    Ext.Msg.alert(loc.get('main.syncResult'), (loc.get('upload.syncCompleteWithErrors') || 'Sync complete with errors').replace('{0}', successCount).replace('{1}', failCount), callback);
                }
                return;
            }

            var rec = records[index];
            var bd_idx = rec.bd_idx;
            var bd_data = rec.bd_data || [];
            var roundData = bd_data.filter(function (c) { return c.cols_code && c.cols_code.startsWith('round') && c.isUpdatedOffline; });

            var roundSync = function (rIdx) {
                if (rIdx >= roundData.length) {
                    processSync(index + 1);
                    return;
                }
                var col = roundData[rIdx];
                var params = {
                    ca_id: projectData.ca_id,
                    bd_idx: bd_idx,
                    lastRound: 13 // Max allowed
                };
                params[col.cols_code] = col.data_val;

                Ext.Ajax.request({
                    url: CasMobile.APIs.UPDATE_DATA,
                    params: params,
                    withCredentials: true,
                    success: function (res) {
                        if (res.responseText.indexOf('true') !== -1) successCount++;
                        else failCount++;
                        roundSync(rIdx + 1);
                    },
                    failure: function () {
                        failCount++;
                        roundSync(rIdx + 1);
                    }
                });
            };
            roundSync(0);
        };

        processSync(0);
    },

    getOfflineProjectData: function (tabId) {
        var me = this;
        return new Promise(function (resolve) {
            var dbReq = indexedDB.open('CasOfflineDB', 2);
            dbReq.onsuccess = function (e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains('evaluations')) {
                    resolve(null);
                    return;
                }
                var tx = db.transaction(['evaluations'], 'readonly');
                var store = tx.objectStore('evaluations');
                var req = store.getAll();
                req.onsuccess = function (ev) {
                    var all = ev.target.result;
                    var filtered = all.filter(function (r) { return r._tabId === tabId; });
                    if (!filtered || filtered.length === 0) {
                        me.getLegacyOfflineProjectData(tabId).then(resolve);
                        return;
                    }
                    var maxRound = 0;
                    var mapped = filtered.map(function (row) {
                        var rec = Ext.apply({}, row);
                        if (rec.bd_data) {
                            rec.bd_data.forEach(function (col) {
                                if (col.cols_code && col.cols_code.indexOf('round') !== -1) {
                                    if (col.data_val) {
                                        try {
                                            var val = JSON.parse(col.data_val);
                                            rec[col.cols_code] = Array.isArray(val) ? val[0] : val;
                                            var rNum = parseInt(col.cols_code.replace('round', ''), 10);
                                            if (!isNaN(rNum) && rNum > maxRound) maxRound = rNum;
                                        } catch (e) { }
                                    }
                                } else {
                                    rec[col.cols_code] = col.data_val;
                                }
                            });
                        }
                        return rec;
                    });
                    resolve({ maxRound: maxRound, data: mapped });
                };
            };
            dbReq.onerror = function () { resolve(null); };
        });
    },

    getLegacyOfflineProjectData: function (tabId) {
        return new Promise(function (resolve) {
            var cacheReq = indexedDB.open('CasMobileCache', 3);
            cacheReq.onsuccess = function (e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains('gridData')) {
                    resolve(null);
                    return;
                }
                var tx = db.transaction(['gridData'], 'readonly');
                var store = tx.objectStore('gridData');
                var req = store.get(tabId);
                req.onsuccess = function (ev) {
                    var item = ev.target.result;
                    if (!item) { resolve(null); return; }
                    var records = Array.isArray(item) ? item : item.dataByBdIdx;
                    if (!records) { resolve(null); return; }
                    var maxRound = 0;
                    var mapped = records.map(function (row) {
                        var rec = Ext.apply({}, row);
                        if (rec.bd_data) {
                            rec.bd_data.forEach(function (col) {
                                if (col.cols_code && col.cols_code.indexOf('round') !== -1) {
                                    if (col.data_val) {
                                        try {
                                            rec[col.cols_code] = JSON.parse(col.data_val)[0];
                                            var rNum = parseInt(col.cols_code.replace('round', ''), 10);
                                            if (!isNaN(rNum) && rNum > maxRound) maxRound = rNum;
                                        } catch (e) { }
                                    }
                                } else {
                                    rec[col.cols_code] = col.data_val;
                                }
                            });
                        }
                        return rec;
                    });
                    resolve({ maxRound: maxRound, data: mapped });
                };
            };
            cacheReq.onerror = function () { resolve(null); };
        });
    },

    onScanQRCode: function () {
        var dialog = Ext.create('Ext.Dialog', {
            title: 'QR CODE',
            closable: true,
            layout: 'vbox',
            padding: 20,
            items: [{ xtype: 'container', itemId: 'qrContainer', width: 130, height: 130 }],
            listeners: {
                painted: function (comp) {
                    var container = comp.down('#qrContainer');
                    new QRCode(container.el.dom, {
                        text: Actor.userInfo.nv_id,
                        width: 130,
                        height: 130,
                        correctLevel: QRCode.CorrectLevel.M
                    });
                    comp.center();
                }
            }
        });
        dialog.show();
    },
    /**
     * 다은로드 app
     */
    onDownloadApk: function () {
        var loc = CasMobile.util.Localization;
        var dialog = Ext.create('Ext.Dialog', {
            title: loc.get('apkInstallTitle') || 'CPR MOBILE App Installation',
            closable: true,
            maximizable: false,
            width: '90%',
            maxWidth: 400,
            bodyPadding: 20,
            items: [{ xtype: 'component', html: loc.get('apkInstallGuide') }],
            bbar: [{
                text: loc.get('main.close') || 'Close',
                flex: 1,
                margin: '0 5 0 0',
                handler: function () { dialog.close(); }
            }, {
                text: 'Download APK',
                ui: 'action',
                flex: 1,
                margin: '0 0 0 5',
                hidden: false,
                handler: function () {
                    var brand = window.BRAND || '';
                    if (brand === 'hyundai') brand = '';

                    var host = brand ? brand + '.hmgcolor.com' : 'hmgcolor.com';
                    var url = 'https://' + host + '/binder/down/5423/0';

                    console.log('Final APK Download URL: ' + url);

                    var isMobile = !!(window.cordova || Ext.os.is.Android || Ext.os.is.Phone || window.location.protocol === 'file:');

                    if (isMobile) {
                        dialog.close();
                        var webUrl = 'https://' + host + '/actor/m/index.html';
                        Ext.Msg.confirm(
                            loc.get('main.warning') || 'Notice',
                            (loc.get('downloadWebRedirectMsg') || 'APK downloads require a browser login. Go to the web version?'),
                            function (choice) {
                                if (choice === 'yes') {
                                    if (window.cordova && window.cordova.InAppBrowser) {
                                        window.cordova.InAppBrowser.open(webUrl, '_system');
                                    } else {
                                        window.open(webUrl, '_blank');
                                    }
                                }
                            }
                        );
                    } else {
                        if (window.cordova && window.cordova.InAppBrowser) {
                            window.cordova.InAppBrowser.open(url, '_system');
                        } else {
                            window.location.href = url;
                        }
                        dialog.close();
                    }
                }
            }]
        });
        dialog.show();
    },

    onMainViewPainted: function () {
        Ext.defer(function () {
            this.onShowProjectMenu();
        }, 500, this);
    },

    onShowProjectMenu: function () {
        var menu = this.getView().projectMenu;
        if (!menu || menu.destroyed) {
            menu = Ext.create('CasMobile.view.ProjectMenu');
            this.getView().projectMenu = menu;
            Ext.Viewport.add(menu);
        }
        menu.setHidden(false);
    }
});
