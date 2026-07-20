const crypto = require('crypto');
const File = require('../models/File');
const Folder = require('../models/Folder');
const SharedLink = require('../models/SharedLink');
const {
  uploadFile,
  deleteFile: deleteS3File,
  getPreSignedDownloadUrl,
  initiateMultipartUpload,
  generateUploadPartUrls,
  completeMultipartUpload,
  abortMultipartUpload,
  makeObjectPublic,
  getObjectUrl,
  PART_SIZE,
  MAX_FILE_SIZE
} = require('../services/s3Service');
const { logActivity } = require('../services/activityService');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../utils/errors');

// Allowed MIME types (shared between multer and presigned upload validation)
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/x-msvideo'
];

const serializeFile = (file) => ({
  id: file.id,
  user_id: file.user_id?.toString?.() || file.user_id,
  folder_id: file.folder_id ? file.folder_id.toString() : null,
  file_name: file.file_name,
  original_name: file.original_name,
  file_type: file.file_type,
  file_size: file.file_size,
  s3_key: file.s3_key,
  is_favorite: file.is_favorite,
  is_work_submission: file.is_work_submission || false,
  created_at: file.created_at,
  updated_at: file.updated_at
});

const getS3Category = (mimetype) => {
  if (mimetype === 'application/pdf') return 'documents';
  if (mimetype.startsWith('image/')) return 'images';
  if (mimetype.startsWith('video/')) return 'videos';
  if (mimetype.includes('zip')) return 'archives';
  return 'files';
};

const ensureOwnedFolder = async (folderId, userId) => {
  if (!folderId || folderId === 'null' || folderId === '') {
    return null;
  }

  const folder = await Folder.findById(folderId);
  if (!folder) {
    throw new NotFoundError('Folder not found.');
  }

  if (folder.user_id.toString() !== userId.toString()) {
    throw new ForbiddenError('Access denied: you do not own this folder.');
  }

  return folder;
};

/**
 * Check if a folder (or any of its ancestors) is a Work folder.
 * Walks up the folder tree via parent_folder_id.
 */
const isWorkFolder = async (folderId) => {
  if (!folderId) return false;
  let currentId = folderId;
  // Safety limit to prevent infinite loops on corrupted data
  let depth = 0;
  while (currentId && depth < 20) {
    const folder = await Folder.findById(currentId).select('folder_type parent_folder_id').lean();
    if (!folder) return false;
    if (folder.folder_type === 'work') return true;
    currentId = folder.parent_folder_id;
    depth++;
  }
  return false;
};

const findOwnedFile = async (fileId, userId) => {
  const file = await File.findById(fileId);
  if (!file) {
    throw new NotFoundError('File not found.');
  }

  if (file.user_id.toString() !== userId.toString()) {
    throw new ForbiddenError('Access denied: you do not own this file.');
  }

  return file;
};

