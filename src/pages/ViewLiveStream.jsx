import React, { useState, useEffect, useRef, useCallback } from 'react';
import Api from '../common/SummaryAPI';
import { useToast } from '../hooks/useToast';
import {
    LiveTv,
    Fullscreen,
    FullscreenExit,
    VolumeUp,
    VolumeOff,
    Videocam,
    VideocamOff,
    ArrowBack,
    CropPortrait,
    CropLandscape
} from '@mui/icons-material';

import { LIVEKIT_CONFIG } from '../config/livekit';

const LiveStream = () => {
    const { showToast } = useToast();

    // State
    const [isLoading, setIsLoading] = useState(false);
    const [liveStreams, setLiveStreams] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [viewerCount, setViewerCount] = useState(0);
    const [hasUserClicked, setHasUserClicked] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [selectedStream, setSelectedStream] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [videoOrientation, setVideoOrientation] = useState('portrait'); // 'portrait' or 'landscape'

    // LiveKit states
    const [room, setRoom] = useState(null);
    const [connectionState, setConnectionState] = useState('disconnected');
    // eslint-disable-next-line no-unused-vars
    const [remoteParticipants, setRemoteParticipants] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [livekitError, setLivekitError] = useState(null);

    // Refs for video
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const roomRef = useRef(null); // Store room ref to prevent stale disconnect
    const isReconnectingRef = useRef(false); // Flag to prevent multiple simultaneous reconnects
    const streamEndedRef = useRef(false); // Flag to prevent reconnection when stream ended

    // Load live streams function
    const loadLiveStreams = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                showToast('Vui lòng đăng nhập để xem livestream', 'error');
                return;
            }

            const response = await Api.livestream.getLive(token);
            console.log('📡 API Response:', response);

            if (response.data?.success) {
                const streams = response.data?.data?.streams || [];
                console.log('📡 Streams found:', streams);
                setLiveStreams(streams);
                showToast(`Tải thành công ${streams.length} streams`, 'success');
            } else {
                console.log('📡 API Error:', response.data?.message || 'Unknown error');
                showToast(`API Error: ${response.data?.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            showToast(`Network Error: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    // Check stream status realtime function
    const checkStreamStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await Api.livestream.getLive(token);
            console.log('📡 Status check response:', response);

            if (response.data?.success) {
                const newStreams = response.data?.data?.streams || [];
                console.log('📡 New streams:', newStreams);
                console.log('📡 Current streams:', liveStreams);

                // Always update if there are new streams (for realtime detection)
                if (newStreams.length > 0) {
                    console.log('📡 Found live streams, updating...');
                    setLiveStreams(newStreams);
                } else if (liveStreams.length > 0 && newStreams.length === 0) {
                    console.log('📡 No more live streams, updating...');
                    setLiveStreams([]);
                }
            }
        } catch (error) {
            console.error('Error checking stream status:', error);
        }
    }, [liveStreams, setLiveStreams]);

    // Disconnect from LiveKit function
    const disconnectFromLiveKit = useCallback(async () => {
        if (room) {
            try {
                console.log('🔌 Disconnecting from LiveKit...');

                // Wait a bit before disconnecting to ensure all operations complete
                await new Promise(resolve => setTimeout(resolve, 500));

                await room.disconnect();
                setRoom(null);
                roomRef.current = null;
                setConnectionState('disconnected');
                setRemoteParticipants([]);
                console.log('✅ Disconnected from LiveKit');
            } catch (error) {
                console.error('❌ Error disconnecting from LiveKit:', error);
                // Force cleanup even if disconnect fails
                setRoom(null);
                roomRef.current = null;
                setConnectionState('disconnected');
                setRemoteParticipants([]);
            }
        }
    }, [room]);

    // Connect to LiveKit room
    const connectToLiveKit = useCallback(async (roomName, viewerToken) => {
        // Prevent multiple simultaneous connections
        if (isReconnectingRef.current) {
            console.log('🔄 Already reconnecting, skipping duplicate call');
            return;
        }

        // Don't connect if stream has ended
        if (streamEndedRef.current) {
            console.log('ℹ️ Stream has ended, skipping connection');
            return;
        }

        // Add global error handler to catch and ignore DataChannel errors
        const originalConsoleError = console.error;

        try {
            isReconnectingRef.current = true;
            setLivekitError(null);
            setConnectionState('connecting');

            // Validate inputs
            if (!roomName || !viewerToken) {
                throw new Error('Room name and token are required');
            }

            // Disconnect existing room first if any
            const existingRoom = roomRef.current || room;
            if (existingRoom) {
                console.log('🔌 Disconnecting existing room before creating new one...');
                try {
                    await existingRoom.disconnect();
                    // Wait a bit for cleanup
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error('Error disconnecting existing room:', error);
                }
            }

            // Dynamic import for livekit-client
            const { Room, RoomEvent } = await import('livekit-client');

            // Create room with optimized settings for viewer
            const roomOptions = {
                adaptiveStream: true,
                dynacast: true,
                // Minimal settings to prevent DataChannel errors
                publishDefaults: {
                    videoEncoding: {
                        maxBitrate: 1_000_000,
                        maxFramerate: 30
                    },
                    red: false
                }
            };

            const newRoom = new Room(roomOptions);

            // Set up event listeners
            newRoom.on(RoomEvent.Connected, () => {
                console.log('✅ Connected to LiveKit room');
                setConnectionState('connected');

                // Check host status after connection
                const checkHostStatus = () => {
                    if (!newRoom.participants) {
                        return;
                    }

                    const hostParticipant = Array.from(newRoom.participants.values()).find(p =>
                        p.identity.includes('Host') || p.identity.includes('host')
                    );

                    if (hostParticipant) {
                        console.log('👤 Host found:', hostParticipant.identity);

                        // Check video tracks
                        const videoTracks = Array.from(hostParticipant.videoTrackPublications.values());
                        if (videoTracks.length > 0) {
                            const videoTrack = videoTracks[0];
                            console.log('📹 Host video track:', { muted: videoTrack.isMuted, enabled: videoTrack.track?.enabled });
                        } else {
                            console.log('📹 Host has no video tracks');
                        }

                        // Check audio tracks
                        const audioTracks = Array.from(hostParticipant.audioTrackPublications.values());
                        if (audioTracks.length > 0) {
                            const audioTrack = audioTracks[0];
                            console.log('🎤 Host audio track:', { muted: audioTrack.isMuted, enabled: audioTrack.track?.enabled });
                        } else {
                            console.log('🎤 Host has no audio tracks');
                        }
                    } else {
                        console.log('⚠️ Host not found in room');
                    }
                };

                // Check immediately and after a delay
                checkHostStatus();
                setTimeout(checkHostStatus, 1000);
            });

            newRoom.on(RoomEvent.Disconnected, async (reason) => {
                console.log('❌ Disconnected from LiveKit room:', reason);
                setConnectionState('disconnected');
                setRemoteParticipants([]);

                // Check if disconnection is due to stream ending
                if (reason === 'SERVER_SHUTDOWN' || reason === 'ROOM_DELETED') {
                    console.log('📡 Stream ended by host, showing ended status');
                    showToast('Livestream đã kết thúc', 'info');

                    // Update selected stream status
                    setSelectedStream(prev => prev ? { ...prev, status: 'ended' } : null);
                    return;
                }

                // Disable automatic reconnection to prevent timeout loops
                // Let status checking handle reconnection instead
                console.log('ℹ️ Disconnected - no automatic reconnection to prevent loops');
            });

            newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
                console.log('👤 Participant connected:', participant.identity);
                setRemoteParticipants(prev => [...prev, participant]);
                // Only increase viewer count if user has clicked to watch
                if (hasUserClicked) {
                    setViewerCount(prev => prev + 1);
                }
            });

            newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
                console.log('👤 Participant disconnected:', participant.identity);
                setRemoteParticipants(prev => prev.filter(p => p.identity !== participant.identity));
                // Only decrease viewer count if user has clicked to watch
                if (hasUserClicked) {
                    setViewerCount(prev => Math.max(0, prev - 1));
                }
            });

            newRoom.on(RoomEvent.TrackSubscribed, (track) => {
                if (track.kind === 'video' && videoRef.current) {
                    track.attach(videoRef.current);

                    // Force play video
                    setTimeout(() => {
                        if (videoRef.current) {
                            videoRef.current.play().catch(err => {
                                // Ignore AbortError - it happens when play is interrupted
                                if (err.name !== 'AbortError') {
                                    console.error('Video play failed:', err);
                                }
                            });
                        }
                    }, 100);
                }
            });

            newRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
                if (track.kind === 'video' && videoRef.current) {
                    track.detach(videoRef.current);
                }
            });

            // Track published state
            newRoom.on(RoomEvent.TrackPublished, (publication, participant) => {
                if (participant.identity.includes('Host') || participant.identity.includes('host')) {
                    if (publication.kind === 'video') {
                        console.log('📹 Host video published');
                    } else if (publication.kind === 'audio') {
                        console.log('🎤 Host audio published');
                    }
                }
            });

            newRoom.on(RoomEvent.TrackUnpublished, (publication, participant) => {
                if (participant.identity.includes('Host') || participant.identity.includes('host')) {
                    if (publication.kind === 'video') {
                        console.log('📹 Host video unpublished');
                    } else if (publication.kind === 'audio') {
                        console.log('🎤 Host audio unpublished');
                    }
                }
            });

            // Track enabled/disabled state
            newRoom.on(RoomEvent.TrackMuted, (publication, participant) => {
                console.log('🔇 Track muted:', { kind: publication.kind, source: publication.source, participant: participant.identity });
                if (participant.identity.includes('Host') || participant.identity.includes('host')) {
                    if (publication.kind === 'video') {
                        console.log('📹 Host video muted');
                    } else if (publication.kind === 'audio') {
                        console.log('🎤 Host audio muted');
                    }
                }
            });

            newRoom.on(RoomEvent.TrackUnmuted, (publication, participant) => {
                console.log('🔊 Track unmuted:', { kind: publication.kind, source: publication.source, participant: participant.identity });
                if (participant.identity.includes('Host') || participant.identity.includes('host')) {
                    if (publication.kind === 'video') {
                        console.log('📹 Host video unmuted');
                    } else if (publication.kind === 'audio') {
                        console.log('🎤 Host audio unmuted');
                    }
                }
            });

            // Periodically check host track status (since setEnabled doesn't always trigger events)
            const statusCheckInterval = setInterval(() => {
                if (!newRoom.participants) {
                    return;
                }

                const hostParticipant = Array.from(newRoom.participants.values()).find(p =>
                    p.identity.includes('Host') || p.identity.includes('host')
                );

                if (hostParticipant) {
                    // Check video track
                    const videoTracks = Array.from(hostParticipant.videoTrackPublications.values());
                    if (videoTracks.length > 0) {
                        const videoPublication = videoTracks[0];
                        const videoEnabled = !videoPublication.isMuted && videoPublication.track?.enabled !== false;
                        console.log('📹 Host video status changed:', videoEnabled);
                    }

                    // Check audio track
                    const audioTracks = Array.from(hostParticipant.audioTrackPublications.values());
                    if (audioTracks.length > 0) {
                        const audioPublication = audioTracks[0];
                        const audioEnabled = !audioPublication.isMuted && audioPublication.track?.enabled !== false;
                        console.log('🎤 Host audio status changed:', audioEnabled);
                    }
                }
            }, 500); // Check every 500ms

            // Add WebRTC error handling
            newRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
                console.log('🔗 Connection state changed:', state);
                setConnectionState(state);
            });

            newRoom.on(RoomEvent.MediaDevicesError, (error) => {
                console.error('❌ Media devices error:', error);
                setLivekitError('Media device error: ' + error.message);
            });

            // Handle DataChannel errors specifically - ignore them to prevent disconnection
            newRoom.on(RoomEvent.DataReceived, () => {
                // Silently handle data - don't log to prevent console spam
            });

            // Handle connection quality issues
            newRoom.on(RoomEvent.ConnectionQualityChanged, (quality) => {
                if (quality === 'poor') {
                    console.warn('⚠️ Poor connection quality detected');
                }
            });

            // Cleanup interval on disconnect
            newRoom.on(RoomEvent.Disconnected, () => {
                clearInterval(statusCheckInterval);
            });

            // Connect to room with timeout
            const connectPromise = newRoom.connect(LIVEKIT_CONFIG.serverUrl, viewerToken);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
            );

            // Set up error handler
            console.error = (...args) => {
                const message = args[0]?.toString() || '';
                if (message.includes('DataChannel error') || message.includes('Unknown DataChannel error')) {
                    // Ignore DataChannel errors to prevent disconnection
                    return;
                }
                originalConsoleError.apply(console, args);
            };

            await Promise.race([connectPromise, timeoutPromise]);
            setRoom(newRoom);
            roomRef.current = newRoom; // Store in ref
            isReconnectingRef.current = false; // Reset reconnecting flag

            // Restore original console.error
            console.error = originalConsoleError;

            console.log('🎉 Successfully connected to LiveKit room');

            return newRoom;
        } catch (error) {
            // Restore original console.error in case of error
            if (typeof originalConsoleError !== 'undefined') {
                console.error = originalConsoleError;
            }

            console.error('❌ Error connecting to LiveKit:', error);
            setLivekitError(error.message);
            setConnectionState('error');
            isReconnectingRef.current = false; // Reset reconnecting flag on error

            // Provide specific error messages
            if (error.message.includes('timeout')) {
                showToast('Kết nối timeout. Vui lòng kiểm tra kết nối mạng.', 'error');
            } else if (error.message.includes('token')) {
                showToast('Token không hợp lệ. Vui lòng thử lại.', 'error');
            } else if (error.message.includes('server')) {
                showToast('Không thể kết nối đến server LiveKit.', 'error');
            } else {
                showToast('Lỗi kết nối: ' + error.message, 'error');
            }

            throw error;
        }
    }, [room, showToast, hasUserClicked]);

    // Check current viewing stream status specifically
    const checkCurrentStreamStatus = useCallback(async () => {
        if (!selectedStream || !showVideoModal) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // First try to get the specific stream status directly
            try {
                const viewResponse = await Api.livestream.view({ livestreamId: selectedStream._id }, token);
                if (viewResponse.data?.success) {
                    const streamData = viewResponse.data.data;
                    console.log('📡 Direct stream check response:', streamData);

                    // Check stream status from API response
                    if (streamData.status === 'live') {
                        console.log('📡 Stream is live via direct check, ensuring connection...');

                        // Reset stream ended flag
                        streamEndedRef.current = false;

                        // Update selected stream status to live
                        setSelectedStream(prev => prev ? { ...prev, status: 'live' } : null);

                        // If not connected, try to connect
                        if (connectionState !== 'connected') {
                            console.log('📡 Connecting to live stream...');
                            await connectToLiveKit(streamData.roomName, streamData.viewerToken);
                            showToast('Đã kết nối đến livestream!', 'success');
                        }
                        return; // Exit early if stream is live
                    } else {
                        console.log('📡 Stream is not live via direct check, disconnecting...');
                        showToast('Livestream đã kết thúc', 'info');

                        // Set flag to prevent reconnection
                        streamEndedRef.current = true;

                        // Disconnect from LiveKit
                        await disconnectFromLiveKit();

                        // Update connection state to show ended status
                        setConnectionState('disconnected');

                        // Update selected stream status
                        setSelectedStream(prev => prev ? { ...prev, status: 'ended' } : null);
                        return; // Exit early if stream is not live
                    }
                }
            } catch (viewError) {
                console.log('📡 Direct stream check failed, falling back to list check:', viewError.message);
            }

            // Fallback to list-based checking
            const response = await Api.livestream.getLive(token);
            if (response.data?.success) {
                const newStreams = response.data?.data?.streams || [];
                const currentStream = newStreams.find(s => s._id === selectedStream._id);

                if (currentStream) {
                    // If stream is live, always try to connect or maintain connection
                    if (currentStream.status === 'live') {
                        console.log('📡 Stream is live, ensuring connection...');

                        // Reset stream ended flag
                        streamEndedRef.current = false;

                        // Update selected stream status to live
                        setSelectedStream(prev => prev ? { ...prev, status: 'live' } : null);

                        // If not connected, try to connect
                        if (connectionState !== 'connected') {
                            console.log('📡 Connecting to live stream...');
                            try {
                                const viewResponse = await Api.livestream.view({ livestreamId: selectedStream._id }, token);
                                if (viewResponse.data?.success && viewResponse.data.data.status === 'live') {
                                    await connectToLiveKit(viewResponse.data.data.roomName, viewResponse.data.data.viewerToken);
                                    showToast('Đã kết nối đến livestream!', 'success');
                                }
                            } catch (error) {
                                console.error('Error connecting to live stream:', error);
                            }
                        }
                    }
                    // If stream is not live, disconnect
                    else if (currentStream.status !== 'live') {
                        console.log('📡 Stream is not live, disconnecting...');
                        showToast('Livestream đã kết thúc', 'info');

                        // Set flag to prevent reconnection
                        streamEndedRef.current = true;

                        // Disconnect from LiveKit
                        await disconnectFromLiveKit();

                        // Update connection state to show ended status
                        setConnectionState('disconnected');

                        // Update selected stream status
                        setSelectedStream(prev => prev ? { ...prev, status: 'ended' } : null);
                    }
                } else {
                    // Stream not found in API response - this could mean it ended
                    // But don't disconnect immediately, wait for confirmation
                    console.log('📡 Stream not found in API response, checking if still connected...');

                    // Only disconnect if we're not connected and haven't seen the stream for a while
                    if (connectionState !== 'connected') {
                        console.log('📡 Stream not found and not connected, assuming ended...');
                        showToast('Livestream đã kết thúc', 'info');

                        // Set flag to prevent reconnection
                        streamEndedRef.current = true;

                        // Update connection state to show ended status
                        setConnectionState('disconnected');

                        // Update selected stream status
                        setSelectedStream(prev => prev ? { ...prev, status: 'ended' } : null);
                    } else {
                        console.log('📡 Stream not found but still connected, keeping connection...');
                    }
                }
            }
        } catch (error) {
            console.error('Error checking current stream status:', error);
        }
    }, [selectedStream, showVideoModal, showToast, disconnectFromLiveKit, setConnectionState, setSelectedStream, connectionState, connectToLiveKit]);


    // Join livestream
    const joinLivestream = useCallback(async (livestreamId) => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');

            const response = await Api.livestream.view({ livestreamId }, token);

            if (response.data?.success) {
                // Check if stream is still live before connecting
                if (response.data.data.status === 'live') {
                    showToast('Đã tham gia livestream!', 'success');

                    // Connect to LiveKit room
                    try {
                        await connectToLiveKit(response.data.data.roomName, response.data.data.viewerToken);
                    } catch (error) {
                        console.error('Error in connectToLiveKit:', error);
                        showToast('Lỗi kết nối LiveKit: ' + error.message, 'error');
                    }
                } else {
                    showToast('Livestream đã kết thúc', 'info');
                    setConnectionState('disconnected');
                    setSelectedStream(prev => prev ? { ...prev, status: 'ended' } : null);
                }
            } else {
                showToast(response.data?.message || 'Không thể tham gia livestream', 'error');
            }
        } catch (error) {
            console.error('Error joining livestream:', error);
            showToast('Lỗi khi tham gia livestream', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast, connectToLiveKit, setConnectionState, setSelectedStream]);

    // Open video modal and start watching
    const openVideoModal = useCallback(async (stream) => {
        setSelectedStream(stream);
        setShowVideoModal(true);
        setHasUserClicked(false); // Reset click state for new stream
        setViewerCount(0); // Reset viewer count for new stream

        // Reset stream ended flag for new stream
        streamEndedRef.current = false;

        // Reset connection state
        setConnectionState('disconnected');

        // Join the stream
        await joinLivestream(stream._id);
    }, [joinLivestream]);

    // Load live streams on component mount
    useEffect(() => {
        loadLiveStreams();
    }, [loadLiveStreams]);

    // Set up realtime status checking - reduced frequency to prevent spam
    useEffect(() => {
        const statusCheckInterval = setInterval(() => {
            console.log('📡 Checking for live streams...');
            checkStreamStatus();
        }, 3000); // Check every 3 seconds for realtime updates

        return () => clearInterval(statusCheckInterval);
    }, [checkStreamStatus]);

    // Auto-show video when new live stream appears
    useEffect(() => {
        if (liveStreams.length > 0 && !showVideoModal) {
            const liveStream = liveStreams.find(stream => stream.status === 'live');
            if (liveStream) {
                console.log('📡 New live stream detected, auto-opening video...');
                console.log('📡 Live stream details:', liveStream);
                openVideoModal(liveStream);
            }
        }
    }, [liveStreams, showVideoModal, openVideoModal]);

    // Additional realtime checking when viewing a stream - reduced frequency
    useEffect(() => {
        if (showVideoModal && selectedStream && !streamEndedRef.current) {
            const streamCheckInterval = setInterval(() => {
                checkCurrentStreamStatus();
            }, 5000); // Check every 5 seconds when viewing to reduce API calls

            return () => clearInterval(streamCheckInterval);
        }
    }, [showVideoModal, selectedStream, checkCurrentStreamStatus]);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (room) {
                room.disconnect().catch((error) => {
                    console.error('Error disconnecting from LiveKit on unmount:', error);
                });
            }
        };
    }, [room]);

    // Leave livestream
    const leaveLivestream = async () => {
        try {
            await disconnectFromLiveKit();
            setViewerCount(0);
            setHasUserClicked(false);
            showToast('Đã rời khỏi livestream', 'info');
        } catch (error) {
            console.error('Error leaving livestream:', error);
        }
    };


    // Toggle fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Toggle mute
    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    // Handle user click to start watching (increment viewer count)
    const handleVideoClick = () => {
        if (!hasUserClicked) {
            setHasUserClicked(true);
            setViewerCount(prev => prev + 1);
            showToast('Bạn đã bắt đầu xem livestream!', 'success');
        }
    };

    // Close video modal
    const closeVideoModal = () => {
        setShowVideoModal(false);
        setSelectedStream(null);

        // Reset flags when closing modal
        streamEndedRef.current = false;
        isReconnectingRef.current = false;

        // Reset connection state
        setConnectionState('disconnected');

        leaveLivestream();
    };




    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <div className="bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <LiveTv className="w-8 h-8 text-red-500" />
                            <h1 className="text-xl font-bold text-white">Live Streams</h1>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-green-400">Realtime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - TikTok/Instagram Style */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                        <p className="text-gray-400 mt-2">Đang tải...</p>
                    </div>
                ) : liveStreams.length > 0 ? (
                    /* Live Streams Grid - TikTok Style */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {liveStreams.map((stream, index) => (
                            <div
                                key={index}
                                className="relative bg-black rounded-2xl overflow-hidden cursor-pointer group"
                                style={{ aspectRatio: '9/16' }}
                                onClick={() => openVideoModal(stream)}
                            >
                                {/* Video Preview Placeholder */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                                            <LiveTv className="w-8 h-8" />
                                        </div>
                                        <div className="text-lg font-bold">LIVE</div>
                                    </div>
                                </div>

                                {/* Stream Info Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                                    <div className="absolute top-4 left-4 right-4">
                                        <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                            <span>LIVE</span>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-white font-bold text-lg mb-1 truncate">
                                            {stream.title || 'Untitled Stream'}
                                        </h3>
                                        <p className="text-gray-300 text-sm truncate">
                                            {stream.description || 'No description'}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white text-sm">👤 {stream.currentViewers || 0}</span>
                                                {stream.peakViewers > 0 && (
                                                    <span className="text-yellow-400 text-xs">Peak: {stream.peakViewers}</span>
                                                )}
                                            </div>
                                            <span className="text-gray-300 text-xs">Host: {stream.hostId}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Effect */}
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <div className="bg-red-600 text-white px-6 py-3 rounded-full font-bold">
                                        👆 Tap để xem
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* No Streams */
                    <div className="text-center py-16">
                        <LiveTv className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-4">Không có stream nào đang live</h3>
                        <p className="text-gray-400 text-lg">Hãy quay lại sau để xem các stream mới!</p>
                    </div>
                )}
            </div>

            {/* Video Modal - Full Screen */}
            {showVideoModal && selectedStream && (
                <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
                    <div className="relative bg-black rounded-lg overflow-hidden" style={{ width: '300px', aspectRatio: '9/16' }} ref={containerRef}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            controls={false}
                            className="w-full h-full object-cover cursor-pointer"
                            style={{
                                backgroundColor: '#000'
                            }}
                            onClick={handleVideoClick}
                            onError={(e) => console.error('Video error:', e)}
                        />

                        {/* Close Button */}
                        <button
                            onClick={closeVideoModal}
                            className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                        >
                            <ArrowBack className="w-5 h-5" />
                        </button>

                        {/* Live Status Indicator */}
                        <div className="absolute top-2 right-2">
                            <div className={`flex items-center gap-2 px-2 py-1 rounded text-sm font-medium ${connectionState === 'connected' ? 'bg-red-600 text-white' :
                                connectionState === 'connecting' ? 'bg-yellow-600 text-white' :
                                    connectionState === 'error' ? 'bg-red-600 text-white' :
                                        'bg-gray-600 text-white'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-white animate-pulse' :
                                    connectionState === 'connecting' ? 'bg-white animate-pulse' :
                                        'bg-white'
                                    }`}></div>
                                <span>
                                    {connectionState === 'connected' ? 'LIVE' :
                                        connectionState === 'connecting' ? 'KẾT NỐI' :
                                            connectionState === 'error' ? 'LỖI' : 'KẾT THÚC'}
                                </span>
                            </div>
                        </div>


                        {/* Livestream Ended Overlay */}
                        {connectionState !== 'connected' && (
                            <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
                                <div className="text-center text-white">
                                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                                        <LiveTv className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Livestream đã kết thúc</h3>
                                    <p className="text-gray-300 mb-4">Cảm ơn bạn đã xem!</p>
                                    <button
                                        onClick={closeVideoModal}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Video Controls */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                            <button
                                onClick={toggleMute}
                                className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                            >
                                {isMuted ? <VolumeOff className="w-4 h-4" /> : <VolumeUp className="w-4 h-4" />}
                            </button>

                            <button
                                onClick={toggleFullscreen}
                                className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                            >
                                {isFullscreen ? <FullscreenExit className="w-4 h-4" /> : <Fullscreen className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveStream;
