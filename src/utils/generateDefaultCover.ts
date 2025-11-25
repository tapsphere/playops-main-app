/**
 * Generate a default cover image for a game template
 * Black background with creator logo/profile image or name in center
 */
export const generateDefaultCover = async (
  creatorName: string,
  logoUrl?: string,
  avatarUrl?: string
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // If we have a logo or avatar, draw it
  if (logoUrl || avatarUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = (logoUrl || avatarUrl)!;
      });

      // Calculate size to fit nicely (max 400px)
      const maxSize = 400;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }

      // Center the image
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;

      // Draw with rounded corners if avatar
      if (!logoUrl && avatarUrl) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x, y, width, height);
        ctx.restore();
      } else {
        ctx.drawImage(img, x, y, width, height);
      }
    } catch (error) {
      console.error('Error loading image:', error);
      // Fall through to text rendering
    }
  }

  // If no image or image failed, use creator name
  if (!logoUrl && !avatarUrl) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 64px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add some subtle glow
    ctx.shadowColor = '#00FF00';
    ctx.shadowBlur = 20;
    
    ctx.fillText(creatorName, canvas.width / 2, canvas.height / 2);
  }

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/png');
  });
};
