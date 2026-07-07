module.exports = {
    // Fixes an issue where the dev website breaks when making JS changes
    watch: ["public/assets/js/*.js"],

    // Serve on port 5000 for Replit
    port: 5000,

    // Bind to 0.0.0.0 so Replit's proxy can reach it
    liveReload: true,

    // An accessible variable to determine if the server is in production mode or not
    isProduction: process.env.ELEVENTY_ENV === "PROD",
};
