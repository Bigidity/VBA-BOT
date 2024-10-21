module.exports = function updateUptime(serverStartTime, uptime) {
    const now = Date.now();
    const uptimeMs = now - serverStartTime; // Get uptime in milliseconds

    let totalSeconds = Math.floor(uptimeMs / 1000); // Convert milliseconds to seconds
    let totalMinutes = Math.floor(totalSeconds / 60);
    let totalHours = Math.floor(totalMinutes / 60);
    let totalDays = Math.floor(totalHours / 24);
    let totalMonths = Math.floor(totalDays / 30.42); // Approximate month length
    let totalYears = Math.floor(totalMonths / 12);

    // Remaining units after calculating years and months
    uptime.s = totalSeconds % 60;
    uptime.m = totalMinutes % 60;
    uptime.h = totalHours % 24;
    uptime.d = Math.floor(totalDays % 30.42); // Remaining days after months
    uptime.mo = totalMonths % 12; // Remaining months after years
    uptime.y = totalYears;

    return uptime;
};
