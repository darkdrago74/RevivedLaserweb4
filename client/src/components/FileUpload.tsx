import React, { useCallback } from 'react';

interface FileUploadProps {
    onFileLoaded: (name: string, content: string | File, type: 'vector' | 'raster') => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded }) => {
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();

            if (file.type.includes('svg')) {
                reader.onload = (event) => {
                    const content = event.target?.result as string;
                    onFileLoaded(file.name, content, 'vector');
                };
                reader.readAsText(file);
            } else if (file.type.includes('image')) {
                // For raster, we might pass the file element or base64.
                // Backend needs path for sharp in current implementation?
                // Wait, backend 'generateRaster' takes 'imagePath'.
                // If we upload from browser, we need to UPLOAD it first or send base64.
                // Current plan says: /upload end point TO BE ADDED.
                // For now, let's assume we can pass base64 to generate? 
                // Backend CamService uses sharp(imagePath). Sharp can take Buffer.
                // So we should send file content as buffer/base64?
                // Let's defer Raster upload implementation until backend supports upload or buffer.
                // Focus on Vector (SVG string) for now.
                console.warn("Raster upload not fully implemented yet");
                onFileLoaded(file.name, file, 'raster'); // Just pass file for now
            }
        }
    }, [onFileLoaded]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{
                border: '2px dashed #666',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                color: '#aaa',
                cursor: 'pointer',
                marginBottom: '20px'
            }}
        >
            <p>Drag & Drop SVG or Image here</p>
        </div>
    );
};

export default FileUpload;
