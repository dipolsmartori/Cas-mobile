Ext.define('CasMobile.util.ActorUtil', {
    singleton: true,
    mainVarFilters: ['assemblyCo', 'assyTrim', 'bd_content', 'bd_subject', 'colorCode', 'datasetId', 'grainCode', 'modelId', 'partNumber', 'partId', 'partName1', 'partName2', 'partNumber', 'partType', 'modelName', 'rawMaterialCo', 'rawMaterial'],
    addUpdate1: function (values, uploadContainer) {
        return new Promise(resolve => {
            let formData;

            // Check if the input is already a FormData object or needs conversion.
            if (values instanceof FormData) {
                formData = values;
            } else {
                formData = new FormData();
                for (const key in values) {
                    if (Object.prototype.hasOwnProperty.call(values, key)) {
                        formData.append(key, values[key]);
                    }
                }
            }
            // Only add default values if they haven't already been provided in the
            // incoming `values` object or FormData.
            if (!formData.has('uploadType')) {
                formData.append('uploadType', 'form');
            }
            if (!formData.has('bd_group')) {
                formData.append('bd_group', 1);
            }
            if (!formData.has('fileCount')) {
                formData.append('fileCount', 1);
            }
            // Ext.Ajax.request({
            //     url: CasMobile.APIs.getFullUrl(CasMobile.APIs.ADD_UPDATE1),
            //     method: 'POST',
            //     rawData: formData,
            //     withCredentials:true,
            //     success:function (response){
            //         console.log(response)
            //         let reTxt = xhr.responseText.replace('null(', '');
            //         reTxt = reTxt.replace(')', '');
            //         const result = JSON.parse(reTxt);
            //         if(result.result) {
            //             if (uploadContainer) uploadContainer.fireEvent('uploadcomplete', result.bd_idx, result.file_idx);
            //             resolve(result);
            //         }
            //         else{
            //             alert('An error occurred!');
            //         }
            //     },
            //     failure:function (response){
            //         alert('An error occurred!');
            //     }
            // });
            const xhr = new XMLHttpRequest();
            xhr.open('POST', CasMobile.APIs.getFullUrl(CasMobile.APIs.ADD_UPDATE1), true);
            xhr.withCredentials = true;
            xhr.onload = function () {
                if (xhr.status === 200) {

                } else {
                    alert('An error occurred!');
                }
            };
            xhr.send(formData);
        })

    },
    addUpdate2: async function (values, uploadContainer) {
        let formData;

        // Check if the input is already a FormData object or needs conversion.
        if (values instanceof FormData) {
            formData = values;
        } else {
            formData = new FormData();
            for (const key in values) {
                if (Object.prototype.hasOwnProperty.call(values, key)) {
                    formData.append(key, values[key]);
                }
            }
        }
        // Only add default values if they haven't already been provided in the
        // incoming `values` object or FormData.
        if (!formData.has('uploadType')) {
            formData.append('uploadType', 'form');
        }
        if (!formData.has('bd_group')) {
            formData.append('bd_group', 1);
        }
        try {
            const response = await Ext.Ajax.request({
                url: CasMobile.APIs.ADD_UPDATE2,
                method: 'POST',
                rawData: formData, // Send the FormData object for multipart upload
                headers: {
                    // Let the browser set the Content-Type for multipart, including the boundary
                    'Content-Type': null
                }
            });

            const responseText = response.responseText;
            const re = responseText.startsWith('null(')
                ? responseText.substring(5, responseText.length - 1)
                : responseText;
            const data = JSON.parse(re);
            const bd_idx = data.bd_idx;

            if (uploadContainer) {
                uploadContainer.fireEvent('uploadcomplete', bd_idx, values);
            }
            return bd_idx;
        } catch (response) {
            // Ext.Ajax.request rejects the promise for network errors or non-2xx status codes.
            const message = response.timedout ? 'Connection timed out.' : 'There was a problem saving your data.';
            Ext.Msg.alert('Error', message);
            console.error('Error during form submission.', response);
            return null;
        }
    },
    getPlUploader: function (params, initialize = true) {
        if (params === undefined) {
            alert('No parameters found');
            return;
        }
        const uploader = new plupload.Uploader({
            runtimes: 'html5,flash,silverlight,html4',
            file_data_name: 'file',
            multiple_queues: params.multiple_queues || false,
            browse_button: (params.browse === false) ? null : params.browse_button, // you can pass in id...
            url: params.url || "/binder/upload",
            chunk_size: '200mb' || params.chunk_size,
            filters: {
                max_file_size: '5gb',
                mime_types: [
                    { title: params.title || "Image files", extensions: params.extensions || '*' }
                ],
                prevent_duplicates: true
            },
            views: {
                list: true,
                thumbs: true, // Show thumbs
                active: 'list'
            },
            multipart: true,
            multipart_params: params.multipart_params || { group: 0 },
            multi_selection: (params.multi_selection == false) ? false : true,
            rename: true,
            sortable: true,
            dragdrop: true,
            drop_element: params.drop_element,
            flash_swf_url: 'js/plupload/js/Moxie.swf',
            silverlight_xap_url: 'js/plupload/js/Moxie.xap'
        });
        if (initialize) {
            uploader.init();
        }
        return uploader;
    },
    getWriteData: (categoryId, bd_idx) => {
        return new Promise(resolve => {
            Ext.Ajax.request({
                url: CasMobile.APIs.WRITE,
                withCredentials: true,
                params: {
                    ca_id: categoryId,
                    bd_idx: bd_idx || '',
                    html: 0,
                },
                success: function (response) {
                    const obj = Ext.decode(response.responseText);
                    resolve(obj);
                },
            });
        });
    },
    /**
     * 🆙🆙🆙🆙🆙
     * Main record의 c_roundxx와 연결된 dataset data 값을 업데이트
     * @param mainRecord
     * @param roundJson
     * @param {string} dataIndex c_roundxx (c_round1 | c_round2 | c_round3 | ...)
     * @return {Promise<void>}
     */
    updateMainData: async function (mainRecord, roundJson, dataIndex) {
        const round = roundJson.round;
        if (roundJson.type === 'NONE') roundJson.type = '';

        const roundValStr = JSON.stringify([roundJson]);
        // ⭕⭕ 갱신된 roundJson으로 main bd_idx를 통해 roundx 필드  업데이트
        const mainParams = {
            ca_id: mainRecord.get('ca_id'),
            bd_idx: mainRecord.get('bd_idx'),
            [`round${round}`]: roundValStr
        };

        // 1. Update the record in memory immediately so UI is always snappy
        if (mainRecord.beginEdit) mainRecord.beginEdit();

        // 🆙🆙🆙 CLONE the object to ensure Ext JS detects it as a NEW value
        // If we pass the same reference, set() might skip the update event.
        const freshRoundJson = Ext.apply({}, roundJson);
        mainRecord.set(dataIndex, freshRoundJson);

        // Ensure bd_data is also updated if it exists (for consistency)
        let bdData = mainRecord.get('bd_data');
        if (bdData && Array.isArray(bdData)) {
            // Clone the array to ensure Ext JS detects the change
            const newBdData = [...bdData];
            let targetCol = newBdData.find(c => c.cols_code === dataIndex);
            if (!targetCol) {
                targetCol = { cols_code: dataIndex };
                newBdData.push(targetCol);
            }
            // data_val remains a JSON string as per server/cache format
            targetCol.data_val = JSON.stringify([freshRoundJson]);
            targetCol.isUpdatedOffline = true;
            mainRecord.set('bd_data', newBdData);
        }

        // Flag the memory model as updated so offline excel export sees it
        mainRecord.set('isUpdatedOffline', true);

        if (mainRecord.endEdit) mainRecord.endEdit();
        if (mainRecord.commit) mainRecord.commit();

        // Force a grid refresh as a safety measure for Modern toolkit
        if (CasMobile.activeTab && CasMobile.activeTab.refresh) {
            CasMobile.activeTab.refresh();
        }
        // 2. Persist to server if online
        if (window.isOnline) {
            Ext.Ajax.request({
                url: CasMobile.APIs.UPDATE_DATA,
                params: mainParams,
                withCredentials: true,
                success: function (response) {
                    if (!response.responseText.includes('true')) {
                        console.warn('Server update failed, but record updated locally.');
                    }
                },
                failure: function () {
                    console.warn('Server connection failed, but record updated locally.');
                }
            });
        } else {
            // Offline: Update IndexedDB Cache to ensure data survives refresh/restart
            await new Promise(async (resolve) => {
                try {
                    // 1. Identify datasetId from active grid
                    const grid = CasMobile.activeTab;
                    if (!grid || !grid.params) {
                        console.warn('Could not identify active grid for offline sync');
                        resolve(false);
                        return;
                    }
                    const datasetId = grid.params.datasetId || grid.params.ca_id;
                    const bd_idx = mainRecord.get('bd_idx');

                    // 2. Open IndexedDB
                    const db = await new Promise((res, rej) => {
                        const req = indexedDB.open('CasMobileCache', 3);
                        req.onsuccess = e => res(e.target.result);
                        req.onerror = e => rej(e);
                    });

                    if (!db.objectStoreNames.contains('gridData')) {
                        resolve(false);
                        return;
                    }

                    // 3. Update the specific record in the cached array
                    const tx = db.transaction(['gridData'], 'readwrite');
                    const dbStore = tx.objectStore('gridData');
                    const getReq = dbStore.get(datasetId);

                    getReq.onsuccess = e => {
                        const entry = e.target.result;
                        if (!entry) return;

                        // Support both legacy array format and new object format
                        const records = Array.isArray(entry) ? entry : entry.dataByBdIdx;

                        if (records && Array.isArray(records)) {
                            const recordToUpdate = records.find(r => r.bd_idx === bd_idx);
                            if (recordToUpdate) {
                                // Update bd_data structure in the cache
                                if (!recordToUpdate.bd_data) recordToUpdate.bd_data = [];

                                let targetCol = recordToUpdate.bd_data.find(c => c.cols_code === dataIndex);
                                if (!targetCol) {
                                    targetCol = { cols_code: dataIndex };
                                    recordToUpdate.bd_data.push(targetCol);
                                }
                                // Update the value in the raw format [roundJson]
                                targetCol.data_val = JSON.stringify([roundJson]);
                                targetCol.isUpdatedOffline = true;

                                // Mark this record so we only load updated items for offline sync
                                recordToUpdate.isUpdatedOffline = true;

                                // Put back the entire entry (retaining metadata if present)
                                dbStore.put(entry, datasetId);
                            }
                        }
                    };

                    tx.oncomplete = () => {
                        console.log('Offline IndexedDB sync complete.');
                        resolve(true);
                    };
                    tx.onerror = () => resolve(false);
                } catch (e) {
                    console.error('Offline update error:', e);
                    resolve(false);
                }
            });
        }

        return roundJson;
    },
})