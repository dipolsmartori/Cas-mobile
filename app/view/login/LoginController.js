Ext.define('CasMobile.view.login.LoginController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.login',

    requires: [
        'CasMobile.view.ProjectMenu',
    ],

    init: function () {
        // Restore saved username and password if available
        const savedUserId = localStorage.getItem('casSavedUserId');
        const savedPassword = localStorage.getItem('casSavedPassword');
        if (savedUserId) {
            const view = this.getView();
            const idField = view.down('#userIdField');
            const passField = view.down('#passwordField');
            const rememberField = view.down('#rememberMeField');

            if (idField) idField.setValue(savedUserId);
            if (passField && savedPassword) passField.setValue(savedPassword);
            if (rememberField) rememberField.setChecked(true);
        }
    },

    onLoginClick: function () {
        const view = this.getView();
        const idField = view.down('#userIdField');
        const passField = view.down('#passwordField');
        const rememberField = view.down('#rememberMeField');

        const userId = idField.getValue();
        const password = passField.getValue();
        const rememberMe = rememberField.getChecked();

        if (!userId || !password) {
            Ext.Msg.alert('Error', CasMobile.util.Localization.get('login.emptyFields') || 'Please enter ID and Password.');
            return;
        }

        // Handle Remember Me logic
        if (rememberMe) {
            localStorage.setItem('casSavedUserId', userId);
            localStorage.setItem('casSavedPassword', password);
        } else {
            localStorage.removeItem('casSavedUserId');
            localStorage.removeItem('casSavedPassword');
        }

        view.setMasked({
            xtype: 'loadmask',
            message: 'Logging in...'
        });

        const url = CasMobile.APIs.getLoginApi(userId, password);

        Ext.Ajax.request({
            url: url,
            withCredentials: true,
            success: async function (response) {
                view.setMasked(false);
                const result = Ext.decode(response.responseText);
                if (result.result === true) {
                    let memberInfo = await new Promise(resolve => {
                        Ext.Ajax.request({
                            url: CasMobile.APIs.getMemberViewApi(userId),
                            withCredentials: true,
                            success: function (response) {
                                let reStr = response.responseText.replace('null(', '').replace(')', '');
                                const result = Ext.decode(reStr);
                                resolve(result)

                            },
                            failure: function () {
                                view.setMasked(false);
                                const L = CasMobile.util.Localization;
                                Ext.Msg.alert(L.get('main.error') || 'Error', L.get('errors.networkConnection') || 'Network Error or Server Unreachable.');
                            }

                        });
                    });
                    Object.freeze(memberInfo)

                    if (memberInfo) {
                        window.Actor = window.Actor || {};
                        window.Actor.userInfo = memberInfo.member;
                        localStorage.setItem('casUserInfo', JSON.stringify(memberInfo.member));
                    } else {
                        console.warn('Login success but no member info found', result);
                    }

                    // Switch to Project Menu (handled by Main Controller on view paint)
                    Ext.GlobalEvents.fireEvent('loginsuccess', result);
                    const mainView = 'CasMobile.view.main.Main';
                    Ext.Viewport.removeAll();
                    Ext.require(mainView, () => {
                        Ext.Viewport.add(Ext.create('CasMobile.view.main.Main'));
                    })
                } else {
                    Ext.Msg.alert('Login Failed', result.message || 'Invalid ID or Password.');
                }
            },
            failure: function () {
                view.setMasked(false);
                const L = CasMobile.util.Localization;
                Ext.Msg.alert(L.get('main.error') || 'Error', L.get('errors.networkConnection') || 'Network Error or Server Unreachable.');
            }
        });
    }
});
