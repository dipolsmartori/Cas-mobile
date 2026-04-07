/**
 * Visual Evaluation Specific Field Component (Modern Toolkit via Container)
 */
Ext.define('CasMobile.view.evaluate.VisualEvaluationField', {
    extend: 'Ext.Container',
    xtype: 'visualevaluationfield',

    requires: [
        'Ext.field.ComboBox',
        'Ext.field.TextArea',
        'Ext.layout.VBox'
    ],

    config: {
        fieldName: '',
        roundValues: null
    },

    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    margin: '10 0',
    padding: '15',
    style: 'background-color: #ffffff; border-radius: 12px; border: 1px solid #e0e0e0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);',

    initialize: function () {
        const me = this;
        const fieldName = me.getFieldName();

        me.setItems([
            {
                xtype: 'container',
                layout: 'hbox',
                defaults: {
                    xtype: 'combobox',
                    labelAlign: 'top',
                    flex: 1,
                    ui: 'solo'
                },
                items: [
                    {
                        label: 'DL',
                        name: 'dl' + fieldName,
                        itemId: 'dl' + fieldName,
                        store: ['L+', 'L-', 'D+', 'D-'],
                        bind: {
                            value: '{' + 'dl' + fieldName + '}'
                        },
                        listeners: {
                            change: 'onComboChange'
                        }
                    },
                    {
                        label: 'Da',
                        margin: '0 0 0 10',
                        name: 'da' + fieldName,
                        itemId: 'da' + fieldName,
                        store: ['R+', 'R-', 'G+', 'G-'],
                        bind: {
                            value: '{' + 'da' + fieldName + '}'
                        },
                        listeners: {
                            change: 'onComboChange'
                        }
                    },
                    {
                        label: 'Db',
                        margin: '0 0 0 10',
                        name: 'db' + fieldName,
                        itemId: 'db' + fieldName,
                        store: ['B+', 'B-', 'Y+', 'Y-'],
                        bind: {
                            value: '{' + 'db' + fieldName + '}'
                        },
                        listeners: {
                            change: 'onComboChange'
                        }
                    }
                ]
            },
            {
                xtype: 'textareafield',
                name: 'remarks' + fieldName,
                label: 'Remarks',
                labelAlign: 'top',
                placeholder: 'Enter evaluation remarks...',
                margin: '10 0 0 0',
                maxRows: 3,
                bind: {
                    value: '{' + 'remarks' + fieldName + '}'
                }
            },
            {
                xtype: 'component',
                html: '<div style="text-align: center; color: #bdbdbd; margin-top: 10px;"><i class="fas fa-chevron-down"></i></div>'
            }
        ]);

        me.callParent(arguments);
    }
});