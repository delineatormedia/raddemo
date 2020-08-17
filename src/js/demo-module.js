import RadDemo from './../../dist/raddemo.module.js'
// import RadDemo from './components/raddemo';

const props = {
    container: '#raddemo',
    interval: 100,
    videoID: 'raddemo',
    autoplayNextPausePoint: true,
    autoplayNextChapter: false,
    playlist: [
        {
            videoSource: 'video/RadDemo.mp4',
            pausePoints: ['0:00:03:00', '0:00:08:00', '0:00:13:00'],
            pauseFormat: 'SMTP',
            framerate: 29.97
        },
        {
            videoSource: 'video/RadDemo_inverted.mp4',
            pausePoints: ['0:00:02:00', '0:00:05:00', '0:00:12:00'],
            pauseFormat: 'SMTP',
            framerate: 29.97
        }
    ]
}

const myRadDemo = new RadDemo(props)