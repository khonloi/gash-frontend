import { useState, useRef, useCallback, useEffect } from 'react';
import { LIVEKIT_CONFIG } from '../../../config/livekit';

/**
 * Custom hook to manage LiveKit room connection, participant tracks, and audio/video rendering.
 */
export function useLiveStreamRoom({ showToast, onStreamEnded, videoRef }) {
    const [connectionState, setConnectionState] = useState('disconnected');
    const [streamEnded, setStreamEnded] = useState(false);
    const [room, setRoom] = useState(null);
    const [remoteParticipants, setRemoteParticipants] = useState([]);

    const roomRef = useRef(null);
    const isReconnectingRef = useRef(false);
    const streamEndedRef = useRef(false);

    const connectToLiveKit = useCallback(async (roomName, viewerToken) => {
        if (isReconnectingRef.current) return;
        if (streamEndedRef.current) return;

        if (!roomName || !viewerToken) {
            showToast?.('Missing connection information', 'error');
            return;
        }

        if (typeof viewerToken !== 'string' || viewerToken.length < 10) {
            showToast?.('Invalid token', 'error');
            return;
        }

        if (!LIVEKIT_CONFIG.serverUrl || LIVEKIT_CONFIG.serverUrl.includes('your-livekit-server.com')) {
            showToast?.('LiveKit server not configured', 'error');
            return;
        }

        if (!LIVEKIT_CONFIG.serverUrl.startsWith('wss://') && !LIVEKIT_CONFIG.serverUrl.startsWith('ws://')) {
            showToast?.('Invalid LiveKit server URL', 'error');
            return;
        }

        const originalConsoleError = console.error;

        try {
            isReconnectingRef.current = true;
            setConnectionState('connecting');

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
                setConnectionState('connected');

                const initialParticipants = Array.from(newRoom.remoteParticipants.values());
                setRemoteParticipants(initialParticipants);

                if (videoRef?.current) {
                    videoRef.current.muted = false;
                }

                newRoom.remoteParticipants.forEach((participant) => {
                    participant.trackPublications.forEach((publication) => {
                        if (!publication.isSubscribed) {
                            publication.setSubscribed(true);
                        }

                        if (publication.track) {
                            if (publication.track.kind === 'video' && videoRef?.current) {
                                publication.track.attach(videoRef.current);
                                videoRef.current.muted = false;
                                videoRef.current.play().catch(() => { });
                            } else if (publication.track.kind === 'audio' && videoRef?.current) {
                                publication.track.attach(videoRef.current);
                                if (publication.track instanceof MediaStreamTrack) {
                                    publication.track.enabled = true;
                                }
                                if (videoRef.current) {
                                    videoRef.current.muted = false;
                                }
                            }
                        }
                    });
                });

                setTimeout(() => {
                    if (videoRef?.current) {
                        videoRef.current.muted = false;
                    }
                }, 1000);
            });

            newRoom.on(RoomEvent.Disconnected, (reason) => {
                setConnectionState('disconnected');
                setRoom(null);
                setRemoteParticipants([]);

                if (reason === 'SERVER_SHUTDOWN' || reason === 'ROOM_DELETED') {
                    showToast?.('Livestream has ended', 'info');
                    streamEndedRef.current = true;
                    setStreamEnded(true);
                    onStreamEnded?.();
                }
            });

            newRoom.on(RoomEvent.TrackSubscribed, (track) => {
                if (videoRef?.current) {
                    if (track.kind === 'video') {
                        track.attach(videoRef.current);
                        setTimeout(() => {
                            if (videoRef?.current) {
                                videoRef.current.muted = false;
                                videoRef.current.play().catch((err) => {
                                    if (err.name !== 'AbortError') {
                                        console.error('Video play failed:', err);
                                    }
                                });
                            }
                        }, 100);
                    } else if (track.kind === 'audio') {
                        track.attach(videoRef.current);
                        if (track instanceof MediaStreamTrack) {
                            track.enabled = true;
                        }
                        if (videoRef.current) {
                            videoRef.current.muted = false;
                            setTimeout(() => {
                                if (videoRef.current) videoRef.current.muted = false;
                            }, 100);
                            setTimeout(() => {
                                if (videoRef.current) videoRef.current.muted = false;
                            }, 500);
                        }
                    }
                }
            });

            newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
                setRemoteParticipants(prev => {
                    if (prev.find(p => p.identity === participant.identity)) return prev;
                    return [...prev, participant];
                });

                participant.trackPublications.forEach((publication) => {
                    if (!publication.isSubscribed) {
                        publication.setSubscribed(true);
                    }
                    if (publication.track && publication.track.kind === 'audio' && videoRef?.current) {
                        publication.track.attach(videoRef.current);
                        if (publication.track instanceof MediaStreamTrack) {
                            publication.track.enabled = true;
                        }
                        videoRef.current.muted = false;
                    }
                });
            });

            newRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
                if (videoRef?.current) {
                    track.detach(videoRef.current);
                }
            });

            newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
                setRemoteParticipants(prev => prev.filter(p => p.identity !== participant.identity));
            });

            console.error = (...args) => {
                const message = args[0]?.toString() || '';
                if (message.includes('DataChannel error')) return;
                originalConsoleError.apply(console, args);
            };

            const connectPromise = newRoom.connect(LIVEKIT_CONFIG.serverUrl, viewerToken);
            const timeoutPromise = new Promise((_, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('Connection timeout after 45 seconds'));
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
            return newRoom;
        } catch (error) {
            if (typeof originalConsoleError !== 'undefined') {
                console.error = originalConsoleError;
            }
            setConnectionState('error');
            isReconnectingRef.current = false;

            if (error.message.includes('timeout')) {
                showToast?.('Connection timeout. Please check network', 'error');
            } else if (error.message.includes('token')) {
                showToast?.('Invalid or expired token', 'error');
            } else if (error.message.includes('server')) {
                showToast?.('Unable to connect to server', 'error');
            } else {
                showToast?.(`Connection error: ${error.message}`, 'error');
            }
            throw error;
        }
    }, [showToast, onStreamEnded, videoRef]);

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

    useEffect(() => {
        return () => {
            const currentRoom = roomRef.current;
            if (currentRoom) {
                currentRoom.disconnect().catch(console.error);
            }
        };
    }, []);

    return {
        room,
        connectionState,
        streamEnded,
        setStreamEnded,
        remoteParticipants,
        connectToLiveKit,
        disconnectFromLiveKit,
    };
}

export default useLiveStreamRoom;
