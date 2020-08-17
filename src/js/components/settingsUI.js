export const settingsUI = `
    <div class="settings-overlay"></div>
    
    <div class="settings-panel">
        <h2><i class="fas fa-cog"></i> Settings</h2>
        
        <div>
            <h3>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M384 44v424c0 6.6-5.4 12-12 12h-48c-6.6 0-12-5.4-12-12V291.6l-195.5 181C95.9 489.7 64 475.4 64 448V64c0-27.4 31.9-41.7 52.5-24.6L312 219.3V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12z"/></svg>
                Next Button Behavior
            </h3>
            <label>Autoplay the next pause point?</label>
            <input type="checkbox" name="autoplay-next-pause-point" class="autoplay-next-pause-point" checked />
        </div>
        
        <div>
            <h3>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M500.5 231.4l-192-160C287.9 54.3 256 68.6 256 96v320c0 27.4 31.9 41.8 52.5 24.6l192-160c15.3-12.8 15.3-36.4 0-49.2zm-256 0l-192-160C31.9 54.3 0 68.6 0 96v320c0 27.4 31.9 41.8 52.5 24.6l192-160c15.3-12.8 15.3-36.4 0-49.2z"/></svg>
                Next Chapter Button Behavior
            </h3>
            <label>Autoplay the next chapter?</label>
            <input type="checkbox" name="autoplay-next-chapter" class="autoplay-next-chapter" checked />
        </div>
        
        <div>
            <button type="button" class="settings-confirm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"/></svg>
                OK
            </button>
        </div>
    </div>
`;