Ext.define('CasMobile.util.Localization', {
    singleton: true,

    get: function (key) {
        if (!window.loc) return key;

        const keys = key.split('.');
        let value = window.loc;
        for (const k of keys) {
            value = value[k];
            if (!value) return key;
        }
        return value;
    },

    save: function (lang) {
        localStorage.setItem('language', lang);
        window.location.reload();
    },

    load: function (callback) {
        // Simple language detection or default to 'en'
        // If the location isn't Korea, it must be select English by default
        const systemLang = (navigator.language || navigator.userLanguage).toLowerCase();
        let defaultLang = 'en';
        if (systemLang.includes('ko')) {
            defaultLang = 'ko';
        } else if (systemLang.includes('zh') || systemLang.includes('cn')) {
            defaultLang = 'zh';
        }
        
        const lang = localStorage.getItem('language') || defaultLang;
        console.log('Localization: detected system_lang=' + systemLang + ', default=' + defaultLang + ', final=' + lang);

        Ext.Ajax.request({
            url: 'resources/locales/' + lang + '.json',
            success: function (response) {
                try {
                    window.loc = Ext.decode(response.responseText);
                    window.loc.language = lang; // Store current language code in the object
                    if (callback) callback();
                } catch (e) {
                    console.error('Failed to decode localization file', e);
                    window.loc = {};
                    if (callback) callback();
                }
            },
            failure: function () {
                console.error('Failed to load localization file');
                window.loc = {}; // Fallback
                if (callback) callback();
            }
        });
    }
});
