import React from 'react';

const ImageModal = ({ selectedImage, onClose }) => {
    if (!selectedImage) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4"
            onClick={onClose}
        >
            <div className="relative max-w-2xl max-h-[80vh] animate-fadeIn">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="absolute top-3 right-3 text-white hover:text-gray-300 text-2xl font-bold z-10 bg-black/50 rounded-full w-8 h-8 flex items-center justify-center"
                >
                    ×
                </button>
                <img
                    src={selectedImage.src}
                    alt={selectedImage.alt}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                />
                <div
                    className="absolute bottom-3 left-3 right-3 text-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <p className="text-white text-sm font-medium bg-black/50 rounded-lg px-3 py-1">
                        {selectedImage.alt}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ImageModal;
