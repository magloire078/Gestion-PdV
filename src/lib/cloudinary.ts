export const CLOUDINARY_CLOUD_NAME = "dmsrvtmry";
export const CLOUDINARY_UPLOAD_PRESET = "ml_default"; // À mettre à jour si différent

export async function uploadToCloudinary(file: File, folder?: string): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    if (folder) {
        formData.append("folder", folder);
    }

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Cloudinary upload failed:", errorData);
            throw new Error("Erreur lors de l'envoi à Cloudinary");
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Error in uploadToCloudinary:", error);
        return null;
    }
}
