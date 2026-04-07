Ext.define('CasMobile.view.project.ProjectGridController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.projectgrid',
    control: {
    },

    onViewPainted: function (view) {
        return; // Disable this manual override because changing CSS `overflow` mid-drag breaks Android browser scrolling logic
        const scroller = view.getScrollable();
        if (!scroller) return;

        let lockedAxis = null;

        view.element.on({
            dragstart: function (e) {
                if (e.pointerType === 'touch' && !lockedAxis) {
                    var scrollEl = scroller.getElement();
                    if (!scrollEl) return;

                    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                        lockedAxis = 'y';
                        scrollEl.setStyle('overflow-y', 'hidden'); // Lock Y axis natively
                    } else {
                        lockedAxis = 'x';
                        scrollEl.setStyle('overflow-x', 'hidden'); // Lock X axis natively
                    }
                }
            },
            dragend: function (e) {
                if (e.pointerType === 'touch') {
                    // Slight delay to outlast momentum physics
                    setTimeout(function () {
                        var scrollEl = scroller.getElement();
                        if (scrollEl) {
                            scrollEl.setStyle('overflow-y', 'auto');
                            scrollEl.setStyle('overflow-x', 'auto');
                        }
                        lockedAxis = null;
                    }, 50);
                }
            }
        });

        // Ensure we explicitly release locks when internal scroller recognizes end
        scroller.on('scrollend', function () {
            const scrollEl = scroller.getElement();
            if (scrollEl) {
                scrollEl.setStyle('overflow-y', 'auto');
                scrollEl.setStyle('overflow-x', 'auto');
            }
            lockedAxis = null;
        });
    },

    init: function (grid) {
        this.callParent();
    },

    // Render raw cell (no special formatting)
    renderRawCell: function (value, record, dataIndex, cell, column) {
        var roundInfo = record.get('round' + column.round);
        if (!roundInfo) return '';
        value = roundInfo[dataIndex] || '';
        var displayVal = value.indexOf('\n') !== -1 ? value.replace(/\n/g, '<br>') : value;
        return '<span title="' + value + '">' + displayVal + '</span>';
    },

    // Render measurement cell with tolerance checking and multi‑round values
    renderMeasureCell: function (value, record, dataIndex, cell, column) {
        var roundInfo = record.get('round' + column.round);
        if (!roundInfo) return '';
        var checkTolerance = function (k, v) {
            if (v === null || v === undefined || v === '' || v === '&nbsp;') return true;
            var num = parseFloat(v);
            if (isNaN(num)) return true;
            switch (k) {
                case 'de': return num <= 0.41;
                case 'dl': return num > -0.35 && num < 0.35;
                case 'da': return num > -0.15 && num < 0.15;
                case 'db': return num > -0.15 && num < 0.15;
                default: return true;
            }
        };
        var formatVal = function (k, v) {
            var finalV = v || '&nbsp;';
            if (!checkTolerance(k, v)) {
                return '<span style="color:red;font-weight:bold;">' + finalV + '</span>';
            }
            return finalV;
        };
        var r1 = formatVal(dataIndex, roundInfo[dataIndex + '1']);
        var r2 = formatVal(dataIndex, roundInfo[dataIndex + '2']);
        var r3 = formatVal(dataIndex, roundInfo[dataIndex + '3']);
        return '<div style="width:100%;border-bottom:1px dotted black">' + r1 + '</div>' +
            '<div style="width:100%;border-bottom:1px dotted black">' + r2 + '</div>' +
            '<div style="width:100%">' + r3 + '</div>';
    },

    // Render remark cell (preserve line breaks)
    renderRemarkCell: function (value, record, dataIndex, cell, column) {
        value = '';
        var roundInfo = record.get('round' + column.round);
        if (roundInfo) {
            value = roundInfo.remarksVisual || '';
        }
        var displayVal = value.indexOf('\n') !== -1 ? value.replace(/\n/g, '<br>') : value;
        return '<span title="' + value + '">' + displayVal + '</span>';
    },

    // Render result cell (PASS / FAIL / CLOSE / NOT)
    renderResultCell: function (value, record, dataIndex, cell, column) {
        var roundInfo = record.get('round' + column.round);
        if (!roundInfo) return '';

        value = roundInfo[dataIndex] || 'NOT';

        var colorMap = { 'PASS': '#04bd04', 'FAIL': 'red', 'CLOSE': '#3e9df2', 'NOT': 'black' };
        return '<span style="color:' + (colorMap[value] || 'black') + '; font-weight: bold">' + value + '</span>';
    },

    // Render visual adjustment cell with colour coding
    renderAdjCell: function (value, record, dataIndex, cell, column) {
        var roundInfo = record.get('round' + column.round);
        if (!roundInfo) return '';
        var cellValue = roundInfo[dataIndex] || '';
        if (cellValue === '선택') cellValue = '';
        var colorMap = {
            'L': '#f2f2f2',
            'D': '#a6a6a6',
            'R': '#ffcccc',
            'G': '#ccffcc',
            'Y': '#ffffcc',
            'B': '#ccecff'
        };
        var color = colorMap[cellValue];
        if (cell) {
            // Modern toolkit: use setStyle on the cell component.
            // Important: Reset to null if no color, because cells are recycled.
            cell.setStyle({ backgroundColor: color || null });
        }
        return cellValue || '';
    },

    // Simple arrow cell (used elsewhere)
    renderArrowCell: function () {
        return '&rarr;';
    }
});
