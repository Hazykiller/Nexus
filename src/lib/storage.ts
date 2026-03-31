import cloudinary from './cloudinary';

export async function uploadFile(file: File): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'nexus_uploads' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error('Failed to upload file to Cloudinary'));
            return;
          }
          resolve(result?.secure_url as string);
        }
      );
      
      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('File processing error:', error);
    throw new Error('Failed to process file locally before upload');
  }
}

export async function deleteFile(publicUrl: string): Promise<void> {
  try {
    // Basic extraction if it's a cloudinary URL
    if (!publicUrl.includes('cloudinary.com')) return;
    
    // Extract public ID from the URL roughly
    const parts = publicUrl.split('/');
    const filenameWithExt = parts[parts.length - 1];
    const publicId = 'nexus_uploads/' + filenameWithExt.split('.')[0];
    
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
}
