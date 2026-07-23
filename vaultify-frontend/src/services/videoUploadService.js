const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const activeUploads = {}; // taskId -> { xhr, aborted: boolean }
const uploadCache = {}; // taskId -> { videoId, uploadId, completedParts: [{ partNumber, etag }], partUrls, chunkSize, objectKey }

const calculateSpeedAndETA = (loaded, total, startTime) => {
  const elapsed = (Date.now() - startTime) / 1000; // seconds
  if (elapsed <= 0) return { speed: 0, eta: 0 };
  const speed = loaded / elapsed; // bytes/sec
  const remainingBytes = total - loaded;
  const eta = speed > 0 ? Math.ceil(remainingBytes / speed) : 0;
  return { speed, eta };
};

const uploadPart = (taskId, url, chunk, partNumber, onPartProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (!activeUploads[taskId]) {
      activeUploads[taskId] = { xhr, aborted: false };
    } else {
      activeUploads[taskId].xhr = xhr;
    }

    xhr.open('PUT', url);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onPartProgress(event.loaded);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        let etag = xhr.getResponseHeader('ETag');
        if (etag) {
          etag = etag.replace(/"/g, ''); // clean surrounding quotes
        }
        resolve({ partNumber, etag });
      } else {
        reject(new Error(`Part ${partNumber} upload failed. status: ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error(`Network error on part ${partNumber}`));
    };

    xhr.onabort = () => {
      reject(new Error('aborted'));
    };

    // Wrap chunk in a new Blob with an empty type string to prevent the browser 
    // from automatically adding a Content-Type header which invalidates S3 signatures.
    const cleanChunk = new Blob([chunk], { type: '' });
    xhr.send(cleanChunk);
  });
};

export const videoUploadService = {
  uploadVideo: async (task, options = {}) => {
    const { onProgress, onComplete, onError } = options;
    const startTime = Date.now();
    const token = localStorage.getItem('vaultify_token');

    // 1. Get or create session
    let session = uploadCache[task.id];
    let videoId = session ? session.videoId : null;
    let uploadId = session ? session.uploadId : null;
    let completedParts = session ? session.completedParts : [];
    let partUrls = session ? session.partUrls : [];
    let chunkSize = session ? session.chunkSize : 10 * 1024 * 1024;
    let objectKey = session ? session.objectKey : null;

    try {
      if (!session) {
        // Initiate upload session on backend
        const initRes = await fetch(`${API_URL}/videos/initiate-upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filename: task.file.name,
            mimeType: task.file.type || 'video/mp4',
            size: task.file.size,
            folderId: task.folderId,
            uploadBatchId: task.uploadBatchId,
            relative_path: task.relativePath || null,
            upload_group_id: task.uploadGroupId || null
          })
        });

        if (!initRes.ok) {
          const errData = await initRes.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to initiate video upload session.');
        }

        const initData = await initRes.json();
        const data = initData.data;
        videoId = data.videoId;
        uploadId = data.uploadId;
        partUrls = data.urls || data.partUrls;
        chunkSize = data.chunkSize || 10 * 1024 * 1024; // default 10MB
        objectKey = data.objectKey || data.s3Key;

        session = {
          videoId,
          uploadId,
          completedParts: [],
          partUrls,
          chunkSize,
          objectKey
        };
        uploadCache[task.id] = session;
      }

      // Initialize active upload tracking
      if (!activeUploads[task.id]) {
        activeUploads[task.id] = { xhr: null, aborted: false };
      }

      // Calculate already uploaded bytes from completed parts
      let prevUploadedBytes = completedParts.reduce((acc, part) => {
        const start = (part.partNumber - 1) * chunkSize;
        const end = Math.min(part.partNumber * chunkSize, task.file.size);
        return acc + (end - start);
      }, 0);

      // 2. Upload parts sequentially
      for (const part of partUrls) {
        if (activeUploads[task.id]?.aborted) {
          throw new Error('aborted');
        }

        // Skip already uploaded parts (for chunk-level retries)
        const isCompleted = completedParts.some(p => p.partNumber === part.partNumber);
        if (isCompleted) {
          continue;
        }

        const start = (part.partNumber - 1) * chunkSize;
        const end = Math.min(part.partNumber * chunkSize, task.file.size);
        const chunk = task.file.slice(start, end);

        let partUploadedBytes = 0;

        const result = await uploadPart(
          task.id,
          part.url,
          chunk,
          part.partNumber,
          (loaded) => {
            partUploadedBytes = loaded;
            const currentTotalLoaded = prevUploadedBytes + partUploadedBytes;
            const percent = Math.min(Math.round((currentTotalLoaded / task.file.size) * 100), 99);
            const { speed, eta } = calculateSpeedAndETA(currentTotalLoaded, task.file.size, startTime);
            if (onProgress) {
              onProgress({ progress: percent, speed, eta });
            }
          }
        );

        completedParts.push(result);
        prevUploadedBytes += (end - start);
        session.completedParts = completedParts; // save completed chunk state
      }

      // 3. Complete Multipart Upload
      const completeRes = await fetch(`${API_URL}/videos/complete-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoId,
          uploadId,
          objectKey,
          parts: completedParts,
          folderId: task.folderId,
          filename: task.file.name,
          mimeType: task.file.type || 'video/mp4',
          size: task.file.size,
          uploadBatchId: task.uploadBatchId,
          relative_path: task.relativePath || null,
          upload_group_id: task.uploadGroupId || null
        })
      });

      if (!completeRes.ok) {
        const errData = await completeRes.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to complete video upload.');
      }

      const completeData = await completeRes.json();
      const fileData = completeData.data?.video || completeData.data;

      // Clean up maps upon success
      delete uploadCache[task.id];
      delete activeUploads[task.id];

      if (onComplete) {
        onComplete(fileData);
      }
    } catch (err) {
      const isAbort = err.message === 'aborted';

      if (isAbort) {
        // Clean up maps and notify backend on cancellation
        delete uploadCache[task.id];
        delete activeUploads[task.id];
        if (videoId && uploadId) {
          fetch(`${API_URL}/videos/abort-upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ videoId, uploadId, objectKey })
          }).catch(() => {});
        }
      }

      if (onError) {
        onError(err, isAbort);
      }
    }
  },

  cancelUpload: (taskId) => {
    const active = activeUploads[taskId];
    if (active) {
      active.aborted = true;
      if (active.xhr) {
        active.xhr.abort();
      }
    }
  }
};
