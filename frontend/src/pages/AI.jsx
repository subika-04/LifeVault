import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Menu,
  X,
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import {
  sendChatMessage,
  getChats,
  getChat,
  deleteChat,
  SUGGESTED_QUESTIONS,
} from '../services/aiService';

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Feature detection — Web Speech API. Recognition (voice input) is
// Chrome/Edge-only today; synthesis (voice replies) is broadly
// supported. Both degrade gracefully: the mic/speaker controls simply
// don't render when unsupported, rather than showing a broken button.
const SpeechRecognitionCtor =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
const speechRecognitionSupported = Boolean(SpeechRecognitionCtor);
const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

const AI = () => {
  const { showToast } = useToast();
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  const loadChats = useCallback(async () => {
    setChatsLoading(true);
    try {
      const { data } = await getChats();
      setChats(data.data.chats);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load chat history', 'error');
    } finally {
      setChatsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Stop any in-flight recognition/speech when the page unmounts, so
  // navigating away never leaves the mic listening or audio playing.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (speechSynthesisSupported) window.speechSynthesis.cancel();
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    if (speechSynthesisSupported) window.speechSynthesis.cancel();
    setSpeakingIndex(null);
  }, []);

  const speakText = useCallback(
    (text, index = null) => {
      if (!speechSynthesisSupported || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 1;
      utterance.onend = () => setSpeakingIndex(null);
      utterance.onerror = () => setSpeakingIndex(null);
      setSpeakingIndex(index);
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const toggleVoiceReplies = () => {
    setVoiceRepliesEnabled((prev) => {
      const next = !prev;
      if (!next) stopSpeaking();
      return next;
    });
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const startListening = () => {
    if (!speechRecognitionSupported || listening || sending) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      setInput((finalTranscript || interim).trim());
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        showToast('Microphone access was blocked — check your browser permissions.', 'error');
      } else {
        showToast('Voice input failed. Please try typing instead.', 'error');
      }
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      if (finalTranscript.trim()) {
        submitMessage(finalTranscript.trim());
      }
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const handleMicClick = () => {
    if (listening) stopListening();
    else startListening();
  };

  const openChat = async (chatId) => {
    setPanelOpen(false);
    setError(null);
    stopSpeaking();
    if (!chatId) {
      setActiveChatId(null);
      setMessages([]);
      return;
    }
    try {
      const { data } = await getChat(chatId);
      setActiveChatId(chatId);
      setMessages(data.data.chat.messages);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to open chat', 'error');
    }
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await deleteChat(chatId);
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
      }
      setChats((prev) => prev.filter((c) => c._id !== chatId));
      showToast('Chat deleted');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete chat', 'error');
    }
  };

  const submitMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setError(null);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed, timestamp: new Date() }]);
    setSending(true);

    try {
      const { data } = await sendChatMessage(trimmed, activeChatId || undefined);
      setActiveChatId(data.data.chatId);
      setMessages(data.data.messages);
      loadChats();

      if (voiceRepliesEnabled) {
        const latestMessages = data.data.messages;
        const lastMessage = latestMessages[latestMessages.length - 1];
        if (lastMessage?.role === 'assistant') {
          speakText(lastMessage.content, latestMessages.length - 1);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'LifeVault AI is unavailable right now. Please try again.';
      setError(message);
      // Roll back the optimistic user message on failure.
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMessage(input);
  };

  return (
    <div className="page page--ai">
      <div className="page-header page-header--row">
        <div>
          <h1 className="page-title">Ask LifeVault ✨</h1>
          <p className="page-subtitle">Ask questions about your documents, warranties, and spending</p>
        </div>
        <div className="ai-header-actions">
          {speechSynthesisSupported && (
            <button
              type="button"
              className={`btn btn--ghost ai-voice-toggle ${voiceRepliesEnabled ? 'ai-voice-toggle--active' : ''}`}
              onClick={toggleVoiceReplies}
              title={voiceRepliesEnabled ? 'Voice replies are on — click to turn off' : 'Turn on spoken replies'}
            >
              {voiceRepliesEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              Voice replies
            </button>
          )}
          <button
            type="button"
            className="btn btn--ghost ai-panel-toggle"
            onClick={() => setPanelOpen((v) => !v)}
          >
            {panelOpen ? <X size={18} /> : <Menu size={18} />}
            History
          </button>
        </div>
      </div>

      <div className="ai-layout">
        <aside className={`ai-history ${panelOpen ? 'ai-history--open' : ''}`}>
          <button type="button" className="btn btn--primary btn--full ai-new-chat" onClick={() => openChat(null)}>
            <Plus size={16} />
            New chat
          </button>

          <div className="ai-history__list">
            {chatsLoading ? (
              <p className="ai-history__empty">Loading…</p>
            ) : chats.length === 0 ? (
              <p className="ai-history__empty">No conversations yet</p>
            ) : (
              chats.map((chat) => (
                <button
                  type="button"
                  key={chat._id}
                  className={`ai-history__item ${activeChatId === chat._id ? 'ai-history__item--active' : ''}`}
                  onClick={() => openChat(chat._id)}
                >
                  <MessageSquare size={15} />
                  <span className="ai-history__item-title">{chat.title}</span>
                  <span
                    className="ai-history__item-delete"
                    onClick={(e) => handleDeleteChat(e, chat._id)}
                    role="button"
                    tabIndex={-1}
                  >
                    <Trash2 size={14} />
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="ai-chat">
          <div className="ai-chat__messages" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="ai-empty">
                <div className="ai-empty__icon">
                  <Sparkles size={32} />
                </div>
                <h2>Ask LifeVault anything</h2>
                <p>Try one of these, or type your own question below.</p>
                <div className="ai-empty__suggestions">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      type="button"
                      key={q}
                      className="ai-suggestion-chip"
                      onClick={() => submitMessage(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`ai-message ai-message--${m.role}`}>
                  <div className="ai-message__bubble">
                    <p>{m.content}</p>
                    {m.role === 'assistant' && speechSynthesisSupported && (
                      <button
                        type="button"
                        className="ai-message__speak"
                        onClick={() => (speakingIndex === i ? stopSpeaking() : speakText(m.content, i))}
                        title={speakingIndex === i ? 'Stop reading aloud' : 'Read this reply aloud'}
                      >
                        {speakingIndex === i ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      </button>
                    )}
                  </div>
                  <span className="ai-message__time">{formatTime(m.timestamp)}</span>
                </div>
              ))
            )}

            {sending && (
              <div className="ai-message ai-message--assistant">
                <div className="ai-message__bubble ai-message__bubble--typing">
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-label">✨ LifeVault AI is thinking…</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="ai-error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form className="ai-chat__input" onSubmit={handleSubmit}>
            {speechRecognitionSupported && (
              <button
                type="button"
                className={`ai-mic-btn ${listening ? 'ai-mic-btn--listening' : ''}`}
                onClick={handleMicClick}
                disabled={sending}
                title={listening ? 'Stop listening' : 'Ask by voice'}
              >
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}
            <input
              type="text"
              placeholder={listening ? 'Listening… speak your question' : 'Ask about your documents, warranties, spending…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
            />
            <button type="submit" className="btn btn--primary" disabled={sending || !input.trim()}>
              <Send size={16} />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AI;
