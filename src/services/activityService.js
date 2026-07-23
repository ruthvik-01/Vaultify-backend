const ActivityLog = require('../models/ActivityLog');
const logger = require('../config/logger');

/**
 * Log user action to database activity logs
 * @param {string} userId - ID of the user performing action
 * @param {string} action - Action type
 * @param {object|string} details - Additional structured log parameters
 * @param {string} ipAddress - Client IP address
 */
const logActivity = async (userId, action, details = {}, ipAddress = null) => {
  try {
    let detailsObj = typeof details === 'string' ? {} : (details || {});
    if (typeof details === 'string') {
      try {
        detailsObj = JSON.parse(details);
      } catch (e) {
        detailsObj = { raw: details };
      }
    }

    const resourceName = detailsObj.resourceName || detailsObj.fileName || detailsObj.folderName || detailsObj.title || detailsObj.name || detailsObj.newName || '';
    const resourceType = detailsObj.resourceType || (action.includes('FOLDER') || detailsObj.folderName ? 'Folder' : 'File');
    const folderName = detailsObj.folderName || '';
    const detailsStr = JSON.stringify(detailsObj);

    await ActivityLog.create({
      user_id: userId,
      action,
      resourceType,
      resourceName,
      folderName,
      details: detailsStr,
      ip_address: ipAddress
    });
    logger.info(`[Activity] User ${userId || 'Anonymous'} - ${action} - Resource: ${resourceName}`);
  } catch (error) {
    logger.error(`Database logging failure for action ${action}: ${error.message}`);
  }
};

module.exports = {
  logActivity
};
