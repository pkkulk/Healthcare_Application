import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('conversations')
                .select('*')
                .order('created_at', { ascending: true });

            if (data) setMessages(data);
        };

        fetchMessages();

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

    const [translationsCache, setTranslationsCache] = useState(() => {
        const saved = localStorage.getItem('translationsCache');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('translationsCache', JSON.stringify(translationsCache));
    }, [translationsCache]);

    useEffect(() => {
        const fetchMissingTranslations = async () => {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

            // 1. Identify what needs translation
            const neededTranslations = messages.filter(msg => {
                if (msg.target_language === targetLanguage) return false;
                const cacheKey = `${msg.id}_${targetLanguage}`;
                if (translationsCache[cacheKey]) return false;
                return true;
            });

            if (neededTranslations.length === 0) return;

            // 2. Batch Request
            try {
                console.log(`Batch translating ${neededTranslations.length} messages...`);

                const response = await fetch(`${API_BASE}/api/translate-batch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        inputs: neededTranslations.map(m => ({ id: m.id, text: m.text_original, role: m.role })),
                        targetLanguage
                    })
                });

                const data = await response.json();

                if (data.translations) {
                    const newCache = {};
                    data.translations.forEach(t => {
                        const cacheKey = `${t.id}_${targetLanguage}`;
                        newCache[cacheKey] = t.translated;
                    });

                    setTranslationsCache(prev => ({
                        ...prev,
                        ...newCache
                    }));
                }

            } catch (err) {
                console.error("Batch translation failed", err);
            }
        };

        const timeoutId = setTimeout(fetchMissingTranslations, 1000); // Debounce 1s
        return () => clearTimeout(timeoutId);
    }, [messages, targetLanguage, translationsCache]);

    const handleSend = async () => {
        if (!inputText.trim()) return;
        setIsSending(true);

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            let translatedText = "";
            try {
                const response = await fetch(`${API_BASE}/api/translate`, {
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
            const fileName = `${Date.now()}_${role}.webm`;
            const { error: uploadError } = await supabase.storage
                .from('audio')
                .upload(fileName, audioBlob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('audio')
                .getPublicUrl(fileName);

            const transcript = "[Audio Message]";

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
        setShowSummary(false);
        setSummaryText('Generating summary...');
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const conversationText = messages.map(msg => `${msg.role}: ${msg.text_original}`).join('\n');
            const response = await fetch(`${API_BASE}/api/summarize`, {
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
        (msg.text_translated && msg.text_translated.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex flex-col h-screen w-full bg-white">
            <div className="p-3 md:p-4 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between bg-white z-10 gap-3 md:gap-0">
                <div className="w-full md:w-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-slate-800">Consultation Room</h1>
                        <p className="text-xs md:text-sm text-slate-500">
                            Speaking as: <span className={`font-semibold ${role === 'doctor' ? 'text-blue-600' : 'text-emerald-600'}`}>{role.toUpperCase()}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 md:flex-none text-sm border border-gray-300 rounded-md px-2 py-1.5 w-full md:w-48"
                    />

                    <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-1.5"
                    >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="hi">Hindi</option>
                    </select>

                    <button
                        onClick={handleSummarize}
                        className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md text-slate-700 font-medium whitespace-nowrap"
                    >
                        Summary
                    </button>

                    <div className="hidden md:block">
                        <RoleSwitcher currentRole={role} onSwitch={setRole} />
                    </div>
                </div>

                <div className="md:hidden w-full flex justify-end mt-2">
                    <RoleSwitcher currentRole={role} onSwitch={setRole} />
                </div>
            </div>

            {showSummary && (
                <div className="bg-yellow-50 p-4 border-b border-yellow-200 relative max-h-[40vh] overflow-y-auto">
                    <button onClick={() => setShowSummary(false)} className="absolute top-2 right-2 text-yellow-700 font-bold hover:text-yellow-900">&times;</button>
                    <h3 className="font-bold text-yellow-800 mb-2 sticky top-0 bg-yellow-50 pb-1">Conversation Summary</h3>
                    <div className="prose prose-sm prose-yellow max-w-none text-slate-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {summaryText}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {filteredMessages.map((msg) => {
                    const isMe = msg.role === role;

                    let displayTranslation = msg.text_translated;
                    if (msg.target_language !== targetLanguage) {
                        const cacheKey = `${msg.id}_${targetLanguage}`;
                        displayTranslation = translationsCache[cacheKey] || "...";
                    }

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

                                <p className="text-lg leading-snug">{msg.text_original}</p>

                                {msg.audio_url && (
                                    <audio controls src={msg.audio_url} className="mt-2 w-full max-w-[200px]" />
                                )}

                                {displayTranslation && (
                                    <div className={`mt-2 pt-2 border-t ${isMe ? 'border-blue-500/50' : 'border-gray-100'}`}>
                                        <p className={`text-sm ${isMe ? 'text-blue-100' : 'text-slate-500'} italic`}>
                                            {displayTranslation}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

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
