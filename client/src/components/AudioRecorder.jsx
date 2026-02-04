import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

export default function AudioRecorder({ onRecordingComplete }) {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(audioBlob);

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied or not available.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-full transition-all shadow-md flex items-center justify-center ${isRecording
                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }`}
            title={isRecording ? "Stop Recording" : "Start Recording"}
        >
            {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-6 h-6" />}
        </button>
    );
}
