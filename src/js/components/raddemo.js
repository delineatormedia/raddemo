import keyboard from 'keyboardjs';
import {videoTag} from './videoTag.js'
import {videoControls} from './videoControls.js'
import {settingsUI} from './settingsUI';

export default class RadDemo {
    /**
     * Constructs the instance of RadDemo.
     * @param {object} props
     */
    constructor(props) {

        this.state = {
            currentPlaylistItem: 0,
            interval: props.interval ? props.interval : 100,
            subinterval: props.interval ? props.interval/2 : 100/2,
            timecodeCurrent: 0,
            timecodePrev: 0,
            pausePointPrev: 0,
            pausePointCurrent: 0,
            autoplayNextPausePoint: sessionStorage.autoPlayNextPausePoint ? sessionStorage.autoPlayNextPausePoint === 'true' : typeof props.autoplayNextPausePoint === 'boolean' ? props.autoplayNextPausePoint : true,
            autoplayPrevPausePoint: props.autoplayPrevPausePoint,
            autoplayNextChapter: sessionStorage.autoPlayNextChapter ? sessionStorage.autoPlayNextChapter === 'true' : typeof props.autoplayNextChapter === 'boolean' ? props.autoplayNextChapter : true,
            playCount: 0
        };

        this.container = document.querySelector( props.container );

        this.container.innerHTML = videoTag;
        this.container.insertAdjacentHTML('beforeend', videoControls);
        this.timecode = this.container.querySelector('.timecode');

        this.settings = document.createElement('div');
        this.settings.setAttribute('class', 'settings hidden');
        this.container.appendChild( this.settings );
        this.settings.innerHTML = settingsUI;

        this.media = document.querySelector('video');
        this.btnPlayPause = document.querySelector('.video-controls .play-pause');
        this.btnPrev = document.querySelector('.video-controls .prev');
        this.btnNext = document.querySelector('.video-controls .next');
        this.btnPlayPauselistNext = this.container.querySelector('.playlist-next');
        this.btnPlayPauselistPrev = this.container.querySelector('.playlist-prev');
        this.btnSettings = this.container.querySelector('button.settings');

        /**
         * Checkbox to control setting for autoplay next pause point.
         * @type {Element}
         */
        this.btnAutoPlayNextPP = this.settings.querySelector('.autoplay-next-pause-point');

        if(!this.state.autoplayNextPausePoint) this.btnAutoPlayNextPP.removeAttribute('checked');

        /**
         * Checkbox to control setting for autoplay next chapter.
         * @type {Element}
         */
        this.btnAutoPlayNextChap = this.settings.querySelector('.autoplay-next-chapter');

        if(!this.state.autoplayNextChapter) this.btnAutoPlayNextChap.removeAttribute('checked');


        /**
         * Button to confirm settings and close settings UI.
         * @type {Element}
         */
        this.btnSettingsConfirm = this.container.querySelector('.settings-confirm');

        /**
         * Timeline buttons for skipping to specific pause points.
         * @type {NodeList|null}
         */
        this.btnPausePoints = null;

        this.timelineContainer = document.querySelector('.timeline-container');
        this.timelineFill = document.querySelector('.timeline-fill');
        this.timelinePausePointsContainer = document.querySelector('.timeline-pause-points-container');

        this.media.addEventListener('timeupdate', (e)=>{
            this.timecodeUpdate();
        });

        this.media.addEventListener('ended', (e)=>{
            console.log('radDemo: media ended');
            this.nextPlaylistItem();
        });

        this.btnPlayPause.addEventListener('click', e => {
            console.log('radDemo: btn play/pause');
            this.toggle();
            e.target.closest('button').blur();
        });

        this.btnNext.addEventListener('click', e => {
            console.log('radDemo: btn next pausePoint');
            this.next();
            e.target.closest('button').blur();
        });

        this.btnPrev.addEventListener('click', e => {
            console.log('radDemo: btn prev pausePoint');
            this.prev();
            console.log(e);
            e.target.closest('button').blur();
        });

        this.btnPlayPauselistNext.addEventListener('click', e => {
            console.log('radDemo: btn next chapter');
            this.nextPlaylistItem();
            e.target.closest('button').blur();
        });

        this.btnPlayPauselistPrev.addEventListener('click', e => {
            console.log('radDemo: btn prev chapter');
            this.prevPlaylistItem();
            e.target.closest('button').blur();
        });

        this.btnSettings.addEventListener('click', e => {
            console.log('radDemo: btn settings');
            this.showSettings();
            e.target.closest('button').blur();
        });

        this.btnSettingsConfirm.addEventListener('click', e => {
            this.hideSettings();
        });

        this.btnAutoPlayNextPP.addEventListener('change', e => {
            sessionStorage.setItem('autoPlayNextPausePoint', e.target.checked);
            this.state.autoplayNextPausePoint = e.target.checked;
        });

        this.btnAutoPlayNextChap.addEventListener('change', e => {
            sessionStorage.setItem('autoPlayNextChapter', e.target.checked);
            this.state.autoplayNextChapter = e.target.checked;
        });

        this.media.addEventListener('durationchange', (e)=>{
            // Remove event listeners for any existing pause point buttons
            if(this.btnPausePoints) {
                this.btnPausePoints.forEach(element => {
                    element.removeEventListener('click', this.handlePausePointClick.bind(this));
                });
            }

            let currentPlaylistItem = this.playlist[this.state.currentPlaylistItem];

            this.timelinePausePointsContainer.innerHTML = '';

            for(let i=0; i<currentPlaylistItem.pausePoints.length; i++) {
                this.timelinePausePointsContainer.innerHTML += `
                    <div class="timeline-pause-point"
                         data-pause-point="${currentPlaylistItem.pausePoints[i]}"
                         style="left: ${ ((currentPlaylistItem.pausePoints[i]/this.media.duration)*100)+'%' }"></div>
                `;
            }

            // Add event listeners to newly crated pause point buttons
            this.btnPausePoints = document.querySelectorAll('.timeline-pause-point');
            this.btnPausePoints.forEach(element => {
                element.addEventListener('click', this.handlePausePointClick.bind(this));
            });
        });

        //Process all playlist items
        this.playlist = props.playlist;
        for(let i=0; i<props.playlist.length; i++) {
            let playlistItem = props.playlist[i];
            if(playlistItem.pauseFormat === 'SMTP') {
                this.playlist[i].pausePoints = this.convertTimecodeListToSecondsList(
                    playlistItem.pausePoints,
                    playlistItem.framerate
                );
            }
            else {
                this.playlist[i].pausePoints = playlistItem;
            }
        }
        this.loadPlaylistItem( this.state.currentPlaylistItem );

        this.keyboard = keyboard;

        // Setup keyboard controls
        this.keyboard.bind('space', ()=>{ console.log('radDemo: key space'); this.toggle() });

        this.keyboard.bind('left', ()=>{ console.log('radDemo: key left'); this.prev() });

        this.keyboard.bind('right', ()=>{ console.log('radDemo: key right'); this.next() });

        this.keyboard.bind('shift > left', ()=>{ console.log('radDemo: key shift left'); this.prevPlaylistItem() });

        this.keyboard.bind('shift > right', ()=>{ console.log('radDemo: key shift right'); this.nextPlaylistItem()});

        this.keyboard.bind('s', ()=>{ console.log('radDemo: key s'); this.showSettings() });
    }

