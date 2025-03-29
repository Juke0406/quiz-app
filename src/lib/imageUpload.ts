import { supabase } from './supabase';

export async function uploadImage(file: File) {
    try {
        // Generate a unique filename
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Validate file type
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
        if (!validImageTypes.includes(file.type)) {
            throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
        }

        // Validate file size (max 5MB)
        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSizeInBytes) {
            throw new Error('File size exceeds the maximum allowed (5MB).');
        }

        // Upload the file
        const { error: uploadError } = await supabase.storage
            .from('quiz-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type
            });

        if (uploadError) throw uploadError;

        // Get public URL for the uploaded image
        const { data } = supabase.storage
            .from('quiz-images')
            .getPublicUrl(filePath);

        if (!data.publicUrl) {
            throw new Error('Failed to get public URL for uploaded image');
        }

        console.log('Image uploaded successfully:', data.publicUrl);
        return { publicUrl: data.publicUrl, filePath };
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

export async function deleteImage(filePath: string) {
    try {
        const { error } = await supabase.storage
            .from('quiz-images')
            .remove([filePath]);

        if (error) throw error;

        console.log('Image deleted successfully:', filePath);
        return { success: true };
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
}

export async function verifyImage(file: File): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = URL.createObjectURL(file);
    });
}