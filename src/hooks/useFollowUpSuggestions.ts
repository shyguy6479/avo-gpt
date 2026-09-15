import { useState, useCallback, useRef } from 'react';

/**
 * Intelligent follow-up question suggestion hook
 * Automatically produces 3 relevant, highly engaging next-step questions
 * after an assistant message finishes generating.
 */
export function useFollowUpSuggestions() {
  const [suggestionsMap, setSuggestionsMap] = useState<Record<string, string[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const cacheRef = useRef<Map<string, string[]>>(new Map());

  // Heuristic rule-based generator for ultra-fast, zero-latency instant suggestions
  const generateHeuristicSuggestions = useCallback((content: string, userPrompt?: string): string[] => {
    if (!content || content.trim().length < 10) {
      return [
        'Can you explain this in simpler terms?',
        'Can you give me a practical example?',
        'What are the next steps to implement this?'
      ];
    }

    const text = content.toLowerCase();
    const prompt = (userPrompt || '').toLowerCase();

    // 1. Coding & Development
    if (
      content.includes('```') ||
      text.includes('function') ||
      text.includes('component') ||
      text.includes('import ') ||
      text.includes('const ') ||
      text.includes('bug') ||
      text.includes('error') ||
      text.includes('code') ||
      prompt.includes('code') ||
      prompt.includes('debug') ||
      prompt.includes('script')
    ) {
      return [
        'How can I test and verify this solution?',
        'What are edge cases or potential bugs to watch out for?',
        'Can you optimize the performance of this code?'
      ];
    }

    // 2. Explanations & Deep Concepts
    if (
      text.includes('mechanism') ||
      text.includes('architecture') ||
      text.includes('theory') ||
      text.includes('framework') ||
      prompt.includes('explain') ||
      prompt.includes('how does') ||
      prompt.includes('what is')
    ) {
      return [
        'Can you provide a concrete real-world case study?',
        'What are the main advantages and trade-offs?',
        'How does this compare to alternative approaches?'
      ];
    }

    // 3. Comparison & Decision Making
    if (
      text.includes('pros and cons') ||
      text.includes('versus') ||
      text.includes('vs') ||
      text.includes('comparison') ||
      prompt.includes('compare') ||
      prompt.includes('better') ||
      prompt.includes('which')
    ) {
      return [
        'Which option is recommended for beginners vs experts?',
        'What are the cost and maintenance implications?',
        'Are there any emerging alternatives to consider?'
      ];
    }

    // 4. Creative Writing, Brainstorming & Marketing
    if (
      text.includes('strategy') ||
      text.includes('marketing') ||
      text.includes('campaign') ||
      text.includes('pitch') ||
      prompt.includes('write') ||
      prompt.includes('draft') ||
      prompt.includes('ideas')
    ) {
      return [
        'Can you make this more concise and punchy?',
        'What are 3 variations with different tones of voice?',
        'How can we measure success or key metrics for this?'
      ];
    }

    // 5. Troubleshooting / Problem Solving
    if (
      text.includes('troubleshoot') ||
      text.includes('fix') ||
      text.includes('issue') ||
      text.includes('solution') ||
      prompt.includes('fix') ||
      prompt.includes('not working')
    ) {
      return [
        'What should I check if this still does not work?',
        'How can I prevent this issue in the future?',
        'Are there any configuration or environment requirements?'
      ];
    }

    // Default universal high-value questions
    return [
      'Can you summarize the key takeaways in 3 bullets?',
      'Can you give a step-by-step action plan?',
      'What related questions or pitfalls should I explore?'
    ];
  }, []);

  const getSuggestions = useCallback((messageId: string): string[] => {
    return suggestionsMap[messageId] || [];
  }, [suggestionsMap]);

  const isLoading = useCallback((messageId: string): boolean => {
    return !!loadingMap[messageId];
  }, [loadingMap]);

  const generateSuggestions = useCallback(
    async (messageId: string, assistantContent: string, userPrompt?: string) => {
      if (!messageId || !assistantContent || assistantContent.trim().length < 5) return;

      // Check in-memory cache first
      if (cacheRef.current.has(messageId)) {
        const cached = cacheRef.current.get(messageId)!;
        setSuggestionsMap((prev) => ({ ...prev, [messageId]: cached }));
        return;
      }

      setLoadingMap((prev) => ({ ...prev, [messageId]: true }));

      try {
        // Attempt backend endpoint with short timeout
        const res = await fetch('/api/follow-up-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assistantMessage: assistantContent.slice(0, 1500),
            userPrompt: (userPrompt || '').slice(0, 500)
          }),
          signal: AbortSignal.timeout(3500)
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.suggestions) && data.suggestions.length >= 3) {
            const clean = data.suggestions.slice(0, 3).map((s: string) => s.trim());
            cacheRef.current.set(messageId, clean);
            setSuggestionsMap((prev) => ({ ...prev, [messageId]: clean }));
            setLoadingMap((prev) => ({ ...prev, [messageId]: false }));
            return;
          }
        }
      } catch {
        // Fallback gracefully on network error or timeout
      }

      // Fast, smart heuristic generation fallback
      const heuristics = generateHeuristicSuggestions(assistantContent, userPrompt);
      cacheRef.current.set(messageId, heuristics);
      setSuggestionsMap((prev) => ({ ...prev, [messageId]: heuristics }));
      setLoadingMap((prev) => ({ ...prev, [messageId]: false }));
    },
    [generateHeuristicSuggestions]
  );

  return {
    suggestionsMap,
    getSuggestions,
    isLoading,
    generateSuggestions
  };
}
