export interface NanoBananaRequest {
    userImage: string; // Base64
    clothingImage: string; // Base64
    prompt?: string;
}

export interface NanoBananaResponse {
    generatedImage: string; // Base64 or URL
}

export class GenerationError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = 'GenerationError';
    }
}
