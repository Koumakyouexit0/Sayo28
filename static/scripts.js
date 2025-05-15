function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    e.target.form.submit();
  }
}

const chat = document.getElementById('chat');
if (chat) {
  chat.scrollTop = chat.scrollHeight;
}

document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('featureBtn');
  const menu = document.getElementById('featureMenu');
  if (btn && menu) {
    btn.addEventListener('click', function(e) {
      menu.classList.toggle('active');
      e.stopPropagation();
    });
    document.addEventListener('click', function() {
      menu.classList.remove('active');
    });
    menu.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }

  const aboutBtn = document.getElementById('aboutBtn');
  const aboutModal = document.getElementById('aboutModal');
  const aboutClose = document.getElementById('aboutClose');
  if (aboutBtn && aboutModal && aboutClose) {
    aboutBtn.addEventListener('click', function(e) {
      aboutModal.style.display = 'flex';
      document.getElementById('featureMenu').classList.remove('active');
      e.stopPropagation();
    });
    aboutClose.addEventListener('click', function() {
      aboutModal.style.display = 'none';
    });
    window.addEventListener('click', function(e) {
      if (e.target === aboutModal) aboutModal.style.display = 'none';
    });
  }

  const resetBtn = document.getElementById('resetBtn');
  const confirmModal = document.getElementById('confirmModal');
  const confirmClose = document.getElementById('confirmClose');
  const confirmYes = document.getElementById('confirmYes');
  const confirmNo = document.getElementById('confirmNo');

  if (resetBtn && confirmModal && confirmClose && confirmYes && confirmNo) {
    resetBtn.addEventListener('click', function(e) {
      confirmModal.style.display = 'flex';
      e.stopPropagation();
    });
    confirmClose.addEventListener('click', function() {
      confirmModal.style.display = 'none';
    });
    confirmNo.addEventListener('click', function() {
      confirmModal.style.display = 'none';
    });
    confirmYes.addEventListener('click', function() {
      window.location.href = '/reset';
    });
    window.addEventListener('click', function(e) {
      if (e.target === confirmModal) confirmModal.style.display = 'none';
    });
  }

  const chatForm = document.getElementById('chatForm');
  const chatWindow = document.getElementById('chat');
  if (chatForm && chatWindow) {
    chatForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const textarea = chatForm.querySelector('textarea');
      const prompt = textarea.value.trim();
      if (!prompt) return;

      chatWindow.innerHTML += `
        <div style="display: flex;">
          <div class="msg-spacer"></div>
          <div class="msg-wrapper user">
            <div class="msg-header">You</div>
            <div class="msg-body">${prompt.replace(/</g, "&lt;")}</div>
          </div>
        </div>
      `;

      const thinkingId = "thinking-" + Date.now();
      chatWindow.innerHTML += `
        <div style="display: flex;">
          <div class="msg-wrapper bot" id="${thinkingId}">
            <div class="msg-header">Sayobot</div>
            <div class="msg-body"><i>Sayo đang suy nghĩ...</i></div>
          </div>
          <div class="msg-spacer"></div>
        </div>
      `;
      chatWindow.scrollTop = chatWindow.scrollHeight;
      textarea.value = "";

      fetch("/ask", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({prompt})
      })
      .then(res => res.json())
      .then(data => {
        const thinkingDiv = document.getElementById(thinkingId);
        if (thinkingDiv) {
          if (data.reply) {
            thinkingDiv.querySelector('.msg-body').innerHTML = data.reply;
          } else {
            thinkingDiv.querySelector('.msg-body').innerHTML = "<i>Lỗi: Không nhận được phản hồi từ bot.</i>";
          }
        }
        chatWindow.scrollTop = chatWindow.scrollHeight;
      })
      .catch(() => {
        const thinkingDiv = document.getElementById(thinkingId);
        if (thinkingDiv) {
          thinkingDiv.querySelector('.msg-body').innerHTML = "<i>Lỗi: Không thể kết nối server.</i>";
        }
      });
    });
  }

  document.getElementById('newChatBtn')?.addEventListener('click', function() {
    window.location.href = '/reset';
  });
});

function updateNetStatus() {
  const netDot = document.querySelector('#netStatus .dot');
  if (navigator.onLine) {
    netDot.classList.remove('offline');
    netDot.classList.add('online');
  } else {
    netDot.classList.remove('online');
    netDot.classList.add('offline');
  }
}
window.addEventListener('online', updateNetStatus);
window.addEventListener('offline', updateNetStatus);
updateNetStatus();

function checkApiStatus() {
  const apiDot = document.querySelector('#apiStatus .dot');
  fetch('/', {method: 'HEAD'})
    .then(res => {
      if (res.ok) {
        apiDot.classList.remove('offline');
        apiDot.classList.add('online');
        hideErrorModal();
      } else {
        apiDot.classList.remove('online');
        apiDot.classList.add('offline');
        showErrorModal('Không thể kết nối tới SayoAPI. Vui lòng thử lại sau!');
      }
    })
    .catch(() => {
      apiDot.classList.remove('online');
      apiDot.classList.add('offline');
      showErrorModal('Không thể kết nối tới SayoAPI. Vui lòng thử lại sau!');
    });
}
setInterval(checkApiStatus, 10000);
checkApiStatus();

function checkWebStatus() {
  const webDot = document.querySelector('#webStatus .dot');
  fetch('https://reopykomeo.web.app/peakpx.png', { method: 'HEAD', mode: 'no-cors' })
    .then(() => {
      webDot.classList.remove('offline');
      webDot.classList.add('online');
    })
    .catch(() => {
      webDot.classList.remove('online');
      webDot.classList.add('offline');
    });
}
setInterval(checkWebStatus, 10000);
checkWebStatus();

function showErrorModal(msg) {
  const modal = document.getElementById('errorModal');
  const errorMsg = document.getElementById('errorMsg');
  if (modal && errorMsg) {
    errorMsg.textContent = msg;
    modal.style.display = 'flex';
  }
}
function hideErrorModal() {
  const modal = document.getElementById('errorModal');
  if (modal) modal.style.display = 'none';
}
document.getElementById('errorClose')?.addEventListener('click', hideErrorModal);
window.addEventListener('click', function(e) {
  const modal = document.getElementById('errorModal');
  if (e.target === modal) hideErrorModal();
});

window.addEventListener('offline', function() {
  showErrorModal('Mất kết nối mạng. Vui lòng kiểm tra lại Internet.');
});
window.addEventListener('online', hideErrorModal);

if (window.console) {
    setTimeout(() => {
        console.log('%cChúc mừng vì đã vào được đây!', 'color: green; font-size: 40px; font-weight: bold;');
        console.log('%cGõ "allow pasting" để paste script!', 'color: white; font-size: 16px;');
        console.log('%cHãy đảm bảo script an toàn:C', 'color: white; font-size: 16px;');
    }, 1000);
}
