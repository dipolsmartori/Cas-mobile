Ext.define('CasMobile.view.login.Login', {
    extend: 'Ext.form.Panel',
    xtype: 'login',

    controller: 'login',

    title: 'Login',
    padding: 20,

    layout: {
        type: 'vbox',
        align: 'center',
        pack: 'center'
    },

    initialize: function () {
        this.callParent();

        const loc = CasMobile.util.Localization;

        // Set Title
        this.setTitle(loc.get('login.login')); // If 'title' on form panel is visible

        const fieldset = this.down('#signinFieldset');
        if (fieldset) fieldset.setTitle(loc.get('login.login'));

        // User ID
        const userField = this.down('#userIdField');
        if (userField) {
            userField.setLabel('');
            userField.setPlaceholder(loc.get('login.username') + ' *');
        }

        // Password
        const passField = this.down('#passwordField');
        if (passField) {
            passField.setLabel('');
            passField.setPlaceholder(loc.get('login.password') + ' *');
        }

        // Remember Me
        const rememberField = this.down('#rememberMeField');
        if (rememberField) rememberField.setLabel(loc.get('login.rememberMe'));

        // Button
        const btn = this.down('#loginBtn');
        if (btn) btn.setText(loc.get('login.login'));
        // ✅ 네트웤상태 체크
        const statusDot = this.down('#networkStatusDot');

        // Set Language Value
        const langField = this.down('#languageSelect');
        if (langField) {
            langField.setValue(window.loc && window.loc.language ? window.loc.language : 'en');
        }

        Ext.defer(function () {
            CasMobile.util.Util.setOnlineStatus(statusDot)
        }, 100);
    },

    items: [
        {
            xtype: 'toolbar',
            docked: 'top',
            title: '',
            items: ['->', { // 언어선택
                xtype: 'selectfield',
                itemId: 'languageSelect',
                width: 120,
                options: [
                    { text: 'English', value: 'en' },
                    { text: '한국어', value: 'ko' },
                    { text: '中文', value: 'zh' }
                ],
                listeners: {
                    change: function (field, newValue) {
                        const currentLang = window.loc ? window.loc.language : 'en';
                        if (newValue && newValue !== currentLang) {
                            CasMobile.util.Localization.save(newValue);
                        }
                    }
                }
            },
                { // 네트웍상태 마크
                    xtype: 'component',
                    itemId: 'networkStatusDot',
                    width: 12,
                    height: 12,
                    margin: '0 0 0 10', // Space between button and dot
                    style: {
                        borderRadius: '50%',
                        backgroundColor: '#ccc',
                        marginTop: 'auto', // Vertical center if needed in flex container
                        marginBottom: 'auto'
                    }
                }]
        },
        {
            xtype: 'container',
            layout: 'hbox',
            margin: '0 0 20 0',
            items: [
                { // 로그인 타이틀
                    xtype: 'component',
                    itemId: 'brandTitle',
                    html: 'CAS SYSTEM',
                    style: {
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#062f5e',
                        fontFamily: 'sans-serif'
                    }
                }
            ]
        }, {
            xtype: 'fieldset',
            itemId: 'signinFieldset',
            title: '', // Set in initialize
            width: '100%',
            maxWidth: 400,
            items: [{ // 사용자 아이디
                xtype: 'textfield',
                itemId: 'userIdField',
                name: 'userId',
                label: '', // Set in initialize
                placeholder: '',
                required: true
            }, { // 비밀번호
                xtype: 'passwordfield',
                itemId: 'passwordField',
                name: 'password',
                label: '', // Set in initialize
                placeholder: '',
                required: true,
                revealable: true
            }, { // 로그인 정보 기억
                xtype: 'checkboxfield',
                itemId: 'rememberMeField',
                name: 'rememberMe',
                label: '', // Set in initialize
                checked: false
            }]
        }, {
            xtype: 'button',
            itemId: 'loginBtn',
            text: '', // Set in initialize
            ui: 'action',
            padding: 10,
            width: '100%',
            maxWidth: 400,
            margin: '20 0 0 0',
            handler: 'onLoginClick',
            listeners: {
                painted: function (btn) {
                    const brand = CasMobile.APIs.BRAND;
                    const brandColor = {
                        hyundai: '#062f5e',
                        kia: '#292929',
                        genesis: '#000000'
                    }[brand] || '#062f5e';

                    const brandTitle = {
                        hyundai: 'HYUNDAI CPR MOBILE',
                        kia: 'KIA CPR MOBILE',
                        genesis: 'GENESIS CPR MOBILE'
                    }[brand] || 'CAS MOBILE';

                    btn.setStyle('background-color', brandColor);

                    const titleComp = btn.up('login').down('#brandTitle');
                    if (titleComp) {
                        titleComp.setHtml(brandTitle);
                        titleComp.setStyle('color', brandColor);
                    }
                }
            }
        }]
});
