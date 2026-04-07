Ext.define('CasMobile.store.CarModels', {
    extend: 'Ext.data.Store',
    alias: 'store.carmodels',
    storeId: 'carModelStore',

    requires: [
        'CasMobile.APIs',
        'CasMobile.util.Util'
    ],

    autoLoad: true,
    fields: ['bd_subject', 'bd_regdate', 'bd_idx', 'bd_file', 'code', 'bgColor', 'initials', 'country'],

    proxy: {
        type: 'ajax',
        // url: CasMobile.APIs.getFullUrl(CasMobile.APIs.LIST_C) || '/json/listC', // Fallback if APIs not loaded yet, but requires should handle it
        extraParams: {
            ca_id: '0141', // Car Models Category ID
            o: 's',
            hide: 'NO'
        },
        reader: {
            type: 'json',
            rootProperty: 'binderListBeanList',
            transform: function (rawData) {
                if (!rawData || !rawData.binderListBeanList) return rawData;

                const binderList = rawData.binderListBeanList.map(entry => {
                    const { bd_idx, bd_subject, bd_file } = entry;
                    const initials = CasMobile.util.Util.getInitials(bd_subject);
                    const bgColor = CasMobile.util.Util.stringToHslColor(initials);

                    // Filter logic if needed (e.g. HostAbroad), for now keep all or implement filter
                    // Assuming straight port of logic:
                    // if (ActorUtil.isHostAbroad()) ... skipping user check for now

                    return {
                        bd_subject,
                        code: CasMobile.util.Util.slugify(bd_subject),
                        initials,
                        bd_idx,
                        bd_file,
                        bgColor,
                        bd_regdate: entry.bd_regdate,
                        country: entry.c_country
                    };
                }).filter(item => item !== null);

                return {
                    binderListBeanList: binderList
                };
            }
        }
    }
});
