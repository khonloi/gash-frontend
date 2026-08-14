import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tv, ArrowLeft, Video, Info, ShoppingBag, X } from 'lucide-react';
import Api from '../../common/SummaryAPI';
import { useToast } from '../../hooks/useToast';
import LiveStreamComments from './LiveStreamComments';
import LiveStreamProducts from './LiveStreamProducts';
import { formatDateTime } from '../../utils/formatters';
import { useLiveStreamRoom } from './hooks/useLiveStreamRoom';
import { storage } from '../../utils/storage';

const LiveStreamDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [selectedStream, setSelectedStream] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showComments, setShowComments] = useState(true);
    const [showProducts] = useState(true);
    const [showInfo, setShowInfo] = useState(true);

    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const hasJoinedRef = useRef(false);

    // Sub-hook for LiveKit Room management
    const {
        connectionState,
        streamEnded,
        setStreamEnded,
        remoteParticipants,
        connectToLiveKit,
        disconnectFromLiveKit,
    } = useLiveStreamRoom({
        showToast,
        videoRef,
        onStreamEnded: () => {
            setSelectedStream((prev) => (prev ? { ...prev, status: 'ended' } : null));
        },
    });

    // Load stream details
    useEffect(() => {
        const loadStream = async () => {
            try {
                setIsLoading(true);
                const token = storage.getToken();
                if (!token) {
                    showToast('Please login to view livestream', 'error');
                    navigate('/');
                    return;
                }

                const response = await Api.livestream.join({ livestreamId: id });

                if (response.data?.success) {
                    const streamData = response.data.data;

                    if (streamData.status !== 'live') {
                        showToast('Livestream has ended', 'info');
                        setStreamEnded(true);
                        setSelectedStream(streamData);
                        return;
                    }

                    setSelectedStream(streamData);
                    hasJoinedRef.current = true;

                    await connectToLiveKit(streamData.roomName, streamData.viewerToken);
                    showToast('Joined livestream!', 'success');
                } else {
                    showToast('Livestream not found', 'error');
                    navigate('/');
                }
            } catch (error) {
                console.error('Error loading stream:', error);
                showToast('Error loading livestream', 'error');
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        };

        loadStream();
    }, [id, connectToLiveKit, navigate, setStreamEnded, showToast]);

    const leaveLivestream = useCallback(async () => {
        try {
            if (hasJoinedRef.current && selectedStream?._id) {
                try {
                    await Api.livestream.leave({ livestreamId: selectedStream._id });
                    hasJoinedRef.current = false;
                } catch (apiError) {
                    console.error('Error calling leave API:', apiError);
                }
            }
            await disconnectFromLiveKit();
            showToast('Left livestream', 'info');
        } catch (error) {
            console.error('Error leaving livestream:', error);
        }
    }, [disconnectFromLiveKit, selectedStream?._id, showToast]);

    const goBack = useCallback(() => {
        leaveLivestream();
        navigate('/');
    }, [leaveLivestream, navigate]);

    useEffect(() => {
        return () => {
            if (hasJoinedRef.current && selectedStream?._id) {
                Api.livestream.leave({ livestreamId: selectedStream._id }).catch(console.error);
                hasJoinedRef.current = false;
            }
        };
    }, [selectedStream?._id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 mx-auto mb-6"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-red-500 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                    </div>
                    <p className="text-gray-300 text-lg font-medium">Loading livestream...</p>
                    <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
                </div>
            </div>
        );
    }

    if (streamEnded) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
                <div className="text-center text-white max-w-md">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-sm border border-red-500/30">
                            <Tv className="w-12 h-12 text-red-400" />
                        </div>
                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping opacity-20"></div>
                    </div>
                    <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Livestream has ended
                    </h3>
                    <p className="text-gray-400 mb-8 text-lg">Thank you for watching!</p>
                    <button
                        type="button"
                        onClick={goBack}
                        className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/50 font-medium"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    if (!selectedStream) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
                <div className="text-center text-white max-w-md">
                    <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-sm border border-gray-600/50">
                        <Tv className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Livestream not found
                    </h3>
                    <p className="text-gray-400 mb-8">The livestream you're looking for doesn't exist or has been removed.</p>
                    <button
                        type="button"
                        onClick={goBack}
                        className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/50 font-medium"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black"
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Video Modal - Full Screen */}
            <div
                className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black z-50 flex items-center justify-center p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
            >
                <div
                    className={`relative bg-black/90 backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-500 shadow-2xl border border-gray-800/50 ${
                        showInfo ? 'ml-80' : ''
                    } ${
                        showComments && showProducts
                            ? 'mr-[640px]'
                            : showComments
                            ? 'mr-[352px]'
                            : showProducts
                            ? 'mr-[288px]'
                            : ''
                    }`}
                    style={{
                        width:
                            showInfo && showComments && showProducts
                                ? 'min(calc(100vw - 960px), calc((100vh - 2rem) * 9 / 16))'
                                : showInfo && showComments
                                ? 'min(calc(100vw - 672px), calc((100vh - 2rem) * 9 / 16))'
                                : showInfo && showProducts
                                ? 'min(calc(100vw - 608px), calc((100vh - 2rem) * 9 / 16))'
                                : showInfo
                                ? 'min(calc(100vw - 340px), calc((100vh - 2rem) * 9 / 16))'
                                : showComments && showProducts
                                ? 'min(calc(100vw - 640px), calc((100vh - 2rem) * 9 / 16))'
                                : showComments
                                ? 'min(calc(100vw - 372px), calc((100vh - 2rem) * 9 / 16))'
                                : showProducts
                                ? 'min(calc(100vw - 308px), calc((100vh - 2rem) * 9 / 16))'
                                : 'min(90vw, calc((100vh - 2rem) * 9 / 16))',
                        aspectRatio: '9/16',
                        maxWidth: '90vw',
                        maxHeight: 'calc(100vh - 2rem)',
                    }}
                    ref={containerRef}
                    onClick={(e) => {
                        const target = e.target;
                        if (
                            target.tagName === 'BUTTON' ||
                            target.closest('button') ||
                            target.tagName === 'SVG' ||
                            target.closest('svg')
                        ) {
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        }
                    }}
                    onMouseDown={(e) => {
                        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }}
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        controls={false}
                        muted={false}
                        className="w-full h-full object-cover cursor-pointer"
                        style={{ backgroundColor: '#000' }}
                        onError={(e) => console.error('Video error:', e)}
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    />

                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={goBack}
                        aria-label="Back to Home"
                        className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-black/80 transition-all duration-300 z-50 border border-white/10 shadow-lg hover:scale-110 transform"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    {/* Status & Viewers */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                        <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border transition-all duration-300 shadow-lg ${
                                connectionState === 'connected'
                                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white border-red-500/50 animate-pulse'
                                    : connectionState === 'connecting'
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-500/50'
                                    : connectionState === 'error'
                                    ? 'bg-gradient-to-r from-red-700 to-red-800 text-white border-red-600/50'
                                    : 'bg-gray-700/80 text-white border-gray-600/50'
                            }`}
                        >
                            <div
                                className={`w-2 h-2 rounded-full ${
                                    connectionState === 'connected'
                                        ? 'bg-white animate-ping'
                                        : connectionState === 'connecting'
                                        ? 'bg-white animate-pulse'
                                        : 'bg-white'
                                }`}
                            ></div>
                            <span>
                                {connectionState === 'connected'
                                    ? 'LIVE'
                                    : connectionState === 'connecting'
                                    ? 'CONNECTING'
                                    : connectionState === 'error'
                                    ? 'ERROR'
                                    : 'ENDED'}
                            </span>
                        </div>

                        {selectedStream && (
                            <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border border-white/10 shadow-lg">
                                <Video className="w-4 h-4 text-blue-400" />
                                <span className="text-white font-semibold">{remoteParticipants.length}</span>
                                <span className="text-xs text-gray-300">viewers</span>
                            </div>
                        )}
                    </div>

                    {/* Ended Overlay */}
                    {connectionState !== 'connected' && !streamEnded && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center">
                            <div className="text-center text-white">
                                <div className="relative mb-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-full flex items-center justify-center mx-auto backdrop-blur-md border border-gray-600/30">
                                        <Tv className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <div className="absolute inset-0 bg-gray-500/20 rounded-full animate-ping"></div>
                                </div>
                                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                    Livestream has ended
                                </h3>
                                <p className="text-gray-300 mb-6">Thank you for watching!</p>
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/50 font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Panel - Left side of Video */}
                {showInfo && selectedStream && (
                    <div className="fixed left-0 top-0 h-full w-80 bg-black/95 backdrop-blur-xl flex flex-col z-[40] shadow-2xl pointer-events-auto border-r border-gray-800/50">
                        <div className="bg-gradient-to-br from-black via-gray-900 to-black p-3 flex items-center justify-between border-b border-gray-700/50 shadow-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                                    <Info className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">Information</h3>
                                    <p className="text-white/70 text-[10px]">Livestream details</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowInfo(false)}
                                aria-label="Close information panel"
                                className="text-white hover:bg-white/20 p-1.5 rounded-full transition-all duration-300 hover:scale-110 transform border border-white/10"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-livestream">
                            {/* Title */}
                            <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-3 rounded-lg border border-blue-500/20">
                                <h2 className="text-white font-bold text-sm leading-tight">
                                    {selectedStream.title || 'Untitled Livestream'}
                                </h2>
                            </div>

                            {/* Description */}
                            {selectedStream.description && (
                                <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                                    <h4 className="text-blue-400 text-[10px] font-bold mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                        <Info className="w-2.5 h-2.5" />
                                        Description
                                    </h4>
                                    <p className="text-gray-300 text-xs leading-relaxed">
                                        {selectedStream.description}
                                    </p>
                                </div>
                            )}

                            {/* Host Info */}
                            {selectedStream.hostId && (
                                <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                                    <h4 className="text-blue-400 text-[10px] font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                        <Video className="w-2.5 h-2.5" />
                                        Host
                                    </h4>
                                    <div>
                                        <p className="text-white font-semibold text-xs">
                                            {selectedStream.hostId?.name || 'Unknown Host'}
                                        </p>
                                        {selectedStream.hostId?.email && (
                                            <p className="text-gray-400 text-[10px] mt-0.5">{selectedStream.hostId.email}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Stream Time */}
                            <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                                <h4 className="text-blue-400 text-[10px] font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                    <Tv className="w-2.5 h-2.5" />
                                    Stream Schedule
                                </h4>
                                <div className="space-y-2">
                                    {selectedStream.startTime && (
                                        <div className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                            <div>
                                                <span className="text-gray-400 text-[10px] block mb-0.5">Started</span>
                                                <p className="text-white text-xs font-medium">
                                                    {formatDateTime(selectedStream.startTime)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Products Panel - Right side of Video */}
                {showProducts && (
                    <div className={`fixed right-0 top-0 h-full ${showComments ? 'mr-[352px]' : ''} w-72 bg-black/95 backdrop-blur-xl flex flex-col z-[40] shadow-2xl pointer-events-auto border-l border-gray-800/50`}>
                        <div className="bg-gradient-to-br from-black via-gray-900 to-black p-3 flex items-center justify-between border-b border-gray-700/50 shadow-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                                    <ShoppingBag className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">Products</h3>
                                    <p className="text-white/70 text-[10px]">Featured items</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 scrollbar-livestream">
                            <LiveStreamProducts key={`products-${selectedStream?._id || id}-${showProducts}`} liveId={selectedStream?._id || id} />
                        </div>
                    </div>
                )}

                {/* Comments Panel */}
                {(selectedStream?._id || id) && (
                    <LiveStreamComments
                        liveId={selectedStream?._id || id}
                        hostId={selectedStream?.hostId?._id || selectedStream?.hostId}
                        isVisible={showComments}
                        onToggle={() => setShowComments(!showComments)}
                    />
                )}
            </div>
        </div>
    );
};

export default LiveStreamDetail;