Ext.define('CasMobile.APIs', {
    singleton: true,
    /**
     * @url /json/addUpdate
     * @key ca_id
     * @key bd_idx
     * @key bd_group
     * @key fileCount
     * @key uploadType:'form'
     * @key group 0|1
     */
    ADD_UPDATE1: '/json/addUpdate',
    /**
     * @url /json/addUpdate2
     * @key ca_id
     * @key bd_idx
     * @key bd_group
     * @key fileCount
     * @key uploadType:'form'
     */
    ADD_UPDATE2: '/json/addUpdate2',
    /**
     * @url /json/cateList
     * @key ca_id
     */
    CATEGORY_LIST: '/json/cateList',
    /**
     * @url /json/cateView
     * @key ca_id
     */
    CATEGORY_VIEW: '/json/cateView',
    /**
     * @url /json/colsDataSum
     * @key {string} ca_id - Category ID.
     * @key {string} cols_idx - Column ID for searching.
     * @key {string} search_val - Target value for searching.
     * @key {string} sum_cols_idx - Number field to get summary.
     */
    COLS_DATA_SUM: '/json/colsDataSum',
    /**
     * @url /colsAddUpdate
     * @key ca_id
     * @key cols_idx
     * @key cols_name
     * @key cols_unit
     * @key cols_code
     * @key cols_option
     */
    COLS_ADD_UPDATE: '/category/colsAddUpdate',
    /**
     * @url /json/delete
     * @key bd_idx
     */
    DELETE_DATA: '/json/delete',
    BRAND: window.BRAND || 'hyundai',
    DOMAIN: (function () {
        const host = window.location.hostname;
        const protocol = window.location.protocol;
        // In Cordova (file:) or local development, use brand-specific absolute domains
        if (protocol === 'file:' || host === 'localhost' || host === '127.0.0.1' || host === '') {
            const b = window.BRAND || 'hyundai';
            if (b === 'kia') return 'https://kia.hmgcolor.com';
            if (b === 'genesis') return 'https://genesis.hmgcolor.com';
            return 'https://hmgcolor.com';
        }
        return window.location.origin;
    })(),
    /**
     * @url /category/expDataAdd
     * @key expDataVal
     * @key expDataIdx
     * @key cols_idx
     */
    FIELD_DATA_ADD: '/category/expDataAdd',
    /**
     * @url /category/expDataDel
     */
    FIELD_DATA_DELETE: '/category/expDataDel',
    /**
     * @url /json/expDataJson
     */
    FIELD_DATA_LIST: '/json/expDataJson',
    /**
     * @url /json/colsList
     */
    FIELD_LIST: '/json/colsList',
    /**
     * @url /member/groupAdd
     * @key group_name
     */
    GROUP_ADD: '/member/groupAdd',
    /**
     * @url /member/groupDel
     * @key idx
     */
    GROUP_DEL: '/member/groupDel',
    /**
     * @url /json/list
     */
    LIST: '/json/list',
    /**
     * @url /json/list2
     */
    LIST2: '/json/list2',
    /**
     * @url /json/listC
     */
    LIST_C: '/json/listC',
    /**
     * @url /json/listCsv
     */
    LIST_CSV: '/json/listCsv',
    /**
     * @url /json/login
     */
    LOGIN: '/json/login',
    /**
     * @url /json/session
     */
    SESSION: '/json/session',
    /**
     * @url /member/logout
     */
    LOGOUT: '/member/logout',
    /**
     * @url /json/member
     */
    MEMBER: '/json/member',
    /**
     * @url /config/member/delete
     * @key nv_id
     */
    MEMBER_DELETE: '/config/member/delete',
    /**
     * @url /json/memberView
     * @key nv_id
     */
    MEMBER_VIEW: '/json/memberView',
    /**
     * @url /config/member/update
     * @key nv_id
     */
    MEMBER_UPDATE: '/joinUpdateJson',
    /**
     * @url /member/group
     */
    USER_GROUP: '/member/group',
    /**
     * @url /binder/expDataUpdate
     */
    UPDATE_DATA: '/binder/expDataUpdate',
    /**
     * @url /json/write
     */
    WRITE: '/json/write',
    /**
     * @url /json/view
     */
    VIEW: '/json/view',
    /**
     *
     * @param nv_id
     * @param nv_pass
     * @return {string} url
     */
    getLoginApi: function (nv_id, nv_pass) {
        let url = `${CasMobile.APIs.DOMAIN}${CasMobile.APIs.LOGIN}?nv_id=${nv_id}&nv_pass=${nv_pass}`;
        return url
    },
    /**
     *
     * @return {string} url
     */
    getMemberApi: function () {
        return `${CasMobile.APIs.DOMAIN}${CasMobile.APIs.MEMBER}?psize=100`;
    },
    /**
     *
     * @param nv_idx
     * @return {string} url
     */
    getMemberUpdateApi: function (nv_idx) {
        return `${CasMobile.APIs.DOMAIN}${CasMobile.APIs.MEMBER_UPDATE}?nv_idx=${nv_idx}`;
    },
    /**
     *
     * @param {string} categoryId
     * @return {string} url
     */
    getCategoryListApi: (categoryId) => {
        let params = (categoryId) ? '?node=' + categoryId : '';
        return `${CasMobile.APIs.DOMAIN}${CasMobile.APIs.CATEGORY_LIST}${params}`;
    },
    getSessionApi: function () {
        return `${CasMobile.APIs.DOMAIN}${CasMobile.APIs.SESSION}`;
    },
    getMemberViewApi: function (nv_id){
        return `${CasMobile.APIs.DOMAIN}${CasMobile.APIs.MEMBER_VIEW}?nv_id=${nv_id}`
    },
    /**
     * Returns the full URL for a given endpoint.
     *
     * @param {string} path  The raw endpoint string (e.g. '/json/login')
     * @returns {string}     The absolute URL when offline, otherwise the raw path.
     */
    getFullUrl: function (path) {
        // `siteInfo.domain` is the new source of truth for the domain.
        // Fallback to the old DOMAIN constant for safety.
        return `${CasMobile.APIs.DOMAIN}${path}`
    },
});
