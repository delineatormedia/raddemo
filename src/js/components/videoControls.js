export const videoControls = `
    <div class="video-controls">
        <div class="timeline-container">
            <div class="timeline-fill"></div>
            <div class="timeline-pause-points-container"></div>
        </div>
        <div class="buttons">
            <button type="button" class="playlist-prev">
                <i class="fas fa-backward"></i>
                <span class="sr-only">Prev Chapter</span>
            </button>
            <button type="button" class="prev">
                <i class="fas fa-step-backward"></i>
                <span class="sr-only">Previous</span>
            </button>
            <button type="button" class="play-pause pause">
                <i class="fas fa-play play"></i>
                <i class="fas fa-pause pause"></i>
                <span class="sr-only">Play / Pause</span>
            </button>
            <button type="button" class="next">
                <i class="fas fa-step-forward"></i>
                <span class="sr-only">Next</span>
            </button>
            <button type="button" class="playlist-next">
                <i class="fas fa-forward"></i>
                <span class="sr-only">Next Chapter</span>
            </button>
            <button type="button" class="settings" title="Settings">
                <i class="fas fa-cog"></i> <span class="sr-only">Settings</span>
            </button>
        </div>
        <div class="timecode"></div>
    </div> 
`;