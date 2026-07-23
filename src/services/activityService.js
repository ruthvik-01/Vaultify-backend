const ActivityLog = require('../models/ActivityLog');
const logger = require('../config/logger');

/**
 * Log user action to database activity logs
 * Supports:
 * - logActivity(userId, action, category, description, metadata)
 * - logActivity(userId, action, detailsObj, ipAddress)
 */
const logActivity = async (userId, action, categoryOrDetails = 'General', description = '', metadata = {}, ipAddress = null) => {
  try {
    let category = 'General';
    let desc = '';
    let meta = {};
    let itemName = '';
    let itemType = 'File';
    let folderName = '';

    if (typeof categoryOrDetails === 'object' && categoryOrDetails !== null) {
      meta = categoryOrDetails;
      category = meta.category || (action.includes('FOLDER') ? 'Folder' : action.includes('UPLOAD') ? 'Upload' : action.includes('DELETE') ? 'Delete' : action.includes('LOGIN') ? 'Login' : 'General');
      desc = meta.description || meta.details || meta.text || '';
      itemName = meta.itemName || meta.resourceName || meta.fileName || meta.folderName || meta.title || meta.name || meta.newName || '';
      itemType = meta.itemType || meta.resourceType || (action.includes('FOLDER') || meta.folderName ? 'Folder' : 'File');
      folderName = meta.folderName || '';
      ipAddress = description || null;
    } else {
      category = categoryOrDetails || 'General';
      desc = description || '';
      meta = typeof metadata === 'object' && metadata !== null ? metadata : { raw: metadata };
      itemName = meta.itemName || meta.resourceName || meta.fileName || meta.folderName || meta.title || meta.name || meta.newName || '';
      itemType = meta.itemType || meta.resourceType || (action.includes('FOLDER') || meta.folderName ? 'Folder' : 'File');
      folderName = meta.folderName || '';
    }

    if (!itemName && meta.name) itemName = meta.name;
    if (!desc && itemName) desc = `${action} "${itemName}"`;

    const now = new Date();
    await ActivityLog.create({
      user_id: userId,
      userId: userId ? userId.toString() : null,
      action: action || 'action',
      category: category || 'General',
      itemName: itemName || desc || 'Item',
      itemType: itemType || 'File',
      resourceName: itemName || 'Item',
      resourceType: itemType || 'File',
      folderName: folderName || '',
      description: desc || `${action} action performed`,
      details: JSON.stringify(meta),
      metadata: meta,
      ip_address: ipAddress,
      created_at: now,
      timestamp: now
    });
    logger.info(`[Activity Log] User: ${userId || 'Anon'} | Action: ${action} | Category: ${category}`);
  } catch (error) {
    logger.error(`Database logging failure for action ${action}: ${error.message}`);
  }
};

module.exports = {
  logActivity
};
