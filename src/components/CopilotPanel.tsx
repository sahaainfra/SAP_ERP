/**
 * AI Copilot Component - Part 8
 * 
 * Conversational AI assistant with strict guardrails for data access and actions
 */

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, AlertCircle, Info, Link2 } from 'lucide-react';
import type { CopilotMessage, CopilotSession } from '../types/analytics';

interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CopilotPanel({ isOpen, onClose }: CopilotPanelProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you analyze project data, answer questions about KPIs, and navigate the system. How can I help you today?',
      timestamp: new Date().toISOString(),
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: CopilotMessage = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(input);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const generateResponse = (question: string): CopilotMessage => {
    // Simulate different types of responses based on question patterns
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('cost variance') || lowerQuestion.includes('cv')) {
      return {
        id: messages.length + 2,
        role: 'assistant',
        content: 'Based on the EVM analysis for Metro Line Extension, the current Cost Variance (CV) is **-₹14 Crore**. This indicates the project is running over budget.\n\nThe Cost Performance Index (CPI) is 0.919, meaning for every ₹1 spent, only ₹0.92 of value is earned.',
        timestamp: new Date().toISOString(),
        sources: [
          { type: 'EVM', label: 'EVM Dashboard', count: 1, route: '/analytics/evm' }
        ],
        query: 'SELECT cv, cpi FROM evm_metrics WHERE project_id = 1',
        dataScope: { projectId: 1, companyName: 'Acme Construction Ltd' }
      };
    }

    if (lowerQuestion.includes('overdue') && lowerQuestion.includes('purchase order')) {
      return {
        id: messages.length + 2,
        role: 'assistant',
        content: 'I found **5 overdue purchase orders** in your scope with a total value of **₹2.45 Crore**.\n\nThe oldest overdue PO is PO-2026-00412 from 15 days ago. Would you like me to show you the details?',
        timestamp: new Date().toISOString(),
        sources: [
          { type: 'Purchase Orders', label: 'Overdue POs', count: 5, route: '/procurement/po?status=overdue' }
        ],
        query: 'SELECT COUNT(*), SUM(amount) FROM purchase_orders WHERE status = \'overdue\' AND project_id IN (user_projects)',
        dataScope: { projectId: 1 }
      };
    }

    if (lowerQuestion.includes('material') && lowerQuestion.includes('run out') || lowerQuestion.includes('stock out')) {
      return {
        id: messages.length + 2,
        role: 'assistant',
        content: 'Based on current consumption rates and stock levels, **3 materials** are at risk of running out in the next 2 weeks:\n\n1. **TMT 16mm** - 3.75 days of cover remaining\n2. **Cement OPC 53** - 5.2 days of cover remaining\n3. **Aggregate 20mm** - 8.1 days of cover remaining\n\nI recommend expediting the pending purchase orders for these materials.',
        timestamp: new Date().toISOString(),
        sources: [
          { type: 'Stock', label: 'Low Stock Items', count: 3, route: '/materials/stock?below_reorder=true' },
          { type: 'Forecast', label: 'Material Requirements', route: '/analytics/forecast' }
        ],
        query: 'SELECT material_name, days_of_cover FROM stock_forecast WHERE days_of_cover < 14',
        dataScope: { projectId: 1 }
      };
    }

    if (lowerQuestion.includes('how') && lowerQuestion.includes('calculated')) {
      return {
        id: messages.length + 2,
        role: 'assistant',
        content: 'I can explain how any KPI is calculated. For example:\n\n**Cost Variance (CV)** = Earned Value (EV) - Actual Cost (AC)\n\nThis tells you whether you\'re under or over budget. A negative CV means you\'ve spent more than the value of work completed.\n\nWhich specific KPI would you like me to explain?',
        timestamp: new Date().toISOString(),
        sources: []
      };
    }

    // Default response
    return {
      id: messages.length + 2,
      role: 'assistant',
      content: 'I understand your question. Let me analyze the data available in your scope to provide an answer.\n\nBased on the current project data, I can see that the project is progressing with some areas requiring attention. Would you like me to focus on a specific aspect like cost performance, schedule status, or material availability?',
      timestamp: new Date().toISOString(),
      sources: [
        { type: 'Project', label: 'Metro Line Extension', route: '/projects/1/360' }
      ],
      query: 'SELECT * FROM project_summary WHERE project_id = 1',
      dataScope: { projectId: 1 }
    };
  };

  const suggestedQuestions = [
    'What is the cost variance on Metro Phase 2?',
    'Show me overdue purchase orders above ₹10 lakh',
    'Which materials will run out in the next two weeks?',
    'How is the CPI calculated?'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-14 bottom-0 w-96 sap-card shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
        <div className="flex items-center gap-2">
          <Bot size={24} style={{ color: 'var(--sapAccentColor7)' }} />
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
              AI Copilot
            </h2>
            <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Your intelligent assistant
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
        >
          ×
        </button>
      </div>

      {/* Disclaimer */}
      <div className="p-3 border-b" style={{ background: 'var(--sapInformationBackground)', borderColor: 'var(--sapList_BorderColor)' }}>
        <div className="flex items-start gap-2">
          <Info size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--sapInformativeColor)' }} />
          <p className="text-xs" style={{ color: 'var(--sapTextColor)' }}>
            <strong>Disclaimer:</strong> I assist with analysis and navigation. Always verify critical decisions. I cannot create, approve, or modify data.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              <div className="flex items-center gap-2 mb-1">
                {message.role === 'assistant' && (
                  <Bot size={16} style={{ color: 'var(--sapAccentColor7)' }} />
                )}
                {message.role === 'user' && (
                  <User size={16} style={{ color: 'var(--sapAccentColor6)' }} />
                )}
                <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {message.role === 'assistant' ? 'AI Copilot' : 'You'}
                </span>
              </div>
              <div 
                className="p-3 rounded-lg"
                style={{
                  background: message.role === 'user' 
                    ? 'var(--sapAccentColor6)' 
                    : 'var(--sapGroup_ContentBackground)',
                  color: message.role === 'user' ? 'white' : 'var(--sapTextColor)'
                }}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.content.split('**').map((part, i) => 
                    i % 2 === 0 ? part : <strong key={i}>{part}</strong>
                  )}
                </div>
              </div>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.sources.map((source, index) => (
                    <a
                      key={index}
                      href={source.route}
                      className="flex items-center gap-2 p-2 rounded text-xs hover:bg-[var(--sapList_Hover_Background)] transition-colors"
                      style={{ background: 'var(--sapGroup_ContentBackground)' }}
                    >
                      <Link2 size={12} style={{ color: 'var(--sapLinkColor)' }} />
                      <span style={{ color: 'var(--sapLinkColor)' }}>
                        {source.label}
                        {source.count && ` (${source.count})`}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {/* Query Info */}
              {message.query && (
                <div className="mt-2 p-2 rounded text-xs" style={{ background: 'var(--sapNeutralBackground)' }}>
                  <div className="font-mono" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {message.query}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="p-3 rounded-lg" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--sapAccentColor7)', animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--sapAccentColor7)', animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--sapAccentColor7)', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="p-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Try asking:
          </div>
          <div className="space-y-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInput(question)}
                className="w-full text-left p-2 rounded text-sm hover:bg-[var(--sapList_Hover_Background)] transition-colors"
                style={{ color: 'var(--sapLinkColor)' }}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 rounded border"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4 py-2 rounded font-medium disabled:opacity-50"
            style={{
              background: 'var(--sapButton_Emphasized_Background)',
              color: 'var(--sapButton_Emphasized_TextColor)'
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
