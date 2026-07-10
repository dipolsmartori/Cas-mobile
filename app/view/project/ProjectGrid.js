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
        measurementEvaluationCompact: false
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
        me.setMeasurementEvaluationCompact(me.shouldCompactMeasurementEvaluation());
        me.buildColumns(me.getMaxRound());

        me.element.on({
            tap: function(e) {
                me.onMeasurementEvaluationToggleTap(e);
            },
            delegate: '.project-round-toggle'
        });
    },

    // Handle updates when maxRound changes (e.g. after sync or project selection)
    updateMaxRound: function(maxRound) {
        if (this.isInitialized) {
            this.buildColumns(maxRound);
        }
    },

    shouldCompactMeasurementEvaluation: function() {
        var viewport = Ext.Viewport;
        var width = viewport && viewport.getWidth ? viewport.getWidth() : 0;

        if (!width && typeof window !== 'undefined') {
            width = window.innerWidth;
        }

        return width > 0 && width <= 1180;
    },

    getRoundHeaderText: function(roundNum) {
        var compact = this.getMeasurementEvaluationCompact();
        var iconCls = compact ? 'x-fa fa-expand' : 'x-fa fa-compress';
        var title = compact ? 'Expand Measurement Evaluation' : 'Shrink Measurement Evaluation';
        var handler = 'return CasMobile.activeTab && CasMobile.activeTab.toggleMeasurementEvaluationColumns(event);';
        return '<span class="project-round-header">' +
            '<span class="project-round-toggle" title="' + title + '" onclick="' + handler + '">' +
                '<i class="' + iconCls + '"></i>' +
            '</span>' +
            '<span class="project-round-title">Round ' + roundNum + '</span>' +
        '</span>';
    },

    getCompactMeasurementColumnWidth: function(col) {
        var compactWidths = {
            gross: 52,
            iiiObs: 56,
            dl: 42,
            da: 42,
            db: 42,
            de: 42,
            mi: 42
        };

        return compactWidths[col.dataIndex] || col.width;
    },

    getMeasurementColumnWidth: function(col) {
        return this.getMeasurementEvaluationCompact() ? this.getCompactMeasurementColumnWidth(col) : col.width;
    },

    onMeasurementEvaluationToggleTap: function(e) {
        e.stopEvent();
        this.toggleMeasurementEvaluationColumns();
    },

    toggleMeasurementEvaluationColumns: function(e) {
        if (e) {
            if (e.stopPropagation) e.stopPropagation();
            if (e.preventDefault) e.preventDefault();
            if (e.stopEvent) e.stopEvent();
        }

        this.setMeasurementEvaluationCompact(!this.getMeasurementEvaluationCompact());
        this.syncMeasurementEvaluationColumns();
        return false;
    },

    updateMeasurementEvaluationCompact: function() {
        this.syncMeasurementEvaluationColumns();
    },

    syncMeasurementEvaluationColumns: function() {
        var me = this;
        if (!me.isInitialized || !me.query) return;

        me.query('column').forEach(function(col) {
            if (col.roundGroupHeader && col.setText) {
                col.setText(me.getRoundHeaderText(col.round));
            }

            if (col.measurementEvaluationColumn && col.setWidth) {
                col.setWidth(me.getMeasurementEvaluationCompact() ? col.compactWidth : col.expandedWidth);
            }
        });
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
                    dataIndex: 'round' + roundNum,
                    hidden: roundNum !== maxRound,
                    listeners: {
                        tap: function(column, e) {
                            var target = e && e.getTarget ? e.getTarget('.project-round-toggle') : null;
                            if (target) {
                                me.onMeasurementEvaluationToggleTap(e);
                            }
                        }
                    },
                    columns: [
                        {
                            text: 'Measurement Evaluation',
                            round: roundNum,
                            columns: measureCols.map(function(col) {
                                var newCol = Ext.apply({}, col);
                                newCol.round = roundNum;
                                newCol.measurementEvaluationColumn = true;
                                newCol.expandedWidth = col.width;
                                newCol.compactWidth = me.getCompactMeasurementColumnWidth(col);
                                newCol.width = me.getMeasurementColumnWidth(col);
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