    /**
     * Code that needs to run every time the demo's timecode changes, like checking for pause points.
     */
    timecodeUpdate(){
        console.log('radDemo: timecodeUpdate');

        // Update previous timecode and current timecode
        this.state.timecodePrev = this.roundTime( this.state.timecodeCurrent );
        this.state.timecodeCurrent = this.roundTime( this.media.currentTime );

        // Storing values as shorter to reference constants
        const prevTime = this.state.timecodePrev;
        const currentTime = this.roundTime( this.media.currentTime );
        const pausePoints = this.playlist[ this.state.currentPlaylistItem ].pausePoints;

        // Update the UI timecode and timeline (these need to happen regardless of outcome)
        this.timecode.innerHTML = currentTime;
        this.timelineFill.style.width = ((currentTime/this.media.duration)*100)+'%';

        console.log('radDemo: currentTime: ' + currentTime + ', prevTime: ' + prevTime);

        // If the timecode is higher than the previous (moving forwards)
        if(currentTime >= prevTime) {

            console.log('radDemo: currentTime >= prevTime');

            console.log ('safe timecode distance: ' + (this.state.pausePointCurrent + 0.3));

            // For every pause point
            for(let i=0; i<pausePoints.length; i++) {

                // If we have gained some safe distance from the previous pause point
                if(currentTime > (this.state.pausePointCurrent + 0.3)) {
                    // If the current time falls within a narrow window of this pause point
                    if(currentTime > (pausePoints[i] - 0.15) && currentTime < (pausePoints[i] + 0.15) ) {
                        console.log('radDemo: hit pausePoint: ' + pausePoints[i]);

                        this.highlightPausePoint(pausePoints[i]);

                        // Update the previous and current pause point values
                        this.state.pausePointPrev = this.state.pausePointCurrent;
                        this.state.pausePointCurrent = pausePoints[i];
                        console.log('radDemo: this.state.pausePointPrev: ' + this.state.pausePointPrev);
                        console.log('radDemo: this.state.pausePointCurrent ' + this.state.pausePointCurrent);

                        // If the media is supposed to autoplay from the next pause point ( e.g. when using next() )
                        if(this.media.dataset.autoplay === 'true') {
                            this.play();
                            this.media.dataset.autoplay = 'false';
                        }
                        // Else, no autoplay, so just pause it
                        else {
                            this.pause();
                        }
                    }
                }
            }
        }
        // Else, moving backwards
        else {
            console.log('radDemo: ! currentTime >= prevTime');
            this.pause();

            console.log(currentTime);

            if(currentTime > 0) {
                // For every pause point
                for(let i=0; i<pausePoints.length; i++) {
                    // If the current time falls within a narrow window of this pause point
                    if(currentTime > (pausePoints[i] - 0.15) && currentTime < (pausePoints[i] + 0.15) ) {
                        console.log('radDemo: hit a prev pausePoint');

                        this.highlightPausePoint(pausePoints[i]);

                        this.state.pausePointPrev = this.state.pausePointCurrent;
                        this.state.pausePointCurrent = pausePoints[i];


                    }
                }
            }
            else {
                this.state.pausePointPrev = this.state.pausePointCurrent;
                this.state.pausePointCurrent = 0;
            }


        }
    }

