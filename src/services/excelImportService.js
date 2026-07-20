const XLSX = require('xlsx');
const AdminStudent = require('../models/AdminStudent');

/**
 * Parses Excel buffer (.xlsx, .xls) and upserts student records into admin_students collection
 * @param {Buffer} buffer - Excel file buffer
 * @returns {Promise<Object>} Summary object { imported, updated, ignored, failed }
 */
async function parseAndImportExcel(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error('Invalid or empty Excel file provided.');
  }

  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (err) {
    throw new Error('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls document.');
  }

  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('Excel workbook contains no sheets.');
  }

  const firstSheet = workbook.Sheets[sheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

  let importedCount = 0;
  let updatedCount = 0;
  let ignoredCount = 0;
  let failedCount = 0;

  // Simple email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validRows = [];
  for (const row of rawRows) {
    try {
      const studentName = (
        row['Student Name'] || row['studentName'] || row['Name'] || row['name'] || row['STUDENT NAME'] || ''
      ).toString().trim();

      const email = (
        row['Email'] || row['email'] || row['Email Address'] || row['EMAIL'] || ''
      ).toString().trim().toLowerCase();

      const team = (
        row['Team'] || row['team'] || row['Domain'] || row['domain'] || row['TEAM'] || 'General'
      ).toString().trim();

      if (!studentName || !email || !emailRegex.test(email)) {
        ignoredCount++;
        continue;
      }

      validRows.push({ studentName, email, team });
    } catch (rowError) {
      failedCount++;
    }
  }

  if (validRows.length === 0) {
    return { imported: 0, updated: 0, ignored: ignoredCount, failed: failedCount };
  }

  // Pre-fetch all existing student emails in a single batch query
  const emails = validRows.map(r => r.email);
  const existingRecords = await AdminStudent.find({ email: { $in: emails } }).select('email').lean();
  const existingEmailSet = new Set(existingRecords.map(r => r.email.toLowerCase()));

  const bulkOps = [];
  for (const item of validRows) {
    if (existingEmailSet.has(item.email)) {
      bulkOps.push({
        updateOne: {
          filter: { email: item.email },
          update: { $set: { studentName: item.studentName, team: item.team, active: true } }
        }
      });
      updatedCount++;
    } else {
      bulkOps.push({
        insertOne: {
          document: {
            studentName: item.studentName,
            email: item.email,
            team: item.team,
            active: true
          }
        }
      });
      importedCount++;
    }
  }

  if (bulkOps.length > 0) {
    await AdminStudent.bulkWrite(bulkOps, { ordered: false });
  }

  return {
    imported: importedCount,
    updated: updatedCount,
    ignored: ignoredCount,
    failed: failedCount
  };
}

module.exports = {
  parseAndImportExcel
};
