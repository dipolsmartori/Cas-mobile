Ext.define('CasMobile.view.schedule.Schedule', {
    extend: 'Ext.Panel',
    xtype: 'cas-schedule',
    layout: 'fit',

    requires: [
        'CasMobile.view.schedule.ScheduleController',
        'Ext.Toolbar',
        'Ext.SegmentedButton',
        'Ext.field.Search',
        'Ext.Dialog'
    ],

    controller: 'cas-schedule',

    listeners: {
        painted: 'onViewPainted'
    },

    items: [
        {
            xtype: 'button',
            itemId: 'btnShowDialog',
            iconCls: 'x-fa fa-calendar-alt',
            ui: 'action',
            width: 250,
            height: 50,
            centered: true,
            hidden: true,
            handler: 'openCalendarDialog'
        }
    ]
});
