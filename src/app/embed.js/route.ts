import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || "http://localhost:3000";

  const script = `
(function() {
  // GastroOrder Universal Embed Widget
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var restaurantSlug = currentScript.getAttribute('data-restaurant') || 'pizzeria-bella-napoli';
  var accentColor = currentScript.getAttribute('data-color') || '#ea580c';
  var position = currentScript.getAttribute('data-position') || 'right'; // 'right' | 'left' | 'center'
  var label = currentScript.getAttribute('data-label') || 'Online bestellen';
  var orderUrl = '${origin}/r/' + restaurantSlug;

  // Stile für den schwebenden Bestellbutton
  var style = document.createElement('style');
  style.innerHTML = \`
    .gastro-order-widget-btn {
      position: fixed;
      bottom: 24px;
      \${position === 'left' ? 'left: 24px;' : position === 'center' ? 'left: 50%; transform: translateX(-50%);' : 'right: 24px;'}
      z-index: 999999;
      background-color: \${accentColor};
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      font-weight: 700;
      padding: 14px 22px;
      border-radius: 50px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(8px);
    }
    .gastro-order-widget-btn:hover {
      transform: \${position === 'center' ? 'translateX(-50%) translateY(-3px)' : 'translateY(-3px)'} scale(1.03);
      box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.35);
      color: #ffffff;
    }
    .gastro-order-widget-btn:active {
      transform: \${position === 'center' ? 'translateX(-50%) translateY(0)' : 'translateY(0)'} scale(0.98);
    }
    .gastro-order-pulse-dot {
      width: 10px;
      height: 10px;
      background-color: #22c55e;
      border-radius: 50%;
      display: inline-block;
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
      animation: gastro-pulse 2s infinite;
    }
    @keyframes gastro-pulse {
      0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
      70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
      100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }
    @media (max-width: 640px) {
      .gastro-order-widget-btn {
        bottom: 16px;
        right: 16px;
        padding: 12px 18px;
        font-size: 13px;
      }
    }
  \`;
  document.head.appendChild(style);

  // Button erzeugen
  var btn = document.createElement('a');
  btn.href = orderUrl;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.className = 'gastro-order-widget-btn';
  btn.innerHTML = '<span class="gastro-order-pulse-dot"></span><span>' + label + '</span> ➔';
  document.body.appendChild(btn);
})();
  `;

  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