    highlightPausePoint(pausePoint){
        this.btnPausePoints.forEach(element => {
            element.classList.remove('current', 'previous');
            if(element.dataset.pausePoint == pausePoint) {
                element.classList.add('current', 'viewed');
            }
        });
    }

    /**
     * Rounds time in seconds to two decimal places.
     * @param {number} time
     * @returns {number}
     */
    roundTime(time){
        return Math.round(time * 100) / 100;
    }

    /**
     * Converts an SMTP timecode to seconds.
     * @param {string} timecode
     * @param {number} framerate
     * @returns {number}
     */
    convertTimecodeToSeconds(timecode, framerate) {
        var timeArray = timecode.split(':');
        var hoursInSeconds      =   parseInt(timeArray[0]) * 60 * 60,
            minutesInSeconds    =   parseInt(timeArray[1]) * 60,
            seconds             =   parseInt(timeArray[2]),
            framesInSeconds     =   parseInt(timeArray[3]) * (1/framerate);

        return hoursInSeconds + minutesInSeconds + seconds + framesInSeconds;
    }

    convertTimecodeListToSecondsList(timecodeList, framerate) {
        let timeCodeListInSeconds = timecodeList;
        for (var i = 0; i < timecodeList.length; i++){
            timeCodeListInSeconds[i] = this.convertTimecodeToSeconds(timeCodeListInSeconds[i], framerate);
        }
        return timeCodeListInSeconds;
    }

    /**
     * Loads a specific item from the playlist into the demo's <video>.
     * @param {number} playlistItem
     */
    loadPlaylistItem(playlistItem) {
        this.state.currentPlaylistItem = playlistItem;
        this.state.pausePointPrev = 0;
        this.state.pausePointCurrent = 0;
        this.timelineFill.style.width = '0%';
        this.btnPlayPause.classList.add('pause');
        this.btnPlayPause.classList.remove('play');
        this.state.timecodePrev = 0;
        this.state.timecodeCurrent = 0;
        this.media.setAttribute('src', this.playlist[this.state.currentPlaylistItem].videoSource);
    }

