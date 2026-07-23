import { useState } from 'react';
import { shareService } from '../services/shareService';

export function useVideoShare() {
  const [activeItem, setActiveItem] = useState(null); // { id, name, type: 'video' | 'folder' }
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const openShare = async (item) => {
    setActiveItem(item);
    setShareLink('');
    setCopied(false);
    setError('');
    setLoading(true);

    try {
      let result;
      if (item.type === 'folder') {
        // Determine if this is a regular (Work) folder or a VideoFolder
        const isWorkFolder = item.folder_name || item.parent_folder_id || item.user_id || item.isWorkFolder;
        
        if (isWorkFolder) {
          // Regular folder — use POST /share with folder_id
          result = await shareService.shareFile(null, item.id);
          if (result && result.share_link) {
            const parts = result.share_link.split('/');
            const token = parts[parts.length - 1];
            setShareLink(`${window.location.origin}/share/${token}`);
          } else {
            throw new Error('Link generation failed.');
          }
        } else {
          // VideoFolder — use POST /videos/share
          result = await shareService.shareFolder(item.id);
          if (result && result.share_link) {
            const parts = result.share_link.split('/');
            const token = parts[parts.length - 1];
            setShareLink(`${window.location.origin}/share/${token}`);
          } else {
            throw new Error('Link generation failed.');
          }
        }
      } else {
        const isVideo = item.videoFolderId !== undefined || (item.mimeType && item.mimeType.startsWith('video/')) || ['mp4', 'mov', 'webm', 'mkv', 'avi'].includes((item.name || '').split('.').pop().toLowerCase());
        
        if (isVideo) {
          const token = localStorage.getItem('vaultify_token');
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const res = await fetch(`${API_URL}/videos/${item.id}/share`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (!res.ok) {
            throw new Error('Failed to generate permanent share link.');
          }
          const data = await res.json();
          if (data && data.shareUrl) {
            const parts = data.shareUrl.split('/');
            const shareToken = parts[parts.length - 1];
            setShareLink(`${window.location.origin}/share/${shareToken}`);
          } else {
            throw new Error('Link generation failed.');
          }
        } else {
          // Regular file sharing
          const result = await shareService.shareFile(item.id);
          if (result && result.share_link) {
            const parts = result.share_link.split('/');
            const shareToken = parts[parts.length - 1];
            setShareLink(`${window.location.origin}/share/${shareToken}`);
          } else {
            throw new Error('Link generation failed.');
          }
        }
      }
    } catch (e) {
      setError(e.message || 'Failed to generate share link.');
    } finally {
      setLoading(false);
    }
  };

  const closeShare = () => {
    setActiveItem(null);
    setShareLink('');
    setCopied(false);
  };

  const copyToClipboard = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return {
    activeItem,
    shareLink,
    loading,
    copied,
    error,
    openShare,
    closeShare,
    copyToClipboard,
  };
}
