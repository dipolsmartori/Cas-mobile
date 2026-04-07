Ext.define('CasMobile.Events', {
    singleton: true,
    /**
     * @event addbuttonclick
     * @param {Ext.grid.Panel]
     * @param {Array<Ext.data.Model>} records
     */
    ADD_BUTTON_CLICK: 'addbuttonclick',

    /**
     * @event adduserbuttonclick
     */
    ADD_USER_BUTTON_CLICK: 'adduserbuttonclick',

    /**
     * @event edituserbuttonclick
     */
    EDIT_USER_BUTTON_CLICK: 'edituserbuttonclick',

    /**
     * 업로드 창 수정 모드에서 등록됐던 파일을 제거 하려 할때 발생
     * @event attachfileremoved
     * - From: Actor.view.upload.ActorUploader > form
     * @param {plupload.File} file
     * @param {Number} index
     * @param {Number} group
     * @param {Ext.form.Panel} form
     */
    ATTACH_FILE_REMOVED: 'attachfileremoved',

    /**
     * 업로드 창에서 AttachUnit의 휴지통을 클릭해서 삭제 할때 발생
     * @event attachunitcanceled
     * - From: Actor.view.upload.AttachUnit
     * @param {Actor.view.upload.FileUploader} fileUploaderView
     * @param {Number} index,
     * @param {plupload.File} file
     * @param {Number} file_group
     */
    ATTACH_UNIT_CANCELED: 'attachunitcanceled',

    /**
     * Fired when a user clicks the button on ActorUtil.alert() a window.
     * - From: Actor.view.ActorAlert
     */
    BUTTON_CLICK: 'buttonclick',
    OKAY: 'buttonclick',

    /**
     * 달력에서 이벹트 등록/수정창이 열렸을 때
     * @event calendarupdatewindowready
     *  - From: Actor.view.calendar.ActorCalendar
     *  @param {Actor.view.calendar.ActorAddScheduleWindow} updateWindow
     */
    CALENDAR_UPDATE_WINDOW_READY: 'calendarupdatewindowready',

    /**
    /**
     * cancel
     */
    CANCEL: 'cancel',


    /**
     * - From: Actor.view.upload.ActorUploader > form
     * @param {Ext.form.Panel} formPanel
     * @param {Ext.Window} this
     * @param {Number} group
     */
    CUSTOM_FIELD_COMPLETE: 'customfieldcomplete',

    /**
     * 삭제 버튼 클릭
     * @event deletebuttonclick
     * @param {Ext.grid.Panel} grid
     * @param {Array<Ext.data.Model>} records
     */
    DELETE_BUTTON_CLICK: 'deletebuttonclick',

    /**
     * @event deleteuserbuttonclick
     */
    DELETE_USER_BUTTON_CLICK: 'deleteuserbuttonclick',

    /**
     * 수정 모드에서 첨부되었던 파일을 제거 했을 때
     * @event delentryadded
     * - From: Actor.view.upload.ActorUploader
     * @param {Actor.view.upload.ActorUpload} view
     * @param {Number} file_idx
     * @param {Actor.view.upload.AttachUnit} attachUnit
     */
    DEL_ENTRY_ADDED: 'delentryadded',

    /**
    /**
     * If categoryOption has an option --doSubmit:0, submit stopped when a user clicks the submitted button
     * and do something after listening to this event
     * As set btnSubmit.doSubmit = true; btnSubmit.handler(btnSubmit), it can be submitted with new added function
     * - From: Actor.view.upload.ActorUploader > form
     * @param {Ext.Button} button submitted button
     * @param {Ext.form.Panel} form
     * @event dosubmit
     */
    DO_SUBMIT: 'dosubmit',

    /**
     * ActorAlert에 texts config나 buttonText1 config가 있을때 생기는 추가 버튼을 클릭 했을 때 발생
     * - From: Actor.view.ActorAlert
     * @event extrabuttonclick
     */
    EXTRA_BUTTON_CLICK: 'extrabuttonclick',

    /**

    /**
     * Fired whenever file(s) are added in the pluploader
     * - From: Actor.view.upload.ActorUploader
     * @param {Ext.Panel} view
     * @param {Array<plupload.File>} files
     * @param {Number} group the file_group
     */
    FILE_ADDED: 'fileadded',

    /**
     * Fired to signal a transition to the main application view from Actor.controller.Login.
     * - From: Ext.GlobalEvents
     * @param {Ext.Component} [container] Optional container to destroy before showing the main view.
     */
    GO_TO_MAIN_VIEW: 'gotomainview',

    /**
     * Fired when the user changes the grid's row height, or the width and height of a Gallery type item.
     * @param {String} gridType
     * @param {Object} value w:100, h:200
     */
    GRID_ITEM_RESIZE: 'griditemresize',

    /**
     * Fired when the initial application view (either Login or Main) is created and ready from
     * Actor.Application and Actor.controller.Login.
     * The view component itself is passed as a parameter.
     * - From: Ext.GlobalEvents
     * @param {Ext.Component} view The initial view component.
     */
    INITIAL_VIEW_READY: 'initialviewready',


    /**
     * Fired when the application language has been changed from Actor.util.Localization
     * - From: Ext.GlobalEvents
     * @param {String} lang The new language code (e.g., 'en', 'ko').
     */
    LANGUAGE_CHANGE: 'languagechange',

    /**
     * 로그인 판넬에서 로고가 렌더링 되었을 때 발생
     * - From: Ext.GlobalEvents
     */
    LOGO_ADDED: 'logoadded',
    /**
     * Fired when a user successfully logs in from Actor.controller.Login.
     * - From: Ext.GlobalEvents
     * @param {String} userId The ID of the logged-in user.
     */
    LOGIN_SUCCESS: 'loginsuccess',

    /**
     * Fired when the main application view is rendered and ready in MainView Controller.
     * - From: Ext.GlobalEvents
     */
    MAIN_VIEW_READY: 'mainviewready',

    /**
     * Fired whenever a new pluploader is created from the FileUploader
     * view, button.uploader, fileCon.group
     * - From: Actor.view.upload.FileUploader
     * @param {FileUploader} view
     * @param {pluploader} uploader
     * @param {Number} file_group
     */
    NEW_UPLOADER: 'newuploader',

    /**
     * Print with another print library and fire the event "print"
     */
    PRINT: 'print',

    /**
     * Fired when a project item clicked
     * - From: Actor.view.main.MainView(mainView)
     * @param {Ext.data.Model} record The project record.
     */
    PROJECT: 'project',

    /**
     * Fired when click a project name
     * @event projectcategoryclick
     * @param {Ext.data.Model} record The project record.
     * @param {HTMLElement} item The HTML element for the clicked item.
     */
    PROJECT_CATEGORY_CLICK: 'projectcategoryclick',

    /**
     * Actor.view.fields.QueryField에서 itemclick으로 데이터가 선택 됐을 경우 발생
     * - From: Actor.view.fields.QueryField
     * @event querydataloaded
     * @param {Actor.view.fields.QueryField}
     * @param {Array} data 선택된 아이템의 레코드 data (listC)
     * @event querydataloaded
     */
    QUERY_DATA_LOADED: 'querydataloaded',

    /**
     * Fired when click the reset button for changing grid item size
     * - From: pagingtoolbar
     * @event resetgriditemsize
     */
    RESET_GRID_ITEM_SIZE: 'resetgriditemsize',

    /**
     * Fires from VisualEvaluationContainer when save button is clicked
     * @event saveevaluationresult
     */
    SAVE_EVALUATION_RESULT: 'saveevaluationresult',



    /**
     * 사용자 정보가 수정 됐을 때
     * userinfochanged
     */
    USER_INFO_CHANGED: 'userinfochanged',

    /**
     * 사용자 사이트 접속이 허용 됐을 때
     * @event userunblocked
     */
    USER_UNBLOCKED: 'userunblocked',
    /**
     * - From: EditFieldItemWindow
     * @event updatecomplete
     * @param {Object} params
     */
    UPDATE_COMPLETE: 'updatecomplete',

    /**
     * Fired after completing an upload
     * @event uploadcomplete
     * @param {Array<number>} bd_idxs
     * @param {Object} values form values
     */
    UPLOAD_COMPLETE: 'uploadcomplete',

    /**
     * Fired when the user clicks the remove icon on an already uploaded file.
     * - From : Actor.view.upload.AttachUnit
     * @event uploadedfileremoveclick
     * @param {number} file_idx The index of the file to be removed from the server.
     */
    UPLOADED_FILE_REMOVE_CLICK: 'uploadedfileremoveclick',

});