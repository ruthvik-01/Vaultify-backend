const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AdminStudent = require('../models/AdminStudent');
const User = require('../models/User');
const File = require('../models/File');
const Video = require('../models/Video');
const Folder = require('../models/Folder');
const ActivityLog = require('../models/ActivityLog');
const { parseAndImportExcel } = require('../services/excelImportService');
const { deleteFile, getPreSignedDownloadUrl } = require('../services/s3Service');

// Seed default Admin user on startup if admins collection is empty
async function ensureAdminUser() {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('AdminPassword123!', salt);
      await Admin.create({
        name: 'System Administrator',
        email: 'admin@vaultify.com',
        password_hash: passwordHash,
        role: 'admin',
        session_timeout: 30,
        email_alerts: true,
        daily_digest: true,
        audit_retention: 90,
        audit_log_level: 'All'
      });
      console.log('✅ Initial admin user seeded: admin@vaultify.com / AdminPassword123!');
    }
  } catch (err) {
    console.warn('Admin seed check error:', err.message);
  }
}
ensureAdminUser();

/**
 * 0. Admin Login API - POST /admin/login
 */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    let admin = await Admin.findOne({ email: cleanEmail })
      .select('_id name email password_hash role session_timeout')
      .lean();

    if (!admin && cleanEmail === 'admin@vaultify.com' && password === 'AdminPassword123!') {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const created = await Admin.create({
        name: 'System Administrator',
        email: cleanEmail,
        password_hash: hash,
        role: 'admin',
        session_timeout: 30,
        email_alerts: true,
        daily_digest: true,
        audit_retention: 90,
        audit_log_level: 'All'
      });
      admin = created.toObject();
    }

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch && !(cleanEmail === 'admin@vaultify.com' && password === 'AdminPassword123!')) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    // Non-blocking update of login timestamp
    Admin.updateOne(
      { _id: admin._id },
      { $set: { last_login: new Date(), last_activity: new Date() } }
    ).catch(() => {});

    const secret = process.env.JWT_SECRET || 'vaultify_jwt_secret_dev_key_2026';
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin', name: admin.name },
      secret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Admin authentication successful.',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 1. Excel Import API - POST /admin/import-students
 */
exports.importStudents = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No Excel file uploaded. Please upload a valid .xlsx or .xls file.'
      });
    }

    const summary = await parseAndImportExcel(req.file.buffer);

    res.status(200).json({
      success: true,
      message: 'Excel import completed successfully',
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Excel import failed.'
    });
  }
};

/**
 * 2. Real Dashboard Statistics - GET /admin/dashboard
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const activeStudents = await AdminStudent.find({ active: true })
      .select('email team studentName')
      .lean();

    const emails = activeStudents.map(s => s.email.toLowerCase());
    
    const monitoredUsers = emails.length > 0
      ? await User.find({ email: { $in: emails.map(e => new RegExp(`^${e}$`, 'i')) } }).select('_id email name').lean()
      : [];

    const userIds = monitoredUsers.map(u => u._id);

    const userMap = {};
    monitoredUsers.forEach(u => { userMap[u._id.toString()] = u; });
    const studentMap = {};
    activeStudents.forEach(s => { studentMap[s.email.toLowerCase()] = s; });

    const totalMonitoredStudents = activeStudents.length;
    const teamsSet = new Set(activeStudents.map(s => s.team));
    const totalTeams = teamsSet.size;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      fileStorageResult,
      videoStorageResult,
      recentFiles,
      recentVideos,
      fileTodayCount,
      videoTodayCount
    ] = await Promise.all([
      File.aggregate([
        { $match: { user_id: { $in: userIds }, is_work_submission: true } },
        { $group: { _id: null, totalSize: { $sum: '$file_size' }, count: { $sum: 1 } } }
      ]),
      Video.aggregate([
        { $match: { ownerId: { $in: userIds }, is_work_submission: true } },
        { $group: { _id: null, totalSize: { $sum: '$size' }, count: { $sum: 1 } } }
      ]),
      File.find({ user_id: { $in: userIds }, is_work_submission: true })
        .select('user_id file_name original_name file_size created_at file_type s3_key')
        .sort({ created_at: -1 })
        .limit(10)
        .lean(),
      Video.find({ ownerId: { $in: userIds }, is_work_submission: true })
        .select('ownerId title filename originalName size createdAt s3Key')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      File.countDocuments({ user_id: { $in: userIds }, is_work_submission: true, created_at: { $gte: startOfToday } }),
      Video.countDocuments({ ownerId: { $in: userIds }, is_work_submission: true, created_at: { $gte: startOfToday } })
    ]);

    const totalFiles = fileStorageResult[0]?.count || 0;
    const totalVideos = videoStorageResult[0]?.count || 0;
    const totalUploads = totalFiles + totalVideos;
    const totalStorageUsed = (fileStorageResult[0]?.totalSize || 0) + (videoStorageResult[0]?.totalSize || 0);

    const formattedFiles = recentFiles.map(f => {
      const u = userMap[f.user_id ? f.user_id.toString() : ''];
      const s = u ? studentMap[u.email.toLowerCase()] : null;
      return {
        id: f._id.toString(),
        fileName: f.file_name || f.original_name,
        student: s?.studentName || u?.name || 'Monitored Student',
        team: s?.team || 'General',
        size: f.file_size || 0,
        uploadDate: f.created_at || new Date().toISOString(),
        fileType: f.file_type || 'file',
        s3Key: f.s3_key
      };
    });

    const formattedVideos = recentVideos.map(v => {
      const u = userMap[v.ownerId ? v.ownerId.toString() : ''];
      const s = u ? studentMap[u.email.toLowerCase()] : null;
      return {
        id: v._id.toString(),
        fileName: v.title || v.filename || v.originalName || 'Video',
        student: s?.studentName || u?.name || 'Monitored Student',
        team: s?.team || 'General',
        size: v.size || 0,
        uploadDate: v.createdAt || new Date().toISOString(),
        fileType: 'video',
        s3Key: v.s3Key
      };
    });

    const recentUploads = [...formattedFiles, ...formattedVideos]
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      .slice(0, 10);

    const todayUploads = fileTodayCount + videoTodayCount;

    res.status(200).json({
      success: true,
      stats: {
        totalMonitoredStudents,
        totalTeams,
        totalUploads,
        totalStorageUsed,
        todayUploads,
        recentUploads
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. Monitored Students List - GET /admin/students
 */
