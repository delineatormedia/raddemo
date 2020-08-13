export const settingsUI = `
    <div class="settings-overlay"></div>
    
    <div class="settings-panel">
        <h2><i class="fas fa-cog"></i> Settings</h2>
        
        <div>
            <h3><i class="fas fa-step-forward"></i> Next Button Behavior</h3>
            <label>Autoplay the next pause point?</label>
            <input type="checkbox" name="autoplay-next-pause-point" class="autoplay-next-pause-point" checked />
        </div>
        
        <div>
            <h3><i class="fas fa-forward"></i> Next Chapter Button Behavior</h3>
            <label>Autoplay the next chapter?</label>
            <input type="checkbox" name="autoplay-next-chapter" class="autoplay-next-chapter" checked />
        </div>
        
        <div>
            <button type="button" class="settings-confirm">
                <i class="fas fa-check-circle"></i> OK
            </button>
        </div>
    </div>
`;