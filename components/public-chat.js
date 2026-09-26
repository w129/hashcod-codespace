(function (window, document) {
  'use strict';

  var VERSION = '20260926-public-chat-retired1';

  function removePublicChat() {
    ['hashcodPublicChatButton', 'hashcodPublicChatPanel'].forEach(function (id) {
      var node = document.getElementById(id);
      if (node && node.parentNode) {
        try { node.parentNode.removeChild(node); } catch (_) {}
      }
    });

    document.querySelectorAll(
      '.hashcod-public-chat-panel,.hashcod-public-chat-button,' +
      '[data-hashcod-public-chat-runtime]'
    ).forEach(function (node) {
      if (node && node.parentNode) {
        try { node.parentNode.removeChild(node); } catch (_) {}
      }
    });
  }

  window.__hashcodPublicChatLoaded = true;
  window.__hashcodPublicChatRetired = true;
  window.__hashcodPublicChatVersion = VERSION;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removePublicChat, { once: true });
  } else {
    removePublicChat();
  }

  window.addEventListener('hashcod:platform-entered', removePublicChat, { once: true });

  window.HashcodPublicChat = Object.freeze({
    version: VERSION,
    retired: true,
    available: false,
    open: function () { return false; },
    close: removePublicChat,
    cleanup: removePublicChat
  });
})(window, document);
