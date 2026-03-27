/**
 * Resizes an image file to a maximum width while maintaining aspect ratio.
 * returns a new File object (JPEG format).
 */
export async function resizeImage(file: File, maxWidth: number = 800): Promise<File> {
    return new Promise((resolve, reject) => {
      // If it's not an image, return as is
      if (!file.type.startsWith('image/')) {
        return resolve(file);
      }
  
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
  
          // Only resize if the width exceeds maxWidth
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else {
            // No resize needed, but we'll still go through canvas to optimize/convert
          }
  
          canvas.width = width;
          canvas.height = height;
  
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Could not get canvas context'));
          }
  
          ctx.drawImage(img, 0, 0, width, height);
  
          // Convert to blob and then to File
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const resizedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
              } else {
                reject(new Error('Canvas toBlob failed'));
              }
            },
            'image/jpeg',
            0.8 // Quality 0.8 is usually sufficient and saves a lot of space
          );
        };
        img.onerror = () => reject(new Error('Image loading failed'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
    });
  }