    /**
     * Handles clicking on a pause point button.
     * @param {event} e
     */
    handlePausePointClick (e) {
        const pausePoint = e.target.dataset.pausePoint ? e.target.dataset.pausePoint : this.media.currentTime;
        this.goToTimeCode(pausePoint);
    }

    /**
     * Go to a specific timecode.
     * @param {int} pausePoint
     */
    goToTimeCode(pausePoint) {
        this.media.currentTime = pausePoint;
    }

    nextPlaylistItem() {
        console.log('radDemo: nextPlaylistItem()');

        let nextPlaylistItem = this.state.currentPlaylistItem + 1;

        if(nextPlaylistItem+1 > this.playlist.length) nextPlaylistItem = 0;

        this.loadPlaylistItem( nextPlaylistItem );

        if(this.state.autoplayNextChapter) {
            this.play();
        }
        else {
            this.pause();
        }
    }

    prevPlaylistItem() {
        console.log('radDemo: prevPlaylistItem()');

        let prevPlaylistItem = this.state.currentPlaylistItem - 1;

        if(prevPlaylistItem < 0) prevPlaylistItem = this.playlist.length - 1;

        this.loadPlaylistItem( prevPlaylistItem );

        if(this.state.autoplayNextChapter) {
            this.play();
        }
        else {
            this.pause();
        }
    }

    /**
     * Plays the demo from current timecode
     */
    play() {
        console.log('radDemo: play()');
        this.media.play();
        this.btnPlayPause.classList.add('play');
        this.btnPlayPause.classList.remove('pause');

        this.btnPausePoints.forEach(element => {
            if(element.classList.contains('current') || element.classList.contains('previous')) {
                console.log(element);
                element.classList.remove('current', 'previous');
                if(this.state.pausePointCurrent == element.dataset.pausePoint) {
                    element.classList.add('previous');
                }
            }
        });

        this.state.playCount++;
    }

    /**
     * Pauses the demo
     */
    pause() {
        console.log('radDemo: pause()');
        this.media.pause();
        this.btnPlayPause.classList.add('pause');
        this.btnPlayPause.classList.remove('play');
    }

    toggle() {
        console.log('radDemo: toggle()');
        if(this.media.paused) {
            this.play();
        }
        else {
            this.pause();
        }
    }

    /**
     * Skips to the next pause point in the demo
     */
    next() {
        console.log('radDemo: next()');

        if(this.media.paused) this.media.play();

        const currentTime = this.media.currentTime;

        const pausePoints = this.playlist[ this.state.currentPlaylistItem ].pausePoints;

        let nextPausePoint = 0;

        for(let i=0; i<pausePoints.length; i++) {

            console.log('radDemo: scanning pausePoints ... ' + pausePoints[i]);

            if( currentTime < (pausePoints[i] - 0.15) && this.state.pausePointCurrent !== pausePoints[i] ) {
                console.log('radDemo: currentTime('+currentTime+') is less than pausePoint('+pausePoints[i]+')');
                console.log('radDemo: Found the next pausePoint');
                nextPausePoint = pausePoints[i];
                if(this.state.autoplayNextPausePoint) this.media.dataset.autoplay = 'true';
                this.media.currentTime = nextPausePoint - 0.15;
                break;
            }
        }

        if(nextPausePoint === 0) this.nextPlaylistItem();
    }

    /**
     * Skips back to the previous pause point in the demo
     */
    prev() {
        console.log('radDemo: prev()');
        const currentTime = this.media.currentTime;

        let pausePoints = this.playlist[ this.state.currentPlaylistItem ].pausePoints.slice().reverse();

        let prevPausePoint = 0;

        for(let i=0; i<pausePoints.length; i++) {
            if( currentTime > (pausePoints[i] + 0.15) ) {
                prevPausePoint = pausePoints[i];
                break;
            }
        }

        this.media.currentTime = prevPausePoint;
    }

    showSettings() {
        this.settings.classList.remove('hidden');
    }

    hideSettings() {
        this.settings.classList.add('hidden');
    }
}