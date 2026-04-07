Ext.define('CasMobile.view.Intro', {
    extend: 'Ext.Container', // Changed from Ext.container.Container for Modern
    xtype: 'intro',
    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    width: '100%',
    height: '100%',

    listeners: {
        resize: function (comp, width, height) {
            console.log(width, height)
            comp.setLayout({
                type: (width > height || width >= 768) ? 'hbox' : 'vbox',
                align: 'stretch'
            });
            console.log(comp.getLayout().type)
        }
    },

    items: [
        {
            xtype: 'component',
            flex: 1,
            style: {
                backgroundColor: 'black',
                cursor: 'pointer'
            },
            html: '<div style="display:flex; width:100%; height:100%; justify-content:center; align-items:center;"><img src="resources/image/genesis.jpg" style="max-width:80%; height:auto; max-height:80%;" alt="GENESIS"></div>',
            listeners: {
                painted: function (comp) {
                    console.log('genesis painted')
                    comp.element.on('tap', () => {
                        // console.log('Genesis clicked');
                    });
                }
            }
        },
        {
            xtype: 'component',
            flex: 1,
            style: {
                backgroundColor: '#062f5e',
                cursor: 'pointer'
            },
            html: '<div style="display:flex; width:100%; height:100%; justify-content:center; align-items:center;"><img src="resources/image/hyundai.jpg" style="max-width:80%; height:auto; max-height:80%;" alt="HYUNDAI"></div>',
            listeners: {
                painted: function (comp) {
                    comp.element.on('tap', () => {
                        if (!CasMobile.util.Util.setOnlineStatus()) {
                            Ext.GlobalEvents.fireEvent('gotomainview');
                        }
                        Ext.fireEvent('showlogin');
                    });
                }
            }
        },
        {
            xtype: 'component',
            flex: 1,
            style: {
                backgroundColor: '#292929',
                cursor: 'pointer'
            },
            html: '<div style="display:flex; width:100%; height:100%; justify-content:center; align-items:center;"><img src="resources/image/kia.jpg" style="max-width:80%; height:auto; max-height:80%;" alt="KIA"></div>',
            listeners: {
                painted: function (comp) {
                    comp.element.on('tap', () => {
                        // console.log('Kia clicked');
                    });
                }
            }
        }
    ]
});
