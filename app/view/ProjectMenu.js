Ext.define('CasMobile.view.ProjectMenu', {
    extend: 'Ext.Panel',
    xtype: 'projectmenu',

    requires: [
        'Ext.dataview.DataView',
        'Ext.field.Search',
        'Ext.grid.PagingToolbar',
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
            pageSize: 20,
            proxy: {
                url: CasMobile.APIs.getFullUrl(CasMobile.APIs.LIST_C),
                limitParam: 'page_size',
                extraParams: {
                    ca_id: window.siteInfo.categories.carModels,
                    o: 's',
                    hide: 'NO'
                }
            },
            listeners: {
                beforeload: function () {
                    me.setProjectPagingLoading(true);
                },
                load: function (store, records, successful, operation) {
                    me.setProjectPagingLoading(false);
                    if (!successful) {
                        console.error('Store load failed', operation);
                        Ext.toast('Failed to load projects');
                    } else {
                        me.syncProjectPagingToolbar(store);
                        const dataview = me.down('#projectDataView');
                        const scroller = dataview && dataview.getScrollable();

                        if (scroller) scroller.scrollTo(0, 0);

                        if (records.length === 0) {
                            Ext.toast('No projects found');
                        }
                    }
                }
            }
        });

        this.projectOriginalParams = Ext.apply({}, store.getProxy().getExtraParams());

        this.add({
            xtype: 'pagingtoolbar',
            itemId: 'projectPagingToolbar',
            docked: 'bottom',
            hidden: true,
            prevButton: {
                width: 34,
                tooltip: 'Previous page',
                handler: function () {
                    me.moveProjectPage(-1);
                }
            },
            nextButton: {
                width: 34,
                tooltip: 'Next page',
                handler: function () {
                    me.moveProjectPage(1);
                }
            },
            summaryComponent: {
                width: 72,
                html: '1 / 1 (0)'
            },
            sliderField: {
                width: 92,
                liveUpdate: false,
                minValue: 1,
                maxValue: 1,
                listeners: {
                    change: function (slider, value) {
                        if (!me.syncingProjectPagingToolbar) {
                            me.loadProjectPage(Math.round(value));
                        }
                    }
                }
            }
        });

        const projectPagingToolbar = this.down('#projectPagingToolbar');
        if (projectPagingToolbar) {
            projectPagingToolbar.add([
                {
                    xtype: 'spacer',
                    width: 4
                },
                {
                    xtype: 'searchfield',
                    itemId: 'projectSearchField',
                    width: 96,
                    placeholder: 'Search',
                    listeners: {
                        action: function (field) {
                            me.applyProjectSearch(field.getValue());
                        },
                        clearicontap: function () {
                            me.resetProjectSearch();
                        }
                    }
                },
                {
                    xtype: 'button',
                    itemId: 'projectSearchReset',
                    iconCls: 'x-fa fa-times',
                    width: 34,
                    tooltip: 'Reset search',
                    disabled: true,
                    handler: function () {
                        me.resetProjectSearch();
                    }
                }
            ]);
        }

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

    setProjectPagingLoading: function (loading) {
        const dataview = this.down('#projectDataView');

        if (dataview) {
            dataview.setMasked(loading ? { xtype: 'loadmask' } : false);
        }
    },

    moveProjectPage: function (offset) {
        const dataview = this.down('#projectDataView');
        const store = dataview && dataview.getStore();
        const currentPage = store ? store.currentPage || 1 : 1;

        this.loadProjectPage(currentPage + offset);
    },

    loadProjectPage: function (page) {
        const dataview = this.down('#projectDataView');
        const store = dataview && dataview.getStore();
        const totalPages = this.projectTotalPages || 1;

        page = Math.max(1, Math.min(totalPages, parseInt(page, 10) || 1));

        if (store && page !== store.currentPage) {
            console.info('[ProjectMenu paging] loading page', {
                extPage: page,
                serverPage: page - 1
            });
            store.loadPage(page);
        }
    },

    getProjectSearchParams: function (searchValue) {
        const params = Ext.apply({}, this.projectOriginalParams || {});
        const pagingParams = ['page', 'page_size', 'start', 'limit', 'se_subject'];
        const value = String(searchValue || '').trim();

        pagingParams.forEach(function (key) {
            delete params[key];
        });

        if (value) {
            params.se_subject = value;
        }

        return params;
    },

    applyProjectSearch: function (searchValue) {
        const dataview = this.down('#projectDataView');
        const store = dataview && dataview.getStore();
        const value = String(searchValue || '').trim();
        const resetButton = this.down('#projectSearchReset');

        if (!store) return;

        store.getProxy().setExtraParams(this.getProjectSearchParams(value));
        this.projectSearchValue = value;
        this.projectTotalPages = 1;

        if (resetButton) {
            resetButton.setDisabled(!value);
        }

        console.info('[ProjectMenu paging] applying search', {
            se_subject: value,
            page: 0
        });

        store.currentPage = 1;
        store.loadPage(1);
    },

    resetProjectSearch: function () {
        const searchField = this.down('#projectSearchField');

        if (searchField) {
            searchField.setValue('');
        }

        this.applyProjectSearch('');
    },

    syncProjectPagingToolbar: function (store) {
        const toolbar = this.down('#projectPagingToolbar');
        const reader = store && store.getProxy().getReader();
        const rawData = reader && reader.rawData || {};
        const pageData = rawData.page || {};
        const serverPage = parseInt(pageData.page, 10);
        const serverMaxPage = parseInt(pageData.maxPage, 10);
        const pageSize = parseInt(pageData.page_size || pageData.pageSize, 10) || store.getPageSize() || 10;
        const parsedTotalCount = parseInt(pageData.totCount, 10);
        const totalCount = isNaN(parsedTotalCount) ? store.getTotalCount() || store.getCount() : parsedTotalCount;
        const currentPage = isNaN(serverPage) ? store.currentPage || 1 : serverPage + 1;
        const totalPages = isNaN(serverMaxPage) ? Math.max(1, Math.ceil(totalCount / pageSize)) : serverMaxPage + 1;

        if (!toolbar) return;

        store.currentPage = currentPage;
        store.totalCount = totalCount;
        this.projectTotalPages = totalPages;
        this.syncingProjectPagingToolbar = true;

        toolbar.getPrevButton().setDisabled(currentPage <= 1);
        toolbar.getNextButton().setDisabled(currentPage >= totalPages);
        toolbar.getSummaryComponent().setHtml(currentPage + ' / ' + totalPages + ' (' + totalCount + ')');
        toolbar.getSliderField().setMinValue(1);
        toolbar.getSliderField().setMaxValue(totalPages);
        toolbar.getSliderField().setValue(currentPage);
        toolbar.getSliderField().setDisabled(totalPages <= 1);
        const resetButton = this.down('#projectSearchReset');
        if (resetButton) resetButton.setDisabled(!this.projectSearchValue);
        toolbar.show();

        this.syncingProjectPagingToolbar = false;

        console.info('[ProjectMenu paging] synchronized', {
            serverPage: isNaN(serverPage) ? null : serverPage,
            currentPage: currentPage,
            totalPages: totalPages,
            pageSize: pageSize,
            totalCount: totalCount
        });
    },

    loadOfflineCarModels: function () {
        var me = this;
        var dataview = me.down('#projectDataView');
        const pagingToolbar = me.down('#projectPagingToolbar');

        if (pagingToolbar) pagingToolbar.hide();

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
