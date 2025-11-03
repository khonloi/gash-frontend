import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Api from '../../common/SummaryAPI';
import { useToast } from '../../hooks/useToast';
import {
    LiveTv,
    Fullscreen,
    FullscreenExit,
    Videocam,
    Chat,
    ArrowBack,
    ShoppingBag,
    Info
} from '@mui/icons-material';
import { LIVEKIT_CONFIG } from '../../config/livekit';
import LiveStreamComments from './LiveStreamComments';
import LiveStreamProducts from './LiveStreamProducts';

const LiveStreamDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [selectedStream, setSelectedStream] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showComments, setShowComments] = useState(true);
    const [showProducts, setShowProducts] = useState(true);
    const [showInfo, setShowInfo] = useState(true);
    const [connectionState, setConnectionState] = useState('disconnected');
    const [needsInteraction, setNeedsInteraction] = useState(false);
    const [streamEnded, setStreamEnded] = useState(false);
    const [_room, setRoom] = useState(null);

    const videoRef = useRef(null);
    const audioRef = useRef(null); // separate audio element to avoid replacing video stream
    const containerRef = useRef(null);
    const roomRef = useRef(null);
    const isReconnectingRef = useRef(false);
    const streamEndedRef = useRef(false);
    const socketRef = useRef(null);
    const lastConnectionRef = useRef({ roomName: null, token: null });
    const reconnectAttemptsRef = useRef(0);

    // Helper: Format date/time to dd/mm/yyyy HH:mm
    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch {
            return '';
        }
    };

    // Connect to LiveKit - moved before useEffect
    const connectToLiveKit = useCallback(async (roomName, viewerToken) => {
        if (isReconnectingRef.current) return;
        if (streamEndedRef.current) return;

        if (!roomName || !viewerToken) {
            showToast('Missing connection information', 'error');
            return;
        }

        if (typeof viewerToken !== 'string' || viewerToken.length < 10) {
            showToast('Invalid token', 'error');
            return;
        }

        if (!LIVEKIT_CONFIG.serverUrl || LIVEKIT_CONFIG.serverUrl.includes('your-livekit-server.com')) {
            showToast('LiveKit server not configured', 'error');
            return;
        }

        if (!LIVEKIT_CONFIG.serverUrl.startsWith('wss://') && !LIVEKIT_CONFIG.serverUrl.startsWith('ws://')) {
            showToast('Invalid LiveKit server URL', 'error');
            return;
        }

        const originalConsoleError = console.error;

        // Helper to safely play media and request user interaction when blocked
        const safePlay = (el) => {
            if (!el || typeof el.play !== 'function') return;
            const p = el.play();
            if (p && typeof p.catch === 'function') {
                p.catch((err) => {
                    const name = err?.name || '';
                    if (String(name).includes('NotAllowedError')) {
                        setNeedsInteraction(true);
                    }
                });
            }
        };

        try {
            isReconnectingRef.current = true;
            console.log('🔗 Connecting to LiveKit room:', roomName);
            setConnectionState('connecting');
            // Remember last successful params for reconnect
            lastConnectionRef.current = { roomName, token: viewerToken };

            const existingRoom = roomRef.current;
            if (existingRoom) {
                existingRoom.removeAllListeners();
                if (existingRoom.state !== 'disconnected') {
                    await existingRoom.disconnect();
                }
                await new Promise(resolve => setTimeout(resolve, 800));
                roomRef.current = null;
                setRoom(null);
            }

            const { Room, RoomEvent } = await import('livekit-client');

            const roomOptions = {
                adaptiveStream: true,
                dynacast: true,
                publishDefaults: {
                    videoEncoding: {
                        maxBitrate: 1_000_000,
                        maxFramerate: 30
                    },
                    red: false
                }
            };

            const newRoom = new Room(roomOptions);

            newRoom.on(RoomEvent.Connected, () => {
                console.log('✅ Connected to LiveKit room');
                setConnectionState('connected');

                // CRITICAL: Ensure video element is not muted (audio always enabled)
                if (videoRef.current) {
                    videoRef.current.muted = false;
                }

                // Subscribe to all remote tracks (video and audio)
                newRoom.remoteParticipants.forEach((participant) => {
                    participant.trackPublications.forEach((publication) => {
                        // Subscribe to the track if not already subscribed
                        if (!publication.isSubscribed) {
                            publication.setSubscribed(true);
                        }

                        // If track is available, attach it immediately
                        if (publication.track) {
                            if (publication.track.kind === 'video' && videoRef.current) {
                                publication.track.attach(videoRef.current);
                                // Keep muted to satisfy autoplay policies across browsers
                                videoRef.current.muted = true;
                                safePlay(videoRef.current);
                            } else if (publication.track.kind === 'audio' && audioRef.current) {
                                // attach audio to a dedicated audio element so we don't replace the video element's srcObject
                                publication.track.attach(audioRef.current);

                                // CRITICAL: Enable audio track
                                if (publication.track instanceof MediaStreamTrack) {
                                    publication.track.enabled = true;
                                }

                                // make sure audio element is playing
                                safePlay(audioRef.current);

                                console.log('✅ Audio track attached on connect', {
                                    trackId: publication.track.id,
                                    enabled: publication.track.enabled,
                                    muted: videoRef.current?.muted
                                });
                            }
                        }
                    });
                });

                // Keep video muted; audio is handled via separate audio element
            });

            // Handle transient reconnect
            newRoom.on(RoomEvent.Reconnecting, () => {
                console.log('↺ Reconnecting to LiveKit...');
                setConnectionState('connecting');
            });

            newRoom.on(RoomEvent.Reconnected, () => {
                console.log('✅ Reconnected to LiveKit');
                setConnectionState('connected');
            });

            newRoom.on(RoomEvent.Disconnected, async (reason) => {
                console.log('❌ Disconnected from LiveKit:', reason);
                setConnectionState('disconnected');
                setRoom(null);

                if (reason === 'SERVER_SHUTDOWN' || reason === 'ROOM_DELETED') {
                    showToast('Livestream has ended', 'info');
                    streamEndedRef.current = true;
                    setStreamEnded(true);
                    setSelectedStream(prev => prev ? { ...prev, status: 'ended' } : null);
                } else if (!streamEndedRef.current) {
                    // Attempt to auto reconnect with backoff
                    const attempt = (reconnectAttemptsRef.current || 0) + 1;
                    reconnectAttemptsRef.current = attempt;
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
                    setTimeout(() => {
                        if (streamEndedRef.current) return;
                        const { roomName: lastRoom, token } = lastConnectionRef.current || {};
                        if (!lastRoom || !token) return;
                        console.log(`↻ Reconnecting to LiveKit (attempt ${attempt})...`);
                        connectToLiveKit(lastRoom, token).catch(() => { });
                    }, delay);
                }
            });

            newRoom.on(RoomEvent.TrackSubscribed, (track) => {
                if (videoRef.current) {
                    if (track.kind === 'video') {
                        track.attach(videoRef.current);
                        setTimeout(() => {
                            if (videoRef.current) {
                                // Keep muted to allow autoplay
                                videoRef.current.muted = true;
                                safePlay(videoRef.current);
                            }
                        }, 100);
                    } else if (track.kind === 'audio') {
                        // Attach audio track to hidden audio element, not the video element
                        if (audioRef.current) {
                            track.attach(audioRef.current);
                        }

                        // CRITICAL: Ensure audio track is enabled
                        if (track instanceof MediaStreamTrack) {
                            track.enabled = true;
                        }

                        // Ensure audio element is playing
                        safePlay(audioRef.current);
                    }
                }
            });

            // Handle participant connected - subscribe to their tracks
            newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
                console.log('👤 Participant connected:', participant.identity);
                // Subscribe to all their tracks
                participant.trackPublications.forEach((publication) => {
                    if (!publication.isSubscribed) {
                        publication.setSubscribed(true);
                    }

                    // If audio track is already available, attach and enable it on the audio element
                    if (publication.track && publication.track.kind === 'audio' && audioRef.current) {
                        publication.track.attach(audioRef.current);
                        if (publication.track instanceof MediaStreamTrack) {
                            publication.track.enabled = true;
                        }
                        safePlay(audioRef.current);
                    }
                });
            });

            newRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
                if (videoRef.current) {
                    if (track.kind === 'video') {
                        track.detach(videoRef.current);
                    } else if (track.kind === 'audio' && audioRef.current) {
                        track.detach(audioRef.current);
                    }
                }
            });

            console.error = (...args) => {
                const message = args[0]?.toString() || '';
                if (message.includes('DataChannel error')) {
                    return;
                }
                originalConsoleError.apply(console, args);
            };

            const connectPromise = newRoom.connect(LIVEKIT_CONFIG.serverUrl, viewerToken);
            const timeoutPromise = new Promise((_, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error(`Connection timeout after 45 seconds`));
                }, 45000);
                connectPromise.then(() => clearTimeout(timeoutId)).catch(() => clearTimeout(timeoutId));
            });

            try {
                await Promise.race([connectPromise, timeoutPromise]);
            } catch (error) {
                try {
                    newRoom.removeAllListeners();
                    if (newRoom.state !== 'disconnected' && newRoom.state !== 'disconnecting') {
                        await Promise.race([
                            newRoom.disconnect(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Disconnect timeout')), 5000))
                        ]).catch(() => { });
                    }
                } catch (disconnectError) {
                    console.warn('Error during cleanup:', disconnectError.message);
                } finally {
                    if (roomRef.current === newRoom) {
                        roomRef.current = null;
                    }
                    setRoom(null);
                }
                throw error;
            }

            setRoom(newRoom);
            roomRef.current = newRoom;
            isReconnectingRef.current = false;
            console.error = originalConsoleError;
            reconnectAttemptsRef.current = 0;
            return newRoom;
        } catch (error) {
            if (typeof originalConsoleError !== 'undefined') {
                console.error = originalConsoleError;
            }
            setConnectionState('error');
            isReconnectingRef.current = false;

            if (error.message.includes('timeout')) {
                showToast('Connection timeout. Please check network', 'error');
            } else if (error.message.includes('token')) {
                showToast('Invalid or expired token', 'error');
            } else if (error.message.includes('server')) {
                showToast('Unable to connect to server', 'error');
            } else {
                showToast(`Connection error: ${error.message}`, 'error');
            }
            throw error;
        }
    }, [showToast]);

    // Responsive: detect mobile and update on resize
    useEffect(() => {
        const updateIsMobile = () => setIsMobile(window.matchMedia('(max-width: 640px)').matches);
        updateIsMobile();
        window.addEventListener('resize', updateIsMobile);
        return () => window.removeEventListener('resize', updateIsMobile);
    }, []);

    // Load stream details
    useEffect(() => {
        const loadStream = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    showToast('Please login to view livestream', 'error');
                    navigate('/live');
                    return;
                }

                const response = await Api.livestream.view({ livestreamId: id }, token);

                if (response.data?.success) {
                    const streamData = response.data.data;

                    if (streamData.status !== 'live') {
                        showToast('Livestream has ended', 'info');
                        setStreamEnded(true);
                        setSelectedStream(streamData);
                        return;
                    }

                    setSelectedStream(streamData);

                    // Auto-join livestream
                    await connectToLiveKit(streamData.roomName, streamData.viewerToken);
                    showToast('Joined livestream!', 'success');
                } else {
                    showToast('Livestream not found', 'error');
                    navigate('/live');
                }
            } catch (error) {
                console.error('Error loading stream:', error);
                showToast('Error loading livestream', 'error');
                navigate('/live');
            } finally {
                setIsLoading(false);
            }
        };

        loadStream();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, connectToLiveKit]);

    // Note: Reactions and Floating Reactions are now handled inside LiveStreamReactions component

    const disconnectFromLiveKit = useCallback(async () => {
        const roomToDisconnect = roomRef.current;
        if (!roomToDisconnect) return;

        try {
            roomToDisconnect.removeAllListeners();
            await new Promise(resolve => setTimeout(resolve, 300));

            if (roomToDisconnect.state !== 'disconnected') {
                await Promise.race([
                    roomToDisconnect.disconnect(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Disconnect timeout')), 5000))
                ]).catch(() => { });
            }
        } catch (error) {
            console.error('Error disconnecting:', error.message);
        } finally {
            if (roomRef.current === roomToDisconnect) {
                roomRef.current = null;
            }
            setRoom(null);
            setConnectionState('disconnected');
            isReconnectingRef.current = false;
        }
    }, []);

    const leaveLivestream = async () => {
        try {
            if (selectedStream?._id) {
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        await Api.livestream.leave({ livestreamId: selectedStream._id }, token);
                    } catch (apiError) {
                        console.error('Error calling leave API:', apiError);
                    }
                }
            }
            await disconnectFromLiveKit();
            showToast('Left livestream', 'info');
        } catch (error) {
            console.error('Error leaving livestream:', error);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Mute functionality removed

    const goBack = () => {
        leaveLivestream();
        navigate('/live');
    };

    useEffect(() => {
        const room = roomRef.current;
        const socket = socketRef.current;

        return () => {
            if (room) {
                room.disconnect().catch(console.error);
            }
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

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
                            <LiveTv className="w-12 h-12 text-red-400" />
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
                        Back to Live Streams
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
                        <LiveTv className="w-10 h-10 text-gray-400" />
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
                        Back to Live Streams
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
                    // Prevent default behavior for any clicks on background
                    if (e.target === e.currentTarget) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
            >
                <div
                    className={`relative bg-black/90 backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-500 shadow-2xl border border-gray-800/50 ${isMobile ? '' : (showInfo ? 'ml-80' : '')
                        } ${isMobile ? '' : (showComments && showProducts
                            ? 'mr-[640px]'
                            : showComments
                                ? 'mr-[352px]'
                                : showProducts
                                    ? 'mr-[288px]'
                                    : '')
                        }`}
                    style={{
                        width: isMobile
                            ? '100vw'
                            : (showInfo && showComments && showProducts
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
                                                        : 'min(90vw, calc((100vh - 2rem) * 9 / 16))'),
                        aspectRatio: '9/16',
                        maxWidth: isMobile ? '100vw' : '90vw',
                        maxHeight: isMobile ? '100vh' : 'calc(100vh - 2rem)'
                    }}
                    ref={containerRef}
                    onClick={(e) => {
                        // Prevent any navigation or reload from container clicks
                        const target = e.target;
                        if (target.tagName === 'BUTTON' || target.closest('button') || target.tagName === 'SVG' || target.closest('svg')) {
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        }
                    }}
                    onMouseDown={(e) => {
                        // Prevent any mouse down events on buttons from propagating
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
                            // Prevent video clicks from bubbling up
                            e.stopPropagation();
                        }}
                    />
                    {/* Hidden audio element to carry remote audio; prevents replacing the video element's srcObject */}
                    <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />

                    {needsInteraction && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <button
                                type="button"
                                className="px-6 py-3 rounded-xl bg-white/90 hover:bg-white text-black font-semibold shadow"
                                onClick={() => {
                                    const vp = videoRef.current?.play?.();
                                    if (vp && typeof vp.catch === 'function') vp.catch(() => undefined);
                                    const ap = audioRef.current?.play?.();
                                    if (ap && typeof ap.catch === 'function') ap.catch(() => undefined);
                                    setNeedsInteraction(false);
                                }}
                            >
                                Tap to play
                            </button>
                        </div>
                    )}

                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={goBack}
                        className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-black/80 transition-all duration-300 z-50 border border-white/10 shadow-lg hover:scale-110 transform"
                    >
                        <ArrowBack className="w-5 h-5" />
                    </button>

                    {/* Status & Viewers */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border transition-all duration-300 shadow-lg ${connectionState === 'connected'
                            ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white border-red-500/50 animate-pulse'
                            : connectionState === 'connecting'
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-500/50'
                                : connectionState === 'error'
                                    ? 'bg-gradient-to-r from-red-700 to-red-800 text-white border-red-600/50'
                                    : 'bg-gray-700/80 text-white border-gray-600/50'
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${connectionState === 'connected'
                                ? 'bg-white animate-ping'
                                : connectionState === 'connecting'
                                    ? 'bg-white animate-pulse'
                                    : 'bg-white'
                                }`}></div>
                            <span>
                                {connectionState === 'connected' ? 'LIVE' :
                                    connectionState === 'connecting' ? 'CONNECTING' :
                                        connectionState === 'error' ? 'ERROR' : 'ENDED'}
                            </span>
                        </div>

                        {selectedStream && (
                            <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border border-white/10 shadow-lg">
                                <Videocam className="w-4 h-4 text-blue-400" />
                                <span className="text-white font-semibold">{selectedStream.currentViewers !== undefined ? selectedStream.currentViewers : 0}</span>
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
                                        <LiveTv className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <div className="absolute inset-0 bg-gray-500/20 rounded-full animate-ping"></div>
                                </div>
                                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                    {connectionState === 'connecting' ? 'Reconnecting…' : 'Connecting…'}
                                </h3>
                                <p className="text-gray-300 mb-6">Please wait a moment</p>
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

                    {/* Controls */}
                    <div
                        className={`absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-10 ${isMobile ? 'gap-1' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
                            <button
                                type="button"
                                onClick={() => setShowInfo(!showInfo)}
                                className={`bg-black/60 backdrop-blur-md text-white ${isMobile ? 'p-2' : 'p-2.5'} rounded-full hover:bg-black/80 transition-all duration-300 border border-white/10 shadow-lg hover:scale-110 transform ${showInfo ? 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 border-blue-500/50' : ''
                                    }`}
                            >
                                <Info className="w-5 h-5" />
                            </button>
                        </div>

                        <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
                            <button
                                type="button"
                                onClick={() => setShowProducts(!showProducts)}
                                className={`bg-black/60 backdrop-blur-md text-white ${isMobile ? 'p-2' : 'p-2.5'} rounded-full hover:bg-black/80 transition-all duration-300 border border-white/10 shadow-lg hover:scale-110 transform ${showProducts ? 'bg-gradient-to-r from-green-600/80 to-emerald-600/80 border-green-500/50' : ''
                                    }`}
                            >
                                <ShoppingBag className="w-5 h-5" />
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowComments(!showComments)}
                                className={`bg-black/60 backdrop-blur-md text-white ${isMobile ? 'p-2' : 'p-2.5'} rounded-full hover:bg-black/80 transition-all duration-300 border border-white/10 shadow-lg hover:scale-110 transform ${showComments ? 'bg-gradient-to-r from-red-600/80 to-pink-600/80 border-red-500/50' : ''
                                    }`}
                            >
                                <Chat className="w-5 h-5" />
                            </button>

                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                className={`bg-black/60 backdrop-blur-md text-white ${isMobile ? 'p-2' : 'p-2.5'} rounded-full hover:bg-black/80 transition-all duration-300 border border-white/10 shadow-lg hover:scale-110 transform`}
                            >
                                {isFullscreen ? <FullscreenExit className="w-5 h-5" /> : <Fullscreen className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Panel - Left side of Video */}
                {!isMobile && showInfo && selectedStream && (
                    <div className="fixed left-0 top-0 h-full w-80 bg-black/95 backdrop-blur-xl flex flex-col z-[40] shadow-2xl pointer-events-auto border-r border-gray-800/50">
                        <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 p-3 flex items-center justify-between border-b border-gray-700/50 shadow-lg">
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
                                className="text-white hover:bg-white/20 p-1.5 rounded-full transition-all duration-300 hover:scale-110 transform border border-white/10"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
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
                                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                                        </svg>
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
                                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                        </svg>
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
                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
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
                                    {selectedStream.endTime && (
                                        <div className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                            <div>
                                                <span className="text-gray-400 text-[10px] block mb-0.5">Ended</span>
                                                <p className="text-white text-xs font-medium">
                                                    {formatDateTime(selectedStream.endTime)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Products Panel - Between Video and Comments */}
                {!isMobile && showProducts && (selectedStream?._id || id) && (
                    <div className={`fixed top-0 h-full w-[288px] bg-black/95 backdrop-blur-xl flex flex-col z-[40] shadow-2xl pointer-events-auto ${showComments ? 'right-[352px]' : 'right-0'
                        } border-l border-gray-800/50`}>
                        <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 p-3 flex items-center justify-between border-b border-gray-700/50 shadow-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                                    <ShoppingBag className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">Products</h3>
                                    <p className="text-white/70 text-[10px]">Featured items</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowProducts(false)}
                                className="text-white hover:bg-white/20 p-1.5 rounded-full transition-all duration-300 hover:scale-110 transform border border-white/10"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 scrollbar-livestream">
                            <LiveStreamProducts liveId={selectedStream?._id || id} />
                        </div>
                    </div>
                )}

                {/* Comments Panel */}
                {(selectedStream?._id || id) && (
                    <LiveStreamComments
                        liveId={selectedStream?._id || id}
                        hostId={selectedStream?.hostId?._id || selectedStream?.hostId}
                        isVisible={isMobile ? false : showComments}
                        onToggle={() => setShowComments(!showComments)}
                    />
                )}
            </div>
        </div>
    );
};

export default LiveStreamDetail;

