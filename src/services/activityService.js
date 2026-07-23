const ActivityLog = require('../models/ActivityLog');
const logger = require('../config/logger');

/**
 * Log user action to database activity logs
 * Supports:
 * - logActivity(userId, action, category, description, metadata, ipAddress)
 * - logActivity(userId, action, detailsObj, ipAddress)
 * - logActivity(object)
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

    const isBsonObj = (obj) => obj && typeof obj === 'object' && (obj._bsontype || obj.toHexString || obj.toString?.length === 24);

    if (typeof userIdOrObj === 'object' && userIdOrObj !== null && !isBsonObj(userIdOrObj) && userIdOrObj.action) {
      const obj = userIdOrObj;
      userId = obj.userId || obj.user_id || null;
      action = obj.action || 'ACTION';
      category = obj.category || 'General';
      title = obj.title || '';
      description = obj.description || obj.details || '';
      itemName = obj.itemName || obj.resourceName || obj.fileName || obj.folderName || obj.newName || obj.oldName || obj.title || obj.name || obj.originalName || '';
      itemType = obj.itemType || obj.resourceType || (action.toUpperCase().includes('FOLDER') ? 'Folder' : 'File');
      folderName = obj.folderName || '';
      metadata = obj.metadata || obj;
      ipAddress = obj.ipAddress || obj.ip_address || null;
    } else {
      userId = userIdOrObj;
      action = actionParam || 'ACTION';

      if (typeof categoryOrDetails === 'object' && categoryOrDetails !== null) {
        metadata = categoryOrDetails;
        category = metadata.category || categoryOrDetails.category || 'General';
        title = metadata.title || metadata.fileName || metadata.folderName || metadata.newName || metadata.name || '';
        description = metadata.description || metadata.details || '';
        itemName = metadata.itemName || metadata.resourceName || metadata.fileName || metadata.folderName || metadata.newName || metadata.oldName || metadata.title || metadata.name || metadata.originalName || '';
        itemType = metadata.itemType || metadata.resourceType || (action.toUpperCase().includes('FOLDER') ? 'Folder' : 'File');
        folderName = metadata.folderName || '';
        ipAddress = typeof descriptionParam === 'string' ? descriptionParam : null;
      } else {
        category = categoryOrDetails || 'General';
        description = typeof descriptionParam === 'string' ? descriptionParam : '';
        metadata = typeof metadataParam === 'object' && metadataParam !== null ? metadataParam : { raw: metadataParam };
        title = metadata.title || metadata.fileName || metadata.folderName || metadata.newName || metadata.name || '';
        itemName = metadata.itemName || metadata.resourceName || metadata.fileName || metadata.folderName || metadata.newName || metadata.oldName || metadata.title || metadata.name || metadata.originalName || description;
        itemType = metadata.itemType || metadata.resourceType || (action.toUpperCase().includes('FOLDER') ? 'Folder' : 'File');
        folderName = metadata.folderName || '';
        ipAddress = ipAddressParam || null;
      }
    }

    // Infer category if general or missing
    const actUpper = (action || '').toUpperCase();
    if (category === 'General') {
      if (actUpper.includes('LOGIN') || actUpper.includes('LOGOUT') || actUpper.includes('AUTH')) category = 'Auth';
      else if (actUpper.includes('UPLOAD')) category = 'Upload';
      else if (actUpper.includes('DELETE') || actUpper.includes('TRASH') || actUpper.includes('PURGE')) category = 'Delete';
      else if (actUpper.includes('RESTORE')) category = 'Restore';
      else if (actUpper.includes('DOWNLOAD')) category = 'Download';
      else if (actUpper.includes('SHARE')) category = 'Share';
      else if (actUpper.includes('RENAME') || actUpper.includes('EDIT')) category = 'Edit';
      else if (actUpper.includes('FOLDER')) category = 'Folder';
      else if (actUpper.includes('PROFILE') || actUpper.includes('ORGANIZATION')) category = 'Profile';
      else if (actUpper.includes('SETTING')) category = 'Settings';
      else if (actUpper.includes('PREVIEW') || actUpper.includes('VIEW')) category = 'Preview';
    }

    if (!itemName && title) itemName = title;
    if (!title && itemName) title = itemName;
    if (!description && itemName) description = `${action} "${itemName}"`;
    if (!description) description = `${action} action performed`;

    const now = new Date();
    await ActivityLog.create({
      user_id: userId,
      userId: userId ? userId.toString() : null,
      action: action || 'ACTION',
      category: category || 'General',
      title: title || itemName || action,
      itemName: itemName || title || action,
      itemType: itemType || 'File',
      resourceName: itemName || title || action,
      resourceType: itemType || 'File',
      folderName: folderName || '',
      description: description,
      details: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata,
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
