Ext.define('CasMobile.view.main.MainController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.maincontroller',

    isOffline: false,

    init: function () {
        let me = this;
        me.isOffline = !window.isOnline;

        CasMobile.app.on('projectselected', this.onProjectSelected, this);

        if (!me.isOffline) {
            me.showStartPopups();
        }

        document.addEventListener('deviceready', function () {
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.notification && window.cordova.plugins.notification.local) {
                window.cordova.plugins.notification.local.on('click', function (notification) {
                    let scheduleView = me.getView().down('cas-schedule');
                    if (scheduleView) {
                        me.getView().setActiveItem(scheduleView);
                        let data = notification.data;
                        if (typeof data === 'string') {
                            try { data = JSON.parse(data); } catch (e) { }
                        }
                        if (data && data.itemStr) {
                            let ctrl = scheduleView.getController();
                            if (ctrl && ctrl.openPopupEventAsync) {
                                try {
                                    let item = JSON.parse(data.itemStr);
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
        // 鍮꾩＜???됯? ???대┃ ???앹뾽???꾩슦怨?????쑝濡??대룞?섎룄濡?泥섎━ (湲곕뒫???륁뻔)
        if (toValue && toValue.getItemId() === 'visualEvalTab') {
            this.onVisualEvaluation();

            let homeTab = container.down('#homeTab');
            if (homeTab && fromValue !== homeTab) {
                container.setActiveItem(homeTab);
            }
            return false;
        }

    },

    showStartPopups: function () {
        let me = this;
        let categories = [
            { categoryId: window.siteInfo.categories.calendar['public'], params: {} },
            { categoryId: window.siteInfo.categories.calendar['private'], params: { participant: '|' + window.Actor.userInfo.nv_id + '|' } },
            { categoryId: window.siteInfo.categories.calendar['private'], params: { participant: '|' + window.Actor.userInfo.nv_group + '|' } }
        ];

        let popupCount = 0;
        categories.forEach(function (cat) {
            let requestParams = Ext.apply({
                popup: 'yes',
                ca_order: 2,
                ca_id: cat.categoryId
            }, cat.params);

            let url = CasMobile.APIs.getFullUrl(CasMobile.APIs.LIST_C);
            Ext.Ajax.request({
                url: url,
                method: 'GET',
                params: requestParams,
                success: function (response) {
                    try {
                        let data = JSON.parse(response.responseText);
                        if (data && data.binderListBeanList) {
                            data.binderListBeanList.forEach(function (item) {
                                if (me.getCookieValue('notice_' + item.bd_idx) === '1') {
                                    return;
                                }
                                let duration = parseInt(item.c_duration, 10) || 7;
                                let durationMs = duration * 24 * 60 * 60 * 1000;
                                let startDate = new Date(item.c_start) || new Date(item.bd_regdate);
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
        let localVal = window.localStorage.getItem(name);
        if (localVal && localVal === '1') {
            let expires = window.localStorage.getItem(name + '_expires');
            if (!expires || new Date() < new Date(expires)) {
                return '1';
            } else {
                window.localStorage.removeItem(name);
                window.localStorage.removeItem(name + '_expires');
            }
        }
        let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) return match[2];
        return '';
    },

    setCookieValue: function (name, value, days) {
        let date = new Date();
        date.setDate(date.getDate() + days);
        document.cookie = name + '=' + value + '; path=/; expires=' + date.toGMTString() + ';';
        window.localStorage.setItem(name, value);
        window.localStorage.setItem(name + '_expires', date.toISOString());
    },

    createModernPopup: function (item, index) {
        let me = this;
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.notification && window.cordova.plugins.notification.local) {
            let div = document.createElement('div');
            div.innerHTML = item.bd_content;
            let text = div.textContent || div.innerText || '';
            text = text.replace(/\s+/g, ' ').trim();

            let scheduleNotification = function () {
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

        let loc = CasMobile.util.Localization;
        let dialog = Ext.create('Ext.Dialog', {
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

    updateMainTitle: function (projectName) {
        if (projectName !== undefined) {
            this.currentProjectName = projectName || '';
        }

        const brand = typeof BRAND !== 'undefined' ? BRAND : (window.BRAND || 'CAS');
        const title = String(brand || 'CAS').toUpperCase() + ' CPR SYSTEM';
        const toolbar = this.getView().down('#mainToolbar');
        const selectedProjectName = this.currentProjectName;

        if (toolbar) {
            toolbar.setTitle(selectedProjectName ? title + ' - ' + selectedProjectName : title);
        }
    },

    onProjectSelected: function (params, callback) {
        let me = this;
        let homeTab = me.getView().down('#homeTab');
        if (!homeTab) return;

        me.getView().setActiveItem(homeTab);
        me.updateMainTitle(params && params.projectName);
        me.isOffline = !window.isOnline;

        if (me.isOffline) {
            console.warn('Offline mode ??loading cached project data');
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

            let grid = Ext.create('CasMobile.view.project.ProjectGrid', {
                flex: 1,
                params: params,
                maxRound: maxRound
            });

            homeTab.add(grid);
            let store = grid.getStore();
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
        let me = this;
        let homeTab = me.getView().down('#homeTab');
        if (!homeTab) return Promise.resolve();

        homeTab.setHtml('');
        homeTab.setLayout({ type: 'vbox', align: 'stretch' });
        homeTab.setMasked({ xtype: 'loadmask', message: 'Loading Offline Data...' });

        return me.getOfflineProjectData(params.datasetId || params.ca_id).then(function (result) {
            if (!result) {
                homeTab.setMasked(false);
                return;
            }

            let maxRound = result.maxRound;
            let data = result.data;

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
        const me = this;
        if (maxRound <= 0) return;

        const containerRow = tab.down('#roundBtnRow');
        if (containerRow) containerRow.destroy();

        const color = window.isOnline ? siteInfo.onlineColor : siteInfo.offlineColor;
        const items = [{
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

        const switchRound = function (btn) {
            const grid = tab.down('projectgrid');
            if (!grid) return;

            const r = btn.round;
            const label = btn.up().down('#selectedRound');
            if (label) label.setHtml(r);

            grid.query('column').forEach(function (col) {
                const colRound = col.round;
                if (colRound) {
                    const hideMeasurement = col.measurementEvaluationGroup &&
                        grid.getMeasurementEvaluationHiddenForRound &&
                        grid.getMeasurementEvaluationHiddenForRound(colRound);

                    col.setHidden(colRound !== r || hideMeasurement);
                }
            });

            Ext.defer(function () {
                const scroller = grid.getScrollable();
                if (scroller) {
                    const y = scroller.getPosition().y;
                    const maxX = scroller.getMaxPosition().x;
                    scroller.scrollTo(maxX, y, { animation: true });
                }
            }, 150);
        };

        for (let i = 1; i <= maxRound; i++) {
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
                    const grid = tab.down('projectgrid');
                    if (!grid) return;
                    const newRound = maxRound + 1;
                    const store = grid.getStore();
                    if (!store) return;

                    const records = store.getRange() || [];
                    records.forEach(function (rec) {
                        rec.set('round' + newRound, { round: newRound });
                    });

                    me._createRoundButtons(tab, newRound);
                    grid.setMaxRound(newRound);
                    grid.buildColumns(newRound);

                    Ext.defer(function () {
                        const buttons = tab.query('button');
                        const nextBtn = buttons.find(function (b) { return b.round === newRound; });
                        if (nextBtn) switchRound(nextBtn);
                    }, 100);
                }
            });
        }

        tab.insert(0, {
            xtype: 'container',
            itemId: 'roundBtnRow',
            width: '100%',
            layout: { type: 'hbox', align: 'center' },
            padding: '10 10 10 10',
            items: [{
                xtype: 'container',
                width: 50
            }, {
                xtype: 'container',
                itemId: 'roundBtnContainer',
                flex: 1,
                layout: { type: 'hbox', pack: 'center', align: 'center' },
                items: items
            }, { // 스토어 초기화
                xtype: 'button',
                iconCls: 'x-fa fas fa-sync-alt',
                ui: 'action',
                width: 40,
                height: 40,
                cls: 'round-btn',
                handler: 'onClearSearchFilter'
            }, {// 검색
                xtype: 'button',
                iconCls: 'x-fa fa-search',
                ui: 'action',
                width: 40,
                height: 40,
                cls: 'round-btn',
                handler: 'onSearch'
            }]
        });
    },

    getMaxRound: function (datasetId) {
        return new Promise(function (resolve) {
            if (!window.siteInfo || !window.siteInfo.categories) {
                resolve(0);
                return;
            }
            let url = CasMobile.APIs.getFullUrl(CasMobile.APIs.COLS_DATA_SUM);
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
                        let data = Ext.decode(response.responseText);
                        let max = (data && data[0] && data[0].calc) ? data[0].calc.max : 0;
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
        let me = this;
        let mainView = me.getView();
        let grid = mainView.down('projectgrid');
        if (!grid || !record) return;

        if (roundInfo) {
            let round = (typeof roundInfo === 'object') ? roundInfo.round : roundInfo;
            let container = mainView.down('#roundBtnContainer');
            if (container) {
                let btns = container.query('button');
                let btn = btns.find(function (b) { return b.round === round; });
                if (btn && btn.getHandler()) {
                    btn.getHandler().call(btn, btn);
                }
            }
        }
        grid.setSelection(record);
        grid.ensureVisible(record);
    },

    onVisualEvaluation: function () {
        let view = Ext.ComponentQuery.query('visualevaluationwindow');
        if (view && view.length > 0) {
            view[0].show();
            return;
        }

        let homeTab = this.getView().down('#homeTab');
        let grid = homeTab.down('projectgrid');
        if (!grid) {
            Ext.Msg.alert('Notice', CasMobile.util.Localization.get('main.selectProject'));
            return;
        }
        let maxRound = grid.getMaxRound();
        Ext.create('CasMobile.view.evaluate.VisualEvaluationWindow', { maxRound: maxRound }).show();
    },

    onSearch: function () {
        const me = this;
        const homeTab = me.getView().down('#homeTab');
        const grid = homeTab ? homeTab.down('projectgrid') : null;
        if (!grid) {
            Ext.Msg.alert('Notice', CasMobile.util.Localization.get('main.selectProject'));
            return;
        }

        const store = grid.getStore();
        if (!store) return;

        const searchDialog = Ext.create('Ext.Dialog', {
            title: 'Search',
            closable: true,
            width: '90%',
            maxWidth: 460,
            autoHide: false,
            items: [{
                xtype: 'container',
                padding: 16,
                layout: 'vbox',
                defaults: {
                    xtype: 'textfield',
                    labelAlign: 'top',
                    clearable: true
                },
                items: [{
                    itemId: 'searchKeyword',
                    label: 'Keyword',
                    placeHolder: 'All fields / round values'
                }, {
                    itemId: 'searchAssemblyCo',
                    label: 'Assembly Co',
                    placeHolder: 'assemblyCo only'
                }, {
                    itemId: 'searchRawMaterialCo',
                    label: 'Raw Material Co',
                    placeHolder: 'rawMaterialCo only'
                }]
            }],
            buttons: [{
                text: 'Clear',
                handler: function (btn) {
                    const dialog = btn.up('dialog');
                    const keywordField = dialog.down('#searchKeyword');
                    const assemblyField = dialog.down('#searchAssemblyCo');
                    const rawField = dialog.down('#searchRawMaterialCo');
                    if (keywordField) keywordField.setValue('');
                    if (assemblyField) assemblyField.setValue('');
                    if (rawField) rawField.setValue('');
                    store.clearFilter();
                }
            }, {
                text: 'Search',
                ui: 'action',
                handler: function (btn) {
                    const dialog = btn.up('dialog');
                    const keywordField = dialog.down('#searchKeyword');
                    const assemblyField = dialog.down('#searchAssemblyCo');
                    const rawField = dialog.down('#searchRawMaterialCo');
                    const keyword = keywordField ? (keywordField.getValue() || '') : '';
                    const assemblyCoKeyword = assemblyField ? (assemblyField.getValue() || '') : '';
                    const rawMaterialCoKeyword = rawField ? (rawField.getValue() || '') : '';

                    const normalizedKeyword = keyword.toLowerCase().trim();
                    const normalizedAssembly = assemblyCoKeyword.toLowerCase().trim();
                    const normalizedRawMaterial = rawMaterialCoKeyword.toLowerCase().trim();

                    store.clearFilter();

                    if (!normalizedKeyword && !normalizedAssembly && !normalizedRawMaterial) {
                        dialog.hide();
                        return;
                    }

                    const contains = function (value, needle) {
                        if (!needle) return true;
                        if (value === null || value === undefined) return false;
                        return String(value).toLowerCase().indexOf(needle) !== -1;
                    };

                    store.filterBy(function (record) {
                        const assemblyMatch = contains(record.get('assemblyCo'), normalizedAssembly);
                        if (!assemblyMatch) return false;

                        const rawMaterialMatch = contains(record.get('rawMaterialCo'), normalizedRawMaterial);
                        if (!rawMaterialMatch) return false;

                        if (!normalizedKeyword) return true;

                        const fields = ['partNumber', 'assyTrim', 'partName2', 'assemblyCo', 'rawMaterialCo', 'bd_subject'];
                        const matched = fields.some(function (field) {
                            return contains(record.get(field), normalizedKeyword);
                        });
                        if (matched) return true;

                        const maxRound = grid.getMaxRound ? grid.getMaxRound() : 0;
                        for (let i = 1; i <= maxRound; i++) {
                            const roundData = record.get('round' + i);
                            if (!roundData) continue;
                            for (const k in roundData) {
                                if (!roundData.hasOwnProperty(k)) continue;
                                if (contains(roundData[k], normalizedKeyword)) {
                                    return true;
                                }
                            }
                        }

                        return false;
                    });

                    dialog.hide();
                }
            }, {
                text: 'Cancel',
                handler: function (btn) {
                    btn.up('dialog').hide();
                }
            }]
        });

        searchDialog.show();
    },

    onClearSearchFilter: function () {
        const homeTab = this.getView().down('#homeTab');
        const grid = homeTab ? homeTab.down('projectgrid') : null;
        if (!grid) return;

        const store = grid.getStore();
        if (!store) return;

        store.clearFilter();
    },

    onDownloadOfflineData: function () {
        let me = this;
        let grid = me.getView().down('projectgrid');
        if (!grid) {
            Ext.Msg.alert('Notice', loc.selectProjectFirst);
            return;
        }

        let store = grid.getStore();
        let proxy = store.getProxy();
        let url = proxy.url;
        let params = Ext.apply({ page_size: 2000 }, proxy.extraParams);

        let fetchProject = new Promise(function (resolve, reject) {
            Ext.Ajax.request({
                url: url,
                method: 'GET',
                params: params,
                withCredentials: true,
                success: function (res) {
                    let data = Ext.decode(res.responseText);
                    if (data && data.binderList) resolve(data.binderList);
                    else reject('Invalid project data');
                },
                failure: function (err) { reject(err); }
            });
        });

        let fetchCars = new Promise(function (resolve) {
            let carStore = Ext.getStore('carModelStore');
            if (carStore && carStore.isLoaded() && carStore.getCount() > 0) {
                resolve(carStore.getRange().map(function (r) { return r.getData(); }));
            } else {
                let tempStore = Ext.create('CasMobile.store.CarModels', { autoLoad: false });
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
            let binderList = results[0];
            let carModels = results[1];
            let datasetId = params.datasetId || params.ca_id;
            let gridParams = grid.params || {};

            let dbReq = indexedDB.open('CasOfflineDB', 2);
            dbReq.onupgradeneeded = function (e) {
                let db = e.target.result;
                if (!db.objectStoreNames.contains('evaluations')) {
                    db.createObjectStore('evaluations', { keyPath: '_compositeId' });
                }
            };
            dbReq.onsuccess = function (e) {
                let db = e.target.result;
                let tx = db.transaction(['evaluations'], 'readwrite');
                let store = tx.objectStore('evaluations');

                // Clear existing for this tab
                let cursorReq = store.openCursor();
                cursorReq.onsuccess = function (evt) {
                    let cursor = evt.target.result;
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

            let cacheReq = indexedDB.open('CasMobileCache', 3);
            cacheReq.onsuccess = function (e) {
                let db = e.target.result;
                let tx = db.transaction(['gridData'], 'readwrite');
                let store = tx.objectStore('gridData');
                let cacheObj = {
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
        let me = this;
        let loc = CasMobile.util.Localization;
        let mainView = me.getView();
        if (!window.isOnline) {
            Ext.Msg.alert(loc.get('main.warning'), loc.get('errors.networkConnection'));
            return;
        }

        let dbReq = indexedDB.open('CasMobileCache', 3);
        dbReq.onsuccess = function (e) {
            let db = e.target.result;
            let tx = db.transaction(['gridData'], 'readonly');
            let store = tx.objectStore('gridData');
            let getAll = store.getAll();
            let getKeys = store.getAllKeys();

            Promise.all([
                new Promise(function (r) { getAll.onsuccess = function (ev) { r(ev.target.result); }; }),
                new Promise(function (r) { getKeys.onsuccess = function (ev) { r(ev.target.result); }; })
            ]).then(function (results) {
                let dataList = results[0];
                let keyList = results[1];
                let syncList = [];

                for (let i = 0; i < dataList.length; i++) {
                    let key = keyList[i];
                    if (key === 'car_models') continue;
                    let item = dataList[i];
                    let records = Array.isArray(item) ? item : item.dataByBdIdx;
                    let pendingCount = 0;
                    if (records) {
                        pendingCount = records.filter(function (r) { return r.isUpdatedOffline; }).length;
                    }
                    if (pendingCount > 0) {
                        let dateStr = '';
                        if (item.timestamp) {
                            let d = new Date(item.timestamp);
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
        let me = this;
        let loc = CasMobile.util.Localization;
        let store = Ext.create('Ext.data.Store', { data: syncList });

        let dialog = Ext.create('Ext.Dialog', {
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
        let me = this;
        let loc = CasMobile.util.Localization;
        let view = me.getView();
        view.setMasked({ xtype: 'loadmask', message: loc.get('upload.syncingOfflineData') });

        let successCount = 0;
        let failCount = 0;
        let records = projectData.records.filter(function (r) { return r.isUpdatedOffline; });
        let total = records.length;

        if (total === 0) {
            view.setMasked(false);
            return;
        }

        let processSync = function (index) {
            if (index >= total) {
                view.setMasked(false);
                let callback = function () {
                    let grid = view.down('projectgrid');
                    if (grid && grid.params) me.onProjectSelected(grid.params);
                };
                if (failCount === 0) {
                    Ext.Msg.alert(loc.get('main.success'), (loc.get('upload.syncSuccess') || 'Successfully synced {0}').replace('{0}', successCount), callback);
                } else {
                    Ext.Msg.alert(loc.get('main.syncResult'), (loc.get('upload.syncCompleteWithErrors') || 'Sync complete with errors').replace('{0}', successCount).replace('{1}', failCount), callback);
                }
                return;
            }

            let rec = records[index];
            let bd_idx = rec.bd_idx;
            let bd_data = rec.bd_data || [];
            let roundData = bd_data.filter(function (c) { return c.cols_code && c.cols_code.startsWith('round') && c.isUpdatedOffline; });

            let roundSync = function (rIdx) {
                if (rIdx >= roundData.length) {
                    processSync(index + 1);
                    return;
                }
                let col = roundData[rIdx];
                let params = {
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
        let me = this;
        return new Promise(function (resolve) {
            let dbReq = indexedDB.open('CasOfflineDB', 2);
            dbReq.onsuccess = function (e) {
                let db = e.target.result;
                if (!db.objectStoreNames.contains('evaluations')) {
                    resolve(null);
                    return;
                }
                let tx = db.transaction(['evaluations'], 'readonly');
                let store = tx.objectStore('evaluations');
                let req = store.getAll();
                req.onsuccess = function (ev) {
                    let all = ev.target.result;
                    let filtered = all.filter(function (r) { return r._tabId === tabId; });
                    if (!filtered || filtered.length === 0) {
                        me.getLegacyOfflineProjectData(tabId).then(resolve);
                        return;
                    }
                    let maxRound = 0;
                    let mapped = filtered.map(function (row) {
                        let rec = Ext.apply({}, row);
                        if (rec.bd_data) {
                            rec.bd_data.forEach(function (col) {
                                if (col.cols_code && col.cols_code.indexOf('round') !== -1) {
                                    if (col.data_val) {
                                        try {
                                            let val = JSON.parse(col.data_val);
                                            rec[col.cols_code] = Array.isArray(val) ? val[0] : val;
                                            let rNum = parseInt(col.cols_code.replace('round', ''), 10);
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
            let cacheReq = indexedDB.open('CasMobileCache', 3);
            cacheReq.onsuccess = function (e) {
                let db = e.target.result;
                if (!db.objectStoreNames.contains('gridData')) {
                    resolve(null);
                    return;
                }
                let tx = db.transaction(['gridData'], 'readonly');
                let store = tx.objectStore('gridData');
                let req = store.get(tabId);
                req.onsuccess = function (ev) {
                    let item = ev.target.result;
                    if (!item) { resolve(null); return; }
                    let records = Array.isArray(item) ? item : item.dataByBdIdx;
                    if (!records) { resolve(null); return; }
                    let maxRound = 0;
                    let mapped = records.map(function (row) {
                        let rec = Ext.apply({}, row);
                        if (rec.bd_data) {
                            rec.bd_data.forEach(function (col) {
                                if (col.cols_code && col.cols_code.indexOf('round') !== -1) {
                                    if (col.data_val) {
                                        try {
                                            rec[col.cols_code] = JSON.parse(col.data_val)[0];
                                            let rNum = parseInt(col.cols_code.replace('round', ''), 10);
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
        let dialog = Ext.create('Ext.Dialog', {
            title: 'QR CODE',
            closable: true,
            layout: 'vbox',
            padding: 20,
            items: [{ xtype: 'container', itemId: 'qrContainer', width: 130, height: 130 }],
            listeners: {
                painted: function (comp) {
                    let container = comp.down('#qrContainer');
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
     * ?ㅼ?濡쒕뱶 app
     */
    onDownloadApk: function () {
        let loc = CasMobile.util.Localization;
        let dialog = Ext.create('Ext.Dialog', {
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
                    let brand = window.BRAND || '';
                    if (brand === 'hyundai') brand = '';

                    let host = brand ? brand + '.hmgcolor.com' : 'hmgcolor.com';
                    let url = 'https://' + host + '/binder/down/5423/0';

                    console.log('Final APK Download URL: ' + url);

                    let isMobile = !!(window.cordova || Ext.os.is.Android || Ext.os.is.Phone || window.location.protocol === 'file:');

                    if (isMobile) {
                        dialog.close();
                        let webUrl = 'https://' + host + '/actor/m/index.html';
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
        let menu = this.getView().projectMenu;
        if (!menu || menu.destroyed) {
            menu = Ext.create('CasMobile.view.ProjectMenu');
            this.getView().projectMenu = menu;
            Ext.Viewport.add(menu);
        }
        menu.setHidden(false);
    }
});
