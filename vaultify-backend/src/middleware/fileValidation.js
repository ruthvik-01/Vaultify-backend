const multer = require('multer');
const { BadRequestError } = require('../utils/errors');

// Memory storage keeps the file in memory buffer, allowing direct stream to AWS S3.
const storage = multer.memoryStorage();

/**
 * Filter allowed file formats
 */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'image/jpeg',
    'image/png',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    // Video formats
    'video/mp4',
    'video/webm',
    'video/quicktime',        // .mov
    'video/x-matroska',       // .mkv
    'video/x-msvideo'         // .avi
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Unsupported file type. Allowed: PDF, DOC/DOCX, JPEG, PNG, ZIP, TXT, MP4, WEBM, MOV, MKV, and AVI.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 Megabytes limit
  }
});

module.exports = upload;
