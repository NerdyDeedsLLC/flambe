// fiveserver.config.js
module.exports = {

    port: 5000,
    root: '/',
    open: 'public/gui.html',
    host: '0.0.0.0',
    highlight: true, // enable highlight feature
    injectBody: false, // enable instant update
    remoteLogs: true, // enable remoteLogs
    remoteLogs: "yellow", // enable remoteLogs and use the color yellow
    injectCss: true, // disable injecting css
    navigate: false, // disable auto-navigation
};