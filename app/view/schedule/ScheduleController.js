Ext.define('CasMobile.view.schedule.ScheduleController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.cas-schedule',

    init: function () {
        this.bullets = {
            partial: `<div style="float:left;margin:3px 5px 0 3px;width:7px;height:10px;background-color:#FFD700"></div>`,
            public: `<div style="float:left;margin:3px 5px 0 3px;width:7px;height:10px;background-color:#FFD700"></div>`,
            private: `<div style="float:left;margin:3px 5px 0 3px;width:7px;height:10px;background-color:#82bcff"></div>`
        };
        this.status = 'combine'; // Default
        this.extendedFields = ['allDay', 'eventTextBackgroundColor', 'eventTextColor', 'participant', 'notifications', 'emails', 'popup', 'duration', 'invite', 'evaluation', 'model', 'round'];

        // Custom CSS for smaller fonts on full-screen mobile dialog
        if (!document.getElementById('mobile-calendar-styles')) {
            const style = document.createElement('style');
            style.id = 'mobile-calendar-styles';
            style.innerHTML = `
                .mobile-calendar-small-font .fc { font-size: 0.85em; }
                .mobile-calendar-small-font .fc-toolbar-title { font-size: 1.1em !important; }
                .mobile-calendar-small-font .fc-button { padding: 0.25em 0.4em !important; font-size: 0.9em !important; }
                .mobile-calendar-small-font .fc-daygrid-event { font-size: 0.85em !important; }
                .mobile-calendar-small-font .fc-col-header-cell-cushion { padding: 3px !important; }
                .mobile-calendar-small-font .fc-daygrid-day-number { padding: 3px !important; }
                
                /* Ensure popovers display correctly above the Ext.Dialog */
                .fc-popover { z-index: 999999 !important; }

                /* Header layout and Custom Search Button alignment */
                .fc-toolbar-chunk { display: flex; align-items: center; }
                .fc-searchBtn-button {
                    font-family: "Font Awesome 5 Free" !important;
                    font-weight: 900 !important;
                    background: transparent !important;
                    border: none !important;
                    color: #555 !important;
                    box-shadow: none !important;
                    padding: 0 0 0 8px !important;
                    font-size: 1.2em !important;
                    vertical-align: middle;
                }
                .fc-searchBtn-button:focus, .fc-searchBtn-button:active, .fc-searchBtn-button:hover {
                    background: transparent !important;
                    box-shadow: none !important;
                    border: none !important;
                    color: #000 !important;
                }
            `;
            document.head.appendChild(style);
        }
    },

    onViewPainted: function () {
        const L = CasMobile.util.Localization;
        const isPhone = Ext.os.is.Phone || Ext.Element.getViewportWidth() < 768;

        if (isPhone) {
            const btn = this.getView().down('#btnShowDialog');
            if (btn) {
                btn.setText(L.get('calendar.calendar') || 'Open Calendar');
                btn.show();
            }
            if (!this.hasAutoOpened) {
                this.openCalendarDialog();
                this.hasAutoOpened = true;
            }
        } else {
            if (!this.calendarContainer) {
                this.calendarContainer = this.getView().add(this.getCalendarConfig());
            }
        }
    },

    getCalendarConfig: function () {
        const me = this;
        return {
            xtype: 'container',
            layout: 'fit',
            scrollable: false,
            itemId: 'calendarMainCon',
            items: [
                {
                    xtype: 'toolbar',
                    docked: 'top',
                    hidden: true,
                    items: [
                        {
                            xtype: 'segmentedbutton',
                            itemId: 'statusGroup',
                            allowMultiple: false,
                            listeners: {
                                change: me.onStatusChange.bind(me),
                                painted: me.onStatusRender.bind(me)
                            },
                            items: [
                                { text: 'All', value: 'combine', pressed: true, itemId: 'btnCombine' },
                                { text: 'Public', value: 'public', itemId: 'btnPublic' },
                                { text: 'Private', value: 'private', itemId: 'btnPrivate' }
                            ]
                        }
                    ]
                },
                {
                    xtype: 'component',
                    itemId: 'calendarComp',
                    listeners: {
                        painted: me.onCalendarPainted.bind(me),
                        resize: me.onCalendarResize.bind(me)
                    }
                }
            ]
        };
    },

    openCalendarDialog: function () {
        const L = CasMobile.util.Localization;
        const me = this;

        if (!this.mobileDialog) {
            this.mobileDialog = Ext.create('Ext.Dialog', {
                layout: 'fit',
                title: L.get('calendar.calendar') || 'Schedule',
                maximized: true,
                closable: true,
                closeAction: 'hide',
                preventRefocus: true,
                cls: 'mobile-calendar-small-font',
                items: [
                    this.getCalendarConfig()
                ],
                listeners: {
                    show: function () {
                        if (window.history && window.history.pushState) {
                            window.history.pushState({ cprState: 'calendar_dialog' }, document.title, window.location.href);
                        }
                        setTimeout(() => {
                            if (me.calendar) {
                                me.calendar.updateSize();
                                me.calendar.render();
                            }
                        }, 300);
                    },
                    hide: function () {
                        if (window.history && window.history.state && window.history.state.cprState === 'calendar_dialog') {
                            window.history.back();
                        }
                    }
                }
            });
            Ext.Viewport.add(this.mobileDialog);
        }
        this.mobileDialog.show();
    },

    onStatusRender: function (segmentedButton) {
        const L = CasMobile.util.Localization;
        const btnCombine = segmentedButton.down('#btnCombine');
        const btnPublic = segmentedButton.down('#btnPublic');
        const btnPrivate = segmentedButton.down('#btnPrivate');

        if (btnCombine) btnCombine.setText(L.get('calendar.titleCombine') || 'All');
        if (btnPublic) btnPublic.setText(L.get('calendar.titlePublic') || 'Public');
        if (btnPrivate) btnPrivate.setText(L.get('calendar.titlePrivate') || 'Private');
    },

    onCalendarPainted: function (comp) {
        if (this.calendar) return; // Prevent double init

        const L = CasMobile.util.Localization;
        this.calendarCategories = window.siteInfo ? window.siteInfo.categories.calendar : null;
        if (!this.calendarCategories) {
            console.error('No calendar categories found in siteInfo');
            return;
        }
        this.calendarCategories.share = this.calendarCategories.private;
        this.calendarCategories.group = this.calendarCategories.private;

        const me = this;

        this.calendarGestureElement = comp.element;
        this.calendarGestureElement.setStyle('touch-action', 'pan-y');
        this.calendarGestureElement.on('swipe', this.onCalendarSwipe, this);

        this.calendar = new FullCalendar.Calendar(comp.element.dom, {
            initialView: 'dayGridMonth',
            timeZone: 'local',
            buttonText: {
                month: L.get('calendar.txtMonth') || 'Month',
                week: L.get('calendar.txtWeek') || 'Week',
                day: L.get('calendar.txtDay') || 'Day',
                list: L.get('calendar.txtList') || 'List',
                today: L.get('calendar.txtToday') || 'Today'
            },
            height: '100%',
            contentHeight: '100%',
            expandRows: true,
            handleWindowResize: true,
            customButtons: {
                searchBtn: {
                    text: '\uF002',
                    click: function () {
                        const L = CasMobile.util.Localization;
                        Ext.Msg.show({
                            title: loc.search.search,
                            message: '',
                            prompt: true,
                            buttons: [
                                { text: loc.main.cancel || 'Cancel', itemId: 'cancel' },
                                { text: loc.main.confirm || 'OK', itemId: 'ok', ui: 'action' }
                            ],
                            fn: function (action, value) {
                                if (action === 'ok' || action === 'yes') {
                                    if (value && value.length > 0) {
                                        me.doSearchPopup(value);
                                    }
                                }
                            }
                        });
                    }
                }
            },
            headerToolbar: {
                left: 'prev,next today',
                center: 'title searchBtn',
                right: 'dayGridMonth,listMonth'
            },
            slotMinTime: '06:00:00',
            slotMaxTime: '21:00:00',
            eventTimeFormat: { hour: 'numeric', minute: '2-digit', omitZeroMinute: false },
            eventOverlap: false,
            dayMaxEvents: 2,
            editable: false,
            selectable: false,
            nowIndicator: true,
            navLinks: true,
            locale: (localStorage.getItem('language') === 'en') ? 'en' : 'ko',

            events: function (fetchInfo, successCallback, failureCallback) {
                me.fetchEvents(fetchInfo, successCallback, failureCallback);
            },

            eventContent: function (arg) {
                let type = arg.event.extendedProps.share || 'public';
                if (type === 'share' || type === 'group') {
                    type = 'partial';
                }
                const eventTitle = document.createElement('div');
                eventTitle.style.overflowX = 'hidden';
                eventTitle.style.maxWidth = '100%';
                eventTitle.style.whiteSpace = 'nowrap';
                eventTitle.style.fontSize = '12px'; // Default, customized by mobile css
                eventTitle.style.padding = '1px 3px';

                if (arg.event.textColor) {
                    eventTitle.style.color = arg.event.textColor;
                }
                if (arg.event.backgroundColor) {
                    eventTitle.style.backgroundColor = arg.event.backgroundColor;
                }

                const bullet = me.bullets[type] || me.bullets['public'] || '';
                const title = arg.event.title || '(No Title)';
                eventTitle.innerHTML = bullet + title;

                return { domNodes: [eventTitle] };
            },

            eventClick: function (info) {
                me.onViewEvent(info.event);
            },

            datesSet: function (dateInfo) {
                const toolbars = comp.element.dom.querySelectorAll('.fc-toolbar');
                toolbars.forEach(toolbar => {
                    toolbar.style.flexWrap = 'wrap';
                    toolbar.style.gap = '5px';
                });
            }
        });

        setTimeout(() => {
            if (this.calendar) {
                this.calendar.render();
                this.calendar.updateSize();
            }
        }, 150);
    },

    onCalendarSwipe: function (event) {
        if (!this.calendar || !event || (event.direction !== 'left' && event.direction !== 'right')) {
            return;
        }

        if (this.calendarSwipeAnimating) {
            console.info('[Schedule calendar swipe] ignored while transition is active');
            return;
        }

        const previousDate = this.calendar.getDate();
        const monthOffset = event.direction === 'left' ? 1 : -1;
        const targetDate = new Date(previousDate.getFullYear(), previousDate.getMonth() + monthOffset, 1);
        const direction = event.direction;
        const me = this;

        console.info('[Schedule calendar swipe] navigation requested', {
            direction: direction,
            from: Ext.Date.format(previousDate, 'Y-m'),
            to: Ext.Date.format(targetDate, 'Y-m')
        });

        Ext.defer(function () {
            if (!me.calendar) return;
            me.animateCalendarMonthChange(targetDate, direction);
        }, 0);
    },

    animateCalendarMonthChange: function (targetDate, direction) {
        const me = this;
        const calendarDom = me.calendarGestureElement && me.calendarGestureElement.dom;
        const harness = calendarDom && calendarDom.querySelector('.fc-view-harness');
        const currentView = harness && harness.querySelector('.fc-view-harness-active');

        if (!me.calendar || !harness || !currentView || !currentView.animate) {
            me.calendar.gotoDate(targetDate);
            me.calendar.render();
            me.calendar.updateSize();
            me.logCalendarSwipeRender(direction, false);
            return;
        }

        me.calendarSwipeAnimating = true;

        const originalOverflow = harness.style.overflow;
        const originalPosition = harness.style.position;
        const outgoingView = currentView.cloneNode(true);
        const distance = harness.getBoundingClientRect().width || currentView.getBoundingClientRect().width;
        const outgoingX = direction === 'left' ? -distance : distance;
        const incomingX = -outgoingX;

        harness.style.position = 'relative';
        harness.style.overflow = 'hidden';

        outgoingView.classList.remove('fc-view-harness-active');
        outgoingView.classList.add('cas-calendar-slide-layer');
        outgoingView.style.position = 'absolute';
        outgoingView.style.inset = '0';
        outgoingView.style.width = '100%';
        outgoingView.style.height = '100%';
        outgoingView.style.zIndex = '2';
        outgoingView.style.pointerEvents = 'none';
        outgoingView.style.backgroundColor = '#fff';
        harness.appendChild(outgoingView);

        me.calendar.gotoDate(targetDate);

        const incomingView = harness.querySelector('.fc-view-harness-active');

        if (!incomingView || !incomingView.animate) {
            outgoingView.remove();
            harness.style.overflow = originalOverflow;
            harness.style.position = originalPosition;
            me.calendarSwipeAnimating = false;
            me.calendar.render();
            me.calendar.updateSize();
            me.logCalendarSwipeRender(direction, false);
            return;
        }

        const animationOptions = {
            duration: 240,
            easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
            fill: 'both'
        };
        const outgoingAnimation = outgoingView.animate([
            { transform: 'translate3d(0, 0, 0)' },
            { transform: 'translate3d(' + outgoingX + 'px, 0, 0)' }
        ], animationOptions);
        const incomingAnimation = incomingView.animate([
            { transform: 'translate3d(' + incomingX + 'px, 0, 0)' },
            { transform: 'translate3d(0, 0, 0)' }
        ], animationOptions);
        let transitionCompleted = false;

        const finishTransition = function () {
            if (transitionCompleted) return;
            transitionCompleted = true;

            outgoingAnimation.cancel();
            incomingAnimation.cancel();
            outgoingView.remove();
            harness.style.overflow = originalOverflow;
            harness.style.position = originalPosition;
            me.calendarSwipeAnimating = false;

            if (me.calendar) {
                me.calendar.updateSize();
                me.logCalendarSwipeRender(direction, true);
            }
        };

        incomingAnimation.onfinish = finishTransition;
        Ext.defer(finishTransition, 400);
    },

    logCalendarSwipeRender: function (direction, animated) {
        const calendarDom = this.calendarGestureElement && this.calendarGestureElement.dom;
        const titleElement = calendarDom && calendarDom.querySelector('.fc-toolbar-title');

        console.info('[Schedule calendar swipe] render completed', {
            direction: direction,
            animated: animated,
            currentMonth: Ext.Date.format(this.calendar.getDate(), 'Y-m'),
            toolbarTitle: titleElement ? titleElement.textContent.trim() : ''
        });
    },

    destroy: function () {
        if (this.calendarGestureElement) {
            this.calendarGestureElement.un('swipe', this.onCalendarSwipe, this);
            this.calendarGestureElement = null;
        }

        if (this.calendar) {
            this.calendar.destroy();
            this.calendar = null;
        }

        this.callParent(arguments);
    },

    onCalendarResize: function () {
        if (this.calendar) {
            this.calendar.updateSize();
        }
    },

    onStatusChange: function (segmentedButton, value) {
        this.status = value;
        if (this.calendar) {
            this.calendar.refetchEvents();
        }
    },

    doSearchPopup: async function (value) {
        if (!value || value.length < 2) {
            Ext.toast(CasMobile.util.Localization.get('calendar.tooShort') || 'Please enter at least 2 characters');
            return;
        }

        Ext.Viewport.setMasked({ xtype: 'loadmask', message: CasMobile.util.Localization.get('upload.searching') || CasMobile.util.Localization.get('schedule.searching') || 'Loading...' });

        try {
            const participantValue = encodeURIComponent(`|${Actor.userInfo.nv_id}|`);
            const participantGrpValue = encodeURIComponent(`|${Actor.userInfo.nv_group}|`);
            const priUrl = CasMobile.APIs.getFullUrl(CasMobile.APIs.LIST_C) + `?ca_id=${this.calendarCategories.private}&se_all=${value}&o=s&participant=${participantValue}`;
            const priGrpUrl = CasMobile.APIs.getFullUrl(CasMobile.APIs.LIST_C) + `?ca_id=${this.calendarCategories.private}&se_all=${value}&o=s&participant=${participantGrpValue}`;
            const pubUrl = CasMobile.APIs.getFullUrl(CasMobile.APIs.LIST_C) + `?ca_id=${this.calendarCategories.public}&se_all=${value}&o=s`;

            const responses = await Promise.all([
                fetch(priUrl).then(res => res.json()),
                fetch(pubUrl).then(res => res.json()),
                fetch(priGrpUrl).then(res => res.json())
            ]);

            const combined = responses.flatMap(res => res.binderListBeanList || []);
            combined.sort((a, b) => new Date(a.c_start) - new Date(b.c_start));

            Ext.Viewport.setMasked(false);

            if (combined.length === 0) {
                Ext.toast(CasMobile.util.Localization.get('main.noMatchingData') || 'No data found');
                return;
            }

            let units = '';
            combined.forEach((entry, index) => {
                const dateStr = entry.c_start ? entry.c_start.substring(0, 10) : '';
                units += `
                    <div style="padding: 10px; border-bottom: 1px solid #eee; position: relative;">
                        <i data-index="${index}" style="position: absolute; right: 10px; top: 15px; font-size: 20px; color: #004F9F; cursor: pointer;" class="fas fa-external-link-square-alt jump-btn"></i>
                        <h3 style="margin: 0 0 5px 0; font-size: 15px; padding-right: 30px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${Ext.htmlEncode(entry.bd_subject)}</h3>
                        <div style="font-size: 12px; color: #666;">
                            <i class="far fa-calendar-alt"></i> ${dateStr} 
                            <span style="margin-left: 10px;"><i class="fas fa-user"></i> ${Ext.htmlEncode(entry.bd_name)}</span>
                        </div>
                    </div>
                `;
            });

            const me = this;
            const searchDialog = Ext.create('Ext.Dialog', {
                title: (CasMobile.util.Localization.get('search.search') || 'Search') + `: ${value}`,
                layout: 'fit',
                width: '90%',
                height: '70%',
                closable: true,
                scrollable: true,
                html: units,
                buttons: [
                    {
                        text: CasMobile.util.Localization.get('main.close') || 'Close',
                        ui: 'action',
                        handler: function (btn) {
                            btn.up('dialog').destroy();
                        }
                    }
                ],
                listeners: {
                    painted: function (comp) {
                        const btns = comp.element.dom.querySelectorAll('.jump-btn');
                        btns.forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                const idx = e.target.getAttribute('data-index');
                                const item = combined[idx];
                                let d = item.c_start || item.start || item.bd_start || item.c_date || item.bd_date;
                                if (d && typeof d === 'string' && d.length === 8 && !d.includes('-')) {
                                    d = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
                                }
                                if (d && me.calendar) {
                                    me.calendar.gotoDate(new Date(d));
                                }
                                comp.destroy();
                            });
                        });
                    }
                }
            });
            Ext.Viewport.add(searchDialog);
            searchDialog.show();

        } catch (e) {
            Ext.Viewport.setMasked(false);
            console.error('Search failed', e);
            Ext.toast('Search failed');
        }
    },

    fetchEvents: async function (fetchInfo, successCallback, failureCallback) {
        setTimeout(async () => {
            const refDt = Ext.Date.format(fetchInfo.start, 'Y-m');
            const status = this.status;
            let eventPromises = [];

            if (!Actor.userInfo) {
                console.warn('UserInfo is missing, skipping calendar data fetch');
                successCallback([]);
                return;
            }

            if (status === 'private' || status === 'combine') {
                eventPromises.push(this.getCalendarData(refDt, this.calendarCategories.private, false, true));
                eventPromises.push(this.getCalendarData(refDt, this.calendarCategories.private));
                eventPromises.push(this.getCalendarData(refDt, this.calendarCategories.private, true));
            }
            if (status === 'public' || status === 'combine') {
                eventPromises.push(this.getCalendarData(refDt, this.calendarCategories.public));
                eventPromises.push(this.getCalendarData(refDt, this.calendarCategories.public, true));
            }

            const eventArrays = await Promise.all(eventPromises);
            let selectedEvents = [].concat(...eventArrays);

            const uniqueEventsMap = new Map();
            selectedEvents.forEach(ev => {
                if (ev && ev.id) {
                    uniqueEventsMap.set(ev.id, ev);
                }
            });
            selectedEvents = Array.from(uniqueEventsMap.values());

            successCallback(selectedEvents);
        }, 0);
    },

    getCalendarData: async function (dt, categoryId, isAll, isGroup) {
        dt = isAll ? 'perpetual' : `-${dt}`;
        let url = `${CasMobile.APIs.getFullUrl(CasMobile.APIs.LIST_C)}?ca_id=${categoryId}&o=s&months=${dt}`;

        if (this.calendarCategories.private === categoryId && Actor.userInfo) {
            const searchId = isGroup ?
                encodeURIComponent(`|${Actor.userInfo.nv_group}|`) :
                encodeURIComponent(`|${Actor.userInfo.nv_id}|`);
            url += `&participant=${searchId}`;
        }

        let res;
        try {
            const req = await fetch(url);
            res = await req.json();
        } catch (e) {
            console.error(`Failed to fetch calendar data for category ${categoryId}:`, e);
            return [];
        }

        if (!res || !res.binderListBeanList) {
            return [];
        }

        return res.binderListBeanList.map((eventData) => {
            for (let key in eventData) {
                if (key.indexOf('id') === 0 && key.length > 2 && key !== 'id') {
                    let newKey = 'c_' + key.substring(2);
                    if (eventData[newKey] === undefined) {
                        eventData[newKey] = eventData[key];
                    }
                }
            }

            const etObj = {
                id: eventData.bd_idx,
                title: eventData.bd_subject,
                start: (function () {
                    let d = eventData.c_start || eventData.start || eventData.bd_start || eventData.c_date || eventData.bd_date;
                    if (d && typeof d === 'string' && d.length === 8 && !d.includes('-')) {
                        return `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
                    }
                    return d;
                })(),
                end: (function () {
                    let d = eventData.c_end || eventData.end || eventData.bd_end || eventData.c_endDate || eventData.bd_endDate;
                    if (d && typeof d === 'string' && d.length === 8 && !d.includes('-')) {
                        return `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
                    }
                    return d;
                })(),
                allDay: (eventData.c_allDay === 'on' || eventData.c_allDay === true || eventData.allDay === true || eventData.c_isAllDay === 'Y'),
                backgroundColor: (function () {
                    let color = eventData.c_backgroundColor || '#EAEEF7';
                    if (color && !color.startsWith('#')) color = '#' + color;
                    return color;
                })(),
                textColor: (function () {
                    let color = eventData.c_textColor || '#1F1F1F';
                    if (color && !color.startsWith('#')) color = '#' + color;
                    return color;
                })(),
                borderColor: eventData.c_borderColor ? `#${eventData.c_borderColor}` : (eventData.c_backgroundColor ? `#${eventData.c_backgroundColor}` : undefined),
                participant: eventData.c_participant ? eventData.c_participant.slice(1, -1).split('||').filter(Boolean) : [],
                notifications: eventData.c_notifications ? eventData.c_notifications.split(',') : [],
                emails: eventData.c_emails ? eventData.c_emails.split(',') : [],
                extendedProps: {
                    ca_id: categoryId,
                    author: eventData.mb_id,
                    authorName: eventData.bd_name,
                    bd_content: eventData.bd_content,
                    share: eventData.c_share || eventData.share || 'public',
                    joiner: eventData.c_joiner || eventData.joiner || '',
                    invite: eventData.c_invite || eventData.invite || '',
                    evaluation: eventData.c_evaluation || eventData.evaluation || '',
                    model: eventData.c_model || eventData.model || '',
                    round: eventData.c_round || eventData.round || '',
                    startTime: eventData.c_start || eventData.start,
                    endTime: eventData.c_end || eventData.end
                }
            };

            this.extendedFields.forEach(field => {
                if (eventData['c_' + field] !== undefined) {
                    etObj.extendedProps[field] = eventData['c_' + field];
                }
            });

            if (eventData.c_rrule) {
                try {
                    const rruleValue = JSON.parse(eventData.c_rrule);
                    if (rruleValue.byweekday && typeof rruleValue.byweekday === 'string') {
                        rruleValue.byweekday = rruleValue.byweekday.split(',');
                    }
                    etObj.rrule = rruleValue;
                    etObj.extendedProps.rrule = rruleValue;
                } catch (e) {
                    console.error(`Invalid rrule JSON for event ${eventData.bd_idx}:`, eventData.c_rrule);
                }
            }

            if (etObj.end) {
                if (etObj.allDay) {
                    const endDate = new Date(etObj.end);
                    endDate.setDate(endDate.getDate() + 1);
                    etObj.end = Ext.Date.format(endDate, 'Y-m-d');
                } else if (!etObj.end.includes('T') && !etObj.end.includes(' ')) {
                    etObj.end = `${etObj.end}T23:59:59`;
                }
            }

            if (!etObj.start) {
                etObj.start = eventData.bd_regdate;
            }
            return etObj;
        });
    },
    /**
     * 이벤트 보기
     * @param {Object} event
     */
    onViewEvent: function (event) {
        const me = this;
        const { extendedProps, id: bd_idx } = event;
        console.log(extendedProps)
        const { authorName, bd_content, share, joiner, invite, evaluation, model, round } = extendedProps;
        const L = CasMobile.util.Localization;

        const userInfo = (window.Actor && window.Actor.userInfo) ? window.Actor.userInfo : {};

        let shareType = 'private';
        if (share === 'public' || share === 'share') shareType = 'public';
        const shareText = L.get('calendar.' + shareType) || shareType;

        let customRows = '';
        let infoArr = [];
        if (evaluation) infoArr.push(`<b>${L.get('cas.evaluation') || 'Evaluation'}:</b> ${Ext.htmlEncode(evaluation)}`);
        if (model) infoArr.push(`<b>${L.get('cas.carModel') || 'Model'}:</b> ${Ext.htmlEncode(model)}`);
        if (round) infoArr.push(`<b>Round:</b> ${Ext.htmlEncode(round)}`);

        if (infoArr.length > 0) {
            customRows = `
                <div style="color: #666; font-size: 13px; margin-bottom: 5px;">
                    <strong><i class="fas fa-info-circle"></i> ${L.get('cas.evaluation') || 'Info'}:</strong> ${infoArr.join('&nbsp;&nbsp;|&nbsp;&nbsp;')}
                </div>
            `;
        }

        let contentHtml = `
            <div style="padding: 10px;">
                <h3 style="margin-top: 0; margin-bottom: 10px;">${Ext.htmlEncode(event.title)}</h3>
                <div style="color: #666; font-size: 13px; margin-bottom: 5px;">
                    <strong><i class="fas fa-user"></i> ${L.get('calendar.writer') || 'Writer'}:</strong> ${Ext.htmlEncode(authorName)}
                </div>
                <div style="color: #666; font-size: 13px; margin-bottom: 5px;">
                    <strong><i class="fas fa-share-alt"></i> ${L.get('calendar.share') || 'Share'}:</strong> ${Ext.htmlEncode(shareText)}
                </div>
                ${customRows}
                <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
                <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.5; color: #333;">${bd_content || ''}</div>
            </div>
        `;

        let dialogButtons = [
            '->',
            {
                text: L.get('main.close') || 'Close',
                ui: 'action',
                handler: function (btn) {
                    btn.up('dialog').destroy();
                }
            }
        ];

        const inviteVal = String(invite || '').toLowerCase();
        // Check if invite is enabled and user is not admin (nv_level <= 4)
        if (inviteVal === 'on' && userInfo.nv_level <= 4) {
            let joinIdToken = '';
            let joinName = '';

            if (share === 'group' || share === 'public') {
                joinIdToken = `|${userInfo.nv_group}<${userInfo.nv_id}>|`;
                const sourceStore = Ext.getStore('MemberGroupStore');
                if (sourceStore) {
                    const sourceRecord = sourceStore.findRecord('idx', userInfo.nv_group, 0, false);
                    joinName = sourceRecord ? sourceRecord.get('label') : `Group ${userInfo.nv_group}`;
                } else {
                    joinName = `Group ${userInfo.nv_group}`;
                }
            } else {
                joinIdToken = `<${userInfo.nv_id}>`;
                joinName = userInfo.nv_name || userInfo.nv_id;
            }
            let isJoined = (joinIdToken && joiner) ? joiner.includes(joinIdToken) : false;

            const buttonText = isJoined ? (L.get('calendar.joinCancel') || 'Cancel Join') : (L.get('calendar.join') || 'Join');
            const iconCls = isJoined ? 'x-fa fa-sign-out-alt' : 'x-fa fa-sign-in-alt';

            let appliedText = '';
            if (isJoined) {
                const appliedCompanyStr = L.get('calendar.appliedCompany') || 'Applied: {#}';
                appliedText = appliedCompanyStr.replace('{#}', `<strong>${Ext.htmlEncode(joinName)}</strong>`);
            }

            dialogButtons.unshift({
                xtype: 'button',
                iconCls: iconCls,
                text: buttonText,
                joinIdToken: joinIdToken,
                bd_idx: bd_idx,
                isJoined: isJoined,
                handler: function (btn) {
                    me._joinEvaluation(btn);
                }
            });

            if (isJoined) {
                dialogButtons.unshift({
                    xtype: 'component',
                    html: appliedText,
                    margin: '0 10 0 0',
                    style: 'align-self: center;'
                });
            }
        }

        Ext.create('Ext.Dialog', {
            title: Ext.htmlEncode(event.title) || L.get('calendar.notice') || 'Details',
            layout: 'fit',
            width: '90%',
            height: '70%',
            closable: true,
            scrollable: true,
            preventRefocus: true,
            html: contentHtml,
            bbar: dialogButtons
        }).show();
    },

    _joinEvaluation: async function (btn) {
        if (!window.isOnline) {
            Ext.Msg.alert(CasMobile.util.Localization.get('main.offline') || 'Offline', 'You cannot perform this action while offline.');
            return;
        }

        const L = CasMobile.util.Localization;
        const dialog = btn.up('dialog');
        dialog.setMasked({ xtype: 'loadmask', message: 'Updating...' });

        try {
            // Fetch current joiners
            let currentJoiners = await new Promise((resolve, reject) => {
                Ext.Ajax.request({
                    url: CasMobile.APIs.getFullUrl(CasMobile.APIs.VIEW),
                    params: { bd_idx: btn.bd_idx },
                    success: (response) => {
                        try {
                            const data = JSON.parse(response.responseText);
                            const joinerField = data.binderView.bd_data.find(item => item.cols_code === 'joiner');
                            resolve((joinerField && joinerField.data_val) ? joinerField.data_val : '');
                        } catch (e) { reject(e); }
                    },
                    failure: reject
                });
            });

            const { joinIdToken, isJoined } = btn;
            const resultText = isJoined ? (L.get('calendar.applyCancel') || 'Cancelled') : (L.get('calendar.applyJoin') || 'Applied');
            const titleText = isJoined ? (L.get('calendar.joinCancel') || 'Cancel Join') : (L.get('calendar.join') || 'Join');

            if (isJoined) {
                currentJoiners = currentJoiners.replace(joinIdToken, '');
            } else {
                if (!currentJoiners.includes(joinIdToken)) {
                    currentJoiners += joinIdToken;
                }
            }

            // Using Ext.Ajax.request to UPDATE
            await new Promise((resolve, reject) => {
                Ext.Ajax.request({
                    url: CasMobile.APIs.getFullUrl(CasMobile.APIs.UPDATE_DATA),
                    method: 'POST',
                    params: {
                        bd_idx: btn.bd_idx,
                        joiner: currentJoiners
                    },
                    success: resolve,
                    failure: reject
                });
            });

            dialog.setMasked(false);
            dialog.destroy();
            Ext.Msg.alert(titleText, resultText);

            // Refetch events by triggering calendar load
            if (this.calendar) {
                this.calendar.refetchEvents();
            }
        } catch (error) {
            console.error(error);
            dialog.setMasked(false);
            Ext.Msg.alert('Error', 'Failed to update. Please check network connection.');
        }
    },

    openPopupEventAsync: function (item) {
        // Map any dynamic `idX` fields to `c_X` for correct parameter extraction matching getCalendarData
        for (let key in item) {
            if (key.indexOf('id') === 0 && key.length > 2 && key !== 'id') {
                let newKey = 'c_' + key.substring(2);
                if (item[newKey] === undefined) {
                    item[newKey] = item[key];
                }
            }
        }
        // Translate raw popup item format into calendar event format
        const etObj = {
            id: item.bd_idx,
            title: item.bd_subject,
            extendedProps: {
                ca_id: item.ca_id,
                author: item.mb_id,
                authorName: item.bd_name,
                bd_content: item.bd_content,
                share: item.c_share || item.share || 'public',
                joiner: item.c_joiner || item.joiner || '',
                invite: item.c_invite || item.invite || '',
                evaluation: item.c_evaluation || item.evaluation || '',
                model: item.c_model || item.model || '',
                round: item.c_round || item.round || '',
                startTime: item.c_start || item.start || item.bd_regdate,
                endTime: item.c_end || item.end
            }
        };

        this.onViewEvent(etObj);
    }
});
