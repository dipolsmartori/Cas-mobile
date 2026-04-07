Ext.define('CasMobile.view.ProjectMenu', {
    extend: 'Ext.Panel',
    xtype: 'projectmenu',

    requires: [
        'Ext.dataview.DataView',
        'CasMobile.store.CarModels',
        'Ext.Toast',
        'CasMobile.util.Util'
    ],

    floated: true,
    modal: false, 
    left: 0,
    top: 0,
    bottom: 0,
    width: '85%',
    maxWidth: 400,
    height: '100%',

    showAnimation: {
        type: 'slide',
        direction: 'right'
    },
    hideAnimation: {
        type: 'slide',
        direction: 'left',
        out: true
    },

    scrollable: true,
    layout: 'fit',

    initialize: function () {
        this.callParent();

        var me = this;
        var btnHeight = 60; // Slightly larger for touch

        // Template for the data view items matching the requested design
        var tpl = new Ext.XTemplate(
            '<div class="model-view-item" style="min-height: ' + btnHeight + 'px; display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #eee; background: white;">',
               '<div class="model-icon" style="background-color: {bgColor}; min-width: 40px; width: 40px; height: 40px; border-radius: 4px; color: white; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; font-size: 14px;">{initials}</div>',
               '<span class="model-text" style="flex: 1; font-size: 16px; font-weight: 400; color: #333;">{bd_subject}</span>',
               '<div class="model-actions" style="display: flex; gap: 8px;">',
                  '<div class="action-btn p1" data-id="{bd_idx}" data-type="p1" style="padding: 8px 12px; background: black; color: white; border-radius: 0px; font-size: 14px; font-weight: bold; cursor: pointer;">P1</div>',
                  '<div class="action-btn p2" data-id="{bd_idx}" data-type="p2" style="padding: 8px 12px; background: black; color: white; border-radius: 0px; font-size: 14px; font-weight: bold; cursor: pointer;">P2</div>',
                  '<div class="action-btn m" data-id="{bd_idx}" data-type="m" style="padding: 8px 12px; background: black; color: white; border-radius: 0px; font-size: 14px; font-weight: bold; cursor: pointer;">M</div>',
               '</div>',
            '</div>'
        );

        var store = Ext.create('CasMobile.store.CarModels', {
            autoLoad: false,
            proxy: {
                url: CasMobile.APIs.getFullUrl(CasMobile.APIs.LIST_C),
                extraParams: {
                    ca_id: window.siteInfo.categories.carModels,
                    o: 's',
                    hide: 'NO'
                }
            },
            listeners: {
                load: function (store, records, successful, operation) {
                    if (!successful) {
                        console.error('Store load failed', operation);
                        Ext.toast('Failed to load projects');
                    } else {
                        if (records.length === 0) {
                            Ext.toast('No projects found');
                        }
                    }
                }
            }
        });

        this.add({
            xtype: 'dataview',
            itemId: 'projectDataView',
            store: store,
            cls: 'project-menu-dataview',
            itemTpl: tpl,
            listeners: {
                itemtap: function (view, index, target, record, e) {
                    var targetEl = e.target;
                    if (targetEl.classList.contains('action-btn')) {
                        var type = targetEl.getAttribute('data-type');
                        var idStr = type + '_' + record.get('bd_idx');
                        var params = {
                            ca_id: window.siteInfo.categories.evaluationDataCategory,
                            datasetId: idStr,
                            idStr: idStr,
                            projectName: record.get('bd_subject')
                        };
                        if (Actor.userInfo.nv_level < 5) {
                            params.autho = '|' + Actor.userInfo.nv_group + '|';
                        }
                        
                        me.setHidden(true);

                        CasMobile.app.fireEvent('projectselected', params, function () {
                            if (!me.destroyed) me.setHidden(true);
                        });
                        Ext.toast('Loading ' + record.get('bd_subject') + ' (' + type + ')');
                    }
                }
            }
        });

        this.add({
            xtype: 'toolbar',
            docked: 'top',
            title: 'PROJECTS',
            items: [
                {
                    iconCls: 'x-fa fa-sort-alpha-asc',
                    text: 'Sort',
                    menu: {
                        items: [
                            {
                                text: 'Name (Asc)',
                                handler: function () { me.sortStore('bd_subject', 'ASC'); }
                            },
                            {
                                text: 'Name (Desc)',
                                handler: function () { me.sortStore('bd_subject', 'DESC'); }
                            },
                            {
                                text: 'Date (Asc)',
                                handler: function () { me.sortStore('bd_regdate', 'ASC'); }
                            },
                            {
                                text: 'Date (Desc)',
                                handler: function () { me.sortStore('bd_regdate', 'DESC'); }
                            }
                        ]
                    }
                },
                {
                    xtype: 'spacer'
                },
                {
                    iconCls: 'x-fa fa-times',
                    align: 'right',
                    handler: function () {
                        me.setHidden(true);
                    }
                }
            ]
        });

        if (CasMobile.util.Util.setOnlineStatus()) {
            me.down('#projectDataView').getStore().load();
        } else {
            me.loadOfflineCarModels();
        }
    },

    sortStore: function (field, direction) {
        var dataview = this.down('#projectDataView');
        if (dataview) {
            var store = dataview.getStore();
            if (store) {
                store.sort(field, direction);
            }
        }
    },

    loadOfflineCarModels: function () {
        var me = this;
        var dataview = me.down('#projectDataView');

        var req = indexedDB.open('CasMobileCache', 3);

        req.onupgradeneeded = function (e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains('gridData')) {
                db.createObjectStore('gridData');
            }
        };

        req.onerror = function (e) {
            console.error('Failed to open CasMobileCache:', e);
            Ext.toast('Failed to access offline storage.');
        };

        req.onsuccess = function (e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains('gridData')) {
                return;
            }

            var tx = db.transaction(['gridData'], 'readonly');
            var store = tx.objectStore('gridData');
            var getReq = store.get('car_models');

            getReq.onsuccess = function (e) {
                var data = e.target.result;
                if (data && Array.isArray(data) && data.length > 0) {
                    var storeObj = dataview.getStore();
                    if (storeObj) {
                        storeObj.loadData(data);
                        Ext.toast('Loaded cached projects');
                    }
                }
            };
        };
    },

    onBodyTap: function (e) {
        if (!this.el.contains(e.target)) {
            this.hide();
        }
    },

    listeners: {
        painted: function () {
            var dataview = this.down('#projectDataView');
            if (dataview) {
                if (!CasMobile.util.Util.setOnlineStatus()) {
                    this.loadOfflineCarModels();
                }
            }
        },
        show: function (sender) {
            Ext.defer(function () {
                Ext.getBody().on('tap', sender.onBodyTap, sender);
            }, 100);
        },
        hide: function (sender) {
            Ext.getBody().un('tap', sender.onBodyTap, sender);
        }
    }
});
