require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const AdminStudent = require('../src/models/AdminStudent');
const User = require('../src/models/User');
const File = require('../src/models/File');
const Video = require('../src/models/Video');
const { deleteFile } = require('../src/services/s3Service');

async function removeCloudUploads() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Finding students belonging to team "Cloud"...');
    const cloudStudents = await AdminStudent.find({ team: { $regex: /^cloud$/i } }).lean();
    console.log(`Found ${cloudStudents.length} students in Cloud team.`);

    const emails = cloudStudents.map(s => s.email.toLowerCase());
    
    // Also include any fallback search for users directly with team or matching emails
    const cloudUsers = await User.find({ 
      $or: [
        { email: { $in: emails } },
        { team: { $regex: /^cloud$/i } }
      ] 
    }).lean();

    const userIds = cloudUsers.map(u => u._id);
    console.log(`Matched ${userIds.length} user account(s).`);

    // 1. Delete Files
    const filesToDelete = await File.find({ user_id: { $in: userIds } }).lean();
    console.log(`Found ${filesToDelete.length} file(s) uploaded by Cloud team.`);

    for (const file of filesToDelete) {
      if (file.s3_key) {
        try {
          await deleteFile(file.s3_key);
        } catch (err) {
          console.warn(`Failed to delete S3/local file key "${file.s3_key}":`, err.message);
        }
      }
      await File.deleteOne({ _id: file._id });
    }

    // 2. Delete Videos
    const videosToDelete = await Video.find({ ownerId: { $in: userIds } }).lean();
    console.log(`Found ${videosToDelete.length} video(s) uploaded by Cloud team.`);

    for (const video of videosToDelete) {
      if (video.s3Key) {
        try {
          await deleteFile(video.s3Key);
        } catch (err) {
          console.warn(`Failed to delete S3/local video key "${video.s3Key}":`, err.message);
        }
      }
      await Video.deleteOne({ _id: video._id });
    }

    console.log('✅ Successfully removed all Cloud team demo uploads!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing Cloud team uploads:', error);
    process.exit(1);
  }
}

removeCloudUploads();
