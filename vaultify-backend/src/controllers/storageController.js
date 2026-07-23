const File = require('../models/File');
const Video = require('../models/Video');
const Folder = require('../models/Folder');
const VideoFolder = require('../models/VideoFolder');
const mongoose = require('mongoose');

exports.getStorageSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Run aggregation query to count and size files by categories
    const results = await File.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'folders',
          localField: 'folder_id',
          foreignField: '_id',
          as: 'folderInfo'
        }
      },
      { $unwind: { path: '$folderInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: '$file_name',
          size: '$file_size',
          folderName: { $ifNull: ['$folderInfo.folder_name', ''] },
          fileType: '$file_type'
        }
      },
      {
        $unionWith: {
          coll: 'videos',
          pipeline: [
            { $match: { ownerId: new mongoose.Types.ObjectId(userId) } },
            {
              $lookup: {
                from: 'videofolders',
                localField: 'folderId',
                foreignField: '_id',
                as: 'folderInfo'
              }
            },
            { $unwind: { path: '$folderInfo', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                name: '$filename',
                size: '$size',
                folderName: { $ifNull: ['$folderInfo.name', ''] },
                fileType: '$mimeType'
              }
            }
          ]
        }
      },
      {
        $addFields: {
          category: {
            $cond: {
              if: {
                $regexMatch: {
                  input: '$name',
                  regex: /\.(jpg|jpeg|png|gif|svg|bmp|webp)$/i
                }
              },
              then: 'Images',
              else: {
                $cond: {
                  if: {
                    $regexMatch: {
                      input: '$name',
                      regex: /\.(mp4|mov|avi|mkv|webm|mp3|wav)$/i
                    }
                  },
                  then: 'Media',
                  else: 'Documents'
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$category',
          files: { $sum: 1 },
          size: { $sum: '$size' }
        }
      }
    ]);

    const defaultStats = {
      plan: '500 GB',
      usedStorage: 0,
      remainingStorage: 500 * 1024 * 1024 * 1024,
      usagePercentage: 0,
      documents: { files: 0, size: 0 },
      images: { files: 0, size: 0 },
      media: { files: 0, size: 0 }
    };

    let totalSize = 0;
    results.forEach(r => {
      totalSize += r.size;
      const key = r._id.toLowerCase();
      if (key === 'documents') {
        defaultStats.documents = { files: r.files, size: r.size };
      } else if (key === 'images') {
        defaultStats.images = { files: r.files, size: r.size };
      } else if (key === 'media') {
        defaultStats.media = { files: r.files, size: r.size };
      }
    });

    const planLimit = req.user.storage_plan === 'pro'
      ? 1000 * 1024 * 1024 * 1024 // 1 TB
      : 500 * 1024 * 1024 * 1024; // 500 GB

    defaultStats.plan = req.user.storage_plan === 'pro' ? '1 TB' : '500 GB';
    defaultStats.usedStorage = totalSize;
    defaultStats.remainingStorage = Math.max(0, planLimit - totalSize);
    defaultStats.usagePercentage = planLimit > 0 ? parseFloat(((totalSize / planLimit) * 100).toFixed(6)) : 0;

    res.status(200).json({
      status: 'success',
      data: defaultStats
    });
  } catch (error) {
    next(error);
  }
};