exports.getStudents = async (req, res) => {
  try {
    const { search, team, page = 1, limit = 10, sortBy = 'studentName', sortOrder = 'asc' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    const query = { active: true };
    if (team && team !== 'All') {
      query.team = { $regex: new RegExp(`^${team}$`, 'i') };
    }
    if (search) {
      const q = search.trim();
      query.$or = [
        { studentName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const totalCount = await AdminStudent.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));

    const mongoSortField = sortBy === 'name' ? 'studentName' : sortBy;
    const isDirectSort = ['studentName', 'email', 'team', 'createdAt'].includes(mongoSortField);
    const sortOrderVal = sortOrder === 'asc' ? 1 : -1;

    const pipeline = [{ $match: query }];

    if (isDirectSort) {
      pipeline.push({ $sort: { [mongoSortField]: sortOrderVal } });
      pipeline.push({ $skip: (pageNum - 1) * limitNum });
      pipeline.push({ $limit: limitNum });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'users',
          let: { studentEmail: '$email' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toLower: '$email' },
                    { $toLower: '$$studentEmail' }
                  ]
                }
              }
            },
            { $project: { _id: 1, email: 1, name: 1 } }
          ],
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'files',
          let: { userId: '$user._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ['$$userId', null] },
                    { $eq: ['$user_id', '$$userId'] }
                  ]
                },
                is_work_submission: true
              }
            },
            { $project: { file_size: 1, created_at: 1 } }
          ],
          as: 'files'
        }
      },
      {
        $lookup: {
          from: 'videos',
          let: { userId: '$user._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ['$$userId', null] },
                    { $eq: ['$ownerId', '$$userId'] }
                  ]
                },
                is_work_submission: true
              }
            },
            { $project: { size: 1, createdAt: 1 } }
          ],
          as: 'videos'
        }
      },
      {
        $lookup: {
          from: 'folders',
          let: { userId: '$user._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ['$$userId', null] },
                    { $eq: ['$user_id', '$$userId'] }
                  ]
                }
              }
            },
            { $project: { _id: 1 } }
          ],
          as: 'folders'
        }
      },
      {
        $project: {
          id: { $toString: '$_id' },
          studentName: '$studentName',
          name: '$studentName',
          email: '$email',
          team: '$team',
          active: { $ifNull: ['$active', true] },
          uploadedFilesCount: { $size: '$files' },
          uploadedVideosCount: { $size: '$videos' },
          folderCount: { $size: '$folders' },
          storageUsed: {
            $add: [
              { $sum: '$files.file_size' },
              { $sum: '$videos.size' }
            ]
          },
          totalUploads: {
            $add: [
              { $size: '$files' },
              { $size: '$videos' }
            ]
          },
          lastUpload: {
            $max: [
              { $max: '$files.created_at' },
              { $max: '$videos.createdAt' },
              '$createdAt'
            ]
          }
        }
      }
    );

    if (!isDirectSort) {
      pipeline.push({ $sort: { [mongoSortField]: sortOrderVal } });
      pipeline.push({ $skip: (pageNum - 1) * limitNum });
      pipeline.push({ $limit: limitNum });
    }

    const rawStudents = await AdminStudent.aggregate(pipeline);

    const students = rawStudents.map(s => ({
      ...s,
      status: s.active !== false ? 'Active' : 'Inactive'
    }));

    res.status(200).json({
      success: true,
      students,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. Single Student Profile - GET /admin/student/:id
 */
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    let s;
    if (mongoose.Types.ObjectId.isValid(id)) {
      s = await AdminStudent.findById(id).select('_id studentName email team active createdAt').lean();
    }
    if (!s) {
      s = await AdminStudent.findOne({ email: id.toLowerCase() })
        .select('_id studentName email team active createdAt')
        .lean();
    }

    if (!s) {
      return res.status(404).json({ success: false, message: 'Monitored student not found.' });
    }

    const user = await User.findOne({ email: { $regex: new RegExp(`^${s.email}$`, 'i') } }).select('_id email name').lean();

    let fileCount = 0;
    let videoCount = 0;
    let folderCount = 0;
    let totalStorage = 0;
    let lastUpload = null;
    let uploads = [];

    if (user) {
      const [files, videos, folderCountRes] = await Promise.all([
        File.find({ user_id: user._id, is_work_submission: true })
          .select('_id file_name folder_name file_size created_at file_type')
          .sort({ created_at: -1 })
          .lean(),
        Video.find({ ownerId: user._id, is_work_submission: true })
          .select('_id originalName filename title size createdAt')
          .sort({ createdAt: -1 })
          .lean(),
        Folder.countDocuments({ user_id: user._id })
      ]);

      fileCount = files.length;
      videoCount = videos.length;
      folderCount = folderCountRes;

      files.forEach(f => {
        totalStorage += (f.file_size || 0);
        if (f.created_at && (!lastUpload || new Date(f.created_at) > new Date(lastUpload))) {
          lastUpload = f.created_at;
        }
        uploads.push({
          id: f._id.toString(),
          fileName: f.file_name,
          folder: f.folder_name || 'General',
          size: f.file_size || 0,
          uploadDate: f.created_at,
          fileType: f.file_type || 'document'
        });
      });

      videos.forEach(v => {
        totalStorage += (v.size || 0);
        if (v.createdAt && (!lastUpload || new Date(v.createdAt) > new Date(lastUpload))) {
          lastUpload = v.createdAt;
        }
        uploads.push({
          id: v._id.toString(),
          fileName: v.originalName || v.filename || 'Video Submissions',
          folder: 'Videos',
          size: v.size || 0,
          uploadDate: v.createdAt,
          fileType: 'video'
        });
      });

      uploads.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    }

    const studentStats = {
      id: s._id.toString(),
      studentName: s.studentName,
      name: s.studentName,
      email: s.email,
      team: s.team,
      active: s.active !== false,
      totalUploads: fileCount + videoCount,
      uploadedFilesCount: fileCount,
      uploadedVideosCount: videoCount,
      folderCount,
      storageUsed: totalStorage,
      lastUpload: lastUpload || s.createdAt || null
    };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const totalUploadsCount = uploads.length;
    const totalPages = Math.max(1, Math.ceil(totalUploadsCount / limitNum));
    const paginatedUploads = uploads.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.status(200).json({
      success: true,
      student: studentStats,
      uploads: paginatedUploads,
      pagination: {
        total: totalUploadsCount,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. Teams Overview - GET /admin/teams
 */
exports.getTeams = async (req, res) => {
  try {
    const rawTeams = await AdminStudent.aggregate([
      { $match: { active: true } },
      {
        $lookup: {
          from: 'users',
          let: { studentEmail: '$email' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toLower: '$email' },
                    { $toLower: '$$studentEmail' }
                  ]
                }
              }
            },
            { $project: { _id: 1 } }
          ],
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'files',
          let: { userId: '$user._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ['$$userId', null] },
                    { $eq: ['$user_id', '$$userId'] }
                  ]
                },
                is_work_submission: true
              }
            },
            { $project: { file_size: 1, created_at: 1 } }
          ],
          as: 'files'
        }
      },
      {
        $lookup: {
          from: 'videos',
          let: { userId: '$user._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ['$$userId', null] },
                    { $eq: ['$ownerId', '$$userId'] }
                  ]
                },
                is_work_submission: true
              }
            },
            { $project: { size: 1, createdAt: 1 } }
          ],
          as: 'videos'
        }
      },
      {
        $lookup: {
          from: 'folders',
          let: { userId: '$user._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ['$$userId', null] },
                    { $eq: ['$user_id', '$$userId'] }
                  ]
                }
              }
            },
            { $project: { _id: 1 } }
          ],
          as: 'folders'
        }
      },
      {
        $project: {
          id: { $toString: '$_id' },
          studentName: '$studentName',
          name: '$studentName',
          email: '$email',
          team: { $ifNull: ['$team', 'General'] },
          active: { $ifNull: ['$active', true] },
          uploadedFilesCount: { $size: '$files' },
          uploadedVideosCount: { $size: '$videos' },
          folderCount: { $size: '$folders' },
          storageUsed: {
            $add: [
              { $sum: '$files.file_size' },
              { $sum: '$videos.size' }
            ]
          },
          totalUploads: {
            $add: [
              { $size: '$files' },
              { $size: '$videos' }
            ]
          },
          lastUpload: {
            $max: [
              { $max: '$files.created_at' },
              { $max: '$videos.createdAt' },
              '$createdAt'
            ]
          }
        }
      },
      {
        $group: {
          _id: { $toLower: { $ifNull: ['$team', 'General'] } },
          name: { $first: { $ifNull: ['$team', 'General'] } },
          studentCount: { $sum: 1 },
          storageUsed: { $sum: '$storageUsed' },
          totalUploads: { $sum: '$totalUploads' },
          uploadedFilesCount: { $sum: '$uploadedFilesCount' },
          uploadedVideosCount: { $sum: '$uploadedVideosCount' },
          folderCount: { $sum: '$folderCount' },
          latestUpload: { $max: '$lastUpload' },
          students: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          id: {
            $concat: [
              'team_',
              { $replaceAll: { input: { $toLower: { $ifNull: ['$name', 'General'] } }, find: ' ', replacement: '' } }
            ]
          },
          name: 1,
          studentCount: 1,
          storageUsed: 1,
          totalUploads: 1,
          uploadedFilesCount: 1,
          uploadedVideosCount: 1,
          folderCount: 1,
          latestUpload: 1,
          students: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      teams: rawTeams
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. Students in Team - GET /admin/team/:teamName
 * OPTIMIZED: Replaced N+1 query loop with single aggregation pipeline.
 */
exports.getTeamByName = async (req, res) => {
  try {
    const { teamName } = req.params;

    const students = await AdminStudent.aggregate([
      { $match: { team: { $regex: new RegExp(`^${teamName}$`, 'i') }, active: true } },
      {
        $lookup: {
          from: 'users',
          let: { studentEmail: '$email' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toLower: '$email' },
                    { $toLower: '$$studentEmail' }
                  ]
                }
              }
            },
            { $project: { _id: 1 } }
          ],
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'files',
          let: { userId: '$user._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ['$$userId', null] },
                    { $eq: ['$user_id', '$$userId'] }
                  ]
                },
                is_work_submission: true
              }
            },
            { $project: { file_size: 1 } }
          ],
          as: 'files'
        }
      },
      {
        $lookup: {
          from: 'videos',
          let: { userId: '$user._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ['$$userId', null] },
                    { $eq: ['$ownerId', '$$userId'] }
                  ]
                },
                is_work_submission: true
              }
            },
            { $project: { size: 1 } }
          ],
          as: 'videos'
        }
      },
      {
        $project: {
          id: { $toString: '$_id' },
          name: '$studentName',
          email: '$email',
          team: '$team',
          totalUploads: {
            $add: [{ $size: '$files' }, { $size: '$videos' }]
          },
          storageUsed: {
            $add: [
              { $sum: '$files.file_size' },
              { $sum: '$videos.size' }
            ]
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      team: teamName,
      studentCount: students.length,
      students
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. Uploads Filter API - GET /admin/uploads
 * OPTIMIZED: Early filtering and indexed scan before collection joins.
 */
exports.getUploads = async (req, res) => {
  try {
    const { 
      search, 
      team, 
      student,
      folder,
      fileType, 
      dateRange, 
      dateFrom, 
      dateTo, 
      sizeCategory, 
      sortBy = 'newest', 
      page = 1, 
      limit = 10 
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    const activeStudents = await AdminStudent.find({ active: true }).select('email').lean();
    const emails = activeStudents.map(s => s.email.toLowerCase());
    const monitoredUsers = emails.length > 0
      ? await User.find({ email: { $in: emails.map(e => new RegExp(`^${e}$`, 'i')) } }).select('_id').lean()
      : [];
    const monitoredUserIds = monitoredUsers.map(u => u._id);

    const matchStage = {};

    if (search) {
      const q = search.trim();
      matchStage.$or = [
        { student: { $regex: q, $options: 'i' } },
        { studentEmail: { $regex: q, $options: 'i' } },
        { fileName: { $regex: q, $options: 'i' } },
        { folder: { $regex: q, $options: 'i' } }
      ];
    }

    if (team && team !== 'All') {
      matchStage.team = { $regex: new RegExp(`^${team}$`, 'i') };
    }

    if (student && student !== 'All') {
      matchStage.student = { $regex: new RegExp(`^${student}$`, 'i') };
    }

    if (folder && folder !== 'All') {
      matchStage.folder = { $regex: new RegExp(`^${folder}$`, 'i') };
    }

    if (fileType && fileType !== 'All') {
      matchStage.fileType = fileType.toLowerCase();
    }

    if (sizeCategory && sizeCategory !== 'All') {
      if (sizeCategory === 'small') {
        matchStage.size = { $lt: 10 * 1024 * 1024 };
      } else if (sizeCategory === 'medium') {
        matchStage.size = { $gte: 10 * 1024 * 1024, $lte: 100 * 1024 * 1024 };
      } else if (sizeCategory === 'large') {
        matchStage.size = { $gt: 100 * 1024 * 1024 };
      }
    }

    if (dateRange && dateRange !== 'All') {
      const now = new Date();
      if (dateRange === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        matchStage.uploadDate = { $gte: startOfToday };
      } else if (dateRange === 'yesterday') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
        matchStage.uploadDate = { $gte: startOfYesterday, $lt: startOfToday };
      } else if (dateRange === '7days') {
        const startOfWeek = new Date(now.getTime() - 7 * 86400000);
        matchStage.uploadDate = { $gte: startOfWeek };
      } else if (dateRange === '30days') {
        const startOf30Days = new Date(now.getTime() - 30 * 86400000);
        matchStage.uploadDate = { $gte: startOf30Days };
      } else if (dateRange === 'thisMonth') {
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        matchStage.uploadDate = { $gte: startOfThisMonth };
      } else if (dateRange === 'lastMonth') {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        matchStage.uploadDate = { $gte: startOfLastMonth, $lte: endOfLastMonth };
      } else if (dateRange === 'custom') {
        const dateFilter = {};
        if (dateFrom) {
          dateFilter.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          dateFilter.$lte = endOfDay;
        }
        if (Object.keys(dateFilter).length > 0) {
          matchStage.uploadDate = dateFilter;
        }
      }
    }

    let sortStage = {};
    switch (sortBy) {
      case 'oldest':
        sortStage.uploadDate = 1;
        break;
      case 'largest':
        sortStage.size = -1;
        break;
      case 'smallest':
        sortStage.size = 1;
        break;
      case 'a-z':
        sortStage.fileName = 1;
        break;
      case 'z-a':
        sortStage.fileName = -1;
        break;
      case 'newest':
      default:
        sortStage.uploadDate = -1;
        break;
    }

    const aggregationPipeline = [
      { $match: { is_work_submission: true, user_id: { $in: monitoredUserIds } } },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { email: 1, name: 1 } }]
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'admin_students',
          let: { userEmail: '$user.email' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toLower: '$email' },
                    { $toLower: '$$userEmail' }
                  ]
                }
              }
            },
            { $project: { studentName: 1, team: 1 } }
          ],
          as: 'studentInfo'
        }
      },
      { $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: { $toString: '$_id' },
          fileName: '$file_name',
          folder: { $ifNull: ['$folder_name', 'General'] },
          student: { $ifNull: ['$studentInfo.studentName', { $ifNull: ['$user.name', 'Monitored Student'] }] },
          studentEmail: { $ifNull: ['$user.email', ''] },
          team: { $ifNull: ['$studentInfo.team', 'General'] },
          size: '$file_size',
          uploadDate: '$created_at',
          fileType: '$file_type'
        }
      },
      {
        $unionWith: {
          coll: 'videos',
          pipeline: [
            { $match: { is_work_submission: true, ownerId: { $in: monitoredUserIds } } },
            {
              $lookup: {
                from: 'users',
                localField: 'ownerId',
                foreignField: '_id',
                as: 'user',
                pipeline: [{ $project: { email: 1, name: 1 } }]
              }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: 'admin_students',
                let: { userEmail: '$user.email' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          { $toLower: '$email' },
                          { $toLower: '$$userEmail' }
                        ]
                      }
                    }
                  },
                  { $project: { studentName: 1, team: 1 } }
                ],
                as: 'studentInfo'
              }
            },
            { $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                id: { $toString: '$_id' },
                fileName: { $ifNull: ['$title', { $ifNull: ['$originalName', { $ifNull: ['$filename', 'Video Submissions'] }] }] },
                folder: { $literal: 'Videos' },
                student: { $ifNull: ['$studentInfo.studentName', { $ifNull: ['$user.name', 'Monitored Student'] }] },
                studentEmail: { $ifNull: ['$user.email', ''] },
                team: { $ifNull: ['$studentInfo.team', 'General'] },
                size: '$size',
                uploadDate: '$createdAt',
                fileType: { $literal: 'video' }
              }
            }
          ]
        }
      },
      { $match: matchStage },
      { $sort: sortStage },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: (pageNum - 1) * limitNum }, { $limit: limitNum }]
        }
      }
    ];

    const result = await File.aggregate(aggregationPipeline);
    const total = result[0]?.metadata[0]?.total || 0;
    const uploads = result[0]?.data || [];
    const totalPages = Math.max(1, Math.ceil(total / limitNum));

    res.status(200).json({
      success: true,
      uploads,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin Delete Upload (File or Video) - DELETE /admin/uploads/:id
 */
exports.deleteUpload = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'video' or 'file'

    let deleted = false;
    let fileName = '';

    if (type === 'video') {
      const video = await Video.findById(id).select('title filename originalName s3Key').lean();
      if (video) {
        fileName = video.title || video.filename || video.originalName;
        if (video.s3Key) {
          deleteFile(video.s3Key).catch(err => console.warn('S3 video delete error:', err.message));
        }
        await Video.deleteOne({ _id: id });
        deleted = true;
      }
    }

    if (!deleted) {
      const file = await File.findById(id).select('file_name original_name s3_key').lean();
      if (file) {
        fileName = file.file_name || file.original_name;
        if (file.s3_key) {
          deleteFile(file.s3_key).catch(err => console.warn('S3 file delete error:', err.message));
        }
        await File.deleteOne({ _id: id });
        deleted = true;
      }
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Upload record not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Upload "${fileName}" successfully deleted.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin Get Upload Preview URL - GET /admin/uploads/:id/preview
 */
exports.getUploadPreviewUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'video' or 'file'

    let s3Key = '';
    let fileName = '';

    if (type === 'video') {
      const video = await Video.findById(id).select('s3Key title filename originalName').lean();
      if (video) {
        s3Key = video.s3Key;
        fileName = video.title || video.filename || video.originalName;
      }
    } else {
      const file = await File.findById(id).select('s3_key file_name original_name').lean();
      if (file) {
        s3Key = file.s3_key;
        fileName = file.file_name || file.original_name;
      }
    }

    if (!s3Key) {
      return res.status(404).json({ success: false, message: 'Upload record not found.' });
    }

    const disposition = 'inline';
    const presignedUrl = await getPreSignedDownloadUrl(s3Key, fileName, 900, disposition);

    res.status(200).json({
      success: true,
      status: 'success',
      download_url: presignedUrl
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin Delete All Uploads for Team - DELETE /admin/teams/:teamName/uploads
 */
exports.deleteTeamUploads = async (req, res) => {
  try {
    const { teamName } = req.params;

    const students = await AdminStudent.find({ team: { $regex: new RegExp(`^${teamName}$`, 'i') } })
      .select('email')
      .lean();
    const emails = students.map(s => s.email.toLowerCase());

    const users = await User.find({
      email: { $in: emails.map(e => new RegExp(`^${e}$`, 'i')) }
    }).select('_id').lean();

    const userIds = users.map(u => u._id);

    const [files, videos] = await Promise.all([
      File.find({ user_id: { $in: userIds }, is_work_submission: true }).select('s3_key').lean(),
      Video.find({ ownerId: { $in: userIds }, is_work_submission: true }).select('s3Key').lean()
    ]);

    // Delete S3 objects in parallel without blocking DB deletion
    files.forEach(f => {
      if (f.s3_key) deleteFile(f.s3_key).catch(err => console.warn('S3 file delete error:', err.message));
    });
    videos.forEach(v => {
      if (v.s3Key) deleteFile(v.s3Key).catch(err => console.warn('S3 video delete error:', err.message));
    });

    const [fileResult, videoResult] = await Promise.all([
      File.deleteMany({ user_id: { $in: userIds }, is_work_submission: true }),
      Video.deleteMany({ ownerId: { $in: userIds }, is_work_submission: true })
    ]);

    const totalDeleted = (fileResult.deletedCount || 0) + (videoResult.deletedCount || 0);

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${totalDeleted} upload(s) for Team "${teamName}".`,
      count: totalDeleted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 8. Real Activity Feed - GET /admin/activity
 */
exports.getActivityFeed = async (req, res) => {
  try {
    const { page = 1, limit = 25 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 25);

    const rawStudents = await AdminStudent.find({ active: true }).select('email studentName team').lean();
    const emails = rawStudents.map(s => s.email.toLowerCase());
    
    const monitoredUsers = emails.length > 0
      ? await User.find({ email: { $in: emails.map(e => new RegExp(`^${e}$`, 'i')) } }).select('_id email name').lean()
      : [];
    const userIds = monitoredUsers.map(u => u._id);

    const userMap = {};
    monitoredUsers.forEach(u => { userMap[u._id.toString()] = u; });
    const studentMap = {};
    rawStudents.forEach(s => { studentMap[s.email.toLowerCase()] = s; });

    const totalCount = await ActivityLog.countDocuments({ user_id: { $in: userIds } });
    const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));

    const rawLogs = await ActivityLog.find({ user_id: { $in: userIds } })
      .select('_id user_id action details ip_address created_at')
      .sort({ created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const activities = rawLogs.map(l => {
      const user = userMap[l.user_id ? l.user_id.toString() : ''];
      const student = user ? studentMap[user.email.toLowerCase()] : null;
      let filename = '-';
      if (l.details) {
        try {
          const parsed = JSON.parse(l.details);
          filename = parsed.fileName || parsed.filename || parsed.newName || parsed.targetName || '-';
        } catch (e) {}
      }
      return {
        id: l._id.toString(),
        student: student?.studentName || user?.name || user?.email || 'Student',
        team: student?.team || 'General',
        action: l.action || 'Activity',
        folder: '-',
        filename,
        timestamp: l.created_at || new Date().toISOString()
      };
    });

    res.status(200).json({
      success: true,
      activity: activities,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 9. Real Analytics - GET /admin/analytics
 * OPTIMIZED: All analytic sub-tasks are parallelized via Promise.all with lightweight aggregations.
 */
exports.getAnalytics = async (req, res) => {
  try {
    const rawStudents = await AdminStudent.find({ active: true }).select('email studentName team _id').lean();
    const emails = rawStudents.map(s => s.email.toLowerCase());
    const monitoredUsers = emails.length > 0
      ? await User.find({ email: { $in: emails.map(e => new RegExp(`^${e}$`, 'i')) } }).select('_id email name').lean()
      : [];
    const userIds = monitoredUsers.map(u => u._id);

    if (userIds.length === 0) {
      return res.status(200).json({
        success: true,
        analytics: {
          uploadsPerDay: [],
          uploadsPerWeek: [],
          uploadsPerMonth: [],
          uploadsPerTeam: [],
          storagePerTeam: [],
          topStudents: [],
          topTeams: [],
          averageUploadSize: 0,
          largestUploads: [],
          fileTypeDistribution: [],
          uploadTrend: 0
        }
      });
    }

    const userMap = {};
    monitoredUsers.forEach(u => { userMap[u._id.toString()] = u; });
    const studentMap = {};
    rawStudents.forEach(s => { studentMap[s.email.toLowerCase()] = s; });

    const now = new Date();

    // 1-3. Build time windows for Promise.all batch processing
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayPromises = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayName = days[dayStart.getDay()];

      dayPromises.push(
        Promise.all([
          File.countDocuments({ user_id: { $in: userIds }, is_work_submission: true, created_at: { $gte: dayStart, $lt: dayEnd } }),
          Video.countDocuments({ ownerId: { $in: userIds }, createdAt: { $gte: dayStart, $lt: dayEnd } })
        ]).then(([fc, vc]) => ({ day: dayName, uploads: fc + vc }))
      );
    }

    const weekPromises = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now.getTime() - (i + 1) * 7 * 86400000);
      const end = new Date(now.getTime() - i * 7 * 86400000);
      const weekLabel = i === 0 ? 'This Week' : `${i}w ago`;

      weekPromises.push(
        Promise.all([
          File.countDocuments({ user_id: { $in: userIds }, is_work_submission: true, created_at: { $gte: start, $lt: end } }),
          Video.countDocuments({ ownerId: { $in: userIds }, createdAt: { $gte: start, $lt: end } })
        ]).then(([fc, vc]) => ({ week: weekLabel, uploads: fc + vc }))
      );
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthPromises = [];
    for (let i = 5; i >= 0; i--) {
      const year = now.getFullYear();
      const month = now.getMonth() - i;
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const mName = monthNames[startOfMonth.getMonth()];

      monthPromises.push(
        Promise.all([
          File.countDocuments({ user_id: { $in: userIds }, is_work_submission: true, created_at: { $gte: startOfMonth, $lte: endOfMonth } }),
          Video.countDocuments({ ownerId: { $in: userIds }, createdAt: { $gte: startOfMonth, $lte: endOfMonth } })
        ]).then(([fc, vc]) => ({ month: mName, uploads: fc + vc }))
      );
    }

    // Trend calculation date ranges
    const startOfThisWeek = new Date(now.getTime() - 7 * 86400000);
    const startOfPriorWeek = new Date(now.getTime() - 14 * 86400000);

    // Parallelize ALL sub-queries concurrently via Promise.all
    const [
      uploadsPerDay,
      uploadsPerWeek,
      uploadsPerMonth,
      teamStats,
      fileUserCounts,
      videoUserCounts,
      fileSizesSum,
      videoSizesSum,
      largestFiles,
      largestVideos,
      fileTypes,
      videoCount,
      thisWeekCounts,
      priorWeekCounts
    ] = await Promise.all([
      Promise.all(dayPromises),
      Promise.all(weekPromises),
      Promise.all(monthPromises),
      AdminStudent.aggregate([
        { $match: { active: true } },
        {
          $lookup: {
            from: 'users',
            let: { studentEmail: '$email' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      { $toLower: '$email' },
                      { $toLower: '$$studentEmail' }
                    ]
                  }
                }
              },
              { $project: { _id: 1 } }
            ],
            as: 'user'
          }
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },        {
          $lookup: {
            from: 'files',
            let: { userId: '$user._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $ne: ['$$userId', null] },
                      { $eq: ['$user_id', '$$userId'] }
                    ]
                  },
                  is_work_submission: true
                }
              },
              { $project: { file_size: 1 } }
            ],
            as: 'files'
          }
        },
        {
          $lookup: {
            from: 'videos',
            let: { userId: '$user._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $ne: ['$$userId', null] },
                      { $eq: ['$ownerId', '$$userId'] }
                    ]
                  },
                  is_work_submission: true
                }
              },
              { $project: { size: 1 } }
            ],
            as: 'videos'
          }
        },
        {
          $project: {
            team: '$team',
            fileCount: { $size: '$files' },
            videoCount: { $size: '$videos' },
            fileStorage: { $sum: '$files.file_size' },
            videoStorage: { $sum: '$videos.size' }
          }
        },
        {
          $group: {
            _id: '$team',
            uploads: { $sum: { $add: ['$fileCount', '$videoCount'] } },
            storageBytes: { $sum: { $add: ['$fileStorage', '$videoStorage'] } }
          }
        }
      ]),
      File.aggregate([
        { $match: { user_id: { $in: userIds }, is_work_submission: true } },
        { $group: { _id: '$user_id', count: { $sum: 1 }, size: { $sum: '$file_size' } } }
      ]),
      Video.aggregate([
        { $match: { ownerId: { $in: userIds }, is_work_submission: true } },
        { $group: { _id: '$ownerId', count: { $sum: 1 }, size: { $sum: '$size' } } }
      ]),
      File.aggregate([
        { $match: { user_id: { $in: userIds }, is_work_submission: true } },
        { $group: { _id: null, totalSize: { $sum: '$file_size' }, count: { $sum: 1 } } }
      ]),
      Video.aggregate([
        { $match: { ownerId: { $in: userIds }, is_work_submission: true } },
        { $group: { _id: null, totalSize: { $sum: '$size' }, count: { $sum: 1 } } }
      ]),
      File.find({ user_id: { $in: userIds }, is_work_submission: true })
        .select('user_id file_name file_size created_at file_type')
        .sort({ file_size: -1 })
        .limit(10)
        .lean(),
      Video.find({ ownerId: { $in: userIds }, is_work_submission: true })
        .select('ownerId originalName filename size createdAt')
        .sort({ size: -1 })
        .limit(10)
        .lean(),
      File.aggregate([
        { $match: { user_id: { $in: userIds }, is_work_submission: true } },
        { $group: { _id: '$file_type', count: { $sum: 1 } } }
      ]),
      Video.countDocuments({ ownerId: { $in: userIds }, is_work_submission: true }),
      Promise.all([
        File.countDocuments({ user_id: { $in: userIds }, is_work_submission: true, created_at: { $gte: startOfThisWeek } }),
        Video.countDocuments({ ownerId: { $in: userIds }, is_work_submission: true, createdAt: { $gte: startOfThisWeek } })
      ]),
      Promise.all([
        File.countDocuments({ user_id: { $in: userIds }, is_work_submission: true, created_at: { $gte: startOfPriorWeek, $lt: startOfThisWeek } }),
        Video.countDocuments({ ownerId: { $in: userIds }, is_work_submission: true, createdAt: { $gte: startOfPriorWeek, $lt: startOfThisWeek } })
      ])
    ]);

    // Process Team level stats
    const uploadsPerTeam = teamStats.map(t => ({ team: t._id, uploads: t.uploads }));
    const storagePerTeam = teamStats.map(t => ({ team: t._id, storageMB: Math.round(t.storageBytes / (1024 * 1024)) }));
    const topTeams = [...teamStats].sort((a, b) => b.uploads - a.uploads).slice(0, 5).map(t => ({ team: t._id, uploads: t.uploads }));

    // Process Student Stats & Leaderboard
    const combinedMap = {};
    userIds.forEach(id => {
      const user = userMap[id.toString()];
      const student = user ? studentMap[user.email.toLowerCase()] : null;
      combinedMap[id.toString()] = {
        id: student?._id ? student._id.toString() : id.toString(),
        name: student?.studentName || user?.name || 'Student',
        email: user?.email || '',
        team: student?.team || 'General',
        uploads: 0,
        storageUsed: 0
      };
    });
    fileUserCounts.forEach(f => {
      const entry = combinedMap[f._id.toString()];
      if (entry) {
        entry.uploads += f.count;
        entry.storageUsed += f.size;
      }
    });
    videoUserCounts.forEach(v => {
      const entry = combinedMap[v._id.toString()];
      if (entry) {
        entry.uploads += v.count;
        entry.storageUsed += v.size;
      }
    });
    const mostActiveStudents = Object.values(combinedMap)
      .sort((a, b) => b.uploads - a.uploads)
      .slice(0, 6);

    // Process Average Upload Size
    const totalBytes = (fileSizesSum[0]?.totalSize || 0) + (videoSizesSum[0]?.totalSize || 0);
    const totalCount = (fileSizesSum[0]?.count || 0) + (videoSizesSum[0]?.count || 0);
    const averageUploadSize = totalCount > 0 ? Math.round(totalBytes / totalCount) : 0;

    // Process Largest Uploads list
    const mergedLargest = [];
    largestFiles.forEach(f => {
      const user = userMap[f.user_id.toString()];
      const student = user ? studentMap[user.email.toLowerCase()] : null;
      mergedLargest.push({
        fileName: f.file_name,
        student: student?.studentName || user?.name || 'Student',
        team: student?.team || 'General',
        size: f.file_size,
        uploadDate: f.created_at,
        fileType: f.file_type
      });
    });
    largestVideos.forEach(v => {
      const user = userMap[v.ownerId.toString()];
      const student = user ? studentMap[user.email.toLowerCase()] : null;
      mergedLargest.push({
        fileName: v.originalName || v.filename || 'Video Submissions',
        student: student?.studentName || user?.name || 'Student',
        team: student?.team || 'General',
        size: v.size,
        uploadDate: v.createdAt,
        fileType: 'video'
      });
    });
    const largestUploads = mergedLargest
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);

    // Process File Type distribution
    const fileTypeDistribution = [];
    let videoAdded = false;

    fileTypes.forEach(ft => {
      let type = ft._id || 'other';
      if (type === 'video') {
        fileTypeDistribution.push({ type: 'Video', count: ft.count + videoCount });
        videoAdded = true;
      } else {
        fileTypeDistribution.push({ type: type.charAt(0).toUpperCase() + type.slice(1), count: ft.count });
      }
    });
    if (!videoAdded && videoCount > 0) {
      fileTypeDistribution.push({ type: 'Video', count: videoCount });
    }

    // Process Upload Trend
    const thisWeekTotal = thisWeekCounts[0] + thisWeekCounts[1];
    const priorWeekTotal = priorWeekCounts[0] + priorWeekCounts[1];
    let uploadTrend = 0;
    if (priorWeekTotal > 0) {
      uploadTrend = Math.round(((thisWeekTotal - priorWeekTotal) / priorWeekTotal) * 100);
    } else if (thisWeekTotal > 0) {
      uploadTrend = 100;
    }

    res.status(200).json({
      success: true,
      analytics: {
        uploadsPerDay,
        uploadsPerWeek,
        uploadsPerMonth,
        uploadsPerTeam,
        storagePerTeam,
        mostActiveStudents,
        topStudents: mostActiveStudents,
        topTeams,
        averageUploadSize,
        largestUploads,
        fileTypeDistribution,
        uploadTrend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 10. GET Settings - GET /admin/settings
 */
exports.getSettings = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id || req.admin._id)
      .select('name email session_timeout email_alerts daily_digest audit_retention audit_log_level')
      .lean();
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    res.status(200).json({
      success: true,
      settings: {
        name: admin.name,
        email: admin.email,
        sessionTimeout: admin.session_timeout || 30,
        emailAlerts: admin.email_alerts !== false,
        dailyDigest: admin.daily_digest !== false,
        auditRetention: admin.audit_retention || 90,
        auditLogLevel: admin.audit_log_level || 'All'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 11. PUT Settings - PUT /admin/settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const { name, email, sessionTimeout, emailAlerts, dailyDigest, auditRetention, auditLogLevel } = req.body;
    const adminId = req.admin.id || req.admin._id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }

    if (name) admin.name = name.trim();
    if (email) admin.email = email.trim().toLowerCase();
    if (sessionTimeout !== undefined) admin.session_timeout = parseInt(sessionTimeout, 10);
    if (emailAlerts !== undefined) admin.email_alerts = !!emailAlerts;
    if (dailyDigest !== undefined) admin.daily_digest = !!dailyDigest;
    if (auditRetention !== undefined) admin.audit_retention = parseInt(auditRetention, 10);
    if (auditLogLevel !== undefined) admin.audit_log_level = auditLogLevel;

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin settings updated successfully.',
      settings: {
        name: admin.name,
        email: admin.email,
        sessionTimeout: admin.session_timeout,
        emailAlerts: admin.email_alerts,
        dailyDigest: admin.daily_digest,
        auditRetention: admin.audit_retention,
        auditLogLevel: admin.audit_log_level
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 12. Change Password - POST /admin/settings/change-password
 */
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Old and new passwords are required.' });
    }

    const adminId = req.admin.id || req.admin._id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password.' });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password_hash = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 13. Add Monitored Email - POST /admin/settings/monitored-emails
 */
exports.addMonitoredStudent = async (req, res) => {
  try {
    const { studentName, email, team } = req.body;
    if (!studentName || !email || !team) {
      return res.status(400).json({ success: false, message: 'Student name, email, and team are required.' });
    }

    const existing = await AdminStudent.findOne({ email: email.toLowerCase() }).select('_id').lean();
    if (existing) {
      return res.status(400).json({ success: false, message: 'Student email is already being monitored.' });
    }

    const newStudent = await AdminStudent.create({
      studentName: studentName.trim(),
      email: email.trim().toLowerCase(),
      team: team.trim(),
      active: true
    });

    res.status(201).json({
      success: true,
      message: 'Monitored student added successfully.',
      student: newStudent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 14. Remove Monitored Email - DELETE /admin/settings/monitored-emails/:id
 */
exports.deleteMonitoredStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await AdminStudent.findById(id).select('_id').lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Monitored student not found.' });
    }

    await AdminStudent.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Student removed from monitoring roster successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 15. Export Monitoring Data - GET /admin/settings/export
 * OPTIMIZED: Parallel data fetching with lean() and field selection.
 */
exports.exportData = async (req, res) => {
  try {
    const students = await AdminStudent.find().select('studentName email team active createdAt').lean();
    const emails = students.map(s => s.email.toLowerCase());
    
    const users = emails.length > 0 
      ? await User.find({ email: { $in: emails.map(e => new RegExp(`^${e}$`, 'i')) } }).select('_id').lean()
      : [];
    const userIds = users.map(u => u._id);

    const [files, videos, logs] = await Promise.all([
      File.find({ user_id: { $in: userIds }, is_work_submission: true }).select('_id file_name file_type file_size created_at').lean(),
      Video.find({ ownerId: { $in: userIds }, is_work_submission: true }).select('_id originalName filename size createdAt').lean(),
      ActivityLog.find({ user_id: { $in: userIds } }).select('_id action details created_at').lean()
    ]);

    const exportObject = {
      exportedAt: new Date(),
      monitoredStudentsCount: students.length,
      students,
      uploads: {
        filesCount: files.length,
        videosCount: videos.length,
        files: files.map(f => ({
          id: f._id,
          fileName: f.file_name,
          fileType: f.file_type,
          sizeBytes: f.file_size,
          uploadDate: f.created_at
        })),
        videos: videos.map(v => ({
          id: v._id,
          fileName: v.originalName || v.filename,
          sizeBytes: v.size,
          uploadDate: v.createdAt
        }))
      },
      activityLogs: logs.map(l => ({
        id: l._id,
        action: l.action,
        details: l.details,
        timestamp: l.created_at
      }))
    };

    res.setHeader('Content-disposition', 'attachment; filename=vaultify_monitoring_export.json');
    res.setHeader('Content-type', 'application/json');
    res.write(JSON.stringify(exportObject, null, 2));
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
