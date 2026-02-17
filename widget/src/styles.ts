export const STYLES = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #111;
    box-sizing: border-box;
  }

  *, *::before, *::after { box-sizing: inherit; }

  /* Bubble */
  .imply-bubble {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #111;
    color: #fff;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    transition: opacity 0.15s;
    z-index: 999999;
  }
  .imply-bubble:hover { opacity: 0.85; }
  .imply-bubble.left { right: auto; left: 24px; }

  @keyframes imply-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(17,17,17,0.4); }
    70%  { box-shadow: 0 0 0 10px rgba(17,17,17,0); }
    100% { box-shadow: 0 0 0 0 rgba(17,17,17,0); }
  }
  .imply-bubble.pulse { animation: imply-pulse 1.5s ease-out 1; }

  /* Drawer */
  .imply-drawer {
    position: fixed;
    bottom: 92px;
    right: 24px;
    width: 380px;
    height: 560px;
    background: #faf8f5;
    border: 1px solid #e5e1db;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    display: flex;
    flex-direction: column;
    z-index: 999998;
    transform: translateY(20px);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.25s ease-out, opacity 0.25s ease-out;
  }
  .imply-drawer.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: all;
  }
  .imply-drawer.left { right: auto; left: 24px; }

  @media (max-width: 640px) {
    .imply-drawer {
      width: 100vw;
      height: 65vh;
      bottom: 0;
      right: 0;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
    .imply-drawer.left { left: 0; }
    .imply-bubble { bottom: 16px; right: 16px; }
    .imply-bubble.left { right: auto; left: 16px; }
  }

  /* Drawer header */
  .imply-header {
    background: #111;
    color: #fff;
    padding: 14px 16px;
    border-radius: 14px 14px 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .imply-header-title { font-weight: 600; font-size: 14px; }
  .imply-header-actions { display: flex; gap: 4px; }
  .imply-header-btn {
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.7);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: color 0.15s;
  }
  .imply-header-btn:hover { color: #fff; }

  /* Message list */
  .imply-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .imply-messages::-webkit-scrollbar { width: 4px; }
  .imply-messages::-webkit-scrollbar-thumb { background: #e5e1db; border-radius: 2px; }

  /* Message bubbles */
  .imply-msg { display: flex; flex-direction: column; max-width: 80%; }
  .imply-msg.user { align-self: flex-end; align-items: flex-end; }
  .imply-msg.assistant { align-self: flex-start; align-items: flex-start; }

  .imply-msg-bubble {
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.5;
    word-break: break-word;
  }
  .imply-msg.user .imply-msg-bubble {
    background: #111;
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .imply-msg.assistant .imply-msg-bubble {
    background: #f0ebe4;
    color: #111;
    border-bottom-left-radius: 4px;
  }

  /* Typing dots */
  .imply-typing { display: flex; gap: 4px; padding: 14px; }
  .imply-typing span {
    width: 6px; height: 6px;
    background: #999;
    border-radius: 50%;
    animation: imply-bounce 1.2s infinite;
  }
  .imply-typing span:nth-child(2) { animation-delay: 0.2s; }
  .imply-typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes imply-bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40%           { transform: translateY(-6px); }
  }

  /* Sources */
  .imply-sources {
    margin-top: 6px;
    font-size: 12px;
    color: #888;
    cursor: pointer;
    user-select: none;
  }
  .imply-sources-list {
    margin-top: 4px;
    padding: 8px 10px;
    background: #fff;
    border: 1px solid #e5e1db;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .imply-source-item { font-size: 11px; color: #555; }

  /* Input bar */
  .imply-input-bar {
    padding: 12px;
    border-top: 1px solid #e5e1db;
    display: flex;
    gap: 8px;
    align-items: flex-end;
    flex-shrink: 0;
  }
  .imply-textarea {
    flex: 1;
    border: 1px solid #e5e1db;
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 14px;
    font-family: inherit;
    resize: none;
    outline: none;
    background: #fff;
    color: #111;
    min-height: 38px;
    max-height: 96px;
    overflow-y: auto;
    line-height: 1.5;
    transition: border-color 0.15s;
  }
  .imply-textarea:focus { border-color: #111; }
  .imply-textarea:disabled { opacity: 0.5; cursor: not-allowed; }
  .imply-send-btn {
    width: 36px;
    height: 36px;
    background: #111;
    border: none;
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.15s;
  }
  .imply-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .imply-send-btn:not(:disabled):hover { opacity: 0.8; }

  /* Error */
  .imply-error {
    font-size: 12px;
    color: #dc2626;
    padding: 4px 14px 8px;
    text-align: center;
  }
`
