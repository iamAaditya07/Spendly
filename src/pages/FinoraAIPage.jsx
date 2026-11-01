import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  askFinoraAI,
  fetchUserChatHistory,
  saveUserChatMessage,
  clearUserChatHistory,
  getUserFinancialContext
} from '../services/aiAssistantService';
import { formatCurrency } from '../utils/formatters';
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  RefreshCw,
  HelpCircle,
  TrendingDown,
  Wallet,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'How much did I spend this month?',
  'Where did most of my money go?',
  'Can I afford a laptop worth ₹50,000?',
  'Why am I spending more than last month?',
  'How much should I save every month?',
  'What is my daily spending limit?'
];

export default function FinoraAIPage() {
  const { user } = useAuth();
  const { setCurrentPage } = useApp();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      loadChatAndContext();
    }
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatAndContext = async () => {
    try {
      setLoadingContext(true);
      const [history, ctx] = await Promise.all([
        fetchUserChatHistory(user?.id),
        getUserFinancialContext(user?.id)
      ]);
      setMessages(history);
      setContextData(ctx);
    } catch (e) {
      console.error('Error loading chat or context:', e);
    } finally {
      setLoadingContext(false);
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setInputText('');

    // 1. Append User Message
    const userMsg = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);
    saveUserChatMessage(user?.id, 'user', text);

    // 2. Fetch AI Response
    setLoading(true);
    try {
      const response = await askFinoraAI(user?.id, text, messages);
      const assistantMsg = {
        id: 'msg_ai_' + Date.now(),
        role: 'assistant',
        content: response.content,
        metadata: {
          model: response.modelName,
          isAIModel: response.isAIModel
        },
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);
      saveUserChatMessage(user?.id, 'assistant', response.content, assistantMsg.metadata);
    } catch (e) {
      console.error('Error generating AI response:', e);
      const errorMsg = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: `I encountered an issue accessing your records. Here is a quick snapshot: Your available balance is **${formatCurrency(contextData?.availableBalance || 0)}** with **${formatCurrency(contextData?.dailyAllowance || 0)}/day** safe allowance.`,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear your chat history with Finora?')) {
      await clearUserChatHistory(user?.id);
      loadChatAndContext();
    }
  };

  // Basic formatting helper for markdown bold and bullet lines
  const renderFormattedContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-extrabold text-slate-900 dark:text-white mt-2 mb-1 text-sm sm:text-base">
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Bullets
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const bulletText = line.substring(2);
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5 pl-2 text-xs sm:text-sm">
            <span className="text-brand-500 font-bold">•</span>
            <span>{parseBold(bulletText)}</span>
          </div>
        );
      }
      // Empty line
      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }
      // Standard paragraph
      return (
        <p key={idx} className="my-0.5 text-xs sm:text-sm leading-relaxed">
          {parseBold(line)}
        </p>
      );
    });
  };

  // Simple parser to turn **bold** into <strong>
  const parseBold = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Page Header with Live Balance Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-campus-cyan flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Finora AI Assistant
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Grounded
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI financial mentor connected directly to your transactions and pocket money.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Chat
          </button>
        </div>
      </div>

      {/* Live Financial Context Pill Bar */}
      {contextData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pocket Money Baseline
            </span>
            <p className="font-extrabold text-slate-900 dark:text-white text-sm">
              {formatCurrency(contextData.pocketMoney)}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Spent This Month
            </span>
            <p className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">
              {formatCurrency(contextData.totalSpent)}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Available Balance
            </span>
            <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
              {formatCurrency(contextData.availableBalance)}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Safe Daily Limit
            </span>
            <p className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">
              {formatCurrency(contextData.dailyAllowance)}/day
            </p>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col h-[560px] overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-campus-cyan text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  {isUser ? (
                    <p className="font-medium whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>{renderFormattedContent(msg.content)}</div>
                  )}

                  {!isUser && msg.metadata?.model && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        Grounded in Supabase Database
                      </span>
                      <span>{msg.metadata.model}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking Animation Bubble */}
          {loading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-campus-cyan text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl rounded-bl-none bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Sparkles className="w-4 h-4 text-brand-500 animate-spin" />
                <span>Finora is analyzing your transaction records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Pills */}
        <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-500" /> Quick Ask:
          </span>
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:text-brand-600 transition-colors shrink-0 shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input Field */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Finora about your spending, affordability, or savings..."
              disabled={loading}
              className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-brand-500/20 hover:opacity-95 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
