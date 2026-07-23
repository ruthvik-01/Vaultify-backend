const ActivityLog = require('../models/ActivityLog');
const logger = require('../config/logger');

/**
 * Log user action to database activity logs
 * Supports:
 * - logActivity(userId, action, category, description, metadata)
 * - logActivity(userId, action, detailsObj, ipAddress)
 */
const logActivity = async (userIdOrObj, actionParam, categoryOrDetails = 'General', descriptionParam = '', metadataParam = {}, ipAddressParam = null) => {
  try {
    let userId = null;
    let action = 'ACTION';
    let category = 'General';
    let title = '';
    let description = '';
    let itemName = '';
    let itemType = 'File';
    let folderName = '';
    let metadata = {};
    let ipAddress = null;

    if (typeof userIdOrObj === 'object' && userIdOrObj !== null && !userIdOrObj._bsontype && !userIdOrObj.toHexString) {
      const obj = userIdOrObj;
      userId = obj.userId || obj.user_id || null;
      action = obj.action || 'ACTION';
      category = obj.category || 'General';
      title = obj.title || '';
      description = obj.description || obj.details || '';
      itemName = obj.itemName || obj.resourceName || obj.fileName || obj.folderName || obj.title || obj.name || '';
      itemType = obj.itemType || obj.resourceType || (action.includes('FOLDER') ? 'Folder' : 'File');
      folderName = obj.folderName || '';
      metadata = obj.metadata || obj;
      ipAddress = obj.ipAddress || obj.ip_address || null;
    } else {
      userId = userIdOrObj;
      action = actionParam || 'ACTION';

      if (typeof categoryOrDetails === 'object' && categoryOrDetails !== null) {
        metadata = categoryOrDetails;
        category = metadata.category || 'General';
        title = metadata.title || '';
        description = metadata.description || metadata.details || '';
        itemName = metadata.itemName || metadata.resourceName || metadata.fileName || metadata.folderName || metadata.title || metadata.name || '';
        itemType = metadata.itemType || metadata.resourceType || (action.includes('FOLDER') ? 'Folder' : 'File');
        folderName = metadata.folderName || '';
        ipAddress = descriptionParam || null;
      } else {
        category = categoryOrDetails || 'General';
        description = descriptionParam || '';
        metadata = typeof metadataParam === 'object' && metadataParam !== null ? metadataParam : { raw: metadataParam };
        title = metadata.title || '';
        itemName = metadata.itemName || metadata.resourceName || metadata.fileName || metadata.folderName || metadata.title || metadata.name || '';
        itemType = metadata.itemType || metadata.resourceType || (action.includes('FOLDER') ? 'Folder' : 'File');
        folderName = metadata.folderName || '';
        ipAddress = ipAddressParam || null;
      }
    }

    if (!itemName && title) itemName = title;
    if (!title && itemName) title = itemName;
    if (!description && itemName) description = `${action} "${itemName}"`;

    const now = new Date();
    await ActivityLog.create({
      user_id: userId,
      userId: userId ? userId.toString() : null,
      action: action || 'action',
      category: category || 'General',
      title: title || itemName || action,
      itemName: itemName || title || 'Item',
      itemType: itemType || 'File',
      resourceName: itemName || title || 'Item',
      resourceType: itemType || 'File',
      folderName: folderName || '',
      description: description || `${action} action performed`,
      details: JSON.stringify(metadata),
      metadata: metadata,
      ip_address: ipAddress,
      created_at: now,
      timestamp: now
    });
    logger.info(`[Activity Log] User: ${userId || 'Anon'} | Action: ${action} | Category: ${category}`);
  } catch (error) {
    logger.error(`Database logging failure for action ${actionParam}: ${error.message}`);
  }
};

module.exports = {
  logActivity
};
