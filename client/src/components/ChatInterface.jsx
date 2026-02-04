import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import RoleSwitcher from './RoleSwitcher';
import AudioRecorder from './AudioRecorder';

export default function ChatInterface({ role, setRole }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [targetLanguage, setTargetLanguage] = useState(role === 'doctor' ? 'es' : 'en');
    const [isSending, setIsSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSummary, setShowSummary] = useState(false);
    const [summaryText, setSummaryText] = useState('');
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // Load initial messages and subscribe to realtime
    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .order('created_at', { ascending: true });

            if (data) setMessages(data);
        };

        fetchMessages();

        // Subscribe
        const channel = supabase
            .channel('public:conversations')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleSend = async () => {
        if (!inputText.trim()) return;
        setIsSending(true);

        try {
            // 1. Send to Backend for Translation (using fetch to our Express server)
            // Note: Assuming Port 3000 for server
            let translatedText = "";
            try {
                const response = await fetch('http://localhost:3000/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: inputText,
                        targetLanguage,
                        role
                    })
                });
                const data = await response.json();
                translatedText = data.translated;
            } catch (err) {
                console.error("Translation API failed, falling back to mock", err);
                translatedText = `[Mock Translate]: ${inputText}`;
            }

            // 2. Insert into Supabase
            const { error } = await supabase.from('conversations').insert({
                role,
                text_original: inputText,
                text_translated: translatedText,
                target_language: targetLanguage,
            });

            if (error) console.error("Supabase insert error:", error);
            else setInputText('');

        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleAudioRecord = async (audioBlob) => {
        setIsSending(true);
        try {
            // 1. Upload to Supabase Storage
            const fileName = `${Date.now()}_${role}.webm`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('audio')
                .upload(fileName, audioBlob);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('audio')
                .getPublicUrl(fileName);

            // 3. Send to Backend for Translation (Transcription first normally, but we'll mock)
            // Ideally: Whisper API -> Text -> Translation
            // For now: We will just store the audio and a placeholder text
            const transcript = "[Audio Message]";

            // 4. Insert into Supabase
            await supabase.from('conversations').insert({
                role,
                text_original: transcript,
                text_translated: "[Audio Translation Pending]",
                target_language: targetLanguage,
                audio_url: publicUrl
            });

        } catch (error) {
            console.error("Error handling audio:", error);
            alert("Failed to upload audio. Make sure 'audio' bucket exists and is public.");
        } finally {
            setIsSending(false);
        }
    };

    const handleSummarize = async () => {
        setShowSummary(false); // Hide previous summary
        setSummaryText('Generating summary...');
        try {
            const conversationText = messages.map(msg => `${msg.role}: ${msg.text_original}`).join('\n');
            const response = await fetch('http://localhost:3000/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversation: conversationText })
            });
            const data = await response.json();
            setSummaryText(data.summary || 'Failed to generate summary.');
        } catch (error) {
            console.error("Error generating summary:", error);
            setSummaryText('Error generating summary.');
        } finally {
            setShowSummary(true);
        }
    };

    const filteredMessages = messages.filter(msg =>
        msg.text_original.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.text_translated.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white z-10">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Consultation Room</h1>
                    <p className="text-sm text-slate-500">
                        You are speaking as: <span className={`font-semibold ${role === 'doctor' ? 'text-blue-600' : 'text-emerald-600'}`}>{role.toUpperCase()}</span>
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="text-sm border-gray-300 rounded-md px-2 py-1"
                    />
                    <button
                        onClick={handleSummarize}
                        className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-md text-slate-700 font-medium"
                    >
                        Generate Summary
                    </button>

                    <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="hi">Hindi</option>
                    </select>
                    <RoleSwitcher currentRole={role} onSwitch={setRole} />
                </div>
            </div>

            {/* Summary Modal area (simple inline for now) */}
            {showSummary && (
                <div className="bg-yellow-50 p-4 border-b border-yellow-200 relative">
                    <button onClick={() => setShowSummary(false)} className="absolute top-2 right-2 text-yellow-700 font-bold">&times;</button>
                    <h3 className="font-bold text-yellow-800 mb-1">Conversation Summary</h3>
                    <p className="text-sm text-yellow-800 whitespace-pre-wrap">{summaryText}</p>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {filteredMessages.map((msg) => {
                    const isMe = msg.role === role;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-4 ${isMe
                                ? 'bg-blue-600 text-white rounded-tr-sm'
                                : 'bg-white border border-gray-200 text-slate-800 rounded-tl-sm'
                                }`}>
                                <div className="text-xs opacity-75 mb-1 flex justify-between gap-4">
                                    <span className="font-semibold uppercase">{msg.role}</span>
                                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>

                                {/* Original Text */}
                                <p className="text-lg leading-snug">{msg.text_original}</p>

                                {/* Audio Player */}
                                {msg.audio_url && (
                                    <audio controls src={msg.audio_url} className="mt-2 w-full max-w-[200px]" />
                                )}

                                {/* Translated Text (Divider) */}
                                {msg.text_translated && (
                                    <div className={`mt-2 pt-2 border-t ${isMe ? 'border-blue-500/50' : 'border-gray-100'}`}>
                                        <p className={`text-sm ${isMe ? 'text-blue-100' : 'text-slate-500'} italic`}>
                                            {msg.text_translated}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-end gap-2">
                    <AudioRecorder onRecordingComplete={handleAudioRecord} />

                    <div className="flex-1 bg-slate-100 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type your message..."
                            className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2"
                            rows={1}
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim() || isSending}
                        className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                        {isSending ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
