Ext.define('CasMobile.view.project.ProjectGrid', {
    extend: 'Ext.grid.Grid',
    xtype: 'projectgrid',
    cls: 'project-grid',
    controller: 'projectgrid',

    scrollable: {
        direction: 'both',
        directionLock: false
    },
    
    variableHeights: true,

    config: {
        maxRound: 0,
        params: null,
        measurementEvaluationHidden: false
    },

    store: {
        type: 'store',
        pageSize: 50,
        fields: [
            'bd_idx', 'bd_subject', 'bd_data', 'partNumber', 'assyTrim', 'partName2',
            'assemblyCo', 'rawMaterialCo', 'gross', 'iiiObs', 'dl', 'da', 'db', 'de', 'mi',
            'dlVisual1', 'daVisual1', 'dbVisual1', 'remarksVisual', 'resultVisual',
            'round1', 'round2', 'round3', 'round4', 'round5', 'round6', 'round7', 'round8', 'round9', 'round10', 'round11', 'round12', 'round13',
            'isUpdatedOffline'
        ],
        proxy: {
            type: 'jsonp',
            url: CasMobile.APIs.getFullUrl(CasMobile.APIs.LIST),
            reader: {
                type: 'json',
                rootProperty: 'binderList',
                totalProperty: 'page.totCount',
                transform: function(response) {
                    response.binderList.forEach(function(row) {
                        var data = row.bd_data;
                        if (data) {
                            data.forEach(function(item) {
                                var code = item.cols_code;
                                if (code) {
                                    if (code.indexOf('round') !== -1) {
                                        if (item.data_val) {
                                            try {
                                                row[code] = JSON.parse(item.data_val)[0];
                                            } catch(e) {
                                                row[code] = item.data_val;
                                            }
                                        }
                                    } else {
                                        row[code] = item.data_val;
                                    }
                                }
                            });
                        }
                    });
                    return response;
                }
            }
        }
    },

    initialize: function() {
        var me = this;
        // Call parent using prototype to ensure ES5 compatibility in some build environments
        Ext.grid.Grid.prototype.initialize.apply(this, arguments);
        
        CasMobile.activeTab = this;
        me.buildColumns(me.getMaxRound());

        me.element.on({
            tap: function(e, target) {
                me.onRoundToggleColumnTap(e, target);
            },
            delegate: '.project-round-toggle-column'
        });
    },

    // Handle updates when maxRound changes (e.g. after sync or project selection)
    updateMaxRound: function(maxRound) {
        if (this.isInitialized) {
            this.buildColumns(maxRound);
        }
    },

    getRoundHeaderText: function(roundNum) {
        return 'Round ' + roundNum;
    },

    onMeasurementEvaluationToggleTap: function(e) {
        var browserEvent = e && (e.browserEvent || e.event || e);

        if (browserEvent && this.lastMeasurementToggleEvent === browserEvent) {
            return;
        }

        this.lastMeasurementToggleEvent = browserEvent;

        if (e && e.stopEvent) {
            e.stopEvent();
        }

        this.toggleMeasurementEvaluationColumns();
    },

    isRoundToggleTap: function(column, e) {
        var headerRegion = column && column.headerElement && column.headerElement.getRegion();
        var point = e && e.getPoint ? e.getPoint() : null;
        var isToggleTap = !!(headerRegion && point &&
            point.x >= headerRegion.left &&
            point.x <= headerRegion.left + 36 &&
            point.y >= headerRegion.top &&
            point.y <= headerRegion.bottom);

        return isToggleTap;
    },

    isRoundToggleElementTap: function(target, e) {
        var box = target && target.getBoundingClientRect ? target.getBoundingClientRect() : null;
        var browserEvent = e && (e.browserEvent || e.event || e);
        var x = browserEvent && typeof browserEvent.clientX === 'number' ? browserEvent.clientX : null;
        var y = browserEvent && typeof browserEvent.clientY === 'number' ? browserEvent.clientY : null;
        var isToggleTap = !!(box && x !== null && y !== null &&
            x >= box.left &&
            x <= box.left + 36 &&
            y >= box.top &&
            y <= box.bottom);

        return isToggleTap;
    },

    onRoundToggleColumnTap: function(e, target) {
        if (this.isRoundToggleElementTap(target, e)) {
            this.onMeasurementEvaluationToggleTap(e);
        }
    },

    toggleMeasurementEvaluationColumns: function(e) {
        if (e) {
            if (e.stopPropagation) e.stopPropagation();
            if (e.preventDefault) e.preventDefault();
            if (e.stopEvent) e.stopEvent();
        }

        this.setMeasurementEvaluationHidden(!this.getMeasurementEvaluationHidden());
        this.syncMeasurementEvaluationColumns();
        return false;
    },

    updateMeasurementEvaluationHidden: function() {
        this.syncMeasurementEvaluationColumns();
    },

    eachProjectColumn: function(fn) {
        var me = this;
        var headerCt = me.getHeaderContainer && me.getHeaderContainer();
        var seen = {};
        var visitItems = function(items) {
            if (!items) return;

            if (items.items) {
                items = items.items;
            }

            Ext.Array.each(items, function(item) {
                visit(item);

                if (item.items) {
                    visitItems(item.items);
                }

                if (item.innerItems) {
                    visitItems(item.innerItems);
                }
            });
        };
        var visit = function(col) {
            var id;

            if (!col) return;

            id = col.getId ? col.getId() : col.id;
            if (id && seen[id]) return;
            if (id) seen[id] = true;

            fn(col);
        };

        if (headerCt && headerCt.visitPreOrder) {
            headerCt.visitPreOrder('gridcolumn', visit);
        }

        if (headerCt && headerCt.items) {
            visitItems(headerCt.items);
        }

        if (headerCt && headerCt.getColumns) {
            Ext.Array.each(headerCt.getColumns(), visit);
        }

        if (me.query) {
            Ext.Array.each(me.query('gridcolumn'), visit);
            Ext.Array.each(me.query('column'), visit);
        }
    },

    syncMeasurementEvaluationColumns: function() {
        var me = this;

        if (me.destroyed || me.destroying) {
            return;
        }

        me.eachProjectColumn(function(col) {
            if (col.roundGroupHeader) {
                if (col.setText) {
                    col.setText(me.getRoundHeaderText(col.round));
                }

                if (col.toggleCls) {
                    col.toggleCls('project-round-measure-hidden', me.getMeasurementEvaluationHidden());
                } else if (col.addCls && col.removeCls) {
                    col[me.getMeasurementEvaluationHidden() ? 'addCls' : 'removeCls']('project-round-measure-hidden');
                }
            }

            if (col.measurementEvaluationGroup && col.setHidden) {
                col.setHidden(me.getMeasurementEvaluationHidden());
            }
        });

        if (me.refresh) {
            me.refresh();
        }
    },

    buildColumns: function(maxRound) {
        var me = this;
        
        // Define Measurement Columns
        var measureCols = [
            { dataIndex: 'gross', text: 'GROSS', width: 70, renderer: 'renderRawCell' },
            { dataIndex: 'iiiObs', text: 'III/Obs', width: 88, renderer: 'renderMeasureCell' },
            { dataIndex: 'dl', text: 'DL*', width: 60, renderer: 'renderMeasureCell' },
            { dataIndex: 'da', text: 'DA*', width: 60, renderer: 'renderMeasureCell' },
            { dataIndex: 'db', text: 'DB*', width: 60, renderer: 'renderMeasureCell' },
            { dataIndex: 'de', text: 'DE*', width: 60, renderer: 'renderMeasureCell' },
            { dataIndex: 'mi', text: 'MI', width: 60, renderer: 'renderMeasureCell' }
        ];

        // Define Visual Columns
        var visualCols = [
            { dataIndex: 'dlVisual2', text: 'DL', width: 45, renderer: 'renderAdjCell' },
            { dataIndex: 'daVisual2', text: 'Da', width: 45, renderer: 'renderAdjCell' },
            { dataIndex: 'dbVisual2', text: 'Db', width: 45, renderer: 'renderAdjCell' },
            { dataIndex: 'remarksVisual', text: 'Remarks', width: 150, renderer: 'renderRemarkCell' },
            { dataIndex: 'resultVisual', text: 'Result', width: 91, itemId: 'resultVisual', renderer: 'renderResultCell' }
        ];

        var roundColumns = [];
        
        // Dynamic Round Generation
        for (var i = 1; i <= maxRound; i++) {
            (function(roundNum) {
                roundColumns.push({
                    text: me.getRoundHeaderText(roundNum),
                    round: roundNum,
                    roundGroupHeader: true,
                    cls: 'project-round-toggle-column' + (me.getMeasurementEvaluationHidden() ? ' project-round-measure-hidden' : ''),
                    dataIndex: 'round' + roundNum,
                    hidden: roundNum !== maxRound,
                    listeners: {
                        tap: function(column, e) {
                            if (me.isRoundToggleTap(column, e)) {
                                me.onMeasurementEvaluationToggleTap(e);
                            }
                        }
                    },
                    columns: [
                        {
                            text: 'Measurement Evaluation',
                            round: roundNum,
                            measurementEvaluationGroup: true,
                            hidden: me.getMeasurementEvaluationHidden(),
                            columns: measureCols.map(function(col) {
                                var newCol = Ext.apply({}, col);
                                newCol.round = roundNum;
                                newCol.measurementEvaluationColumn = true;
                                newCol.cell = { encodeHtml: false };
                                return newCol;
                            })
                        },
                        {
                            text: 'Visual Measurement',
                            round: roundNum,
                            columns: visualCols.map(function(col) {
                                var newCol = Ext.apply({}, col);
                                newCol.round = roundNum;
                                newCol.cell = { encodeHtml: false };
                                if (col.dataIndex.indexOf('Visual2') !== -1) {
                                    newCol.width = 45;
                                }
                                if (col.dataIndex === 'resultVisual') {
                                    newCol.width = 91;
                                }
                                return newCol;
                            })
                        }
                    ]
                });
            })(i);
        }

        // Fixed Left Columns
        var fixedCols = [
            { text: 'Part No.', dataIndex: 'partNumber', width: 120, cell: { encodeHtml: false } },
            { text: 'Assy Name', dataIndex: 'assyTrim', width: 115, cell: { encodeHtml: false } },
            { text: 'Part Name', dataIndex: 'partName2', width: 150, cell: { encodeHtml: false } },
            { text: 'Assy Co.', dataIndex: 'assemblyCo', width: 100 },
            { text: 'Raw Mat.', dataIndex: 'rawMaterialCo', width: 100 }
        ];

        me.setColumns(fixedCols.concat(roundColumns));
    }
});