const uploadFileController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { folder_id, uploadBatchId } = req.body;

    if (!req.file) {
      return next(new BadRequestError('No file uploaded.'));
    }

    const folder = await ensureOwnedFolder(folder_id, userId);
    const file = req.file;
    const category = getS3Category(file.mimetype);
    const objectId = crypto.randomUUID();
    const sanitizedName = file.originalname.replace(/\s+/g, '-');
    const s3Key = `users/${userId}/${category}/${objectId}-${sanitizedName}`;

    await uploadFile(file.buffer, s3Key, file.mimetype);

    // Check if the target folder is inside the Work folder tree
    const workFlag = folder ? await isWorkFolder(folder.id) : false;

    const createdFile = await File.create({
      user_id: userId,
      folder_id: folder ? folder.id : null,
      file_name: file.originalname,
      original_name: file.originalname,
      file_type: file.mimetype,
      file_size: file.size,
      s3_key: s3Key,
      is_work_submission: workFlag,
      uploadBatchId: uploadBatchId || null
    });

    await logActivity(userId, 'Upload', { fileId: createdFile.id, fileName: createdFile.file_name }, req.ip);

    res.status(201).json({
      status: 'success',
      data: {
        file: serializeFile(createdFile)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getFiles = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { folder_id, is_favorite } = req.query;
    const query = { user_id: userId };

    if (folder_id !== undefined) {
      query.folder_id = folder_id === 'null' || folder_id === '' ? null : folder_id;
    }

    if (is_favorite !== undefined) {
      query.is_favorite = is_favorite === 'true';
    }

    const files = await File.find(query).sort({ created_at: -1 });

    res.status(200).json({
      status: 'success',
      results: files.length,
      data: {
        files: files.map(serializeFile)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getFile = async (req, res, next) => {
  try {
    const file = await findOwnedFile(req.params.id, req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        file: serializeFile(file)
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateFile = async (req, res, next) => {
  try {
    const file = await findOwnedFile(req.params.id, req.user.id);
    const oldName = file.file_name;

    file.file_name = req.body.file_name;
    await file.save();

    await logActivity(req.user.id, 'Rename', { fileId: file.id, oldName, newName: file.file_name }, req.ip);

    res.status(200).json({
      status: 'success',
      data: {
        file: serializeFile(file)
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteFileController = async (req, res, next) => {
  try {
    const file = await findOwnedFile(req.params.id, req.user.id);

    await deleteS3File(file.s3_key);
    await SharedLink.deleteMany({ file_id: file.id });
    await File.findByIdAndDelete(file.id);

    await logActivity(req.user.id, 'Delete', { fileId: file.id, fileName: file.file_name }, req.ip);

    res.status(200).json({
      status: 'success',
      message: 'File metadata deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const moveFile = async (req, res, next) => {
  try {
    const { file_id, folder_id } = req.body;
    const file = await findOwnedFile(file_id, req.user.id);
    const folder = await ensureOwnedFolder(folder_id, req.user.id);
    const oldFolder = file.folder_id ? file.folder_id.toString() : null;

    file.folder_id = folder ? folder.id : null;
    // Recalculate work submission flag based on new folder
    file.is_work_submission = folder ? await isWorkFolder(folder.id) : false;
    await file.save();

    await logActivity(
      req.user.id,
      'Move',
      { fileId: file.id, fileName: file.file_name, oldFolder, newFolder: file.folder_id ? file.folder_id.toString() : null },
      req.ip
    );

    res.status(200).json({
      status: 'success',
      data: {
        file: serializeFile(file)
      }
    });
  } catch (error) {
    next(error);
  }
};

const favoriteFile = async (req, res, next) => {
  try {
    const { file_id, is_favorite } = req.body;
    const file = await findOwnedFile(file_id, req.user.id);

    file.is_favorite = is_favorite;
    await file.save();

    res.status(200).json({
      status: 'success',
      data: {
        file: serializeFile(file)
      }
    });
  } catch (error) {
    next(error);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const file = await findOwnedFile(req.params.id, req.user.id);
    const disposition = req.query.disposition === 'inline' ? 'inline' : 'attachment';
    const presignedUrl = await getPreSignedDownloadUrl(file.s3_key, file.original_name, 900, disposition);

    await logActivity(req.user.id, 'Download', { fileId: file.id, fileName: file.file_name }, req.ip);

    res.status(200).json({
      status: 'success',
      download_url: presignedUrl
    });
  } catch (error) {
    next(error);
  }
};

const shareFile = async (req, res, next) => {
  try {
    const { file_id, folder_id, permission, expiry_hours } = req.body;
    
    if (!file_id && !folder_id) {
      throw new BadRequestError('Must provide either file_id or folder_id to generate a share link.');
    }

    let targetId;
    let targetType;
    let targetName;

    if (file_id) {
      const file = await findOwnedFile(file_id, req.user.id);
      targetId = file.id;
      targetType = 'file';
      targetName = file.file_name;
    } else {
      const folder = await Folder.findById(folder_id);
      if (!folder || folder.user_id.toString() !== req.user.id.toString()) {
        throw new NotFoundError('Folder not found or access denied.');
      }
      targetId = folder.id;
      targetType = 'folder';
      targetName = folder.folder_name;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiryDate = expiry_hours ? new Date(Date.now() + expiry_hours * 60 * 60 * 1000) : null;

    const sharedLink = await SharedLink.create({
      file_id: targetType === 'file' ? targetId : null,
      folder_id: targetType === 'folder' ? targetId : null,
      token,
      permission: permission || 'read',
      expiry_date: expiryDate
    });

    await logActivity(
      req.user.id,
      'Share',
      { 
        targetId, 
        targetType, 
        name: targetName, 
        shareId: sharedLink.id, 
        expiryHours: expiry_hours || null 
      },
      req.ip
    );

    res.status(201).json({
      status: 'success',
      data: {
        id: sharedLink.id,
        file_id: targetType === 'file' ? targetId : null,
        folder_id: targetType === 'folder' ? targetId : null,
        token: sharedLink.token,
        permission: sharedLink.permission,
        expiry_date: sharedLink.expiry_date,
        share_link: `${req.protocol}://${req.get('host')}/api/share/${sharedLink.token}`
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSharedFile = async (req, res, next) => {
  try {
    const disposition = req.query.disposition || 'attachment';

    const sharedLink = await SharedLink.findOne({ token: req.params.token })
      .populate('file_id')
      .populate('folder_id');

    if (!sharedLink || (!sharedLink.file_id && !sharedLink.folder_id)) {
      // Try VideoShare fallback
      const VideoShare = require('../models/VideoShare');
      const Video = require('../models/Video');
      const VideoFolder = require('../models/VideoFolder');
      const s3Service = require('../services/s3Service');

      const videoShare = await VideoShare.findOne({ token: req.params.token, isActive: true })
        .populate('videoId')
        .populate('folderId');

      if (!videoShare) {
        return next(new NotFoundError('Shared link not found.'));
      }

      if (videoShare.expiresAt && new Date() > videoShare.expiresAt) {
        return next(new ForbiddenError('This shared link has expired.'));
      }

      if (videoShare.videoId) {
        const video = videoShare.videoId;
        const presignedUrl = await s3Service.getPreSignedDownloadUrl(video.s3Key, video.originalName || video.filename, 600, disposition);

        await logActivity(video.ownerId, 'Download', { videoId: video._id, viaShare: videoShare.id, status: 'public_video' }, req.ip);

        return res.status(200).json({
          status: 'success',
          data: {
            type: 'file',
            file_name: video.originalName || video.filename,
            file_type: video.mimeType,
            file_size: video.size,
            download_url: presignedUrl,
            createdAt: video.createdAt
          }
        });
      } else if (videoShare.folderId) {
        const folder = videoShare.folderId;
        const videos = await Video.find({ folderId: folder._id, status: 'Active' });
        const subfolders = await VideoFolder.find({ parentFolder: folder._id });

        return res.status(200).json({
          status: 'success',
          data: {
            type: 'folder',
            file_name: folder.name,
            files: videos.map(v => ({
              id: v._id,
              name: v.originalName || v.filename,
              size: v.size,
              mimeType: v.mimeType,
              type: v.mimeType ? v.mimeType.split('/')[1] : 'file'
            })),
            folders: subfolders.map(f => {
              const folderObj = f.toObject();
              folderObj.id = folderObj._id.toString();
              delete folderObj._id;
              delete folderObj.__v;
              return folderObj;
            })
          }
        });
      }

      return next(new NotFoundError('Shared link not found.'));
    }

    if (sharedLink.expiry_date && new Date() > sharedLink.expiry_date) {
      return next(new ForbiddenError('This shared link has expired.'));
    }

    if (sharedLink.file_id) {
      const file = sharedLink.file_id;
      const presignedUrl = await getPreSignedDownloadUrl(file.s3_key, file.original_name, 600, disposition);

      await logActivity(file.user_id, 'Download', { fileId: file.id, viaShare: sharedLink.id, status: 'public' }, req.ip);

      res.status(200).json({
        status: 'success',
        data: {
          type: 'file',
          file_name: file.file_name,
          file_type: file.file_type,
          file_size: file.file_size,
          download_url: presignedUrl
        }
      });
    } else if (sharedLink.folder_id) {
      const folder = sharedLink.folder_id;
      const files = await File.find({ folder_id: folder.id });
      
      const Video = require('../models/Video');
      const videos = await Video.find({ folderId: folder.id, status: 'Active' });

      const serializedFiles = [
        ...files.map(serializeFile),
        ...videos.map(v => ({
          id: v.id,
          user_id: v.ownerId,
          folder_id: v.folderId ? v.folderId.toString() : null,
          file_name: v.originalName || v.filename,
          original_name: v.originalName || v.filename,
          file_type: v.mimeType,
          file_size: v.size,
          s3_key: v.s3Key,
          is_favorite: false,
          is_work_submission: v.is_work_submission || false,
          created_at: v.createdAt,
          updated_at: v.updatedAt,
          name: v.originalName || v.filename,
          filename: v.filename,
          size: v.size,
          mimeType: v.mimeType
        }))
      ];

      const subfolders = await Folder.find({ parent_folder_id: folder.id });

      res.status(200).json({
        status: 'success',
        data: {
          type: 'folder',
          file_name: folder.folder_name,
          files: serializedFiles,
          folders: subfolders.map(f => {
            const folderObj = f.toObject();
            folderObj.id = folderObj._id.toString();
            delete folderObj._id;
            delete folderObj.__v;
            return folderObj;
          })
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

const getSharedFolderFile = async (req, res, next) => {
  try {
    const { token, fileId } = req.params;
    const disposition = req.query.disposition || 'attachment';

    // 1. Try SharedLink first
    const sharedLink = await SharedLink.findOne({ token }).populate('folder_id');
    if (sharedLink && sharedLink.folder_id) {
      if (sharedLink.expiry_date && new Date() > sharedLink.expiry_date) {
        return next(new ForbiddenError('This shared folder link has expired.'));
      }
      
      let file = await File.findOne({ _id: fileId, folder_id: sharedLink.folder_id._id });
      let isVideo = false;
      let s3Key, originalName, mimeType, size, ownerId;

      if (file) {
        s3Key = file.s3_key;
        originalName = file.original_name;
        mimeType = file.file_type;
        size = file.file_size;
        ownerId = file.user_id;
      } else {
        const Video = require('../models/Video');
        const video = await Video.findOne({ _id: fileId, folderId: sharedLink.folder_id._id, status: 'Active' });
        if (!video) {
          return next(new NotFoundError('File not found in this shared folder.'));
        }
        s3Key = video.s3Key;
        originalName = video.originalName || video.filename;
        mimeType = video.mimeType;
        size = video.size;
        ownerId = video.ownerId;
        isVideo = true;
      }

      let presignedUrl;
      if (isVideo) {
        const s3Service = require('../services/s3Service');
        presignedUrl = await s3Service.getPreSignedDownloadUrl(s3Key, originalName, 600, disposition);
      } else {
        presignedUrl = await getPreSignedDownloadUrl(s3Key, originalName, 600, disposition);
      }

      await logActivity(ownerId, 'Download', { 
        fileId, 
        viaShare: sharedLink.id, 
        status: isVideo ? 'public_video_folder' : 'public_folder' 
      }, req.ip);

      return res.status(200).json({
        status: 'success',
        data: {
          file_name: originalName,
          file_type: mimeType,
          file_size: size,
          download_url: presignedUrl
        }
      });
    }

    // 2. Try VideoShare
    const VideoShare = require('../models/VideoShare');
    const Video = require('../models/Video');
    const s3Service = require('../services/s3Service');

    const videoShare = await VideoShare.findOne({ token, isActive: true }).populate('folderId');
    if (videoShare && videoShare.folderId) {
      if (videoShare.expiresAt && new Date() > videoShare.expiresAt) {
        return next(new ForbiddenError('This shared folder link has expired.'));
      }

      const video = await Video.findOne({ _id: fileId, folderId: videoShare.folderId._id, status: 'Active' });
      if (!video) {
        return next(new NotFoundError('Video not found in this shared folder.'));
      }

      const presignedUrl = await s3Service.getPreSignedDownloadUrl(video.s3Key, video.originalName || video.filename, 600, disposition);
      await logActivity(video.ownerId, 'Download', { videoId: video._id, viaShare: videoShare.id, status: 'public_video_folder' }, req.ip);

      return res.status(200).json({
        status: 'success',
        data: {
          file_name: video.originalName || video.filename,
          file_type: video.mimeType,
          file_size: video.size,
          download_url: presignedUrl
        }
      });
    }

    return next(new NotFoundError('Shared folder link not found or invalid.'));
  } catch (error) {
    next(error);
  }
};

const deleteShare = async (req, res, next) => {
  try {
    const sharedLink = await SharedLink.findById(req.params.id).populate('file_id');

    if (!sharedLink || !sharedLink.file_id) {
      return next(new NotFoundError('Shared link not found.'));
    }

    if (sharedLink.file_id.user_id.toString() !== req.user.id.toString()) {
      return next(new ForbiddenError('Access denied: you do not own the file associated with this share link.'));
    }

    await SharedLink.findByIdAndDelete(sharedLink.id);

    res.status(200).json({
      status: 'success',
      message: 'Shared link revoked successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a public viewing link for a video file.
 * Sets public-read ACL on the S3 object and creates a short URL code.
 * The link never expires.
 */
const generateVideoLink = async (req, res, next) => {
  try {
    const file = await findOwnedFile(req.params.id, req.user.id);

    if (!file.file_type.startsWith('video/')) {
      return next(new BadRequestError('Public video links can only be generated for video files.'));
    }

    // Make the S3 object publicly readable (permanent URL, no expiry)
    await makeObjectPublic(file.s3_key);

    // Generate a short 8-character URL code
    const shortCode = crypto.randomBytes(6).toString('base64url'); // 8 chars, URL-safe

    const sharedLink = await SharedLink.create({
      file_id: file.id,
      token: shortCode,
      permission: 'read',
      expiry_date: null // never expires
    });

    await logActivity(
      req.user.id,
      'Share',
      { fileId: file.id, fileName: file.file_name, shareId: sharedLink.id, type: 'video-link' },
      req.ip
    );

    const shortUrl = `${req.protocol}://${req.get('host')}/v/${shortCode}`;
    const permanentS3Url = getObjectUrl(file.s3_key);

    res.status(201).json({
      status: 'success',
      data: {
        id: sharedLink.id,
        file_id: file.id,
        short_url: shortUrl,
        direct_url: permanentS3Url
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public redirect: short URL → permanent S3 object URL.
 * No login required. Redirects the browser directly to the video on S3.
 */
const getPublicVideo = async (req, res, next) => {
  try {
    const sharedLink = await SharedLink.findOne({ token: req.params.code }).populate('file_id');

    if (!sharedLink || !sharedLink.file_id) {
      return next(new NotFoundError('Video link not found or has been revoked.'));
    }

    const file = sharedLink.file_id;

    if (!file.file_type.startsWith('video/')) {
      return next(new BadRequestError('This link does not point to a video file.'));
    }

    const permanentUrl = getObjectUrl(file.s3_key);

    await logActivity(file.user_id, 'Video View', { fileId: file.id, viaShare: sharedLink.id, status: 'public' }, req.ip);

    // 302 redirect — browser goes directly to S3
    res.redirect(302, permanentUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * Initiate a presigned multipart upload.
 * Client sends file metadata; server returns presigned URLs for direct S3 upload.
 * Supports files up to 15 GB.
 */
const initiateUploadController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { file_name, file_type, file_size, folder_id } = req.body;

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file_type)) {
      return next(new BadRequestError(`Unsupported file type: ${file_type}`));
    }

    // Validate file size
    if (file_size > MAX_FILE_SIZE) {
      return next(new BadRequestError(`File size exceeds the 15 GB limit.`));
    }

    // Validate folder ownership
    const folder = await ensureOwnedFolder(folder_id, userId);

    // Build the S3 key
    const category = getS3Category(file_type);
    const objectId = crypto.randomUUID();
    const sanitizedName = file_name.replace(/\s+/g, '-');
    const s3Key = `users/${userId}/${category}/${objectId}-${sanitizedName}`;

    // Calculate number of parts
    const totalParts = Math.ceil(file_size / PART_SIZE);

    // Initiate S3 multipart upload
    const uploadId = await initiateMultipartUpload(s3Key, file_type);

    // Generate presigned URLs for each part
    const parts = await generateUploadPartUrls(s3Key, uploadId, totalParts);

    res.status(200).json({
      status: 'success',
      data: {
        upload_id: uploadId,
        s3_key: s3Key,
        part_size: PART_SIZE,
        total_parts: totalParts,
        parts,
        // Pass back metadata so the client can send it on complete
        file_metadata: {
          file_name,
          file_type,
          file_size,
          folder_id: folder ? folder.id : null
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete a multipart upload after the client finishes uploading all parts.
 * Creates the File record in MongoDB.
 */
const completeUploadController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { upload_id, s3_key, parts, file_name, file_type, file_size, folder_id, uploadBatchId } = req.body;

    if (!upload_id || !s3_key || !parts || !Array.isArray(parts) || parts.length === 0) {
      return next(new BadRequestError('upload_id, s3_key, and parts[] are required.'));
    }

    // Complete the S3 multipart upload
    await completeMultipartUpload(s3_key, upload_id, parts);

    // Check if the target folder is inside the Work folder tree
    const workFlag = folder_id ? await isWorkFolder(folder_id) : false;

    // Create the file record in MongoDB
    const createdFile = await File.create({
      user_id: userId,
      folder_id: folder_id || null,
      file_name: file_name,
      original_name: file_name,
      file_type: file_type,
      file_size: file_size,
      s3_key: s3_key,
      is_work_submission: workFlag,
      uploadBatchId: uploadBatchId || null
    });

    await logActivity(userId, 'Upload', { fileId: createdFile.id, fileName: createdFile.file_name, method: 'multipart' }, req.ip);

    res.status(201).json({
      status: 'success',
      data: {
        file: serializeFile(createdFile)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Abort a multipart upload and clean up S3 parts.
 */
const abortUploadController = async (req, res, next) => {
  try {
    const { upload_id, s3_key } = req.body;

    if (!upload_id || !s3_key) {
      return next(new BadRequestError('upload_id and s3_key are required.'));
    }

    await abortMultipartUpload(s3_key, upload_id);

    res.status(200).json({
      status: 'success',
      message: 'Multipart upload aborted and parts cleaned up.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFile: uploadFileController,
  getFiles,
  getFile,
  updateFile,
  deleteFile: deleteFileController,
  moveFile,
  favoriteFile,
  downloadFile,
  shareFile,
  getSharedFile,
  getSharedFolderFile,
  deleteShare,
  generateVideoLink,
  getPublicVideo,
  initiateUpload: initiateUploadController,
  completeUpload: completeUploadController,
  abortUpload: abortUploadController
};
