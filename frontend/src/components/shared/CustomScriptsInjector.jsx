'use client';

import { useEffect, useRef } from 'react';

/**
 * Safely injects user-defined custom Header and Footer scripts into the DOM.
 * 
 * Multi-layer safety architecture:
 * 1. Plain text like "hi" or notes are never blindly wrapped into <script>.
 * 2. Any inline script execution is isolated inside a try-catch sandbox so runtime errors
 *    (like "ReferenceError: hi is not defined") never crash the Next.js app or show error screens.
 * 3. External scripts (<script src="...">) have fallback onerror listeners for ad-blockers / network drop.
 */
export default function CustomScriptsInjector({
  headerScripts = '',
  footerScripts = '',
  keepWhatsAppWithCustomChat = false,
}) {
  const injectedRef = useRef({ header: null, footer: null });

  useEffect(() => {
    // Detect popular third-party live chat widgets in injected scripts
    const combined = `${headerScripts} ${footerScripts}`;
    const isLiveChat = /(tawk\.to|embed\.tawk|crisp\.chat|intercom|livechat|zendesk|tidio|freshchat|chat-widget)/i.test(combined);

    if (typeof window !== 'undefined') {
      window.__HAS_CUSTOM_CHAT_WIDGET__ = isLiveChat;
      window.__KEEP_WHATSAPP__ = Boolean(keepWhatsAppWithCustomChat);
      window.dispatchEvent(
        new CustomEvent('daas-chat-widget-changed', {
          detail: {
            hasCustomChat: isLiveChat,
            keepWhatsApp: Boolean(keepWhatsAppWithCustomChat),
          },
        })
      );
    }
    const inject = (content, target, key) => {
      if (!content || typeof content !== 'string') return;
      const trimmed = content.trim();
      if (!trimmed) return;

      // Clean up previous injection container for this key if content updated
      const containerId = `custom-injected-${key}`;
      const existingContainer = document.getElementById(containerId);
      if (existingContainer) {
        existingContainer.remove();
      }

      // If the content is pure plain text without any HTML tags (<script>, <meta>, <link>, <style>, etc.),
      // do not evaluate it as JavaScript to avoid ReferenceErrors (e.g. typing "hi" or notes).
      const hasHtmlTags = /<[a-z!][\s\S]*>/i.test(trimmed);
      if (!hasHtmlTags) {
        // Safe: non-HTML plain text is ignored for script execution
        console.warn(`[CustomScriptsInjector] Skipped non-HTML plain text in ${key} scripts. Please wrap scripts in <script>...</script>.`);
        return;
      }

      const container = document.createElement('div');
      container.id = containerId;
      container.style.display = 'none';

      try {
        const temp = document.createElement('div');
        temp.innerHTML = trimmed;

        const elements = Array.from(temp.childNodes);
        elements.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();

            if (tagName === 'script') {
              const script = document.createElement('script');

              // Copy all attributes (src, async, defer, type, id, etc.)
              Array.from(node.attributes).forEach((attr) => {
                script.setAttribute(attr.name, attr.value);
              });

              if (node.src) {
                // External script: handle ad-blocker or CDN failure gracefully
                script.onerror = () => {
                  console.warn(`[CustomScriptsInjector] External script failed to load: ${node.src}`);
                };
              } else if (node.textContent && node.textContent.trim()) {
                // Inline script: wrap inside an isolated try-catch block
                const safeCode = node.textContent.trim();
                script.textContent = `try {
  (function() {
    ${safeCode}
  })();
} catch (customScriptErr) {
  console.warn('[Custom Script Handled Error in ${key}]:', customScriptErr?.message || customScriptErr);
}`;
              }

              container.appendChild(script);
            } else {
              // Safe non-script tags (<meta>, <link>, <style>, <div>, etc.)
              container.appendChild(node.cloneNode(true));
            }
          }
        });

        target.appendChild(container);
      } catch (err) {
        console.warn(`[CustomScriptsInjector] Parse or injection error for ${key}:`, err);
      }
    };

    if (injectedRef.current.header !== headerScripts) {
      inject(headerScripts, document.head, 'head');
      injectedRef.current.header = headerScripts;
    }

    if (injectedRef.current.footer !== footerScripts) {
      inject(footerScripts, document.body, 'body');
      injectedRef.current.footer = footerScripts;
    }
  }, [headerScripts, footerScripts, keepWhatsAppWithCustomChat]);

  return null;
}
