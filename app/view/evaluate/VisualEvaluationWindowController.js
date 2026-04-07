/**
 * Controller for VisualEvaluationWindow.
 */
Ext.define('CasMobile.view.evaluate.VisualEvaluationWindowController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.visualevaluationwindowcontroller',

    requires: [
        'CasMobile.util.Util',
        'CasMobile.view.ProjectMenu',
        'CasMobile.util.Localization'
    ],

    control: {
        '#': {
            initialize: 'onInitialize'
        }
    },

    init: function () {
        const me = this;
        // Minimize된 상태에서 메인그리드 셀을 클릭 했을때 레코드 추가 준비
        me.boundOnMainGridChildTap = me.onMainGridChildTap.bind(me);

        // Find the main tab panel
        me.mainAppView = Ext.Viewport.down('app-main');

        if (me.mainAppView) {
            // Minimize 된 동안 메인그리드에서 프로젝트를 바꿀 경우에 대비
            me.mainAppView.on('activeItemchange', me._onProjectTabChange, me);
            const activeTab = me.mainAppView.getActiveItem();
            if (activeTab) {
                me._onProjectTabChange(me.mainAppView, activeTab);
            }
        } else {
            // 메인 그리드에서 CELL을 클릭 했을때 낚아 챔
            const grid = Ext.ComponentQuery.query('projectgrid')[0];
            if (grid) {
                me.activeProjectGrid = grid;
                grid.on('childtap', me.boundOnMainGridChildTap);
            }
        }
    },

    onInitialize: function (view) {
        // 창을 최소화 했을때 대신 뜨는 똥그란 버튼 스타일링
        if (!document.getElementById('fab-circular-style')) {
            const style = document.createElement('style');
            style.id = 'fab-circular-style';
            style.innerHTML = `
                .circular-fab, .circular-fab .x-button-el, .circular-fab .x-inner-el {
                    border-radius: 50% !important;
                    background-color: #00579c !important;
                    color: white !important;
                }
                .fab-badge {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #ff5252;
                    color: white;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: bold;
                    z-index: 10;
                }
            `;
            document.head.appendChild(style);
        }

        const store = Ext.create('Ext.data.Store', {
            fields: ['ca_id', 'ca_name', 'bd_refer', 'bd_idx', 'modelName', 'round', 'partId', 'partName', 'assemblyCo', 'rawMaterialCo', 'type', 'roundJson', 'checked'],
            listeners: {
                datachanged: this.onStoreDataChanged,
                update: this.onStoreUpdate,
                scope: this
            }
        });
        view.down('#evaluationGrid').setStore(store);
    },

    onMinimize: function () {
        const me = this;
        console.log('onMinimize');
        const dialog = me.getView();
        const count = dialog.down('#evaluationGrid').getStore().getCount();

        dialog.hide();

        // Disable Main window's Visual Evaluation button
        const evalBtn = Ext.ComponentQuery.query('#btnVisualEval')[0];
        if (evalBtn) evalBtn.setDisabled(true);

        // Disarm any lingering identical FABs just in case
        const existingFab = Ext.ComponentQuery.query('#visualEvalFab')[0];
        if (existingFab) existingFab.destroy();

        // 창을 최소화 했을때 대신 뜨는 똥그란 버튼
        const fab = Ext.Viewport.add({
            xtype: 'button',
            itemId: 'visualEvalFab',
            ui: 'action',
            cls: 'circular-fab',
            width: 65,
            height: 65,
            bottom: 30,
            right: 20,
            zIndex: 999,
            style: 'box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 2px solid #fff; overflow: visible !important;',
            text: `<div class="fab-badge">${count}</div>`,
            handler: function () {
                dialog.show();
                this.destroy();
                me.minimizeFab = null;

                // Re-enable Main window's Visual Evaluation button
                if (evalBtn) evalBtn.setDisabled(false);
            }
        });

        me.minimizeFab = fab;
    },

    destroy: function () {
        if (this.mainAppView && !this.mainAppView.destroyed) {
            this.mainAppView.un('activeItemchange', this._onProjectTabChange, this);
        }
        if (this.activeProjectGrid && !this.activeProjectGrid.destroyed) {
            this.activeProjectGrid.un('childtap', this.boundOnMainGridChildTap);
        }
        if (this.minimizeFab && !this.minimizeFab.destroyed) {
            this.minimizeFab.destroy();
        }

        // Defensively ensure main eval button is active when this destroys
        const evalBtn = Ext.ComponentQuery.query('#btnVisualEval')[0];
        if (evalBtn) evalBtn.setDisabled(false);

        this.callParent(arguments);
    },

    onQrButtonPainted: function (btn) {
        const menuItems = [];
        const maxRound = this.getView().getMaxRound();
        for (let i = 1; i <= maxRound; i++) {
            menuItems.push({
                text: `Round ${i}`,
                round: i,
                handler: (menuItem) => {
                    Ext.create('CasMobile.view.QrScannerWindow', {
                        mode: 'add',
                        round: menuItem.round,
                        targetView: this.getView()
                    }).show();
                }
            });
        }
        if (menuItems.length > 0) {
            btn.setMenu(menuItems);
        }
    },

    onStoreDataChanged: function (store) {
        const L = CasMobile.util.Localization;
        const view = this.getView();
        let title = L.get('visualEvaluation');
        const count = store.getCount();

        // Update Title Badge
        view.setTitle(`${title} <span style="background: #e91e63; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px;">${count}</span>`);

        // Update FAB Badge if it exists
        if (this.minimizeFab && !this.minimizeFab.destroyed) {
            const badge = count > 0 ? `<div class="fab-badge">${count}</div>` : '';
            this.minimizeFab.setText(badge);
        }

        this.syncFormState();
    },

    onStoreUpdate: function (store, record, operation, modifiedFieldNames) {
        if (modifiedFieldNames && modifiedFieldNames.indexOf('checked') !== -1) {
            this.syncFormState();
        }
    },

    syncFormState: function () {
        const view = this.getView();
        if (!view) return;

        const grid = view.down('#evaluationGrid');
        if (!grid) return;

        const store = grid.getStore();
        if (!store) return;

        const evaluationContainer = view.down('#evaluationContainer');
        const form = evaluationContainer.down('formpanel');

        // Find if at least one record is checked
        const hasChecked = store.getRange().some(rec => rec.get('checked'));
        console.log('hasChecked', hasChecked)
        if (hasChecked) {
            form.setDisabled(false);
            view.down('#btnSaveAll').setDisabled(false);
        } else {
            // If nothing is checked, and no specific record is being edited 
            // (e.g. after deselecting all), disable the form.
            view.down('#btnSaveAll').setDisabled(true);
            form.setDisabled(true);
            evaluationContainer.down('#btnSaveResult').setDisabled(true);
            evaluationContainer.down('#btnUploadImage').setDisabled(true);
            form.setDisabled(false);
            form.reset();
        }
    },
    // Minimize 된 상태에서 프로젝트를 바꾸면
    _onProjectTabChange: function (tabPanel, newCard, oldCard) {
        const me = this;
        if (oldCard && !oldCard.destroyed) {
            const oldGrids = oldCard.isXType('projectgrid') ? [oldCard] : oldCard.query('projectgrid');
            oldGrids.forEach(g => g.un('childtap', me.boundOnMainGridChildTap));
            oldCard.un('add', me._onProjectTabAdd, me);
        }

        if (newCard && !newCard.destroyed) {
            const grid = newCard.isXType('projectgrid') ? newCard : newCard.down('projectgrid');
            if (grid) {
                me.activeProjectGrid = grid;
                grid.on('childtap', me.boundOnMainGridChildTap);
            } else {
                // If grid isn't there yet, listen for it being added
                newCard.on('add', me._onProjectTabAdd, me);
            }
        }
    },

    _onProjectTabAdd: function (container, item) {
        const me = this;
        const grid = item.isXType('projectgrid') ? item : (item.down ? item.down('projectgrid') : null);
        if (grid) {
            me.activeProjectGrid = grid;
            grid.on('childtap', me.boundOnMainGridChildTap);
            container.un('add', me._onProjectTabAdd, me);
        }
    },

    onMainGridChildTap: async function (grid, location) {
        const record = location.record;
        const column = location.column;
        const round = column.round;
        const L = CasMobile.util.Localization;
        if (!record || !column) return;
        let roundJson = record.get(`round${round}`);
        if (round === undefined) {
            Ext.Msg.alert(L.get('main.warning'), '라운드 컬럼을 탭 해 주세요.');
            return;
        }
        if (!roundJson) roundJson = { round: round }
        // If the FAB exists (dialog is minimized), add directly to "plus" the count
        if (this.minimizeFab && !this.minimizeFab.destroyed) {
            const L = CasMobile.util.Localization;
            // Regular behavior: confirm before adding
            Ext.Msg.show({
                title: L.get('main.confirm'),
                message: `${L.get('qAddEvaluationList')}?<br><b style="color:#007bff;">${record.get('modelName')} / ${record.get('partName2')} / Round ${round}</b>`,
                buttons: [
                    { text: L.get('yes'), itemId: 'yes', ui: 'action' },
                    { text: L.get('no'), itemId: 'no' }
                ],
                fn: (btn) => {
                    if (btn === 'yes') {
                        this.addEvaluationList(record, roundJson);
                    }
                }
            });
        }
    },
    /**
     * 메인 그리드 셀을 클릭 했을 때 평가 목록에 추가
     * @param record
     * @param roundJson
     */
    addEvaluationList: function (record, roundJson) {
        if (typeof roundJson === 'number') {
            roundJson = { round: roundJson }
        }
        const grid = this.getView().down('#evaluationGrid');
        const store = grid.getStore();
        const partId = record.get('partId');

        const exists = store.findBy((rec) => {
            return rec.get('partId') === partId && rec.get('round') === roundJson.round;
        }) !== -1;
        const L = CasMobile.util.Localization;
        if (exists) {
            Ext.Msg.alert(L.get('main.warning'), '이미 리스트에 포함된 항목입니다.');
            return;
        }

        store.add({
            ca_id: record.get('ca_id'),
            ca_name: record.get('ca_name'),
            bd_idx: record.get('bd_idx'),
            bd_refer: record.get('bd_refer'),
            modelName: record.get('modelName') || record.get('model_nm') || '',
            round: roundJson.round,
            partId: partId,
            partName: record.get('partName2') || record.get('part_nm') || '',
            roundJson: roundJson,
            mainRecord: record // 🆙🆙🆙 Keep reference to update main grid store
        });
    },

    onGridChildTap: function (grid, location) {
        const record = location.record;
        const column = location.column;
        if (!record) return;

        // 셀안의 쓰레기통을 클릭 했을 때 record 삭제
        if (location.event.target.classList.contains('remove-item-icon')) {
            location.event.stopPropagation();
            location.event.preventDefault();

            Ext.asap(() => {
                grid.getStore().remove(record);
            });
            return;
        }

        // Checkcolumn click should behave as multi-select (default behavior)
        if (column && (column.xtype === 'checkcolumn' || column.isCheckColumn)) {
            return;
        }

        // Row tap logic: Single Selection (Uncheck others)
        // This ensures multi-selection is ONLY allowed via checkboxes
        const store = grid.getStore();
        store.beginUpdate();
        store.getRange().forEach(r => {
            if (r !== record) {
                r.set('checked', false);
            }
        });
        record.set('checked', true);
        store.endUpdate();

        // Load values into form
        const container = this.getView().down('#evaluationContainer');
        container.setEvaluationValues(record);
    },

    syncFormState: function () {
        const view = this.getView();
        if (!view) return;

        const grid = view.down('#evaluationGrid');
        const store = grid ? grid.getStore() : null;
        if (!store) return;

        const evaluationContainer = view.down('#evaluationContainer');
        const form = evaluationContainer.down('formpanel');
        const btnSaveResult = evaluationContainer.down('#btnSaveResult');
        const btnUploadImage = evaluationContainer.down('#btnUploadImage');
        const btnSaveAll = view.down('#btnSaveAll');

        const checkedRecords = store.getRange().filter(rec => rec.get('checked'));
        const checkCount = checkedRecords.length;

        if (checkCount === 0) {
            // Nothing selected: Disable all editing
            form.setDisabled(true);
            btnSaveAll.setDisabled(true);
            if (btnSaveResult) btnSaveResult.setDisabled(true);
            if (btnUploadImage) btnUploadImage.setDisabled(true);
            form.reset();
        } else {
            // At least one selected: Enable form and Batch Save
            form.setDisabled(false);
            btnSaveAll.setDisabled(false);

            if (checkCount === 1) {
                // Exactly one: Enable individual save and image upload
                if (btnSaveResult) btnSaveResult.setDisabled(false);
                if (btnUploadImage) btnUploadImage.setDisabled(false);

                // Ensure form reflects the single selected record if not already
                const currentRecord = form.getRecord();
                if (!currentRecord || currentRecord !== checkedRecords[0]) {
                    evaluationContainer.setEvaluationValues(checkedRecords[0]);
                }
            } else {
                // Multiple selected: Disable individual save (individual save doesn't make sense for multiple)
                if (btnSaveResult) btnSaveResult.setDisabled(true);
                // Keep image upload enabled? Usually batch doesn't support individual images easily, 
                // but let's stick to disabling individual save as requested.
            }
        }
    },
    batchProcessHandler: async function () {
        const grid = this.getView().down('#evaluationGrid');
        const store = grid ? grid.getStore() : null;
        if (!store) return;

        const L = CasMobile.util.Localization;
        // Get all records where the checkcolumn is checked
        const selection = store.getRange().filter(rec => rec.get('checked'));

        if (selection.length === 0) {
            Ext.Msg.alert(L.get('main.alert'), L.get('main.selectItemFirst')).setZIndex(99999);
            return;
        }
        const container = this.getView().down('#evaluationContainer');
        const form = container.down('formpanel');
        const values = form.getValues();
        if (!values.resultVisual || values.resultVisual.trim() === '') {
            Ext.Msg.alert(L.get('main.warning'), L.get('selectResult')).setZIndex(99999);
            return;
        }

        Ext.Msg.confirm(L.get('main.warning'), L.get('saveAllItems'), async (btn) => {
            if (btn !== 'yes') return;
            const view = this.getView();
            view.setMasked({ xtype: 'loadmask', message: 'Saving...' });

            try {
                this.isBatchProcessing = true;
                for (const record of selection) {
                    const round = record.get('round');
                    const roundJson = record.get('roundJson') || {};
                    Ext.apply(roundJson, values);
                    roundJson.round = round;

                    await this.onSaveEvaluationResult(container, record, roundJson, true);
                }
                this.isBatchProcessing = false;
                if (window.isOnline) {
                    CasMobile.activeTab.getStore().load();
                }
                Ext.Msg.alert('Success', '모든 항목이 성공적으로 저장되었습니다.').setZIndex(99999);
                this.getView().destroy();
            } catch (e) {
                console.error(e);
                Ext.Msg.alert('Error', '저장 도중 오류가 발생했습니다.').setZIndex(99999);
            } finally {
                if (view) view.setMasked(false);
            }
        }).setZIndex(99999);
    },
    /**
     *
     * @param view
     * @param evalRecord
     * @param roundJson
     * @return {Promise<void>}
     */
    onSaveEvaluationResult: async function (view, evalRecord, roundJson, isBatch) {
        const round = evalRecord.get('round') || roundJson[0].round;
        const mainRecord = evalRecord.get('mainRecord');

        // 1. Update the original record in the main project grid
        if (mainRecord) {
            await CasMobile.util.ActorUtil.updateMainData(mainRecord, roundJson, `round${round}`);
        } else {
            // Fallback: search by bd_idx if reference is lost
            const bd_idx = evalRecord.get('bd_idx');
            const mainGrid = CasMobile.activeTab;
            if (mainGrid && mainGrid.getStore) {
                const store = mainGrid.getStore();
                const rec = store.findRecord('bd_idx', bd_idx);
                if (rec) {
                    await CasMobile.util.ActorUtil.updateMainData(rec, roundJson, `round${round}`);
                }
            }
        }

        // 2. Update the dummy record in this window's grid
        evalRecord.set('roundJson', roundJson);

        if (view) {
            const win = view.up('window');
            const ctrl = win ? win.getController() : this;
            if (!ctrl.isBatchProcessing) {
                if (window.isOnline) {
                    CasMobile.activeTab.getStore().load();
                }
            }
        }
        // 모두저장이 아닌경우 저장완료 메시지
        if (isBatch !== true) {
            Ext.toast(loc.upload.saved)
        }
        return Promise.resolve(true);
    }
});