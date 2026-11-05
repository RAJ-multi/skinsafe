"use client";

/**
 * SkinSafe AI Assistant — floating chat widget.
 *
 * - Fixed bottom-right corner.
 * - Opens a compact chat panel on click.
 * - Context-aware: passes current analysis/comparison results to the backend.
 * - All AI requests go through the secure backend proxy (/api/v1/assistant/chat).
 * - No API key is ever present in browser code.
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  X,
  Send,
  Trash2,
  Loader2,
  ChevronDown,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { assistantChat, ApiError } from "@/lib/api";
import { MolecularAnalysisResult, CompareCompoundsResponse } from "@/lib/types";

interface Message {
  role: "user" | "assistant" | "error";
  text: string;
}

interface AiAssistantProps {
  analysis?: MolecularAnalysisResult | null;
  compareResults?: CompareCompoundsResponse | null;
}

// Suggested prompts shown when no messages yet
const SUGGESTED_PROMPTS_NO_CONTEXT = [
  "What is TPSA and why does it matter for skin permeability?",
  "Explain the Potts–Guy model and its limitations.",
  "What is cLogP and how does it affect skin absorption?",
  "What is the Lipinski Rule of Five?",
  "Explain the difference between HBD and HBA.",
];

const SUGGESTED_PROMPTS_WITH_CONTEXT = [
  "Explain the skin permeability prediction for this compound.",
  "Why did this compound pass or fail Lipinski's rule?",
  "What does the TPSA indicate for this molecule?",
  "Is the predicted Kp value high or low for a cosmetic ingredient?",
  "Explain the drug-likeness assessment results.",
];

/** Build a serializable context object from current analysis state */
function buildContext(
  analysis: MolecularAnalysisResult | null | undefined,
  compareResults: CompareCompoundsResponse | null | undefined
): Record<string, unknown> | null {
  if (compareResults && compareResults.compounds.length > 0) {
    return {
      mode: "comparison",
      compounds: compareResults.compounds.map((c) => ({
        name: c.name,
        canonical_smiles: c.canonical_smiles,
        calculated_properties: c.calculated_properties,
        skin_permeability_prediction: c.skin_permeability_prediction,
        druglikeness_assessment: {
          lipinski_passed: c.druglikeness_assessment.lipinski.passed,
          lipinski_violations: c.druglikeness_assessment.lipinski.violations,
          ghose_passed: c.druglikeness_assessment.ghose.passed,
          ghose_violations: c.druglikeness_assessment.ghose.violations,
        },
      })),
    };
  }
  if (analysis) {
    return {
      mode: "single_molecule",
      canonical_smiles: analysis.canonical_smiles,
      calculated_properties: analysis.calculated_properties,
      skin_permeability_prediction: analysis.skin_permeability_prediction,
      druglikeness_assessment: {
        lipinski_passed: analysis.druglikeness_assessment.lipinski.passed,
        lipinski_violations: analysis.druglikeness_assessment.lipinski.violations,
        ghose_passed: analysis.druglikeness_assessment.ghose.passed,
        ghose_violations: analysis.druglikeness_assessment.ghose.violations,
      },
    };
  }
  return null;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  analysis,
  compareResults,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasContext = !!(
    (analysis) ||
    (compareResults && compareResults.compounds.length > 0)
  );

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
      setInputValue("");
      setIsThinking(true);

      const context = buildContext(analysis, compareResults);

      try {
        const response = await assistantChat(trimmed, context);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: response.reply },
        ]);
      } catch (err) {
        let errorText =
          "The assistant is unavailable. Please check the backend configuration.";
        if (err instanceof ApiError) {
          errorText = err.detail.message || errorText;
        }
        setMessages((prev) => [
          ...prev,
          { role: "error", text: errorText },
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [analysis, compareResults, isThinking]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setInputValue("");
  };

  const prompts = hasContext
    ? SUGGESTED_PROMPTS_WITH_CONTEXT
    : SUGGESTED_PROMPTS_NO_CONTEXT;

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isOpen
            ? "bg-slate-700 hover:bg-slate-800 rotate-0"
            : "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
        }`}
      >
        {isOpen ? (
          <ChevronDown className="h-6 w-6 text-white" />
        ) : (
          <Bot className="h-6 w-6 text-white" />
        )}
        {/* Pulse indicator when analysis context is active */}
        {!isOpen && hasContext && (
          <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-emerald-300 animate-ping opacity-75" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-900/15 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-emerald-100" />
              <div>
                <p className="text-sm font-semibold text-white">SkinSafe AI</p>
                <p className="text-[10px] text-emerald-100">
                  {hasContext
                    ? "Context: analysis loaded ✓"
                    : "Computational Chemistry Assistant"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  title="Clear chat"
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px] max-h-[380px]">
            {messages.length === 0 ? (
              <div className="space-y-3">
                {/* Welcome message */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    <span className="font-semibold">Hello!</span> I can explain
                    molecular descriptors, drug-likeness rules, and Potts–Guy
                    skin permeability predictions.
                    {hasContext &&
                      " I can see your current analysis — ask me anything about it."}
                  </p>
                </div>
                {/* Suggested prompts */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Suggested questions
                  </p>
                  {prompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(prompt)}
                      className="w-full text-left text-xs text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80 hover:border-emerald-200 rounded-lg px-3 py-2 transition-colors cursor-pointer leading-snug"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "error" ? (
                    <div className="flex items-start space-x-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 max-w-[90%]">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-700 leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-sm"
                          : "bg-slate-100 text-slate-800 rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              ))
            )}
            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3 py-2 flex items-center space-x-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                  <span className="text-xs text-slate-500">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Scientific disclaimer */}
          <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-100">
            <p className="text-[9px] text-amber-700 leading-tight">
              AI responses are for scientific exploration only. Potts–Guy values are model predictions, not experimental data. Lipinski/Ghose do not indicate cosmetic safety.
            </p>
          </div>

          {/* Input area */}
          <div className="px-3 py-3 border-t border-slate-200/80 bg-white">
            <div className="flex items-end space-x-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about molecular descriptors, skin permeability…"
                rows={1}
                disabled={isThinking}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-300 transition-all disabled:opacity-50 leading-relaxed"
                style={{ minHeight: "36px", maxHeight: "96px" }}
              />
              <button
                onClick={() => sendMessage(inputValue)}
                disabled={isThinking || !inputValue.trim()}
                className="flex-shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            <p className="text-[9px] text-slate-400 mt-1.5 text-center">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
};

