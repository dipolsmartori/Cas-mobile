Ext.define('CasMobile.util.Util', {
    singleton: true,

    VIVID_COLOR_PALETTE: [
        '#D32F2F', // Red
        '#C2185B', // Pink
        '#7B1FA2', // Purple
        '#512DA8', // Deep Purple
        '#303F9F', // Indigo
        '#1976D2', // Blue
        '#0288D1', // Light Blue
        '#0097A7', // Cyan
        '#00796B', // Teal
        '#388E3C', // Green
        '#F57C00', // Orange
        '#E64A19'  // Deep Orange
    ],

    getInitials: function (name) {
        if (!name) return '';
        const words = name.trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return '';
        if (words.length > 1) {
            return (words[0][0] + (words[1][0] || '')).toUpperCase();
        }
        return words[0].substring(0, 2).toUpperCase();
    },

    stringToHslColor: function (str) {
        if (!str) return '#BDBDBD';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash;
        }
        const palette = this.VIVID_COLOR_PALETTE;
        const index = Math.abs(hash % palette.length);
        return palette[index];
    },

    slugify: function (str) {
        if (!str) return '';
        return str.toString().toLowerCase()
            .replace(/\s+/g, '-')     // Replace spaces with -
            .replace(/[^\w-]+/g, '')  // Remove all non-word chars
            .replace(/--+/g, '-')     // Replace multiple - with single -
            .replace(/^-+/, '')       // Trim - from start of text
            .replace(/-+$/, '');      // Trim - from end of text
    },

    getValueFromBdData: function (bdData, colsCode) {
        if (!bdData || !Array.isArray(bdData)) return '';
        var item = bdData.find(function (d) { return d.cols_code === colsCode; });
        return item ? (item.data_val || '') : '';
    },

    setOnlineStatus: function (statusDot) {
        function hasNetwork() {
            return navigator.onLine;
        }
        let isOnline = hasNetwork();
        // isOnline = false; // for test
        window.isOnline = isOnline;
        if (statusDot) {
            statusDot.setStyle({
                backgroundColor: isOnline ? siteInfo.onlineColor : siteInfo.offlineColor // Green : Red
            });
            // Tooltip support varies in modern, but setting a property or title works
            statusDot.setTooltip && statusDot.setTooltip(isOnline ? 'Online' : 'Offline');
        }
        return isOnline;
    }
});
