/* The Hue dashboard panel. Built by scripts/build_menu.py from frontend/app and frontend/src; edit those files, not this one. */
var HOST_ICONS = {"ac":"<path d='M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9'/>","alert":"<path d='M12 4l9 16H3z'/><path d='M12 10v4M12 17v.5'/>","apple":"<g transform='translate(2.4 2.4) scale(.8)' stroke-width='2'><path d='M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701'/></g>","apps":"<rect x='4' y='4' width='6.500' height='6.500' rx='1.500'/><rect x='13.500' y='4' width='6.500' height='6.500' rx='1.500'/><rect x='4' y='13.500' width='6.500' height='6.500' rx='1.500'/><rect x='13.500' y='13.500' width='6.500' height='6.500' rx='1.500'/>","axis":"<path d='M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3'/>","back":"<path d='M19 12H5M11 6l-6 6 6 6'/>","battery":"<rect x='7' y='6' width='10' height='15' rx='2'/><path d='M10 3h4v3h-4z'/>","bed":"<path d='M3 18V8M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6'/>","bedking":"<path d='M3 19V6M21 19V6M3 14h18M6 14v-3h5v3M13 14v-3h5v3'/>","bedsingle":"<path d='M4 19V7M4 14h16v5M20 14v-2a3 3 0 0 0-3-3H9v5'/>","bell":"<path d='M6 17h12l-1.500-2V11a4.500 4.500 0 0 0-9 0v4z'/><path d='M10 20a2 2 0 0 0 4 0'/>","bright":"<circle cx='12' cy='12' r='4'/><path d='M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2'/>","broom":"<path d='M14 4l6 6M12 6l6 6-8 8H4v-6z'/>","cam":"<rect x='3' y='7' width='13' height='10' rx='2'/><path d='M16 11l5-3v8l-5-3'/>","camoff":"<path d='M4 7h11v10H4zM15 11l5-3v8l-5-3M3 3l18 18'/>","cctv":"<path d='M3 8l12-3 2 6-12 3zM17 10l4-1M9 15v4h6'/>","ceiling":"<path d='M12 3v4'/><path d='M4 14l3-7h10l3 7z'/><path d='M9 18v1M12 18v2M15 18v1'/>","chdown":"<path d='M6 9l6 6 6-6'/>","check":"<path d='M5 12l5 5 9-10'/>","chev":"<path d='M6 9l6 6 6-6'/>","chup":"<path d='M6 15l6-6 6 6'/>","clock":"<circle cx='12' cy='12' r='9'/><path d='M12 7v5l3 2'/>","close":"<path d='M6 6l12 12M18 6L6 18'/>","cog":"<circle cx='12' cy='12' r='3'/><path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'/>","down":"<path d='M12 5v14M6 13l6 6 6-6'/>","drag":"<path d='M5 8h14M5 12h14M5 16h14'/>","drop":"<path d='M12 3s6 6 6 10a6 6 0 0 1-12 0c0-4 6-10 6-10z'/>","edit":"<path d='M4 20l4-1 11-11-3-3L5 16z'/><path d='M14 6l3 3'/>","eq":"<path d='M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4'/>","expand":"<path d='M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'/>","eye":"<path d='M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z'/><circle cx='12' cy='12' r='3'/>","eyeoff":"<path d='M3 3l18 18'/><path d='M10.6 6.2A9.5 9.5 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.4 7.9A16.6 16.6 0 0 0 2 12s3.5 6 10 6a9.7 9.7 0 0 0 4-.9'/><path d='M9.9 9.9a3 3 0 0 0 4.2 4.2'/>","fan":"<circle cx='12' cy='12' r='1.8'/><path d='M12 10.2C12 6 14.5 4 17 5.2c-.8 2.6-2.4 4-5 5zM13.8 12c4.2 0 6 2.5 4.8 5-2.6-.8-4-2.4-4.8-5zM12 13.8c0 4.2-2.5 6-5 4.8.8-2.6 2.4-4 5-4.8zM10.2 12c-4.2 0-6-2.5-4.8-5 2.6.8 4 2.4 4.8 5z'/>","filter":"<path d='M4 6h16l-6 7v6l-4-2v-4z'/>","flood":"<path d='M4 6h16v4H4zM8 14l-2 6M12 14v6M16 14l2 6'/>","floor":"<path d='M12 21v-9M9 21h6'/><path d='M7 12l2-8h6l2 8z'/>","home":"<path d='M4 11l8-7 8 7v9H4z'/>","info":"<circle cx='12' cy='12' r='9'/><path d='M12 11v6M12 7.500v.5'/>","keyboard":"<rect x='2' y='6' width='20' height='12' rx='2'/><path d='M6 10h1M10 10h1M14 10h1M18 10h1M7 14h10'/>","lamp":"<path d='M8 21h8M12 21v-6'/><path d='M7 15h10l-2-9H9z'/>","leave":"<path d='M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10'/>","left":"<path d='M19 12H5M11 6l-6 6 6 6'/>","light":"<path d='M9 18h6M10 21h4'/><path d='M8 14a6 6 0 1 1 8 0c-1 1-1.5 2-1.5 3h-5c0-1-.5-2-1.5-3z'/>","lights":"<path d='M9 18h6M10 21h4'/><path d='M8 14a6 6 0 1 1 8 0c-1 1-1.5 2-1.5 3h-5c0-1-.5-2-1.5-3z'/>","lock":"<rect x='5' y='11' width='14' height='9' rx='2'/><path d='M8 11V8a4 4 0 0 1 8 0v3'/>","media":"<rect x='3' y='5' width='18' height='12' rx='2'/><path d='M8 21h8'/>","mic":"<rect x='9' y='3' width='6' height='11' rx='3'/><path d='M5 11a7 7 0 0 0 14 0M12 18v3'/>","minus":"<path d='M5 12h14'/>","moon":"<path d='M20 14A8 8 0 1 1 10 4a6.500 6.500 0 0 0 10 10z'/>","motion":"<circle cx='12' cy='12' r='2'/><path d='M6 12a6 6 0 0 1 12 0M3 12a9 9 0 0 1 18 0'/>","movie":"<rect x='3' y='6' width='18' height='12' rx='2'/><path d='M3 10h18M8 6l-2 4M13 6l-2 4M18 6l-2 4'/>","mute":"<path d='M4 9v6h4l5 4V5L8 9z'/><path d='M17 9l5 6M22 9l-5 6'/>","next":"<path d='M18 5v14M6 5l10 7-10 7z'/>","note":"<path d='M9 18V5l11-2v13'/><circle cx='6' cy='18' r='3'/><circle cx='17' cy='16' r='3'/>","padlock":"<path class='shk' d='M8 11V8a4 4 0 0 1 8 0v3'/><rect x='5' y='11' width='14' height='9' rx='2'/><circle class='key' cx='12' cy='15.500' r='1' fill='currentColor' stroke='none'/>","palette":"<path d='M12 3a9 9 0 1 0 0 18c1.500 0 2-1 1.500-2s0-2 1.500-2h2a4 4 0 0 0 4-4c0-5-4-10-9-10z'/><circle cx='8' cy='10' r='1'/><circle cx='12' cy='7' r='1'/><circle cx='16' cy='10' r='1'/>","pause":"<path d='M8 5v14M16 5v14'/>","person":"<circle cx='12' cy='8' r='4'/><path d='M4 20c1-4 4-6 8-6s7 2 8 6'/>","phone":"<path d='M22 16.920v3a2 2 0 0 1-2.180 2 19.790 19.790 0 0 1-8.630-3.070 19.500 19.500 0 0 1-6-6 19.790 19.790 0 0 1-3.070-8.670A2 2 0 0 1 4.110 2h3a2 2 0 0 1 2 1.720 12.840 12.840 0 0 0 .7 2.810 2 2 0 0 1-.45 2.110L8.090 9.910a16 16 0 0 0 6 6l1.270-1.270a2 2 0 0 1 2.110-.45 12.840 12.840 0 0 0 2.810.7A2 2 0 0 1 22 16.920z'/>","pin":"<circle cx='12' cy='10' r='3'/><path d='M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z'/>","play":"<path d='M7 5l12 7-12 7z'/>","playc":"<circle cx='12' cy='12' r='9'/><path d='M10 8l6 4-6 4z'/>","playpause":"<path d='M4 5l6 7-6 7zM14 5v14M19 5v14'/>","plug":"<rect x='6' y='5' width='12' height='14' rx='3'/><path d='M10 9v2M14 9v2M10 15h4'/>","plus":"<path d='M12 5v14M5 12h14'/>","power":"<path d='M12 3v8'/><path d='M7 6.500a8 8 0 1 0 10 0'/>","powerset":"<path d='M12 3v8'/><path d='M7 6.500a8 8 0 1 0 10 0'/>","prev":"<path d='M6 5v14M18 5L8 12l10 7z'/>","printer":"<rect x='5' y='9' width='14' height='8' rx='2'/><path d='M8 9V4h8v5M8 17v3h8v-3'/>","pulsebars":"<path d='M4 12h.01M8 9v6M12 12h.01M16 6v12M20 12h.01'/>","purifier":"<rect x='5' y='3' width='14' height='18' rx='3'/><circle cx='12' cy='12' r='3'/>","rec":"<circle cx='12' cy='12' r='6'/>","repeat":"<path d='M17 3l3 3-3 3M20 6H8a4 4 0 0 0-4 4M7 21l-3-3 3-3M4 18h12a4 4 0 0 0 4-4'/>","restart":"<path d='M20 12a8 8 0 1 1-3-6.200M20 4v5h-5'/>","right":"<path d='M5 12h14M13 6l6 6-6 6'/>","rug":"<rect x='3' y='7' width='18' height='10' rx='1'/><path d='M3 10h18M3 14h18'/>","scene":"<circle cx='12' cy='12' r='9'/><circle cx='9' cy='10' r='1.4'/><circle cx='14.5' cy='8.8' r='1.4'/><circle cx='15.5' cy='14.5' r='1.4'/>","sd":"<path d='M7 3h8l4 4v14H7z'/><path d='M10 7v3M13 7v3'/>","search":"<circle cx='11' cy='11' r='7'/><path d='M20 20l-4-4'/>","sofa":"<path d='M4 12V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M3 12h18v6H3z'/>","sparkle":"<path d='M9 3l1.8 4.7L15.5 9.5l-4.7 1.8L9 16l-1.8-4.7L2.5 9.5l4.7-1.8z'/><path d='M18 13l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z'/>","speaker":"<rect x='6' y='3' width='12' height='18' rx='3'/><circle cx='12' cy='14' r='3'/><path d='M10 7h4'/>","stop":"<rect x='6' y='6' width='12' height='12' rx='1'/>","strip":"<path d='M3 8h18v8H3z'/><path d='M6 11v2M10 11v2M14 11v2M18 11v2'/>","swap":"<path d='M7 7h12l-3-3M17 17H5l3 3'/>","syncring":"<path d='M17.500 6.500a8 8 0 1 0 2.300 5.500'/><circle cx='12' cy='12' r='3'/>","target":"<circle cx='12' cy='12' r='8'/><circle cx='12' cy='12' r='3'/>","thermo":"<path d='M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z'/>","trash":"<path d='M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13'/>","tune":"<path d='M4 7h10M18 7h2M4 17h4M12 17h8'/><circle cx='16' cy='7' r='2'/><circle cx='10' cy='17' r='2'/>","tv":"<rect x='3' y='5' width='18' height='12' rx='2'/><path d='M8 21h8'/>","undo":"<path d='M9 14 4 9l5-5'/><path d='M4 9h10.5a5.5 5.5 0 0 1 0 11H11'/>","up":"<path d='M12 19V5M6 11l6-6 6 6'/>","vac":"<circle cx='12' cy='12' r='8'/><circle cx='12' cy='12' r='3'/>","voldown":"<path d='M4 9v6h4l5 4V5L8 9z'/><path d='M16 9a4 4 0 0 1 0 6'/>","volup":"<path d='M4 9v6h4l5 4V5L8 9z'/><path d='M16 9a4 4 0 0 1 0 6M18.500 6.500a8 8 0 0 1 0 11'/>","walk":"<circle cx='13' cy='5' r='2'/><path d='M12 21l2-7-3-3 2-3 3 3h3M9 14l-2 7'/>","wave1":"<path d='M2 12c2.500-1.500 4.500-1.500 7 0s4.500 1.500 7 0 4.500-1.500 6 0'/>","wave2":"<path d='M2 12c2.500-3 4.500-3 7 0s4.500 3 7 0 4.500-3 6 0'/>","wave3":"<path d='M2 12c2.500-5 4.500-5 7 0s4.500 5 7 0 4.500-5 6 0'/>","wave4":"<path d='M2 12c1.200-8 2.300-8 3.500 0s2.300 8 3.500 0 2.300-8 3.500 0 2.300 8 3.500 0 2.300-8 3.500 0'/>","wrench":"<path d='M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3l9-9a4 4 0 0 0-2-2z'/>"};
var HOST_CSS = ":root{--bg:#1b1c20;--bg-warm:#2b2926;--bar:#14151a;--head:#232429;--row:#25262a;--row-hi:#2d2e33;--tile:#3a3b3e;--tile-low:#2c2d30;--line:#33343a;--ink:#f4f4f6;--ink2:#a9a9af;--label:#8f8f95;--acc:#2e68f7;--gold1:#fbdb90;--gold2:#d6ab5b;--gold-ink:#2a2116;--f-card:var(--row);--f-raise:var(--row-hi);--f-line:var(--line);--f-line2:#45464d;--ckfg:#fff;--warm:#f6cd72;--r-s:10px;--r-m:14px;--r-l:18px;--r-xl:22px;--r-row:12px;--sp:10px;--sp-s:8px;--sp-l:12px;--sp-head:14px 6px 8px;--fs-xs:11px;--fs-s:13px;--fs-m:14px;--fs-l:16px;--sab:max(var(--safe-area-inset-bottom,0px),env(safe-area-inset-bottom,0px));--sat:max(var(--safe-area-inset-top,0px),env(safe-area-inset-top,0px));--tabs:58px}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}html,body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.35 -apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}hue-plus-panel{display:block;height:100vh}button{font:inherit;color:inherit}svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.ic{display:flex;align-items:center;justify-content:center;flex:none}.ic svg{width:24px;height:24px}#hp{position:fixed;inset:0;display:flex;flex-direction:column;background:linear-gradient(180deg,var(--bg-warm) 0,var(--bg) 420px)}#hp .view{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:calc(var(--sat) + 14px) 16px calc(var(--tabs) + var(--sab) + 28px)}#hp .view>.in{max-width:760px;margin:0 auto}#hp nav.tabs{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;justify-content:center;background:var(--bar);padding-bottom:var(--sab)}#hp nav.tabs .in{display:flex;width:100%;max-width:760px}#hp nav.tabs button{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:9px 2px 8px;background:none;border:0;color:#5d5e66;cursor:pointer;font-size:9.5px;letter-spacing:.03em;text-transform:uppercase}#hp nav.tabs button svg{width:25px;height:25px}#hp nav.tabs button.on{color:#fff}#hp nav.tabs button:focus-visible{outline:2px solid var(--acc);outline-offset:-3px;border-radius:10px}.hd{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:6px 0 4px}.hd h1{margin:0;font-size:29px;font-weight:700;letter-spacing:-.01em;line-height:1.15}.hd .acts{display:flex;align-items:center;gap:10px;margin-left:auto}.top{display:flex;justify-content:flex-end;gap:10px;min-height:30px;margin-bottom:10px}.lb{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--label);margin:28px 4px 10px}.empty{color:var(--ink2);text-align:center;padding:36px 12px;font-size:var(--fs-l)}.rbt{width:30px;height:30px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none;padding:0}.rbt svg{width:17px;height:17px}.rbt.dk{background:var(--tile)}.rbt:focus-visible{outline:2px solid #fff;outline-offset:2px}.tg{width:47px;height:29px;border-radius:15px;flex:none;background:#56575c;position:relative;cursor:pointer;border:0;padding:0;transition:background .2s}.tg i{position:absolute;left:2px;top:2px;width:25px;height:25px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.4);transition:transform .2s}.tg.on{background:var(--acc)}.tg.on i{transform:translateX(18px)}.tg:focus-visible{outline:2px solid #fff;outline-offset:2px}.sl{position:relative;height:18px;touch-action:pan-y;cursor:pointer;display:flex;align-items:center}.sl:before{content:\"\";position:absolute;left:0;right:0;height:8px;border-radius:4px;background:rgba(255,255,255,.16)}.sl .kn{position:absolute;top:0;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.45);left:0}.rooms{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:12px}.room{position:relative;background:var(--tile);border-radius:var(--r-l);padding:16px 18px 14px;display:flex;flex-direction:column;gap:14px;cursor:pointer;min-height:92px;transition:background .25s;color:#fff}.room .rh{display:flex;align-items:center;gap:20px}.room .rh .ic svg{width:28px;height:28px}.room .rn{flex:1;min-width:0;font-size:17px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.room:focus-visible{outline:2px solid #fff;outline-offset:2px}.on-gold{background:linear-gradient(180deg,var(--gold1) 0,var(--gold2) 100%);color:var(--gold-ink)}.on-gold .tg{background:rgba(70,52,12,.38)}.on-gold .tg.on{background:rgba(70,52,12,.38)}.on-gold .sl:before{background:rgba(70,52,12,.22)}.rhead{padding:calc(var(--sat) + 10px) 16px 16px;border-radius:0 0 22px 22px;background:linear-gradient(180deg,var(--tile) 0,var(--tile-low) 100%);color:#fff;transition:background .25s}.rhead.on-gold{box-shadow:0 8px 24px rgba(0,0,0,.35)}.rhead .rr{display:flex;align-items:center;gap:10px}.rhead .rr .nm{flex:1;min-width:0;font-size:17px;font-weight:500;margin-left:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rhead .rr .tg{margin-left:4px}.rhead .sl{margin-top:20px}.rhead.on-gold .rbt{background:rgba(255,255,255,.34);color:#fff}.rbody{padding:4px 16px calc(var(--sab) + 40px);max-width:760px;margin:0 auto}.stiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:12px}.stile{position:relative;border-radius:var(--r-m);background:var(--tile);height:104px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:0 6px 12px;cursor:pointer;overflow:hidden;color:#fff;text-align:center}.stile .dots{position:absolute;left:0;right:0;top:12px;display:flex;flex-wrap:wrap;justify-content:center;gap:5px 6px;padding:0 10px}.stile .dots i{width:20px;height:20px;border-radius:50%;background:var(--c,#888)}.stile b{font-size:14px;font-weight:500;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}.stile .gear{position:absolute;right:6px;top:6px;width:26px;height:26px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:inherit;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}.stile .gear svg{width:14px;height:14px}.stile.add{background:transparent;border:2px dashed #4a4b50;color:var(--ink2);justify-content:center;padding:0}.stile.add svg{width:28px;height:28px}.stile:focus-visible{outline:2px solid #fff;outline-offset:2px}.ltiles{display:flex;gap:12px;overflow-x:auto;padding:0 0 6px;margin:0 -16px;padding-left:16px;padding-right:16px;scrollbar-width:none}.ltiles::-webkit-scrollbar{display:none}.ltile{flex:none;width:96px;height:150px;border-radius:var(--r-m);background:var(--tile);color:#fff;display:flex;flex-direction:column;overflow:hidden;cursor:pointer;transition:background .25s}.ltile .up{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:8px 6px 4px;min-height:0}.ltile .up .ic svg{width:28px;height:28px}.ltile .up b{font-size:13.5px;font-weight:500;line-height:1.2;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ltile .dn{height:52px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.14)}.ltile.on-gold{background:linear-gradient(180deg,var(--gold1) 0,var(--gold2) 100%)}.ltile.gone{opacity:.5}.ltile:focus-visible{outline:2px solid #fff;outline-offset:2px}.ctiles{display:flex;flex-wrap:wrap;gap:12px}.ctile{width:calc(50% - 6px);max-width:150px;min-height:104px;border-radius:var(--r-m);background:var(--tile);padding:12px 12px 12px;display:flex;flex-direction:column;justify-content:space-between;cursor:pointer;color:#fff}.ctile .ic{justify-content:flex-start}.ctile .ic svg{width:26px;height:26px}.ctile b{display:block;font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ctile i{display:block;font-style:normal;font-size:13px;color:var(--ink2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ctile:focus-visible{outline:2px solid #fff;outline-offset:2px}.addgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:6px 16px 24px}.addgrid .atile{aspect-ratio:1.5;border-radius:var(--r-m);background:var(--tile);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;cursor:pointer;font-size:14px;font-weight:500;color:#fff}.atile .ci{width:48px;height:48px;border-radius:50%;background:#101114;display:flex;align-items:center;justify-content:center}.atile .ci svg{width:24px;height:24px}.atile:focus-visible{outline:2px solid #fff;outline-offset:2px}.lightframe{position:fixed;left:0;right:0;bottom:0;top:0;z-index:55;border:0;width:100%;height:100%;background:transparent;display:none}.lightframe.show{display:block}.pg{position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;background:var(--bg);transform:translateX(24px);opacity:0;transition:transform .22s cubic-bezier(.2,.8,.2,1),opacity .18s}.pg.in{transform:none;opacity:1}.pg .pbar{display:flex;align-items:center;gap:14px;background:var(--head);padding:calc(var(--sat) + 10px) 16px 12px;flex:none}.pg .pbar .rbt{background:var(--tile);width:32px;height:32px}.pg .pbar .rbt svg{width:17px;height:17px;stroke-width:2.2}.pg .pbar .ttl{flex:1;min-width:0;font-size:15.5px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pg .pbar .ttl .ic{display:none}.pg .pbar .act{border:0;background:var(--tile);color:#fff;border-radius:16px;padding:8px 17px;font-size:13px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;cursor:pointer}.pg .pbar .act:disabled{opacity:.5;cursor:default}.pg .pbody{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:0 0 calc(var(--sab) + 32px)}.pg .pbody>*{max-width:760px;margin-left:auto;margin-right:auto}.pg.bare .pbar{background:transparent}@media(prefers-reduced-motion:reduce){*{transition:none!important}}.pill{position:relative;display:flex;align-items:center;gap:14px;min-height:62px;padding:10px 18px;background:var(--row);cursor:pointer;overflow:hidden}.pill+.pill{border-top:1px solid var(--line)}.pill.static{cursor:default}.pill .tx{flex:1;min-width:0;display:flex;flex-direction:column;position:relative;z-index:1}.pill .nm{font-size:16px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pill .sb{font-size:var(--fs-s);color:var(--ink2);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pill .vl{font-size:var(--fs-m);color:var(--ink2);font-variant-numeric:tabular-nums;white-space:nowrap;position:relative;z-index:1}.pill>.ic{position:relative;z-index:1;width:40px;height:40px;border-radius:50%;background:#101114;color:#fff}.pill>.ic svg{width:21px;height:21px}.pill.on>.ic{background:var(--gold1);color:var(--gold-ink)}.pill .ck{width:22px;height:22px;flex:none;color:var(--acc);opacity:0;display:flex}.pill .ck svg{width:22px;height:22px;stroke-width:2.4}.pill.checked .ck{opacity:1}.pill:focus-visible{outline:2px solid var(--acc);outline-offset:-2px}.pill.slide{touch-action:pan-y}.pill.slide .fill{position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(46,104,247,.38);transition:width .15s;z-index:0}.pill.slide .fill:after{content:\"\";position:absolute;right:0;top:12px;bottom:12px;width:3px;border-radius:3px;background:rgba(255,255,255,.75)}.sep{display:flex;align-items:center;gap:8px;font-size:var(--fs-xs);letter-spacing:.18em;text-transform:uppercase;color:var(--label);margin:26px 18px 10px}.sep svg{display:none}.hint{font-size:var(--fs-s);color:var(--ink2);margin:10px 18px}.notec.pane.dim{font-size:var(--fs-m);color:var(--ink2);line-height:1.45;padding:14px 18px}.sqw.pane{background:var(--row);padding:4px 18px}.sq{width:100%;min-height:52px;background:none;border:0;color:var(--ink);font:inherit;font-size:var(--fs-l);outline:none}.gridl{display:grid;gap:var(--sp);padding:0 16px}.gridl.g2{grid-template-columns:1fr 1fr}.chev{display:flex}.pane{position:relative}.scrim{position:fixed;inset:0;opacity:0;transition:opacity .25s;z-index:80;background:rgba(0,0,0,.6)}.scrim.in{opacity:1}.dlg{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:90;width:min(360px,88%);border-radius:var(--r-xl);padding:22px;text-align:center;background:var(--head);box-shadow:0 20px 50px rgba(0,0,0,.5)}.dlg p{margin:0 0 20px;font-size:var(--fs-l);line-height:1.4}.dlg .rrow{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp)}.rbtn{min-height:46px;display:flex;align-items:center;justify-content:center;border-radius:999px;background:var(--tile);cursor:pointer;font-weight:600;user-select:none}.rbtn.go{background:var(--acc);color:#fff}.toast{position:fixed;left:50%;bottom:calc(var(--tabs) + var(--sab) + 18px);transform:translate(-50%,10px);padding:11px 18px;border-radius:999px;font-size:var(--fs-m);z-index:95;opacity:0;transition:opacity .25s,transform .25s;background:var(--tile);max-width:90vw;text-align:center}.toast.in{opacity:1;transform:translate(-50%,0)}.hm{padding:0 0 24px}.hm .hm-bigi{width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex:none;color:#fff}.hm .hm-bigi svg{width:34px;height:34px}.hm .hm-title{padding:18px 18px 8px}.hm .hm-tt{min-width:0;display:block;margin-top:6px}.hm .hm-tt b{display:block;font-size:30px;font-weight:700;line-height:1.1;overflow-wrap:anywhere}.hm .hm-tt i{display:block;font-style:normal;font-size:var(--fs-m);color:var(--ink2);margin-top:6px}.hm .hm-label{font-size:var(--fs-xs);letter-spacing:.18em;text-transform:uppercase;color:var(--label);padding:26px 18px 10px}.hm .hm-group{background:var(--row);margin:0;border:0;border-radius:0}.hm .hm-row{display:flex;align-items:center;gap:14px;min-height:64px;padding:10px 18px;transition:background .2s}.hm .hm-row+.hm-row{border-top:1px solid var(--line)}.hm .hm-row.tap{cursor:pointer;user-select:none}.hm .hm-row.tap:active{background:var(--row-hi)}.hm .hm-row:focus-visible{outline:2px solid var(--acc);outline-offset:-2px}.hm .hm-i{width:40px;height:40px;border-radius:50%;background:#101114;display:flex;align-items:center;justify-content:center;flex:none;color:#fff}.hm .hm-i svg,.hm .hm-c svg,.hm .hm-ck svg,.hm .hm-ni svg,.hm .hm-ti svg,.hm .hm-gear svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.hm .hm-i svg{width:21px;height:21px}.hm .hm-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.hm .hm-n{font-size:16px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hm .hm-s{font-size:var(--fs-s);color:var(--ink2);overflow-wrap:anywhere}.hm .hm-v{font-size:var(--fs-m);color:var(--ink2);white-space:nowrap;font-variant-numeric:tabular-nums}.hm .hm-c{width:20px;height:20px;flex:none;color:var(--ink2);display:flex;align-items:center}.hm .hm-c svg{width:18px;height:18px;transform:rotate(-90deg)}.hm .hm-row.stack{min-height:58px}.hm .hm-row.good .hm-s{color:#6dd58c}.hm .hm-row.danger .hm-n{color:#ff6b62}.hm .hm-ck{width:22px;height:22px;flex:none;color:var(--acc);opacity:0;transition:opacity .2s}.hm .hm-ck svg{width:22px;height:22px;stroke-width:2.4}.hm .hm-row.checked .hm-ck,.hm .hm-row.good .hm-ck{opacity:1}.hm .hm-row.good .hm-ck{color:#6dd58c}.hm .hm-sw{width:47px;height:29px;border-radius:15px;flex:none;background:#56575c;position:relative;transition:background .2s}.hm .hm-sw i{position:absolute;left:2px;top:2px;width:25px;height:25px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.4);transition:transform .2s}.hm .hm-row.on .hm-sw{background:var(--acc)}.hm .hm-row.on .hm-sw i{transform:translateX(18px)}.hm .hm-note{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;margin:16px 16px;border-radius:var(--r-row);font-size:var(--fs-m);line-height:1.4;color:var(--ink2);background:rgba(46,104,247,.1);border:1px solid rgba(46,104,247,.4)}.hm .hm-ni{width:20px;height:20px;flex:none;color:var(--acc);margin-top:1px}.hm .hm-ni svg{width:20px;height:20px}.hm .hm-actions{display:flex;flex-direction:column;align-items:center;gap:12px;padding:26px 0 6px}.hm .hm-btn{min-width:120px;padding:10px 26px;border-radius:999px;border:1px solid transparent;font:inherit;font-size:var(--fs-m);font-weight:600;cursor:pointer;color:#fff;transition:transform .1s,filter .2s}.hm .hm-btn:active{transform:scale(.97)}.hm .hm-btn:focus-visible{outline:2px solid #fff;outline-offset:2px}.hm .hm-btn.primary{background:var(--acc)}.hm .hm-btn.ghost{background:var(--tile)}.hm .hm-btn.danger{background:transparent;color:#ff6b62;border:1.5px solid #e5484d}.hm .hm-chips{display:flex;gap:8px;margin:0 16px 10px}.hm .hm-chip{flex:1;padding:10px 0;border-radius:999px;border:0;background:var(--tile);color:#fff;font:inherit;font-size:var(--fs-m);font-weight:600;cursor:pointer;transition:background .2s}.hm .hm-chip.on{background:var(--acc)}.hm .hm-tiles{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:0 16px}.hm .hm-tile{position:relative;min-height:116px;padding:14px;border-radius:var(--r-m);display:flex;flex-direction:column;justify-content:flex-end;gap:2px;background:var(--tile);cursor:pointer;user-select:none;transition:background .2s}.hm .hm-tile b{font-size:var(--fs-l);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hm .hm-tile i{font-style:normal;font-size:var(--fs-s);color:var(--ink2)}.hm .hm-ti{position:absolute;left:14px;top:14px;width:30px;height:30px}.hm .hm-ti svg{width:28px;height:28px}.hm .hm-tile.on{background:linear-gradient(180deg,var(--gold1),var(--gold2));color:var(--gold-ink)}.hm .hm-tile.on i{color:rgba(42,33,22,.7)}.hm .hm-gear{position:absolute;right:10px;top:10px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:inherit;display:flex;align-items:center;justify-content:center;cursor:pointer}.hm .hm-gear svg{width:18px;height:18px}.hm .hm-time{flex:1;min-height:44px;padding:8px 12px;border-radius:var(--r-row);border:0;background:var(--tile);color:#fff;font:inherit;font-size:var(--fs-l);font-variant-numeric:tabular-nums}.hm .hm-time:focus-visible{outline:2px solid var(--acc);outline-offset:1px}.bar{position:relative;height:40px;border-radius:20px;background:var(--tile);overflow:hidden;touch-action:pan-y;cursor:pointer}.bar .fill{position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,var(--gold1),var(--gold2));border-radius:inherit;transition:width .12s}.bar .vl{position:absolute;left:16px;top:50%;transform:translateY(-50%);font-size:var(--fs-s);font-weight:600;color:#fff;text-shadow:0 0 3px rgba(0,0,0,.6);pointer-events:none}.bar.off .fill{width:0!important}.asheet{position:fixed;left:8px;right:8px;bottom:calc(var(--sab) + 8px);z-index:90;max-width:520px;margin:0 auto;background:var(--head);border-radius:var(--r-xl);overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.5)}.arow{display:block;width:100%;min-height:56px;border:0;background:none;color:#fff;font-size:17px;cursor:pointer;border-top:1px solid var(--line)}.arow:first-child{border-top:0}.arow.danger{color:#ff6b62}.arow.cancel{font-weight:600}.pg.roompg .pbar{display:none}.pg.roompg .pbody{padding:0 0 calc(var(--sab) + 24px)}.pg.roompg .pbody>*{max-width:none}.pg.roompg .rhead{position:sticky;top:0;z-index:5}.pg.roompg .rbody{max-width:760px}#hp .view .hm .hm-group{margin-left:-16px;margin-right:-16px}#hp .view .hm .hm-label{padding-left:20px}.room.on-gold,.stile.on-gold,.ltile.on-gold,.rhead.on-gold{background:linear-gradient(180deg,var(--gold1) 0,var(--gold2) 100%);color:var(--gold-ink)}.rhead.on-gold{color:#fff;text-shadow:0 1px 2px rgba(60,45,15,.35)}.rhead.on-gold .sl:before{background:rgba(70,52,12,.25)}.ltile.on-gold .dn{background:rgba(70,52,12,.16)}.gridl .pill{flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:12px;min-height:118px;padding:14px;background:var(--tile);border-radius:var(--r-m)}.gridl .pill+.pill{border-top:0}.gridl .pill .nm,.gridl .pill .sb{white-space:normal;overflow:visible}.gridl .pill .tx{flex:none}";
/* The host of the Hue dashboard panel: what the Hue Plus pages expect of the dashboard they run in (the plugin API, version 1, which Home Control also offers), made for this panel.
 It gives them Home Assistant's states and registries, service calls, rows and sliders, sheets that open over the tab (with the "unsaved changes" question), dialogs and toasts, in the Hue app's look.
 The pages themselves (the Hue Plus menu, the wizards, the Spotify sync and the sync box) are the very same files Home Control loads; nothing here knows about them except the registration they make.
 Home Control's dashboard is not loaded here: its light panel runs in a frame of its own (light.js, popup.html). */
(function () {
  var EN = {
    brightness: "Brightness",
    colour: "Colour",
    freeze: "Freeze",
    hidden: "Hidden",
    mode: "Mode",
    palette: "Palette",
    paused: "Paused",
    play: "Play",
    playing: "Playing",
    speed: "Speed",
    style: "Style",
    visible: "Visible",
    now_playing: "Now playing",
    nothing_playing: "Nothing playing",
    speaker: "Speaker",
    tv: "TV",
    note: "Note",
    add_at_least_one_light: "Add at least one light",
    all_off: "All off",
    area: "Area",
    auto: "Auto",
    automations: "Automations",
    button: "Button",
    clock: "Clock",
    firmware: "Firmware",
    give_the_area_a_name: "Give the area a name",
    home: "Home",
    home_and_away: "Home and Away",
    hue_plus: "Hue Plus",
    in_this_room: "in this room.",
    light: "Light",
    lights: "Lights",
    loading: "Loading…",
    lock: "Lock",
    manual: "Manual",
    no_effect: "No effect",
    none: "None",
    nothing_found: "Nothing found",
    number: "Number",
    off: "Off",
    on_2: "On",
    other: "Other",
    pause: "Pause",
    power: "Power",
    press: "Press",
    rooms: "Rooms",
    safety: "Safety",
    scene: "Scene",
    scenes: "Scenes",
    switch: "Switch",
    time: "Time",
    unavailable: "Unavailable",
    zigbee_channel: "Zigbee channel",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    discard_changes: "Discard changes",
    unsaved_changes: "Unsaved changes",
    done: "Done",
    back: "Back",
    close: "Close",
  };

  function T(key) {
    if (EN[key] !== undefined) return EN[key];
    return key;
  }

  /* ---- drawing ---- */

  function mk(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function svg(name) {
    return "<svg viewBox='0 0 24 24'>" + (HOST_ICONS[name] || HOST_ICONS.info) + "</svg>";
  }

  function ic(name) {
    return "<span class='ic'>" + svg(name) + "</span>";
  }

  function cap(s) {
    s = String(s || "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function cntS(n, one, many) {
    return n + " " + (n === 1 ? one : many);
  }

  /* ---- Home Assistant: states, registries, calls ---- */

  var HASS = null;
  var REGISTRY = { entities: {}, devices: {}, areas: {} };
  var REGISTRY_SOURCES = [
    {
      key: "entities",
      list: "config/entity_registry/list",
      event: "entity_registry_updated",
      pick: function (e) {
        return e.disabled_by
          ? null
          : { entity_id: e.entity_id, device_id: e.device_id || null, area_id: e.area_id || null, platform: e.platform, unique_id: e.unique_id || null, entity_category: e.entity_category || null, hidden: !!e.hidden_by };
      },
      id: function (e) {
        return e.entity_id;
      },
    },
    {
      key: "devices",
      list: "config/device_registry/list",
      event: "device_registry_updated",
      pick: function (d) {
        return { id: d.id, name: d.name, name_by_user: d.name_by_user || null, area_id: d.area_id || null, manufacturer: d.manufacturer || null, model: d.model || null };
      },
      id: function (d) {
        return d.id;
      },
    },
    {
      key: "areas",
      list: "config/area_registry/list",
      event: "area_registry_updated",
      pick: function (a) {
        return { area_id: a.area_id, name: a.name };
      },
      id: function (a) {
        return a.area_id;
      },
    },
  ];
  var FACADE = {
    get states() {
      return HASS.states;
    },
    get services() {
      return HASS.services;
    },
    get config() {
      return HASS.config;
    },
    get user() {
      return HASS.user;
    },
    get locale() {
      return HASS.locale;
    },
    get entities() {
      return REGISTRY.entities;
    },
    get devices() {
      return REGISTRY.devices;
    },
    get areas() {
      return REGISTRY.areas;
    },
    callService: function (domain, service, data) {
      return HASS.callService(domain, service, data);
    },
  };
  var REGISTRIES_READY = null;

  function loadRegistry(src) {
    return HASS.callWS({ type: src.list }).then(
      function (rows) {
        var out = {};
        (rows || []).forEach(function (r) {
          var v = src.pick(r);
          if (v) out[src.id(r)] = v;
        });
        REGISTRY[src.key] = out;
        schedule();
      },
      function (err) {
        console.warn("[hue-plus] could not read " + src.list, err);
      }
    );
  }

  function watchRegistry(src) {
    var timer = 0;
    HASS.connection.subscribeEvents(function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        loadRegistry(src);
      }, 400);
    }, src.event);
  }

  function attach(h) {
    var first = !HASS;
    HASS = h;
    if (first)
      REGISTRIES_READY = Promise.all(REGISTRY_SOURCES.map(loadRegistry)).then(function () {
        REGISTRY_SOURCES.forEach(watchRegistry);
      });
    if (HOST.onHass) HOST.onHass(h);
    schedule();
  }

  function H() {
    return FACADE;
  }

  function A(id) {
    var s = HASS && HASS.states[id];
    return (s && s.attributes) || {};
  }

  function V_(id) {
    var s = HASS && HASS.states[id];
    return s ? s.state : "unavailable";
  }

  function isOn(id) {
    return V_(id) === "on";
  }

  function errorText(e) {
    return (e && (e.message || e.error || (e.body && e.body.message))) || T("unavailable");
  }

  function callRaw(domain, service, data) {
    if (!HASS) return undefined;
    var p = Promise.resolve(HASS.callService(domain, service, data));
    p.catch(function (e) {
      toast(errorText(e));
    });
    return p;
  }

  function call(domain, service, data) {
    callRaw(domain, service, data);
  }

  /* The same call, for a slider that sends many: a failure is not shown each time. */
  function callLive(key, domain, service, data) {
    if (HASS)
      Promise.resolve(HASS.callService(domain, service, data)).catch(function () {});
  }

  function serviceResponse(domain, service, data) {
    return HASS.callWS({ type: "call_service", domain: domain, service: service, service_data: data, return_response: true }).then(function (r) {
      return r && r.response;
    });
  }

  function toggleEnt(id) {
    var domain = id.split(".")[0];
    if (domain === "light" || domain === "switch" || domain === "input_boolean") call(domain, "toggle", { entity_id: id });
    else call("homeassistant", "toggle", { entity_id: id });
  }

  /* ---- what redraws: functions a page registers, called again whenever Home Assistant changes ---- */

  var TAB_LIST = [];
  var SHEET_LIST = [];
  var BUILDING = null;
  var QUEUED = false;

  function reg(f) {
    (BUILDING || SHEET_LIST).push(f);
  }

  function refresh() {
    TAB_LIST.concat(SHEET_LIST).forEach(function (f) {
      try {
        f();
      } catch (e) {
        console.error("[hue-plus]", e);
      }
    });
  }

  /* One redraw per frame, however many changes arrive. */
  function schedule() {
    if (QUEUED) return;
    QUEUED = true;
    requestAnimationFrame(function () {
      QUEUED = false;
      refresh();
      if (HOST.onUpdate) HOST.onUpdate();
    });
  }

  /* ---- toasts and questions ---- */

  function toast(text) {
    var t = mk("div", "toast");
    t.setAttribute("role", "status");
    t.textContent = text;
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      t.classList.add("in");
    });
    setTimeout(function () {
      t.classList.remove("in");
      setTimeout(function () {
        t.remove();
      }, 300);
    }, 2400);
  }

  /* A question with buttons: [{label, fn, primary}]; Cancel is always there. */
  function ask(text, buttons) {
    var bg = mk("div", "scrim"),
      d = mk("div", "dlg"),
      row = mk("div", "rrow");
    bg.style.zIndex = 69;
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-modal", "true");
    d.appendChild(mk("p")).textContent = text;
    function close() {
      bg.remove();
      d.remove();
    }
    buttons = [{ label: T("cancel") }].concat(buttons);
    d.style.display = "block";
    row.style.gridTemplateColumns = "repeat(" + buttons.length + ",1fr)";
    buttons.forEach(function (b, i) {
      var r = mk("div", "rbtn" + (i === buttons.length - 1 ? " go" : ""));
      r.textContent = b.label;
      r.tabIndex = 0;
      r.setAttribute("role", "button");
      function act() {
        close();
        if (b.fn) b.fn();
      }
      r.addEventListener("click", act);
      r.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          act();
        }
      });
      row.appendChild(r);
    });
    d.appendChild(row);
    bg.addEventListener("click", close);
    document.body.appendChild(bg);
    document.body.appendChild(d);
    requestAnimationFrame(function () {
      bg.classList.add("in");
    });
  }

  function confirmDlg(text, fn) {
    ask(text, [{ label: T("confirm"), fn: fn }]);
  }

  /* ---- rows and sliders ---- */

  function pill(icon, name, o) {
    o = o || {};
    var r = mk("div", "pill" + (o.tap ? "" : " static") + (o.on ? " tg" : ""));
    r.innerHTML = ic(icon) + "<span class='tx'><span class='nm'></span><span class='sb'></span></span><span class='vl'></span>";
    r.querySelector(".nm").textContent = name;
    var sb = r.querySelector(".sb"),
      vl = r.querySelector(".vl");
    if (o.check) {
      r.classList.add("chk");
      r.setAttribute("role", "checkbox");
      r.appendChild(mk("span", "ck", svg("check")));
    }
    if (o.tap) {
      r.tabIndex = 0;
      if (!o.check) r.setAttribute("role", "button");
      var act = function (e) {
        if (o.iconTap && e && e.target.closest && e.target.closest(".ic")) {
          o.iconTap();
          return;
        }
        o.tap();
      };
      r.addEventListener("click", act);
      r.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          o.tap();
        }
      });
    }
    r.refresh = function () {
      if (o.check) {
        var ck = !!o.check();
        r.classList.toggle("checked", ck);
        r.setAttribute("aria-checked", ck ? "true" : "false");
      }
      r.classList.toggle("on", o.on ? !!o.on() : false);
      var t = o.sub ? o.sub() : "";
      sb.textContent = t || "";
      sb.style.display = t ? "" : "none";
      vl.textContent = o.val ? o.val() : "";
    };
    reg(r.refresh);
    return r;
  }

  function sep(name, icon) {
    var s = mk("div", "sep", svg(icon || "info") + "<span></span>");
    s.querySelector("span").textContent = name;
    return s;
  }

  /* Horizontal drag on an element: h = {onMove(fraction), onCommit(fraction), onCancel(), onTap()}. A mostly vertical move is a scroll and is left alone. */
  function attachSlide(el, h) {
    var sx = 0,
      sy = 0,
      down = false,
      moved = false,
      scrolling = false,
      rect = null;
    function frac(e) {
      return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    }
    el.addEventListener("pointerdown", function (e) {
      down = true;
      moved = false;
      scrolling = false;
      sx = e.clientX;
      sy = e.clientY;
      rect = el.getBoundingClientRect();
      try {
        el.setPointerCapture(e.pointerId);
      } catch (x) {}
    });
    el.addEventListener("pointermove", function (e) {
      if (!down || scrolling) return;
      if (!moved) {
        var dx = Math.abs(e.clientX - sx),
          dy = Math.abs(e.clientY - sy);
        if (dy > 8 && dy >= dx) {
          scrolling = true;
          return;
        }
        if (dx > 6) moved = true;
      }
      if (moved) h.onMove(frac(e));
    });
    function finish(e, cancelled) {
      if (!down) return;
      down = false;
      if (cancelled || scrolling) {
        if (h.onCancel) h.onCancel();
        return;
      }
      if (moved) h.onCommit(frac(e));
      else if (h.onTap) h.onTap(e);
      else h.onCommit(frac(e));
    }
    el.addEventListener("pointerup", function (e) {
      finish(e, false);
    });
    el.addEventListener("pointercancel", function (e) {
      finish(e, true);
    });
  }

  /* A row that is a slider: o = {icon, name, min, max, step, get(), fmt(v), on(), live(v), commit(v), readonly}. */
  function sliderRow(o) {
    var r = mk("div", "pill slide");
    r.innerHTML = "<div class='fill'></div>" + ic(o.icon) + "<span class='tx'><span class='nm'></span><span class='sb'></span></span><span class='vl'></span>";
    r.querySelector(".nm").textContent = o.name;
    var fill = r.querySelector(".fill"),
      vl = r.querySelector(".vl"),
      drag = false,
      liveAt = 0;
    if (!o.readonly) {
      r.tabIndex = 0;
      r.setAttribute("role", "slider");
      r.setAttribute("aria-label", o.name);
      r.setAttribute("aria-valuemin", o.min);
      r.setAttribute("aria-valuemax", o.max);
    }
    function snap(f) {
      var v = o.min + f * (o.max - o.min),
        st = o.step || 1;
      v = Math.round((v - o.min) / st) * st + o.min;
      return Math.max(o.min, Math.min(o.max, Number(v.toFixed(2))));
    }
    function paint(v) {
      var f = Math.max(0, Math.min(1, (v - o.min) / (o.max - o.min)));
      fill.style.width = f * 100 + "%";
      vl.textContent = o.fmt ? o.fmt(v) : v;
      r.setAttribute("aria-valuenow", v);
    }
    if (!o.readonly)
      attachSlide(r, {
        onMove: function (f) {
          drag = true;
          var v = snap(f);
          paint(v);
          if (o.live && Date.now() - liveAt > 150) {
            liveAt = Date.now();
            o.live(v);
          }
        },
        onCommit: function (f) {
          var v = snap(f);
          paint(v);
          o.commit(v);
          setTimeout(function () {
            drag = false;
          }, 600);
        },
        onCancel: function () {
          drag = false;
        },
      });
    r.addEventListener("keydown", function (e) {
      if (o.readonly) return;
      var d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var v = Math.max(o.min, Math.min(o.max, o.get() + d * (o.step || 1)));
      paint(v);
      o.commit(v);
    });
    r.refresh = function () {
      if (drag) return;
      paint(o.get());
      r.classList.toggle("on", o.on ? !!o.on() : false);
    };
    reg(r.refresh);
    return r;
  }

  /* A brightness button: a slider bar showing a percentage. o = {pct(), lit(), fmt(v), live(v), commit(v)}. */
  function briControl(o) {
    var bar = mk("div", "bar live");
    bar.innerHTML = "<div class='fill'></div><span class='vl'></span>";
    bar.tabIndex = 0;
    bar.setAttribute("role", "slider");
    bar.setAttribute("aria-label", T("brightness"));
    var fill = bar.querySelector(".fill"),
      vl = bar.querySelector(".vl"),
      drag = false,
      liveAt = 0;
    function paint(v) {
      fill.style.width = v + "%";
      vl.textContent = o.fmt ? o.fmt(v) : v + "%";
      bar.setAttribute("aria-valuenow", v);
    }
    function snap(f) {
      return Math.max(1, Math.round(f * 100));
    }
    attachSlide(bar, {
      onMove: function (f) {
        drag = true;
        var v = snap(f);
        paint(v);
        if (o.live && Date.now() - liveAt > 150) {
          liveAt = Date.now();
          o.live(v);
        }
      },
      onCommit: function (f) {
        var v = snap(f);
        paint(v);
        o.commit(v);
        setTimeout(function () {
          drag = false;
        }, 600);
      },
      onCancel: function () {
        drag = false;
      },
    });
    bar.refresh = function () {
      if (drag) return;
      paint(o.pct());
      bar.classList.toggle("off", o.lit ? !o.lit() : false);
    };
    reg(bar.refresh);
    return bar;
  }

  /* A row that chooses one of some options with the device's own chooser: dropRow(label, options(), value(), set(v), icon). */
  function dropRow(label, options, value, set, icon) {
    var r = pill(icon || "tune", label, {
        val: function () {
          return value() || "";
        },
      }),
      sel = mk("select");
    sel.setAttribute("aria-label", label);
    sel.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer";
    r.classList.add("selrow");
    r.appendChild(sel);
    sel.addEventListener("change", function () {
      set(sel.value);
    });
    var base = r.refresh;
    r.refresh = function () {
      base();
      var list = options() || [],
        cur = value();
      if (sel.dataset.sig !== list.join("|")) {
        sel.innerHTML = "";
        list.forEach(function (o) {
          var op = mk("option");
          op.value = o;
          op.textContent = o;
          sel.appendChild(op);
        });
        sel.dataset.sig = list.join("|");
      }
      sel.value = cur;
    };
    reg(r.refresh);
    return r;
  }

  function switchPill(icon, name, id) {
    return pill(icon, name, {
      on: function () {
        return isOn(id);
      },
      tap: function () {
        toggleEnt(id);
      },
    });
  }

  function pop(el) {
    if (el && el.animate) el.animate([{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }], { duration: 220 });
  }

  /* ---- colours (for the colour of a scene, the pill of a light) ---- */

  function cssToRgb(s) {
    if (!s) return null;
    var m = String(s).match(/[\d.]+/g);
    if (/^#/.test(s)) {
      var h = s.slice(1);
      if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    return m && m.length >= 3 ? m.slice(0, 3).map(Number) : null;
  }

  function cssRgb(rgb) {
    return rgb ? "rgb(" + Math.round(rgb[0]) + "," + Math.round(rgb[1]) + "," + Math.round(rgb[2]) + ")" : "";
  }

  /* The colour of a white at a temperature in kelvin (Tanner Helland's approximation). */
  function kelvinRgb(k) {
    var t = Math.max(1000, Math.min(40000, k)) / 100,
      r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592),
      g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492),
      b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    function c(v) {
      return Math.max(0, Math.min(255, v));
    }
    return [c(r), c(g), c(b)];
  }

  /* The colour of an xy pair at full brightness (the wide RGB D65 conversion that Hue documents). */
  function liveXyRgb(x, y) {
    if (!y) return [255, 255, 255];
    var z = 1 - x - y,
      X = x / y,
      Z = z / y,
      r = X * 1.656492 - 0.354851 - Z * 0.255038,
      g = -X * 0.707196 + 1.655397 + Z * 0.036152,
      b = X * 0.051713 - 0.121364 + Z * 1.01153;
    function gamma(v) {
      v = Math.max(0, v);
      return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    }
    var rgb = [gamma(r), gamma(g), gamma(b)],
      m = Math.max(rgb[0], rgb[1], rgb[2], 1e-6);
    return rgb.map(function (v) {
      return Math.round((Math.max(0, v) / m) * 255);
    });
  }

  function lightMembers(id) {
    var m = A(id).entity_id;
    return Array.isArray(m) && m.length ? m.slice() : [id];
  }

  function dom(id) {
    return String(id).split(".")[0];
  }

  /* ---- sheets: pages that open over the tab ---- */

  var PAGES = {};
  var SHEET = null; /* {root, body}: the page that is open, while there is one */
  var SESSION = {}; /* what the pages ask HC.sheet for: it changes whenever the sheet closes or the tab changes, which is when what they read is read again */
  var STACK = [];
  var CURRENT = null;
  var POPGUARD = null;
  var CHECK = null; /* the guard whose checkmark the header shows */

  function pageOf(key) {
    var name = String(key).split(":")[0];
    return { def: PAGES[name], id: String(key).slice(name.length + 1) };
  }

  /* A page of the Hue app: it covers the screen, with a bar of an X (or an arrow when it was opened from another page), the title, and SAVE when what it shows is to be saved. */
  function buildSheet() {
    var root = mk("div", "pg");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.innerHTML =
      "<div class='pbar'><button type='button' class='rbt back' aria-label='" +
      T("back") +
      "'>" +
      svg("back") +
      "</button><button type='button' class='rbt x' aria-label='" +
      T("close") +
      "'>" +
      svg("close") +
      "</button><div class='ttl'><span class='tt'></span></div><button type='button' class='act ok' style='display:none'>" +
      T("save") +
      "</button></div><div class='pbody'></div>";
    var s = { root: root, body: root.querySelector(".pbody") };
    root.querySelector(".back").addEventListener("click", function () {
      popBack();
    });
    root.querySelector(".x").addEventListener("click", function () {
      closeSheet();
    });
    root.querySelector(".ok").addEventListener("click", function () {
      if (CHECK) CHECK.save(CHECK.done);
    });
    document.body.appendChild(root);
    requestAnimationFrame(function () {
      root.classList.add("in");
    });
    return s;
  }

  function title(def, id) {
    return typeof def[0] === "function" ? def[0](id) : T(def[0]);
  }

  function render(key) {
    var p = pageOf(key);
    if (!p.def) return false;
    if (HOST.onRender) HOST.onRender();
    SHEET.root.classList.remove("roompg");
    CURRENT = key;
    POPGUARD = null;
    CHECK = null;
    SHEET_LIST.length = 0;
    SHEET.root.querySelector(".ok").style.display = "none";
    SHEET.root.querySelector(".tt").textContent = title(p.def, p.id);
    SHEET.root.querySelector(".back").style.display = STACK.length ? "" : "none";
    SHEET.root.querySelector(".x").style.display = STACK.length ? "none" : "";
    SHEET.body.innerHTML = "";
    SHEET.body.scrollTop = 0;
    p.def[2](SHEET.body, p.id);
    refresh();
    return true;
  }

  function showPopup(key, push) {
    var p = pageOf(key);
    if (!p.def) return;
    if (!SHEET) SHEET = buildSheet();
    else if (push && CURRENT) STACK.push(CURRENT);
    else if (!push) {
      /* replaces the page; the pages before it stay */
    }
    render(key);
  }

  function popBack() {
    if (POPGUARD && POPGUARD(popBack)) return;
    var prev = STACK.pop();
    if (prev) render(prev);
    else closeSheet();
  }

  function closeSheet() {
    if (POPGUARD && POPGUARD(closeSheet)) return;
    POPGUARD = null;
    CHECK = null;
    if (!SHEET) return;
    var s = SHEET;
    SHEET = null;
    STACK = [];
    CURRENT = null;
    SHEET_LIST.length = 0;
    s.root.classList.remove("in");
    setTimeout(function () {
      s.root.remove();
    }, 250);
    SESSION = {};
    if (HOST.onSheetClosed) HOST.onSheetClosed();
  }

  /* An editor that asks before it is left with changes that are not saved: o = {dirty(), save(leave), discard(), inner, done}. The checkmark of the header saves. */
  function guardUnsaved(o) {
    function guard(leave) {
      if (!o.dirty()) return false;
      if (o.inner && leave === popBack) return false;
      ask(T("unsaved_changes"), [
        {
          label: T("discard_changes"),
          fn: function () {
            POPGUARD = null;
            if (o.discard) o.discard();
            leave();
          },
        },
        {
          label: T("save"),
          fn: function () {
            guard.save(leave);
          },
        },
      ]);
      return true;
    }
    guard.save = function (leave) {
      POPGUARD = null;
      var done = o.save(leave);
      if (done === false) POPGUARD = guard;
      else if (done && done.then)
        done.then(function (ok) {
          if (ok === false) POPGUARD = guard;
        });
    };
    guard.done = o.done || popBack;
    POPGUARD = guard;
    if (!o.inner && SHEET) {
      CHECK = guard;
      SHEET.root.querySelector(".ok").style.display = "";
    }
  }

  /* ---- what the pages register: kept, for the parts of this panel that use them ---- */

  var REGISTERED = { sceneKinds: [], sceneMakers: [], sceneImports: [], deviceKinds: [], playback: [], lightStyles: [], areaHooks: {} };

  var HOST = {
    pages: PAGES,
    registered: REGISTERED,
    onUpdate: null,
    onSheetClosed: null,
    onRender: null,
    onHass: null,
    editLights: function () {
      toast(T("unavailable"));
    },
  };

  window.HueHost = HOST;
  /* The Hue Plus pages read bridge lists through the dashboard's HA object. */
  window.HA = { serviceResponse: serviceResponse };
  window.HomeControl = {
    version: 1,
    hass: H,
    t: T,
    attrs: A,
    state: V_,
    isOn: isOn,
    registry: reg,
    get isAdmin() {
      return !!(HASS && HASS.user && HASS.user.is_admin);
    },
    call: call,
    callRaw: callRaw,
    toggle: toggleEnt,
    toast: toast,
    refresh: refresh,
    el: mk,
    icon: svg,
    row: pill,
    count: cntS,
    confirm: confirmDlg,
    open: showPopup,
    back: popBack,
    closeLayer: closeSheet,
    guard: guardUnsaved,
    get sheet() {
      return SESSION;
    },
    get popGuard() {
      return POPGUARD;
    },
    set popGuard(value) {
      POPGUARD = value;
    },
    editing: function () {
      return false;
    },
    ui: {
      attachSlide: attachSlide,
      briControl: briControl,
      callLive: callLive,
      cap: cap,
      closeSheet: closeSheet,
      cssRgb: cssRgb,
      cssToRgb: cssToRgb,
      deviceGet: function (key, fallback) {
        try {
          var v = JSON.parse(localStorage.getItem("hue_plus_panel_" + key));
          return v === null ? fallback : v;
        } catch (e) {
          return fallback;
        }
      },
      deviceSet: function (key, value) {
        try {
          localStorage.setItem("hue_plus_panel_" + key, JSON.stringify(value));
        } catch (e) {}
      },
      dom: dom,
      dropRow: dropRow,
      ic: ic,
      inkRow: function (row, rgb, pct) {
        row.style.setProperty("--ink-pct", pct + "%");
      },
      kelvinRgb: kelvinRgb,
      lightMembers: lightMembers,
      liveStopOn: function () {},
      liveXyRgb: liveXyRgb,
      pinPop: function () {
        return null;
      },
      pop: pop,
      sep: sep,
      sliderRow: sliderRow,
      switchPill: switchPill,
      get pageFill() {
        return "rgb(255,193,90)";
      },
    },
    /* A "room" of this panel is a Hue room or zone, named "app:<its light entity>"; the Hue pages ask for it by name to start from it. */
    room: function (scope) {
      var id = String(scope || "").indexOf("app:") === 0 ? scope.slice(4) : null;
      return id && HASS && HASS.states[id] ? { id: scope, area: null, name: A(id).friendly_name } : null;
    },
    serviceResponse: serviceResponse,
    scenes: {
      hidden: function () {
        return false;
      },
      setHidden: function () {},
      importFrom: function () {},
      editLights: function (o) {
        return HOST.editLights(o);
      },
    },
    areas: {
      roomLights: function () {
        return [];
      },
      open: function () {},
      clamp: function (v) {
        return v;
      },
      identifyOff: function () {},
      rebuild: function () {},
      get editor() {
        return null;
      },
      openExternal: function () {},
    },
    addStrings: function (dict) {
      Object.keys(dict).forEach(function (k) {
        if (EN[k] === undefined) EN[k] = dict[k];
      });
    },
    registerPage: function (key, titleKey, icon, builder) {
      PAGES[key] = [titleKey, icon, builder];
    },
    registerSettings: function () {},
    addStyles: function (css) {
      var el = document.createElement("style");
      el.textContent = css;
      document.head.appendChild(el);
    },
    registerSceneKind: function (d) {
      REGISTERED.sceneKinds.push(d);
    },
    registerSceneMaker: function (d) {
      REGISTERED.sceneMakers.push(d);
    },
    registerSceneImport: function (d) {
      REGISTERED.sceneImports.push(d);
    },
    registerDeviceKind: function (d) {
      REGISTERED.deviceKinds.push(d);
    },
    registerPlayback: function (d) {
      REGISTERED.playback.push(d);
    },
    registerLightStyle: function (d) {
      REGISTERED.lightStyles.push(d);
    },
    registerAreaHooks: function (id, d) {
      REGISTERED.areaHooks[id] = d;
    },
  };

  /* What the application uses besides the plugin API. */
  HOST.api = {
    attach: attach,
    hass: function () {
      return HASS;
    },
    ws: function (msg) {
      return HASS.callWS(msg);
    },
    ready: function () {
      return REGISTRIES_READY || Promise.resolve();
    },
    T: T,
    mk: mk,
    svg: svg,
    ic: ic,
    setBuilding: function (list) {
      BUILDING = list;
    },
    tabList: TAB_LIST,
    resetSession: function () {
      SESSION = {};
    },
    closeSheet: closeSheet,
    hasSheet: function () {
      return !!SHEET;
    },
    toast: toast,
    ask: ask,
    schedule: schedule,
    addStrings: window.HomeControl.addStrings,
  };
})();

/* Hue Plus in the dashboard: its pages in Settings (the bridge, lights, switches, MotionAware areas, entertainment areas, updates and more), the entertainment areas in the
 area editor, and the Hue effects page's data are Hue Plus's own, not the dashboard's (decision D-25). Home Control loads this file for administrators when Hue Plus is
 installed (`menu` in home_control.json) and it uses the dashboard only through `window.HomeControl` (the plugin API, version 1).
 Built by scripts/build_menu.py from custom_components/hue_plus/frontend/src; edit those files, not this one. */
(function () {
  var HC = window.HomeControl;
  if (!HC || HC.version !== 1) return; /* a dashboard that has no plugin API, or another version of it */

  /* The dashboard's functions, under the names the sources use. */
  var H = HC.hass,
    A = HC.attrs,
    V_ = HC.state,
    isOn = HC.isOn,
    reg = HC.registry,
    call = HC.call,
    callRaw = HC.callRaw,
    toggleEnt = HC.toggle,
    toast = HC.toast,
    refresh = HC.refresh,
    mk = HC.el,
    svg = HC.icon,
    pill = HC.row,
    cntS = HC.count,
    confirmDlg = HC.confirm,
    showPopup = HC.open,
    popBack = HC.back,
    closeLayer = HC.closeLayer,
    guardUnsaved = HC.guard,
    _T = HC.t,
    eaRoomLights = HC.areas.roomLights,
    eaClamp = HC.areas.clamp,
    eaIdentifyOff = HC.areas.identifyOff,
    attachSlide = HC.ui.attachSlide,
    briControl = HC.ui.briControl,
    callLive = HC.ui.callLive,
    cap = HC.ui.cap,
    closeSheet = HC.ui.closeSheet,
    cssRgb = HC.ui.cssRgb,
    cssToRgb = HC.ui.cssToRgb,
    deviceGet = HC.ui.deviceGet,
    deviceSet = HC.ui.deviceSet,
    dom = HC.ui.dom,
    dropRow = HC.ui.dropRow,
    ic = HC.ui.ic,
    inkRow = HC.ui.inkRow,
    kelvinRgb = HC.ui.kelvinRgb,
    lightMembers = HC.ui.lightMembers,
    liveStopOn = HC.ui.liveStopOn,
    liveXyRgb = HC.ui.liveXyRgb,
    pinPop = HC.ui.pinPop,
    pop = HC.ui.pop,
    sep = HC.ui.sep,
    sliderRow = HC.ui.sliderRow,
    switchPill = HC.ui.switchPill,
    roomById = HC.room,
    serviceResponse = HC.serviceResponse,
    sceneEntHidden = HC.scenes.hidden,
    sceneEntSetHidden = HC.scenes.setHidden,
    importLiveScene = HC.scenes.importFrom,
    editLights = HC.scenes.editLights;

  /* What the dashboard keeps in variables is read when it is needed. */
  function isAdmin() {
    return HC.isAdmin;
  }
  function isEditing() {
    return HC.editing();
  }
  function pageFill() {
    return HC.ui.pageFill;
  }
  function currentSheet() {
    return HC.sheet;
  }
  function setPopGuard(value) {
    HC.popGuard = value;
  }
  function areaEditor() {
    return HC.areas.editor;
  }
  function rebuildArea() {
    HC.areas.rebuild();
  }
  function openArea(room, area, seed) {
    return HC.areas.open(room, area, seed);
  }
  function openExternalArea(plugin, draft, extra) {
    return HC.areas.openExternal(plugin, draft, extra);
  }

/* The text of this plugin's pages (the dashboard adds it to its own table when the plugin starts). */

var PLUGIN_STRINGS = {
  "hn_add_a_scene_hint": "Create scenes to save to the Hue bridge. You choose the lights next.",
  "hn_choose_your_lights": "Choose your lights",
  "hn_zones": "Zones",
  "hn_rooms": "Rooms",
  "hn_choose_hint": "Choose a room or zone. A scene sets every light of it; in the light popup you can set any light you want dark to off. For only some lights, make a zone of them.",
  "hn_choose_hint_edit": "The scene's room or zone, with all its lights. Next, the lights are set as the scene has them for you to change.",
  "hn_choose_a_room": "Choose a room or zone",
  "hn_couldn_t_read_the_hue_bridge": "Couldn’t read the Hue bridge",
  "hn_hue_scene": "Hue scene",
  "hn_hue_scene_sub": "Made on the bridge, as in the Hue app",
  "hn_no_hue_room": "Hue Plus has no room or zone to make a scene in.",
  "hn_add_a_scene": "Add a scene",
  "hn_custom_scene": "Custom scene",
  "hn_custom_scene_sub": "Set the lights, then save",
  "hn_save_current": "Save current settings",
  "hn_save_current_sub": "The lights as they are now",
  "hn_all_day": "All-day scene",
  "hn_all_day_sub": "Scenes by time of day",
  "hn_from_photo": "Color palette from photo",
  "hn_from_photo_sub": "Colours taken from a picture",
  "hn_name_your_scene": "Name your scene",
  "hn_name_of_the_scene": "Name of the scene",
  "hn_next": "Next",
  "hn_give_it_a_name": "Give the scene a name",
  "hn_scene_saved": "Scene saved: ",
  "hn_couldn_t_save_the_scene": "Couldn’t save the scene to the bridge",
  "hn_no_hue_lights_here": "There are no Hue lights here to make a scene of",
  "hn_make_a_scene_first": "Make a scene for this room first: an all-day scene uses scenes of the room",
  "hn_all_day_scene": "All-day scene",
  "hn_all_day_hint": "Each time starts its scene and keeps it until the next time.",
  "hn_pick_a_day": "Pick at least one day",
  "hn_save": "Save",
  "hn_day_sun": "S",
  "hn_day_mon": "M",
  "hn_day_tue": "T",
  "hn_day_wed": "W",
  "hn_day_thu": "T",
  "hn_day_fri": "F",
  "hn_day_sat": "S",
  "hn_photo_hint": "Pick a photo: its colours go to the lights, and you can change them before saving.",
  "hn_choose_a_photo": "Choose a photo",
  "hn_use_these_colours": "Use these colours",
  "hn_no_colours_in_that_photo": "No colours found in that photo",
  "hn_couldn_t_open_that_photo": "Couldn’t open that photo",
  "hn_change_the_lights": "Change the lights",
  "hn_change_the_lights_sub": "Set them in the light popup, then save to the bridge",
  "hn_rename": "Rename",
  "hn_delete_scene": "Delete scene",
  "hn_scene_deleted": "Scene deleted from the bridge",
  "a_copy_you_can_edit_and_place_on_your_lights": "A copy you can edit and place on your lights",
  "a_copy_you_can_edit_with_the_lights_as_it_sets_them": "A copy you can edit, with the lights as the scene sets them",
  "an_entertainment_area_of_the_bridge": "An entertainment area of the bridge",
  "automatic_update_time": "Automatic update time",
  "automatic_updates": "Automatic updates",
  "check_for_an_update": "Check for an update",
  "copies_its_colours_and_speed": "Copies its colours and speed",
  "copies_what_it_sets_each_light_to": "Copies what it sets each light to",
  "couldn_t_read_that_scene_from_the_hue_bridge": "Couldn’t read that scene from the Hue bridge",
  "couldn_t_read_the_hue_bridge": "Couldn’t read the Hue bridge",
  "delete_this_motion_area": "Delete this motion area from the bridge?",
  "delete_this_routine_from_the_bridge": "Delete this routine from the bridge?",
  "disconnect_this_matter_app_from_the_bridge": "Disconnect this Matter app from the bridge?",
  "end_last_state": "Back to the last state",
  "end_off": "Off",
  "end_pause": "Stay as they are",
  "end_scene": "A scene",
  "entertainment_area": "Entertainment area",
  "entertainment_areas": "Entertainment areas",
  "experimental_not_yet_tried_on_a_real_bridge": "Experimental: not yet tried on a real bridge",
  "experimental_only_the_last_state_has_been_seen_on_a_real_bridge": "Experimental: only “last state” has been seen on a real bridge",
  "fn_decorative": "Decoration",
  "fn_functional": "Everyday light",
  "fn_mixed": "Both",
  "hdmi_input": "HDMI input",
  "hdmi_signal": "HDMI signal",
  "hide_this_scene": "Hide this scene",
  "hm_a_cycle_needs_two_scenes": "A cycle needs at least two scenes",
  "hm_a_time_based_light_needs_two_times": "A time-based light needs at least two times",
  "hm_add_a_scene": "Add a scene",
  "hm_add_a_time": "Add a time",
  "hm_advanced": "Advanced",
  "hm_applications": "Applications",
  "hm_auto": "Auto",
  "hm_behavior": "Behavior",
  "hm_bridges": "Bridges",
  "hm_brighten": "Brighten",
  "hm_brighten_sub": "Your lights will brighten incrementally each time you press the button",
  "hm_brightness_balance": "Brightness balance",
  "hm_button": "button",
  "hm_button_label": "Button",
  "hm_buttons": "Buttons",
  "hm_connected": "Connected",
  "hm_cycle_timeout_note": "If this many seconds pass between presses, the next press starts the cycle again.",
  "hm_delete": "Delete",
  "hm_device_info": "Device info",
  "hm_devices": "Devices",
  "hm_dial": "dial",
  "hm_dials": "dials",
  "hm_dim": "Dim",
  "hm_dim_sub": "Your lights will dim incrementally each time you press the button until minimum brightness is reached",
  "hm_do_nothing": "Do nothing",
  "hm_do_nothing_sub": "The press does nothing",
  "hm_done": "Done",
  "hm_eighth": "Eighth",
  "hm_enabled": "Enabled",
  "hm_end_last_state": "Returns to how the lights were before the sync",
  "hm_end_off": "The lights turn off",
  "hm_end_pause": "The last light keeps its colour",
  "hm_end_scene": "Plays a scene you choose",
  "hm_entire_home_off": "Entire home off",
  "hm_entire_home_off_sub": "All lights in your home turn off",
  "hm_everything_is_up_to_date": "Everything is up to date",
  "hm_experimental_buttons": "Experimental: changing a button writes to the bridge's automation of this switch and has not been tried on a real dimmer.",
  "hm_fifth": "Fifth",
  "hm_first": "First",
  "hm_fn_decorative": "Accent and mood lighting",
  "hm_fn_functional": "Lighting you rely on to see",
  "hm_fn_mixed": "Both",
  "hm_forward": "Forward",
  "hm_fourth": "Fourth",
  "hm_function": "Function",
  "hm_general": "General",
  "hm_horizontal": "Horizontal",
  "hm_how_you_use_this_light": "How you use this light",
  "hm_id": "ID",
  "hm_in_this_home": "In this home",
  "hm_info": "Info",
  "hm_kind_brighten": "Brighten",
  "hm_kind_cycle": "Scene cycle",
  "hm_kind_dim": "Dim",
  "hm_kind_nothing": "Nothing",
  "hm_kind_off": "Lights off",
  "hm_kind_scene": "Single scene",
  "hm_kind_time": "Time-based light",
  "hm_last_press": "Last press",
  "hm_last_used": "Last used",
  "hm_light": "light",
  "hm_light_behavior_at_power_on": "Light behavior at power on",
  "hm_light_placement": "Light placement",
  "hm_lights": "lights",
  "hm_lights_and_smart_plugs": "Lights & smart plugs",
  "hm_lights_brighten_or_dim": "Lights brighten or dim",
  "hm_lights_label": "Lights",
  "hm_lights_off": "Lights off",
  "hm_lights_off_sub": "The lights turn off",
  "hm_lights_turn_off": "Lights turn off",
  "hm_lights_turn_on": "Lights turn on",
  "hm_linked_to_hue": "Linked to Hue",
  "hm_long_press": "Long press",
  "hm_manual": "Manual",
  "hm_matter_and_linked_apps": "Matter and linked apps",
  "hm_matter_pairing_code_note": "To add the bridge to another app you need a Matter pairing code. Hue Plus cannot make one yet: use the Hue app, Settings, Smart home.",
  "hm_min": "min",
  "hm_motionaware_areas": "MotionAware areas",
  "hm_move_earlier": "Move earlier",
  "hm_move_later": "Move later",
  "hm_ninth": "Ninth",
  "hm_nothing_happens": "Nothing happens",
  "hm_nothing_set": "Nothing set",
  "hm_order": "Order",
  "hm_performance": "Performance",
  "hm_pick_a_scene": "Pick a scene",
  "hm_pick_a_time": "Pick a time",
  "hm_power_on": "Power on",
  "hm_press": "Press",
  "hm_press_set": "press set",
  "hm_press_word": "press",
  "hm_presses_set": "presses set",
  "hm_pw_custom": "Custom",
  "hm_pw_custom_sub": "Choose color and brightness",
  "hm_pw_last_on_state": "Last on",
  "hm_pw_last_on_state_sub": "Last-used color and brightness",
  "hm_pw_powerfail": "Power loss recovery",
  "hm_pw_powerfail_sub": "Stays off or turns back on",
  "hm_pw_safety": "Default",
  "hm_pw_safety_sub": "Warm white, full brightness",
  "hm_remove_from_the_cycle": "Remove from the cycle",
  "hm_remove_this_time": "Remove this time",
  "hm_reversed": "Reversed",
  "hm_room": "Room",
  "hm_saved_to_the_bridge": "Saved to the bridge",
  "hm_scene": "scene",
  "hm_scene_cycle": "Scene cycle",
  "hm_scene_cycle_sub": "Your lights will cycle through selected scenes each time you press the button",
  "hm_scenes": "scenes",
  "hm_sec": "s",
  "hm_second": "Second",
  "hm_selected_lights": "Selected lights",
  "hm_settings": "Settings",
  "hm_seventh": "Seventh",
  "hm_single_scene": "Single scene",
  "hm_single_scene_sub": "Your lights will always display the same scene when you press the button",
  "hm_sixth": "Sixth",
  "hm_smart_home": "Smart home",
  "hm_smart_on_off": "Smart on/off",
  "hm_smart_on_off_note": "With smart on/off the button turns the lights on and off. Pressing again within the time before the cycle restarts goes to the next scene; after the last scene the next press turns the lights off.",
  "hm_software": "Software",
  "hm_software_update": "Software update",
  "hm_status": "Status",
  "hm_switch": "switch",
  "hm_switch_one": "Switch",
  "hm_switches": "Switches",
  "hm_switches_n": "switches",
  "hm_tap_an_app_to_remove_its_access": "Tap an app to take its access to the bridge away.",
  "hm_tenth": "Tenth",
  "hm_the_bridge_did_not_accept_this": "The bridge did not accept this",
  "hm_the_bridge_picks": "The bridge picks which light streams",
  "hm_the_hue_apps_own_times": "The Hue app's own times: Energize, Concentrate, Read, Relax, Nightlight",
  "hm_the_whole_home": "Entire home",
  "hm_third": "Third",
  "hm_this_area_is_on_the_bridge": "The bridge's own area: saving writes it to the bridge",
  "hm_this_light_streams": "This light streams for the area",
  "hm_time": "time",
  "hm_time_based_light": "Time-based light",
  "hm_time_based_light_sub": "Your lights will mimic natural light based on the time of day or a custom schedule",
  "hm_time_based_note": "The lights show the scene of the latest time that has passed. Pressing again within the time before it restarts goes to the next one.",
  "hm_time_zone": "Time zone",
  "hm_timed_effects": "Timed effects",
  "hm_times": "times",
  "hm_two_times_cannot_be_the_same": "Two times cannot be the same",
  "hm_unknown_scene": "A scene that is gone",
  "hm_unreachable": "Not reachable",
  "hm_updates_are_installed_at_this_time": "Updates are installed automatically at this time.",
  "hm_use_the_default_schedule": "Use the default schedule",
  "hm_vertical": "Vertical",
  "hm_what_the_buttons_do_note": "What the buttons do is set in the Hue app. Here you see which presses have something to do.",
  "hm_when_sync_stops": "When sync stops",
  "hm_where_the_lights_are_in_the_room": "Where the lights are in the room",
  "hp_no_effect": "Stop it",
  "hp_scene": "Scene",
  "hp_sunrise": "Start a sunrise",
  "hp_sunset": "Start a sunset",
  "hue_bridge": "Hue bridge",
  "hue_light": "Hue light",
  "hue_lights": "Hue lights",
  "hue_play_hdmi_sync_box": "Hue Play HDMI Sync Box",
  "identify": "Identify",
  "import_a_classic_scene_from_hue": "Import a classic scene from Hue",
  "import_a_live_scene_from_hue": "Import a live scene from Hue",
  "import_as_a_classic_scene": "Import as a classic scene",
  "import_as_a_live_scene": "Import as a live scene",
  "import_from_the_hue_bridge": "Import from the Hue bridge",
  "importing_a_hue_scene_needs_hue_plus": "Importing a Hue scene needs Hue Plus",
  "install_this_update": "Install this update?",
  "intensity": "Intensity",
  "internet": "Internet",
  "light_delay": "Light delay",
  "light_setup": "Light setup",
  "linear": "Linear",
  "lowest_brightness": "Lowest brightness",
  "matter": "Matter",
  "mirrored": "Mirrored",
  "motion_area": "Motion area",
  "motion_areas": "Motion areas",
  "mounting_direction": "Mounting direction",
  "no_hue_lights_in_this_area": "No Hue lights in this area",
  "no_hue_scenes_found": "No Hue scenes found",
  "no_motion_areas": "No motion areas",
  "no_static_hue_scenes_found": "No static Hue scenes found",
  "none_of_its_lights_are_in_this_room": "None of its lights are in this room",
  "not_set_up": "Not set up",
  "nothing_connected": "Nothing connected",
  "orientation": "Orientation",
  "playing_on": "Playing on",
  "read_from_the_hue_bridge": "Read from the Hue bridge",
  "routine": "Routine",
  "routines_and_automations": "Routines and automations",
  "scattered": "Scattered",
  "search_for_new_devices": "Search for new devices",
  "segment_order": "Segment order",
  "segmented": "Segmented",
  "send_to_the_hue_bridge": "Send to the Hue bridge",
  "sent_to_the_hue_bridge": "Sent to the Hue bridge",
  "set_up": "Set up",
  "show_red_for_5_seconds": "Show red for 5 seconds",
  "show_this_scene": "Show this scene",
  "spotify_sync": "Spotify sync",
  "stay_here": "stay here",
  "stop_streaming": "Stop streaming",
  "sync": "Sync",
  "take_this_app_s_access_away_it_can_no_longer_use_the_bridge": "Take this app’s access away? It can no longer use the bridge.",
  "takes_the_positions_of_its_lights": "Takes the positions of its lights",
  "turn_the_colours_around": "Turn the colours around",
  "up_to_date": "Up to date",
  "update_available": "Update available",
  "update_available_2": "update available",
  "updates_available": "updates available",
  "zones": "zones",
  "hw_new_automation": "New automation",
  "hw_what_kind_of_automation": "What kind of automation do you want to create?",
  "hw_what_kind_of_automation_sub": "Start with some quick and easy templates.",
  "hw_wake_up": "Wake up with light",
  "hw_wake_up_sub": "Gradually brighten selected lights in the morning.",
  "hw_go_to_sleep": "Go to sleep",
  "hw_go_to_sleep_sub": "Let selected lights slowly dim until they turn off.",
  "hw_coming_home": "Coming home",
  "hw_coming_home_sub": "Set your lights to turn on automatically when you near your house.",
  "hw_leaving_home": "Leaving home",
  "hw_leaving_home_sub": "Set your lights to turn off automatically when you leave your house.",
  "hw_timer": "Timer",
  "hw_timer_sub": "Signal the end of a set amount of time with light.",
  "hw_lighting_schedule": "Lighting schedule",
  "hw_lighting_schedule_sub": "Automate your lights to go on, off, or to a certain scene throughout the day.",
  "hw_choose_your_settings": "Choose your settings",
  "hw_when_do_you_want_to_wake_up": "When do you want to wake up?",
  "hw_when_do_you_want_to_go_to_sleep": "When do you want to go to sleep?",
  "hw_when_do_you_want_to_schedule": "When do you want to schedule this automation?",
  "hw_start_at": "Start at",
  "hw_end_at": "End at",
  "hw_fade_duration": "Fade duration",
  "hw_repeat": "Repeat",
  "hw_extra_options": "Extra options",
  "hw_randomize_times": "Randomize times",
  "hw_randomize_times_hint": "The times shift by up to this long.",
  "hw_no": "No",
  "hw_h": "h",
  "hw_hours": "hours",
  "hw_day_monday": "M",
  "hw_day_tuesday": "T",
  "hw_day_wednesday": "W",
  "hw_day_thursday": "T",
  "hw_day_friday": "F",
  "hw_day_saturday": "S",
  "hw_day_sunday": "S",
  "hw_day_long_monday": "Monday",
  "hw_day_long_tuesday": "Tuesday",
  "hw_day_long_wednesday": "Wednesday",
  "hw_day_long_thursday": "Thursday",
  "hw_day_long_friday": "Friday",
  "hw_day_long_saturday": "Saturday",
  "hw_day_long_sunday": "Sunday",
  "hw_style": "Style",
  "hw_style_sunrise": "Sunrise",
  "hw_style_sunset": "Sunset",
  "hw_style_basic_up": "Transition to bright",
  "hw_style_basic_down": "Transition to dark",
  "hw_sunrise_hint": "Sunrise is recommended for gradient lights.",
  "hw_sunset_hint": "Sunset is recommended for gradient lights.",
  "hw_maximum_brightness": "Maximum brightness",
  "hw_turn_lights_off": "Turn lights off",
  "hw_turn_lights_off_hint": "The lights switch off this long after the wake-up ends.",
  "hw_end_with": "End with",
  "hw_lights_off": "Lights off",
  "hw_what_should_your_lights_do": "What should your lights do?",
  "hw_no_scenes_here": "This room or zone has no scenes.",
  "hw_how_long_should_your_timer_last": "How long should your timer last?",
  "hw_a_timer_needs_a_minute": "A timer lasts at least a minute",
  "hw_choose_a_day": "Choose at least one day",
  "hw_name_your_automation": "Name your automation",
  "hw_name": "Name",
  "hw_give_it_a_name": "Give it a name",
  "hw_save": "Save",
  "hw_edit_settings": "Edit settings",
  "hw_choose": "Choose",
  "hw_couldn_t_save_the_automation": "Couldn’t save the automation to the bridge",
  "hm_motionaware_area": "MotionAware area",
  "hmw_create_a_motionaware_area": "Create a MotionAware area",
  "hmw_intro_1": "Turn your devices into motion sensors. By selecting 3 or 4 devices in a room, you can create a MotionAware area.",
  "hmw_intro_2": "This area can be customized to control lights and other devices on your bridge. The MotionAware area can easily be deleted from its settings.",
  "hmw_create_area": "Create area",
  "hmw_before_you_choose_devices": "Before you choose devices…",
  "hmw_tip1_1": "High-traffic areas such as doorways, seating areas, and paths that people usually move through should be within the MotionAware area.",
  "hmw_tip2_1": "Ideally, devices should be 1–7 metres (3–23 feet) apart and at varying heights (for example a ceiling light, a floor lamp and a table lamp).",
  "hmw_tip2_2": "Devices should not be separated by a wall or in a straight line, and must remain powered for the MotionAware area to detect you properly.",
  "hmw_tip3_1": "MotionAware areas should create a shape that covers as much of the space as possible, from the floor to the ceiling.",
  "hmw_tip3_2": "This shape is where motion will be detected.",
  "hmw_where_are_the_lights": "Where are the lights that you want to detect motion?",
  "hmw_where_hint": "MotionAware areas require at least 3 devices. Outdoor spaces are not recommended. Some of your devices may not be compatible with MotionAware yet, for example if they have outdated software.",
  "hmw_available_device": "available device",
  "hmw_available_devices": "available devices",
  "hmw_needs_three": "This room has fewer than three compatible devices",
  "hmw_choose_devices": "Choose devices",
  "hmw_choose_devices_hint": "Your MotionAware area can use 3 or 4 devices. Only compatible devices are listed here.",
  "hmw_three_or_four": "Choose three or four devices",
  "hmw_name_your_area": "Name your MotionAware area",
  "hmw_couldn_t_create_the_area": "Couldn’t create the area on the bridge",
  "hmw_area_created": "Area created",
  "hmw_area_created_sub": "Now you’ll choose what happens when your MotionAware area detects something.",
  "hmw_which_lights": "Which lights should turn on when motion is detected?",
  "hmw_which_lights_hint": "You can select up to three rooms or one zone.",
  "hmw_three_rooms": "Up to three rooms, or one zone",
  "hmw_success": "Success! Your MotionAware area is ready to use",
  "hmw_default_settings": "Your MotionAware area will have these default settings. You can adjust them later in Settings, MotionAware areas, or customize them now.",
  "hmw_no_default_scenes": "These rooms don’t have the scenes Concentrate, Read and Nightlight, so choose the times and scenes yourself.",
  "hmw_customize": "Customize",
  "hmw_add_a_time": "Add at least one time",
  "hmw_control_lights": "Control lights",
  "hmw_control_lights_hint": "From each time, motion turns the lights on with its scene. After the minutes without motion, the lights switch off.",
  "hmw_lights_off_after": "Lights off after no motion for",
  "hmw_stay_on": "Stay on",
  "hmw_couldn_t_save": "Couldn’t save to the bridge",
  "hmw_health_healthy": "Healthy",
  "hmw_health_unhealthy": "Unhealthy",
  "hmw_health_degraded": "Degraded",
  "hmw_health_recovering": "Recovering",
  "hmw_health_unrecoverable": "Unrecoverable",
  "hmw_health_not_running": "Not running",
  "hmw_health_unknown": "Unknown",
  "hmw_name": "Name",
  "hmw_what_it_does": "What it does",
  "hmw_nothing_set": "Nothing set",
  "hmw_time_n": "time",
  "hmw_times_n": "times",
  "hmw_general_settings": "General settings",
  "hmw_motion_sensitive_devices": "Motion-sensitive devices",
  "hmw_motion_sensitivity": "Motion sensitivity",
  "hmw_daylight_settings": "Daylight settings",
  "hmw_disabled": "Disabled",
  "hmw_low": "Low",
  "hmw_medium": "Medium",
  "hmw_high": "High",
  "hmw_level": "Level",
  "hw_name_wake_up": "Wake up",
  "hw_name_go_to_sleep": "Go to sleep",
  "hw_name_coming_home": "Coming home",
  "hw_name_leaving_home": "Leaving home",
  "hw_name_timer": "Timer",
  "hw_name_schedule": "Lighting schedule",
  "hm_remove_this_device": "Remove this device from the bridge? It has to be reset before it can be added again.",
  "hm_couldn_t_remove_the_device": "Couldn’t remove the device from the bridge",
  "hm_delete_this_entertainment_area": "Delete this entertainment area from the bridge?",
  "hrw_rooms_and_zones": "Rooms and zones",
  "hrw_create_a_room": "Create a room",
  "hrw_create_a_zone": "Create a zone",
  "hrw_new_room": "New room",
  "hrw_new_zone": "New zone",
  "hrw_lights": "Lights",
  "hrw_devices": "Devices",
  "hrw_delete_this_room": "Delete this room from the bridge? Its devices stay on the bridge, without a room.",
  "hrw_delete_this_zone": "Delete this zone from the bridge?",
  "hrw_couldn_t_save": "Couldn’t save to the bridge",
  "hrw_zigbee_hint": "Every light and accessory has to find the bridge again after the channel changes, and some may not.",
  "hrw_keeps_clear_of_wifi": "Keeps clear of Wi-Fi",
  "hrw_change_the_zigbee_channel": "Change the Zigbee channel? Every light and accessory has to find the bridge again, and some may not.",
  "hmw_leave_the_area": "Leave the area",
  "hmw_leave_hint": "Let’s calibrate your MotionAware area. Make sure nobody, including pets, is in the area during the 20 seconds it will take to calibrate.",
  "hmw_calibrating_area": "Calibrating area…",
  "hmw_calibrating_hint": "This sets the baseline signal strength for MotionAware to detect motion accurately.",
  "hmw_second_to_go": "second to go",
  "hmw_seconds_to_go": "seconds to go",
  "hmw_almost_done": "Almost done…",
  "hmw_calibration_didn_t_finish": "The bridge didn’t finish calibrating. Check that the devices are powered, then try again.",
  "hmw_try_again": "Try again",
  "hw_mimic_presence": "Mimic presence",
  "hw_mimic_presence_sub": "Set your lights to turn on and off to make it look like you’re home.",
  "hw_name_mimic_presence": "Mimic presence",
  "hw_one_only": "An automation of this type already exists on this bridge. You can edit it to change the behavior.",
  "hw_how_should_go_to_sleep_start": "How should Go to sleep start?",
  "hw_at_a_certain_time": "At a certain time",
  "hw_at_a_certain_time_sub": "Schedule Go to sleep for a certain time.",
  "hw_with_a_button_press": "With a button press",
  "hw_with_a_button_press_sub": "Tap the play button to start Go to sleep.",
  "hw_when_should_your_lights_turn_on": "When should your lights turn on?",
  "hw_always": "Always",
  "hw_always_sub": "Your lights will turn on every time you come home.",
  "hw_at_night": "At night",
  "hw_at_night_sub": "Your lights will turn on when the sun is down.",
  "hw_when_should_your_lights_turn_on_active": "When should your lights turn on when the automation is active?",
  "hw_all_day": "All day",
  "hw_all_day_sub": "Your lights will turn on and off during both day and night.",
  "hw_only_when_its_dark": "Only when it’s dark",
  "hw_only_when_its_dark_sub": "Your lights will turn on and off between sunset and sunrise.",
  "hw_this_is_how_your_automation_works": "This is how your automation works",
  "hw_mimic_presence_explanation": "Based on the rooms you selected, your lights will turn on and off to different scenes. They’ll mimic the activities that would be expected in those types of rooms. You can leave all your other automations turned on. Rooms that were not selected will turn off.",
  "hw_where": "Where",
  "hw_when": "When",
  "hw_do_nothing": "Do nothing",
  "hw_end_turn_off": "Lights off",
  "hw_end_minimum_brightness": "Dimmed lights",
  "hw_end_nightlight": "Warm nightlight",
  "hw_on": "On",
  "hw_off": "Off",
  "hw_custom": "Custom",
  "hw_no_end_time": "No end time",
  "hw_at_a_specific_time": "At a specific time",
  "hw_sunrise": "Sunrise",
  "hw_sunset": "Sunset",
  "hw_start": "Start",
  "hw_stop": "Stop",
  "hw_running": "Running now",
  "hmw_before": "before",
  "hmw_after": "after",
  "hmw_no_lights": "No lights",
  "hmw_starts": "Starts",
  "hmw_shifted_by": "Shifted by (minutes)",
  "hmw_dont_trigger_lights": "Don’t trigger lights",
  "hmw_very_low": "Very low",
  "hmw_very_high": "Very high",
  "hmw_sunrise_sunset": "Sunrise/Sunset",
  "hmw_start_triggering": "Start triggering lights",
  "hmw_stop_triggering": "Stop triggering lights",
  "hmw_when_x": "When",
  "hmw_add_a_time_with_a_scene": "Add a time that triggers a scene first",
  "hmw_four_areas": "A bridge takes up to four MotionAware areas",
  "hmw_in_use": "In use",
  "hmw_in_use_hint": "A device can be in one MotionAware area only",
  "hmw_what_should_your_area_do": "What should your MotionAware area do?",
  "hmw_control_lights_sub": "Your lights will turn on and off when motion is detected.",
  "hmw_choice_footer": "You can always adjust what your MotionAware area controls in Settings, MotionAware areas.",
  "hmw_daylight_hint": "MotionAware areas don’t measure daylight, so they can use sunrise and sunset to decide when to trigger lights. Sunrise/Sunset replaces the times between sunrise and sunset with one that starts at sunset and one at sunrise that triggers no lights.",
  "hw_sun_needs_home_location": "Sunrise and sunset need the bridge to know where home is. Set it in Settings, Hue Plus, Bridges, Home location.",
  "hrw_home_location": "Home location",
  "hrw_set_the_home_location": "Set the bridge’s home location to Home Assistant’s home location? The bridge uses it for sunrise and sunset, and for Coming home and Leaving home.",
  "hrw_home_location_set": "The bridge knows where home is",
  "hrw_no_home_location_in_home_assistant": "Home Assistant has no home location set",
  "app_sync": "Sync",
  "app_settings": "Settings",
  "app_tabs": "Tabs",
  "app_lights_on": "lights on",
  "app_light_on": "light on",
  "app_of": "of",
  "app_no_rooms": "No Hue rooms or zones found. Check that Hue Plus has its bridge and lights modules switched on.",
  "app_scene_settings": "Scene settings",
  "app_edit_room": "Edit room",
  "app_edit_zone": "Edit zone",
  "app_edit_the_lights": "Edit the lights",
  "app_light_panel": "Light colour and brightness",
  "app_all_lights": "All lights",
  "app_my_scenes": "My scenes",
  "app_controls": "Controls",
  "app_add": "Add",
  "app_more": "More",
  "app_delete_room": "Delete room",
  "app_delete_zone": "Delete zone",
  "app_add_scene": "Add scene",
  "app_add_devices": "Add devices",
  "app_add_automation": "Add automation",
  "app_add_motionaware": "Add MotionAware area",
  "app_tap_to_add": "Tap the item you want to add to ",
  "app_music": "Music",
  "app_tv_and_games": "TV and games",
  "app_no_spotify_sync": "The Spotify sync is off. Switch on its module in the Hue Plus options.",
  "app_no_sync_box": "No Hue Play HDMI Sync Box is set up. Add one with Hue Plus in Home Assistant's Devices and services.",
  "app_no_entertainment_areas": "The bridge has no entertainment areas.",
};

/* The styles of the Spotify sync and sync box popups, added to the dashboard's page by the plugin (the dashboard's own styles are for its own parts). */
var HUE_PLUS_CSS = ".hs-now{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;padding:4px 0 var(--sp)}\n.hs-art{width:min(62%,248px);aspect-ratio:1;border-radius:var(--r-m);background:var(--f-raise);border:1px solid var(--f-line);overflow:hidden;display:flex;align-items:center;justify-content:center;color:var(--ink2);position:relative}\n.hs-art svg{width:44px;height:44px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}\n.hs-art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}\n.hs-art.has-art svg{visibility:hidden}\n.hs-st{margin-top:12px;font-size:var(--fs-xs);letter-spacing:.14em;text-transform:uppercase;color:var(--ink2)}\n.hs-tt{font-size:19px;font-weight:600;max-width:100%;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow-wrap:anywhere}\n.hs-sub{font-size:var(--fs-m);color:var(--ink2);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.hs-set{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--sp-s);margin:var(--sp) 0}\n.hs-set.one{grid-template-columns:minmax(0,1fr)}\n.hs-col{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}\n.hs-cap{font-size:var(--fs-xs);letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}\n.hs-tile{display:flex;align-items:center;justify-content:center;width:76px;height:50px;border-radius:25px;box-sizing:border-box;background:var(--f-card);border:1px solid var(--f-line);color:var(--ink);cursor:pointer;min-width:0;transition:background .2s}\n.hs-tile:active{background:var(--f-line)}\n.hs-tile.hs-grad{border-color:transparent}\n.hs-i{display:flex;align-items:center;justify-content:center}\n.hs-i svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}\n\n.hs-now,.hs-bar,.hs>.pill,.hs-col{transition:opacity .25s}\n.hs.bri-open .hs-now,.hs.bri-open .hs-bar,.hs.bri-open>.pill,.hs.bri-open .hs-col:not(:last-child){opacity:.25;pointer-events:none}\n.hs-bar{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:var(--sp);padding:14px 12px;margin:var(--sp) 0;border-radius:var(--r-l)}\n.hs-side{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;text-align:center}\n.hs-btn{cursor:pointer}\n.hs-nm{font-size:var(--fs-s);color:var(--ink);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.hs-go{width:76px;height:76px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--f-raise);border:2px solid var(--f-line2);color:var(--ink);cursor:pointer;transition:background .2s,border-color .2s}\n.hs-go svg{width:34px;height:34px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}\n.hs-go.on{background:color-mix(in srgb,var(--acc) 40%,var(--f-raise));border-color:var(--acc)}\n.hs-go.on svg{animation:hs-spin 14s linear infinite}\n@keyframes hs-spin{to{transform:rotate(360deg)}}\n@media(prefers-reduced-motion:reduce){.hs-go.on svg{animation:none}}\n.hs-tile:focus-visible,.hs-go:focus-visible,.hs-btn:focus-visible{outline:2px solid var(--acc);outline-offset:2px}\n.hs-off{opacity:.5;pointer-events:none}\n.hs-sw{width:54px;height:16px;border-radius:999px;flex:none;margin-left:auto;border:1px solid var(--f-line2)}\n.hs-sw+.ck{margin-left:10px}\n.lp-mode.hs-m svg{fill:none}";

/* What Hue Plus offers, read from Home Assistant's registry and states (so a page shows only what exists): the bridge's entities, the lights, what belongs to one light, the
 updates, and the bridge's own data (a service that answers). It was the dashboard's `Integrations.hueplus`; now it is this plugin's. */

var hueplus={
 /* The entities of the bridge, by what they are for. The registry's unique_id of one is "<bridge>_<key>"; the bridge id is read from the Zigbee
  channel sensor, which a bridge always has. Returns {key: entity_id}, or null when no bridge of Hue Plus has its bridge module on. */
 BRIDGE_KEYS:["auto_update","auto_update_time","check_update","search","zigbee_channel","matter_fabrics","authorized_apps","home_and_away","firmware","bridge_update","update_state","device_search","service_internet","service_remoteaccess"],
 bridge:function(h){
  var tail="_zigbee_channel",ids=Object.keys(h.entities||{}),uid=null;
  for(var i=0;i<ids.length&&!uid;i++){
   var e=h.entities[ids[i]];
   if(e.platform==="hue_plus"&&e.unique_id&&e.unique_id.length>tail.length&&e.unique_id.slice(-tail.length)===tail)uid=e.unique_id.slice(0,-tail.length);
  }
  if(!uid)return null;
  var out={};
  ids.forEach(function(id){
   var e=h.entities[id];
   if(e.platform!=="hue_plus"||!e.unique_id||e.unique_id.indexOf(uid+"_")!==0)return;
   var key=e.unique_id.slice(uid.length+1);
   if(hueplus.BRIDGE_KEYS.indexOf(key)>=0)out[key]=id;
  });
  return out;
 },
 /* The lights of Hue Plus (not rooms, zones or gradient zones): entity ids whose state carries the bridge's id of the light. */
 lights:function(h){
  return Object.keys(h.entities||{}).filter(function(id){
   var e=h.entities[id],s=h.states[id];
   return e.platform==="hue_plus"&&id.indexOf("light.")===0&&s&&s.attributes&&s.attributes.hue_light_id;
  });
 },
 /* What belongs to one light: its power-on select, identify button and firmware update (the registry's unique_id ends with the light's id, or with the id of its device for the update). */
 forLight:function(h,id){
  var hue=h.states[id]&&h.states[id].attributes.hue_light_id,out={};
  if(!hue)return out;
  Object.keys(h.entities||{}).forEach(function(k){
   var e=h.entities[k];
   if(e.platform!=="hue_plus"||!e.unique_id||e.device_id!==h.entities[id].device_id)return;
   if(e.unique_id.slice(-("_powerup_"+hue).length)==="_powerup_"+hue)out.powerup=k;
   else if(e.unique_id.slice(-("_identify_"+hue).length)==="_identify_"+hue)out.identify=k;
   else if(k.indexOf("update.")===0)out.update=k;
  });
  return out;
 },
 /* Firmware updates of Hue Plus's devices: update entity ids. */
 updates:function(h){
  return Object.keys(h.entities||{}).filter(function(id){return id.indexOf("update.")===0&&h.entities[id].platform==="hue_plus"});
 },
 /* What the bridge itself holds (lists of automations, entertainment areas, ...), asked for when a page opens. */
 resources:function(kinds){return window.HA.serviceResponse("hue_plus","get_resources",{kinds:kinds})},
 /* Whether the integration is installed and offers this service (its modules that are switched off register nothing extra, but the
  service list of Home Assistant only has what is loaded). */
 has:function(h,service){return !!(h&&h.services&&h.services.hue_plus&&h.services.hue_plus[service])}
};

/* The edits of the Hue Plus menu, kept as a draft for each device until they are saved to the bridge.
 A draft belongs to one device: a light, a switch (an accessory) or a MotionAware area. Changing a setting only changes its draft; Save on that device sends that device's
 changes to the bridge, and nothing else. Nothing in this file touches the page or the bridge: huemenu.js draws the drafts and sends them. */

/* key of a device -> {changes: {field: value}}. A key is "<kind>:<id>" (light, acc, marea). */
var HMD = {};

/* What a device was just saved with, key -> {field: {value, until}}. A light tells its new setting a moment after the bridge took it; until it does, the page keeps
 showing what was saved instead of going back to the old value. */
var HMD_SAVED = {};
var HMD_SAVED_MS = 15000;

function hmdKey(kind, id) {
  return kind + ":" + id;
}

/* Stages `value` for a field. A value equal to `actual` (when it is known) is the same as no change, so the draft is dropped when nothing is left in it. */
function hmdStage(key, field, value, actual) {
  var d = HMD[key] || (HMD[key] = { changes: {} });
  if (actual !== undefined && JSON.stringify(actual) === JSON.stringify(value)) delete d.changes[field];
  else d.changes[field] = value;
  if (!Object.keys(d.changes).length) delete HMD[key];
}

/* What a page shows for a field: the staged value, else what was just saved and is not confirmed yet, else `actual`. */
function hmdValue(key, field, actual) {
  var d = HMD[key];
  if (d && Object.prototype.hasOwnProperty.call(d.changes, field)) return d.changes[field];
  var s = (HMD_SAVED[key] || {})[field];
  if (s) {
    if (JSON.stringify(s.value) === JSON.stringify(actual) || Date.now() > s.until) {
      delete HMD_SAVED[key][field];
      return actual;
    }
    return s.value;
  }
  return actual;
}

function hmdStaged(key, field) {
  var d = HMD[key];
  return d && Object.prototype.hasOwnProperty.call(d.changes, field) ? d.changes[field] : undefined;
}

function hmdDirty(key) {
  return !!HMD[key];
}

function hmdChanges(key) {
  return Object.assign({}, (HMD[key] || {}).changes);
}

function hmdDiscard(key) {
  delete HMD[key];
}

/* The draft is saved: it goes, and what it held is remembered until the device shows it. */
function hmdSaved(key) {
  var d = HMD[key],
    seen = (HMD_SAVED[key] = HMD_SAVED[key] || {});
  Object.keys((d || {}).changes || {}).forEach(function (f) {
    seen[f] = { value: d.changes[f], until: Date.now() + HMD_SAVED_MS };
  });
  delete HMD[key];
}

function hmdClear() {
  HMD = {};
  HMD_SAVED = {};
}

/* A press the way the bridge writes it, from what configure_button is given: the shapes the page reads (hmPressKind, hmPressScenes, hmTimeSlots) work on both, so a staged press
 and a press read from the bridge are drawn by the same code. `what` is {action, scene, scenes, slots, with_off, repeat_timeout} as huemenu.js builds it. */
function hmSpecFrom(what) {
  var recall = function (id) {
      return { action: { recall: { rid: id, rtype: "scene" } } };
    },
    off = { enabled: !!what.with_off },
    timeout = { seconds: what.repeat_timeout || 3 };
  if (what.action === "scene") return { recall_single_extended: { actions: [recall(what.scene)], with_off: off } };
  if (what.action === "scene_cycle")
    return {
      scene_cycle_extended: {
        repeat_timeout: timeout,
        slots: (what.scenes || []).map(function (id) {
          return [recall(id)];
        }),
        with_off: off,
      },
    };
  if (what.action === "time_based")
    return {
      time_based_extended: {
        repeat_timeout: timeout,
        slots: (what.slots || []).map(function (s) {
          var t = String(s.time).split(":");
          return { actions: [recall(s.scene)], start_time: { hour: Number(t[0]), minute: Number(t[1]) } };
        }),
        with_off: off,
      },
    };
  return { action: { dim_up: "dim_up", dim_down: "dim_down", all_off: "all_off", home_off: "home_off" }[what.action] || "do_nothing" };
}

/* What the Hue Plus menu and the dashboard's areas share: whether Hue Plus is there, asking the bridge for what it holds, and the exchange of areas with the bridge. The menu pages themselves are in huemenu.js. */

var HP_ICON = "lights";

/* The pages: key -> [title, icon, builder(b, id)]. A key may carry an id after a colon ("hue-light:light.desk_lamp"). huemenu.js adds the menu's own pages. */
var HP_PAGES = {
  "hue-import": ["import_from_the_hue_bridge", "target", hpImportList],
  "hue-read": ["read_from_the_hue_bridge", "target", hpReadList],
};

function hpShown() {
  return hueplus.has(H(), "get_resources") && !!hueplus.bridge(H());
}

function hpBridgeEnts() {
  return hueplus.bridge(H()) || {};
}

function hpNote(text) {
  return pill("info", text, {});
}

function hpName(id) {
  return A(id).friendly_name || id;
}

/* Draws what the bridge says into a box, after asking for it; a failed or empty answer says so instead of leaving the page blank. `again()` asks once more (after a change). */
function hpLoad(b, kinds, draw) {
  var box = mk("div");
  b.appendChild(box);
  function ask() {
    box.innerHTML = "";
    box.appendChild(hpNote(_T("loading")));
    hueplus.resources(kinds).then(
      function (r) {
        box.innerHTML = "";
        draw(box, r || {}, ask);
      },
      function () {
        box.innerHTML = "";
        box.appendChild(hpNote(_T("couldn_t_read_the_hue_bridge")));
      }
    );
  }
  ask();
  return box;
}

/* A service call that says whether it went through: a promise that rejects when it was not sent (callRaw gives nothing back when Home Assistant cannot be reached) or failed. callRaw tells the user of both itself. */
function hpCall(domain, service, data) {
  var p = callRaw(domain, service, data);
  return p ? Promise.resolve(p) : Promise.reject(new Error("not sent"));
}

/* A change to the bridge, then the list is read again. The service finishes when the bridge has answered, so the list is read after the change succeeded or failed, never before. */
function hpDo(again, service, data) {
  var done = callRaw("hue_plus", service, data);
  Promise.resolve(done).then(again, again);
}

/* ---- the dashboard's areas and the bridge's entertainment areas ----
 The dashboard's areas hold any light, Hue or not, and work without Hue Plus. When it is installed they can exchange their Hue lights and positions with the
 bridge's entertainment areas: nothing below runs, or is shown, without it. */

/* The bridge and the area editor count y the other way round. The bridge's y runs from the left corner of the room (-1) to the back corner (1), as the Hue app draws it; the editor's
 runs from the back corner (-1) to the left corner (1). x and the height are the same. A light is turned over with this on its way in and on its way out, so it stands where the Hue app shows it. */
function hpFlip(y) {
  return y ? -y : 0;
}

function hpHueId(entity) {
  return A(entity).hue_light_id || null;
}

function hpEntityOf(hueId) {
  return (
    hueplus.lights(H()).filter(function (id) {
      return hpHueId(id) === hueId;
    })[0] || null
  );
}

/* Rows at the end of the area editor: send this area's Hue lights to the bridge, or take positions from a bridge area. */
function hpAreaActions(box, draft) {
  if (!hpShown() || !isAdmin()) return;
  var hue = draft.lights.filter(function (l) {
    return hpHueId(l.id);
  });
  box.appendChild(
    pill("target", _T("send_to_the_hue_bridge"), {
      sub: function () {
        var other = draft.lights.length - hue.length;
        return cntS(hue.length, _T("hue_light"), _T("hue_lights")) + (other ? " · " + other + " " + _T("stay_here") : "");
      },
      tap: function () {
        hpSendArea(draft);
      },
    })
  );
  box.appendChild(
    pill("restart", _T("read_from_the_hue_bridge"), {
      sub: function () {
        return _T("takes_the_positions_of_its_lights");
      },
      tap: function () {
        showPopup("hue-read", true);
      },
    })
  );
}

/* The bridge's area of the same name is changed, or one is made. Only the area's Hue lights go: the others stay on the dashboard. */
function hpSendArea(draft) {
  var name = String(draft.name || "").trim(),
    lights = draft.lights
      .filter(function (l) {
        return hpHueId(l.id);
      })
      .map(function (l) {
        return { light: hpHueId(l.id), x: l.x, y: hpFlip(l.y), z: l.z };
      });
  if (!name) {
    toast(_T("give_the_area_a_name"));
    return;
  }
  if (!lights.length) {
    toast(_T("no_hue_lights_in_this_area"));
    return;
  }
  hueplus.resources(["entertainment_areas"]).then(
    function (r) {
      var found = ((r && r.entertainment_areas) || []).filter(function (a) {
        return String(a.name).toLowerCase() === name.toLowerCase();
      })[0];
      if (found) call("hue_plus", "update_entertainment_area", { area: found.id, lights: lights });
      else call("hue_plus", "create_entertainment_area", { name: name, area_type: "other", lights: lights });
      toast(_T("sent_to_the_hue_bridge"));
    },
    function () {
      toast(_T("couldn_t_read_the_hue_bridge"));
    }
  );
}

/* A bridge area's lights as dashboard lights {id, x, y, z}: those Home Assistant has, and (when `only` is given) that belong to it. */
function hpAreaLightsOf(area, only) {
  var out = [];
  (area.lights || []).forEach(function (l) {
    var id = hpEntityOf(l.light_id);
    if (!id || (only && !only[id])) return;
    out.push({ id: id, x: eaClamp(l.x || 0), y: eaClamp(hpFlip(l.y || 0)), z: eaClamp(l.z || 0) });
  });
  return out;
}

function hpBridgeAreas(b, draw) {
  hpLoad(b, ["entertainment_areas"], function (box, r) {
    var list = r.entertainment_areas || [];
    if (!list.length) box.appendChild(hpNote(_T("nothing_found")));
    list.forEach(function (a) {
      draw(box, a);
    });
  });
}

/* In a room's list of areas: a new area made from one of the bridge. It opens in the editor, so nothing is saved until the user says so. */
function hpAreaImport(box, room) {
  if (!hpShown() || !isAdmin()) return;
  box.appendChild(
    pill("plus", _T("import_from_the_hue_bridge"), {
      sub: function () {
        return _T("an_entertainment_area_of_the_bridge");
      },
      tap: function () {
        showPopup("hue-import:" + room, true);
      },
    })
  );
}

function hpImportList(b, room) {
  var here = {};
  eaRoomLights(room).forEach(function (l) {
    here[l.id] = 1;
  });
  hpBridgeAreas(b, function (box, a) {
    var lights = hpAreaLightsOf(a, here);
    box.appendChild(
      pill("target", a.name, {
        sub: function () {
          return cntS(lights.length, _T("light"), _T("lights")) + " " + _T("in_this_room");
        },
        tap: function () {
          if (!lights.length) {
            toast(_T("none_of_its_lights_are_in_this_room"));
            return;
          }
          closeLayer();
          openArea(room, null, { id: "", name: a.name, room: room, lights: lights, dummies: [] });
        },
      })
    );
  });
}

/* In the area editor: the positions of a bridge area's lights, for the lights of this room. */
function hpReadList(b) {
  hpBridgeAreas(b, function (box, a) {
    box.appendChild(
      pill("target", a.name, {
        sub: function () {
          return cntS((a.lights || []).length, _T("light"), _T("lights"));
        },
        tap: function () {
          var have = {};
          eaRoomLights(areaEditor().room).forEach(function (l) {
            have[l.id] = 1;
          });
          areaEditor().draft.lights.forEach(function (l) {
            have[l.id] = 1;
          });
          var got = hpAreaLightsOf(a, have);
          if (!got.length) {
            toast(_T("none_of_its_lights_are_in_this_room"));
            return;
          }
          got.forEach(function (g) {
            var mine = areaEditor().draft.lights.filter(function (l) {
              return l.id === g.id;
            })[0];
            if (mine) {
              mine.x = g.x;
              mine.y = g.y;
              mine.z = g.z;
            } else areaEditor().draft.lights.push(g);
          });
          closeLayer();
          rebuildArea();
        },
      })
    );
  });
}

/* ---- editing an entertainment area on the bridge itself ----
 The placement editor opens on the bridge's area, not on one of the dashboard's: its lights are the Hue lights, what is saved goes to the bridge, and the dashboard's own areas do not change. */

/* The editor's draft of a bridge area. A light of the area that Home Assistant has no entity for cannot be moved here; it is kept as it is (`kept`) and sent back with the others. */
function hpBridgeDraft(area) {
  var lights = [],
    kept = [];
  (area.lights || []).forEach(function (l) {
    var id = hpEntityOf(l.light_id);
    if (id) lights.push({ id: id, x: eaClamp(l.x || 0), y: eaClamp(hpFlip(l.y || 0)), z: eaClamp(l.z || 0), balance: l.balance });
    else kept.push({ light: l.light_id, x: l.x, y: l.y, z: l.z, balance: l.balance });
  });
  return { id: area.id, name: area.name, room: "", lights: lights, dummies: [], kept: kept };
}

function hpEditOnBridge(area, after) {
  openExternalArea("hue_plus", hpBridgeDraft(area), { id: area.id, after: after || null, note: _T("hm_this_area_is_on_the_bridge") });
}

/* The lights that can be put in a bridge area: the Hue Plus lights (the ones Hue lights, not groups). */
function hpBridgeLights() {
  return hueplus.lights(H()).map(function (id) {
    return { id: id, name: hpName(id), icon: "lamp" };
  });
}

/* Saves the area to the bridge and goes on to `leave`. Gives back false when it cannot be saved (no name, no light), else a promise of whether the bridge took it. */
function hpSaveBridge(leave) {
  var d = areaEditor().draft,
    name = String(d.name || "").trim();
  if (!name) {
    toast(_T("give_the_area_a_name"));
    return false;
  }
  var lights = d.kept
    .concat(
      d.lights.map(function (l) {
        return { light: hpHueId(l.id), x: l.x, y: hpFlip(l.y), z: l.z, balance: l.balance };
      })
    )
    .map(function (l) {
      var o = { light: l.light, x: l.x, y: l.y, z: l.z };
      if (typeof l.balance === "number") o.balance = l.balance;
      return o;
    });
  if (!lights.length) {
    toast(_T("add_at_least_one_light"));
    return false;
  }
  var after = areaEditor().external.after;
  return hpCall("hue_plus", "update_entertainment_area", { area: areaEditor().external.id, name: name, lights: lights }).then(
    function () {
      toast(_T("hm_saved_to_the_bridge"));
      eaIdentifyOff();
      areaEditor().saved = JSON.stringify(areaEditor().draft);
      if (after) after();
      setPopGuard(null);
      leave();
      return true;
    },
    function () {
      toast(_T("hm_the_bridge_did_not_accept_this"));
      return false;
    }
  );
}

/* The Hue Plus menu in Settings, laid out like the settings of the Hue app: a big heading, labelled groups of flat rows (icon, name, value, arrow), tiles for lights,
 checklists for a choice, and a few buttons at the end. Everything shown comes from Hue Plus: its entities and what `hue_plus.get_resources` asks the bridge.
 hueplus.js keeps what the area editor needs (hpShown, hpLoad, hpDo, hpName, the bridge-area import); this file only draws the menu pages. */

/* What the bridge said, by kind of resource. Everything the menu shows is read once, when the menu opens (one loading screen); after that every page draws at once from here.
   The edits of a device are not written here but kept as a draft (hmdraft.js) until that device is saved. */
var HM = {};
var HM_KINDS = ["accessories", "scenes", "rooms", "zones", "entertainment_areas", "motion_areas", "automations", "apps", "bridge", "devices", "home_and_away"];
var HM_READY = false;
var HM_READING = null;

/* The one read. Every page that needs the data waits for the same answer. */
function hmReady() {
  if (HM_READY) return Promise.resolve();
  if (!HM_READING)
    HM_READING = hueplus.resources(HM_KINDS).then(
      function (r) {
        HM_KINDS.forEach(function (k) {
          HM[k] = (r || {})[k];
        });
        HM_READY = true;
        HM_READING = null;
      },
      function (e) {
        HM_READING = null;
        throw e;
      }
    );
  return HM_READING;
}

/* A page that draws from HM by itself (its rows read it when they refresh) only needs the data to be there. */
function hmEnsure() {
  hmReady().then(refresh, function () {});
}

/* The menu belongs to the popup it was opened in: a popup opened later reads the bridge again and starts with no drafts. */
var HM_SHEET = null;

function hmSession() {
  if (HM_SHEET === currentSheet()) return;
  HM_SHEET = currentSheet();
  HM = {};
  HM_READY = false;
  HM_READING = null;
  hmdClear();
}

function hmList(kind) {
  var v = HM[kind];
  return Array.isArray(v) ? v : [];
}

function hmMotionAreas() {
  return (HM.motion_areas && HM.motion_areas.areas) || [];
}

/* ---- the pieces ---- */

function hmBox(b) {
  b.classList.add("hm");
  hmSession();
}

/* The big heading under the popup's title bar: an icon, a name and, when given, a second line. `name` may be a function (read again whenever the page refreshes). */
function hmTitle(icon, name, sub) {
  var t = mk("div", "hm-title", "<span class='hm-bigi'>" + svg(icon) + "</span><span class='hm-tt'><b></b><i></i></span>");
  var nm = t.querySelector("b"),
    sb = t.querySelector("i");
  t.refresh = function () {
    nm.textContent = typeof name === "function" ? name() : name;
    var s = typeof sub === "function" ? sub() : sub;
    sb.textContent = s || "";
    sb.style.display = s ? "" : "none";
  };
  reg(t.refresh);
  return t;
}

function hmLabel(text) {
  return mk("div", "hm-label").appendChild(document.createTextNode(text)).parentNode;
}

function hmGroup(rows) {
  var g = mk("div", "hm-group");
  rows.forEach(function (r) {
    if (r) g.appendChild(r);
  });
  return g;
}

/* One row. o: icon, title, sub, val (text or function), tap (a popup key or a function), toggle {get, set}, check (function), danger.
   An arrow shows when a tap opens another page (a popup key); a toggle or a tick shows at the end of the row. */
function hmRow(o) {
  var key = typeof o.tap === "string" ? o.tap : null,
    r = mk("div", "hm-row" + (o.tap || o.toggle ? " tap" : "") + (o.danger ? " danger" : "") + (o.stack ? " stack" : ""));
  r.innerHTML =
    (o.icon ? "<span class='hm-i'>" + svg(o.icon) + "</span>" : "") +
    "<span class='hm-t'><span class='hm-n'></span><span class='hm-s'></span></span><span class='hm-v'></span>" +
    (o.toggle ? "<span class='hm-sw'><i></i></span>" : "") +
    (o.check ? "<span class='hm-ck'>" + svg("check") + "</span>" : "") +
    (key ? "<span class='hm-c'>" + svg("chev") + "</span>" : "");
  var nm = r.querySelector(".hm-n"),
    sb = r.querySelector(".hm-s"),
    vl = r.querySelector(".hm-v");
  if (o.tap || o.toggle) {
    r.setAttribute("role", o.toggle ? "switch" : o.check ? "radio" : "button");
    r.tabIndex = 0;
    var act = function () {
      if (o.toggle) o.toggle.set();
      else if (key) showPopup(key, true);
      else o.tap();
    };
    r.addEventListener("click", act);
    r.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        act();
      }
    });
  }
  r.refresh = function () {
    nm.textContent = typeof o.title === "function" ? o.title() : o.title;
    var s = typeof o.sub === "function" ? o.sub() : o.sub;
    sb.textContent = s || "";
    sb.style.display = s ? "" : "none";
    var v = typeof o.val === "function" ? o.val() : o.val;
    vl.textContent = v === undefined || v === null ? "" : v;
    if (o.toggle) {
      var on = !!o.toggle.get();
      r.classList.toggle("on", on);
      r.setAttribute("aria-checked", on ? "true" : "false");
    }
    if (o.check) {
      var ck = !!o.check();
      r.classList.toggle("checked", ck);
      r.setAttribute("aria-checked", ck ? "true" : "false");
    }
    if (o.good) r.classList.toggle("good", !!o.good());
  };
  reg(r.refresh);
  return r;
}

/* A line of information: what it is above, what it says below. Not pressable. */
function hmInfo(label, value, good) {
  return hmRow({
    title: label,
    sub: value,
    good: good,
    stack: true,
  });
}

/* kind: "primary" (the accent colour), "ghost" or "danger" (red outline). */
function hmButton(text, kind, fn) {
  var b = mk("button", "hm-btn " + (kind || "ghost"));
  b.type = "button";
  b.textContent = text;
  b.addEventListener("click", fn);
  return b;
}

function hmActions(buttons) {
  var a = mk("div", "hm-actions");
  buttons.forEach(function (b) {
    if (b) a.appendChild(b);
  });
  return a;
}

/* An information box. */
function hmCallout(text) {
  var n = mk("div", "hm-note", "<span class='hm-ni'>" + svg("info") + "</span><span class='hm-nt'></span>");
  n.querySelector(".hm-nt").textContent = text;
  return n;
}

/* A short list of choices on one line (for a few numbers of minutes). */
function hmChips(options, cur, set, fmt) {
  var box = mk("div", "hm-chips");
  options.forEach(function (o) {
    var c = mk("button", "hm-chip");
    c.type = "button";
    c.textContent = fmt ? fmt(o) : String(o);
    c.addEventListener("click", function () {
      set(o);
      refresh();
    });
    c.refresh = function () {
      c.classList.toggle("on", cur() === o);
    };
    reg(c.refresh);
    box.appendChild(c);
  });
  return box;
}

/* Draws a page from what was read when the menu opened, at once; the first page of a menu waits for that read and says so. `again()` reads the page's kinds once more and draws it again,
   for the pages whose buttons act at once (a routine, an app, an area) and so change what the bridge holds. */
function hmLoad(b, kinds, draw) {
  var box = mk("div");
  b.appendChild(box);
  function failed() {
    box.innerHTML = "";
    box.appendChild(hmCallout(_T("couldn_t_read_the_hue_bridge")));
  }
  function show() {
    box.innerHTML = "";
    draw(box, HM, ask);
    refresh();
  }
  function ask() {
    hueplus.resources(kinds).then(function (r) {
      kinds.forEach(function (k) {
        HM[k] = (r || {})[k];
      });
      show();
    }, failed);
  }
  if (HM_READY) show();
  else {
    box.appendChild(hmCallout(_T("loading")));
    hmReady().then(show, failed);
  }
  return box;
}

function hmUpdateText(id) {
  var s = V_(id);
  if (s === "on") return _T("update_available") + (A(id).latest_version ? " · " + A(id).latest_version : "");
  return s === "off" ? _T("up_to_date") : "";
}

function hmBridgeId() {
  var E = hpBridgeEnts(),
    e = E.zigbee_channel && H().entities[E.zigbee_channel],
    uid = (e && e.unique_id) || "";
  return uid.replace(/_zigbee_channel$/, "").toUpperCase();
}

/* ---- the edits of one device: shown from its draft, sent to the bridge when that device is saved ---- */

/* The setting of a light as the bridge holds it: its entity says (the power-on behaviour is a select entity of its own). */
function hmLightActual(id, field) {
  if (field === "powerup") {
    var X = hueplus.forLight(H(), id);
    return X.powerup ? V_(X.powerup) : "";
  }
  return A(id)["hue_" + field];
}

/* What a light's page shows: the draft's value, else what was just saved, else what the light says. */
function hmLightValue(id, field) {
  return hmdValue(hmdKey("light", id), field, hmLightActual(id, field));
}

function hmAccessory(id) {
  return hmList("accessories").filter(function (x) {
    return x.id === id;
  })[0];
}

function hmMotionArea1(id) {
  return hmMotionAreas().filter(function (x) {
    return x.id === id;
  })[0];
}

function hmEntArea(id) {
  return hmList("entertainment_areas").filter(function (x) {
    return x.id === id;
  })[0];
}

/* What an entertainment area does when a sync stops, and who streams for it, as the area has them: {end_state, scene} and {mode, light}. A draft holds the same shapes. */
function hmAreaEnd(x) {
  return hmdValue(hmdKey("area", x.id), "end", { end_state: x.end_state || "last_state" });
}

function hmAreaPerf(x) {
  return hmdValue(hmdKey("area", x.id), "performance", { mode: x.performance === "manual" ? "manual" : "auto", light: x.performance_light || null });
}

/* Puts one record read again from the bridge in place of the one held, and leaves every other device as it was. A failed read is no failure of the save: the held record has been updated by hand. */
function hmReread(kind, id) {
  return hueplus.resources([kind]).then(
    function (r) {
      var fresh = (r || {})[kind],
        list = kind === "motion_areas" ? (fresh || {}).areas : fresh,
        mine = Array.isArray(list) && list.filter(function (y) { return y.id === id; })[0],
        swap = function (held) {
          return held.map(function (x) {
            return x.id === id ? mine : x;
          });
        };
      if (!mine) return;
      if (kind === "motion_areas") HM.motion_areas = fresh; /* the areas, their candidates and the sensitivity services move together */
      else HM[kind] = swap(hmList(kind));
    },
    function () {}
  );
}

function hmSaveLight(id, ch) {
  var fields = {},
    X = hueplus.forLight(H(), id),
    job = Promise.resolve();
  ["function", "gradient_orientation", "gradient_order"].forEach(function (f) {
    if (ch[f] !== undefined) fields[f] = ch[f];
  });
  if (Object.keys(fields).length) job = hpCall("hue_plus", "configure_light", Object.assign({ light: A(id).hue_light_id }, fields));
  if (ch.powerup !== undefined && X.powerup)
    job = job.then(function () {
      return hpCall("select", "select_option", { entity_id: X.powerup, option: ch.powerup });
    });
  return job;
}

/* A switch is saved press by press: each press that was changed is one call to the bridge. */
function hmSaveSwitch(id, ch) {
  var x = hmAccessory(id),
    job = Promise.resolve();
  Object.keys(ch).forEach(function (field) {
    var st = ch[field];
    job = job
      .then(function () {
        return hpCall("hue_plus", "configure_button", Object.assign({ accessory: st.k.acc, button: st.k.n, press: st.k.press }, st.what));
      })
      .then(function () {
        var p = field.split("|"),
          f = HM_PRESSES.filter(function (y) { return y[0] === p[1]; })[0][2];
        if (x) {
          x.actions = x.actions || {};
          (x.actions[p[0]] = x.actions[p[0]] || {})[f] = hmSpecFrom(st.what);
        }
      });
  });
  return job.then(function () {
    return hmReread("accessories", id);
  });
}

function hmSaveMotion(id, ch) {
  var body = { area: id };
  ["enabled", "name", "sensitivity"].forEach(function (f) {
    if (ch[f] !== undefined) body[f] = ch[f];
  });
  if (ch.lights !== undefined) body.lights = ch.lights;
  return hpCall("hue_plus", "set_motion_area", body).then(function () {
    return hmReread("motion_areas", id);
  });
}

/* An entertainment area: what happens when a sync stops, and who streams. */
function hmSaveArea(id, ch) {
  var x = hmEntArea(id),
    job = Promise.resolve();
  if (ch.end)
    job = hpCall("hue_plus", "set_streaming_end_state", ch.end.scene ? { area: id, end_state: "scene", scene: ch.end.scene } : { area: id, end_state: ch.end.end_state }).then(function () {
      if (x) x.end_state = ch.end.end_state;
    });
  if (ch.performance)
    job = job
      .then(function () {
        return hpCall(
          "hue_plus",
          "update_entertainment_area",
          ch.performance.mode === "manual" ? { area: id, performance: "manual", performance_light: ch.performance.light } : { area: id, performance: "auto" }
        );
      })
      .then(function () {
        if (x) {
          x.performance = ch.performance.mode;
          x.performance_light = ch.performance.mode === "manual" ? ch.performance.light : null;
        }
      });
  return job.then(function () {
    return hmReread("entertainment_areas", id);
  });
}

/* Sends one device's draft to the bridge. Resolves true when it all went through (the draft is then gone), false when something did not, and the draft stays so it can be saved again. */
function hmSaveDraft(key) {
  var kind = key.split(":")[0],
    id = key.slice(kind.length + 1),
    ch = hmdChanges(key),
    job =
      kind === "light" ? hmSaveLight(id, ch) : kind === "acc" ? hmSaveSwitch(id, ch) : kind === "marea" ? hmSaveMotion(id, ch) : kind === "area" ? hmSaveArea(id, ch) : Promise.resolve();
  return job.then(
    function () {
      hmdSaved(key);
      refresh();
      return true;
    },
    function () {
      return false;
    }
  );
}

/* What the checkmark and the "Unsaved changes" question do: send the device, and when it went through go on to `leave`. */
function hmSaveThen(key, leave) {
  if (!hmdDirty(key)) {
    setPopGuard(null);
    leave();
    return true;
  }
  return hmSaveDraft(key).then(function (ok) {
    if (ok) {
      toast(_T("hm_saved_to_the_bridge"));
      setPopGuard(null);
      leave();
    }
    return ok;
  });
}

/* A device of the menu is saved like everything else that is saved (guardUnsaved): a checkmark next to the close button, and closing with changes that are not saved asks. The pages that only choose
   one setting of the device are inner: going back from them to the device does not ask. */
function hmGuard(key, inner) {
  guardUnsaved({
    inner: !!inner,
    dirty: function () {
      return hmdDirty(key);
    },
    save: function (leave) {
      return hmSaveThen(key, leave);
    },
    discard: function () {
      hmdDiscard(key);
    },
  });
}

/* ---- the first page ---- */

function hmUpdatesDue() {
  return hueplus.updates(H()).filter(function (u) {
    return V_(u) === "on";
  }).length;
}

function hmRoot(b) {
  hmBox(b);
  hmLoad(b, HM_KINDS, function (box) {
    hmRootPage(box);
  });
}

function hmRootPage(b) {
  var E = hpBridgeEnts(),
    lights = function () {
      return hueplus.lights(H()).length;
    };
  b.appendChild(hmLabel(_T("hm_in_this_home")));
  b.appendChild(
    hmGroup([
      hmRow({
        icon: "lights",
        title: _T("hm_devices"),
        sub: function () {
          return cntS(lights(), _T("hm_light"), _T("hm_lights")) + " · " + cntS(hmList("accessories").length, _T("hm_switch"), _T("hm_switches_n"));
        },
        tap: "hue-devices",
      }),
      hmRow({
        icon: "plug",
        title: _T("hm_bridges"),
        sub: function () {
          return (HM.bridge && HM.bridge.name) || _T("hue_bridge");
        },
        tap: "hue-bridge",
      }),
      hmRow({
        icon: "motion",
        title: _T("hm_motionaware_areas"),
        val: function () {
          return HM.motion_areas ? String(hmMotionAreas().length) : "";
        },
        tap: "hue-motion",
      }),
      hmRow({
        icon: "target",
        title: _T("entertainment_areas"),
        val: function () {
          return HM.entertainment_areas ? String(hmList("entertainment_areas").length) : "";
        },
        tap: "hue-ent",
      }),
      hmRow({
        icon: "clock",
        title: _T("routines_and_automations"),
        val: function () {
          return HM.automations ? String(hmList("automations").length) : "";
        },
        tap: "hue-routines",
      }),
      hmRow({
        icon: "scene",
        title: _T("hm_smart_home"),
        sub: _T("hm_matter_and_linked_apps"),
        tap: "hue-matter",
      }),
      hmRow({
        icon: "restart",
        title: _T("hm_software_update"),
        sub: function () {
          var n = hmUpdatesDue();
          return n ? cntS(n, _T("update_available_2"), _T("updates_available")) : _T("hm_everything_is_up_to_date");
        },
        tap: "hue-updates",
      }),
    ])
  );
  b.appendChild(hmLabel(_T("hm_advanced")));
  b.appendChild(
    hmGroup([
      hmRow({
        icon: "lock",
        title: _T("hm_applications"),
        val: function () {
          return HM.apps ? String(hmList("apps").length) : E.authorized_apps ? V_(E.authorized_apps) : "";
        },
        tap: "hue-apps",
      }),
    ])
  );
}

/* ---- devices: lights and switches ---- */

function hmDevices(b) {
  hmBox(b);
  hmEnsure();
  var E = hpBridgeEnts();
  b.appendChild(
    hmGroup([
      hmRow({
        icon: "lamp",
        title: _T("hm_lights_and_smart_plugs"),
        val: function () {
          return String(hueplus.lights(H()).length);
        },
        tap: "hue-lights",
      }),
      hmRow({
        icon: "cog",
        title: _T("hm_switches"),
        val: function () {
          return HM.accessories ? String(hmList("accessories").length) : "";
        },
        tap: "hue-switches",
      }),
      hmRow({
        icon: "home",
        title: _T("hrw_rooms_and_zones"),
        val: function () {
          return HM.rooms ? String(hmList("rooms").length + hmList("zones").length) : "";
        },
        tap: "hue-groups",
      }),
    ])
  );
  if (E.search)
    b.appendChild(
      hmActions([
        hmButton(_T("search_for_new_devices"), "primary", function () {
          call("button", "press", { entity_id: E.search });
        }),
      ])
    );
}

function hmLights(b) {
  hmBox(b);
  var list = hueplus.lights(H());
  if (!list.length) b.appendChild(hmCallout(_T("nothing_found")));
  var grid = mk("div", "hm-tiles");
  list.forEach(function (id) {
    var t = mk("div", "hm-tile tap", "<span class='hm-ti'>" + svg("lamp") + "</span><b></b><i></i>"),
      gear = mk("button", "hm-gear", svg("tune"));
    gear.type = "button";
    gear.setAttribute("aria-label", _T("light_setup"));
    gear.addEventListener("click", function (e) {
      e.stopPropagation();
      showPopup("hue-light:" + id, true);
    });
    t.querySelector("b").textContent = hpName(id);
    t.appendChild(gear);
    t.addEventListener("click", function () {
      showPopup("light:" + id, true);
    });
    t.refresh = function () {
      t.classList.toggle("on", isOn(id));
      t.querySelector("i").textContent = V_(id) === "unavailable" ? _T("hm_unreachable") : isOn(id) ? _T("on_2") : _T("off");
    };
    reg(t.refresh);
    grid.appendChild(t);
  });
  b.appendChild(grid);
}

/* ---- the settings of one light ---- */

var HM_FUNCTIONS = ["decorative", "functional", "mixed"];
var HM_POWER = ["safety", "last_on_state", "powerfail"];

function hmLight(b, id) {
  hmBox(b);
  hmGuard(hmdKey("light", id));
  var X = hueplus.forLight(H(), id),
    hue = A(id).hue_light_id,
    a = function () {
      return A(id);
    },
    area = H().entities && H().entities[id] && H().entities[id].area_id,
    minutes = 15;
  b.appendChild(hmTitle("lamp", hpName(id), function () {
    return V_(id) === "unavailable" ? _T("hm_unreachable") : "";
  }));
  if (area && H().areas && H().areas[area])
    b.appendChild(hmGroup([hmRow({ icon: "home", title: _T("hm_room"), val: H().areas[area].name })]));
  var general = [];
  if (a().hue_function)
    general.push(
      hmRow({
        title: _T("hm_function"),
        sub: _T("hm_how_you_use_this_light"),
        val: function () {
          return _T("fn_" + hmLightValue(id, "function"));
        },
        tap: "hue-fn:" + id,
      })
    );
  if (X.powerup)
    general.push(
      hmRow({
        title: _T("hm_power_on"),
        sub: _T("hm_light_behavior_at_power_on"),
        val: function () {
          return _T("hm_pw_" + hmLightValue(id, "powerup"));
        },
        tap: "hue-pw:" + id,
      })
    );
  if (a().hue_gradient_orientation && a().hue_gradient_orientation_configurable)
    general.push(
      hmRow({
        title: _T("mounting_direction"),
        val: function () {
          return _T("hm_" + hmLightValue(id, "gradient_orientation"));
        },
        tap: "hue-or:" + id,
      })
    );
  if (a().hue_gradient_order && a().hue_gradient_order_configurable)
    general.push(
      hmRow({
        title: _T("segment_order"),
        val: function () {
          return _T("hm_" + hmLightValue(id, "gradient_order"));
        },
        tap: "hue-od:" + id,
      })
    );
  if (general.length) {
    b.appendChild(hmLabel(_T("hm_general")));
    b.appendChild(hmGroup(general));
  }
  if (a().hue_function || a().hue_gradient_order) b.appendChild(hmCallout(_T("experimental_not_yet_tried_on_a_real_bridge")));
  var info = [];
  if (a().hue_min_brightness !== undefined)
    info.push(
      hmRow({
        title: _T("lowest_brightness"),
        val: function () {
          return Math.round(a().hue_min_brightness * 100) / 100 + "%";
        },
      })
    );
  if (X.update)
    info.push(
      hmRow({
        title: _T("firmware"),
        sub: function () {
          return A(X.update).installed_version || "";
        },
        val: function () {
          return hmUpdateText(X.update);
        },
        tap:
          V_(X.update) === "on"
            ? function () {
                confirmDlg(_T("install_this_update"), function () {
                  call("update", "install", { entity_id: X.update });
                });
              }
            : null,
      })
    );
  if (info.length) {
    b.appendChild(hmLabel(_T("hm_device_info")));
    b.appendChild(hmGroup(info));
  }
  b.appendChild(hmLabel(_T("hm_timed_effects")));
  b.appendChild(hmChips([5, 15, 30, 60], function () { return minutes; }, function (v) { minutes = v; }, function (v) { return v + " " + _T("hm_min"); }));
  b.appendChild(
    hmGroup(
      [
        ["sunrise", "bright"],
        ["sunset", "moon"],
        ["no_effect", "stop"],
      ].map(function (x) {
        return hmRow({
          icon: x[1],
          title: _T("hp_" + x[0]),
          tap: function () {
            call("hue_plus", "timed_effect", { light: hue, effect: x[0], duration: minutes * 60 });
          },
        });
      })
    )
  );
  b.appendChild(
    hmActions([
      X.identify
        ? hmButton(_T("identify"), "ghost", function () {
            call("button", "press", { entity_id: X.identify });
          })
        : null,
      hmButton(_T("hm_delete"), "danger", function () {
        hmRemoveDevice(hpName(id), id);
      }),
    ])
  );
}

/* Takes a light or an accessory off the bridge, after asking. The device must be reset before it can be added again. */
function hmRemoveDevice(device, entity) {
  confirmDlg(_T("hm_remove_this_device"), function () {
    hpCall("hue_plus", "remove_device", { device: device, confirm: true }).then(
      function () {
        HM_READY = false;
        closeLayer();
        hmEnsure();
      },
      function () {
        toast(_T("hm_couldn_t_remove_the_device"));
      }
    );
  });
}

/* ---- a choice, shown as a checklist (like the Hue app's "Power on") ---- */

/* kind -> the light setting it picks (a field of the light's draft, see hmLightValue) and how to list and describe the choices. The page key is "<kind>:<light>". */
var HM_PICKS = {
  "hue-fn": {
    field: "function",
    title: "hm_function",
    options: function () {
      return HM_FUNCTIONS;
    },
    name: function (v) {
      return _T("fn_" + v);
    },
    sub: function (v) {
      return _T("hm_fn_" + v);
    },
  },
  "hue-pw": {
    field: "powerup",
    title: "hm_power_on",
    options: function (id) {
      var X = hueplus.forLight(H(), id);
      return X.powerup ? (A(X.powerup).options || HM_POWER) : HM_POWER;
    },
    name: function (v) {
      return _T("hm_pw_" + v);
    },
    sub: function (v) {
      return _T("hm_pw_" + v + "_sub");
    },
  },
  "hue-or": {
    field: "gradient_orientation",
    title: "mounting_direction",
    options: function () {
      return ["horizontal", "vertical"];
    },
    name: function (v) {
      return _T("hm_" + v);
    },
  },
  "hue-od": {
    field: "gradient_order",
    title: "segment_order",
    options: function () {
      return ["forward", "reversed"];
    },
    name: function (v) {
      return _T("hm_" + v);
    },
  },
};

function hmPick(kind) {
  return function (b, id) {
    hmBox(b);
    var cfg = HM_PICKS[kind],
      key = hmdKey("light", id);
    hmGuard(key, true);
    b.appendChild(
      hmGroup(
        cfg.options(id).map(function (v) {
          return hmRow({
            title: cfg.name(v),
            sub: cfg.sub ? cfg.sub(v) : "",
            check: function () {
              return hmLightValue(id, cfg.field) === v;
            },
            tap: function () {
              hmdStage(key, cfg.field, v, hmLightActual(id, cfg.field));
              popBack();
            },
          });
        })
      )
    );
  };
}

/* ---- the bridge ---- */

function hmBridge(b) {
  hmBox(b);
  hmEnsure();
  var E = hpBridgeEnts();
  b.appendChild(
    hmTitle("plug", function () {
      return (HM.bridge && HM.bridge.name) || _T("hue_bridge");
    })
  );
  b.appendChild(hmLabel(_T("hm_info")));
  b.appendChild(
    hmGroup([
      hmInfo(
        _T("hm_status"),
        function () {
          return E.firmware && V_(E.firmware) !== "unavailable" ? _T("hm_connected") : _T("hm_unreachable");
        },
        function () {
          return E.firmware && V_(E.firmware) !== "unavailable";
        }
      ),
      hmInfo(_T("hm_id"), hmBridgeId),
      E.bridge_update
        ? hmInfo(_T("hm_software"), function () {
            return A(E.bridge_update).installed_version || "";
          })
        : null,
    ])
  );
  b.appendChild(hmLabel(_T("hm_settings")));
  b.appendChild(
    hmGroup([
      hmRow({
        title: _T("hw_name"),
        val: function () {
          return (HM.bridge && HM.bridge.name) || "";
        },
        tap: "hue-bname",
      }),
      E.zigbee_channel
        ? hmRow({
            title: _T("zigbee_channel"),
            val: function () {
              return V_(E.zigbee_channel);
            },
            tap: "hue-zch",
          })
        : null,
      hmRow({
        title: _T("hrw_home_location"),
        val: function () {
          return HM.home_and_away && HM.home_and_away.configured ? _T("set_up") : _T("not_set_up");
        },
        tap: hrwSetHomeLocation,
      }),
      hmRow({
        title: _T("hm_time_zone"),
        val: function () {
          return (HM.bridge && HM.bridge.time_zone) || "";
        },
      }),
      E.service_internet
        ? hmRow({
            title: _T("internet"),
            val: function () {
              return isOn(E.service_internet) ? _T("on_2") : _T("off");
            },
          })
        : null,
      E.home_and_away
        ? hmRow({
            title: _T("home_and_away"),
            val: function () {
              return V_(E.home_and_away) === "configured" ? _T("set_up") : _T("not_set_up");
            },
          })
        : null,
      hmRow({
        title: _T("matter"),
        val: function () {
          return E.matter_fabrics ? V_(E.matter_fabrics) + " / " + (A(E.matter_fabrics).max_fabrics || "–") : "";
        },
        tap: "hue-matter",
      }),
      hmRow({
        title: _T("hm_applications"),
        val: function () {
          return E.authorized_apps ? V_(E.authorized_apps) : "";
        },
        tap: "hue-apps",
      }),
    ])
  );
  b.appendChild(
    hmActions([
      E.search
        ? hmButton(_T("search_for_new_devices"), "primary", function () {
            call("button", "press", { entity_id: E.search });
          })
        : null,
    ])
  );
}

/* ---- software update ---- */

function hmUpdates(b) {
  hmBox(b);
  var E = hpBridgeEnts(),
    list = hueplus.updates(H());
  var status = hmRow({
    title: function () {
      var n = hmUpdatesDue();
      return n ? cntS(n, _T("update_available_2"), _T("updates_available")) : _T("hm_everything_is_up_to_date");
    },
    good: function () {
      return !hmUpdatesDue();
    },
    check: function () {
      return !hmUpdatesDue();
    },
  });
  b.appendChild(hmGroup([status]));
  var auto = [];
  if (E.auto_update)
    auto.push(
      hmRow({
        title: _T("automatic_updates"),
        toggle: {
          get: function () {
            return isOn(E.auto_update);
          },
          set: function () {
            toggleEnt(E.auto_update);
          },
        },
      })
    );
  if (E.auto_update_time)
    auto.push(
      hmRow({
        title: _T("automatic_update_time"),
        val: function () {
          return (V_(E.auto_update_time) || "").slice(0, 5);
        },
      })
    );
  if (auto.length) {
    b.appendChild(hmGroup(auto));
    b.appendChild(hmCallout(_T("hm_updates_are_installed_at_this_time")));
  }
  b.appendChild(hmLabel(_T("hm_devices")));
  if (!list.length) b.appendChild(hmCallout(_T("nothing_found")));
  b.appendChild(
    hmGroup(
      list.map(function (id) {
        return hmRow({
          icon: "restart",
          title: hpName(id).replace(/ firmware$/i, ""),
          sub: function () {
            return A(id).installed_version || "";
          },
          val: function () {
            return V_(id) === "on" ? hmUpdateText(id) : "";
          },
          tap: function () {
            if (V_(id) !== "on") return;
            confirmDlg(_T("install_this_update"), function () {
              call("update", "install", { entity_id: id });
            });
          },
        });
      })
    )
  );
  if (E.check_update)
    b.appendChild(
      hmActions([
        hmButton(_T("check_for_an_update"), "ghost", function () {
          call("button", "press", { entity_id: E.check_update });
        }),
      ])
    );
}

/* ---- smart home (Matter) and applications ---- */

function hmMatter(b) {
  hmBox(b);
  var E = hpBridgeEnts(),
    f = (E.matter_fabrics && A(E.matter_fabrics).fabrics) || [];
  b.appendChild(hmLabel(_T("hm_linked_to_hue")));
  if (!f.length) b.appendChild(hmCallout(_T("nothing_connected")));
  else
    b.appendChild(
      hmGroup(
        f.map(function (x) {
          return hmRow({
            icon: "scene",
            title: x.label || x.vendor || x.id,
            sub: [x.vendor, x.status].filter(Boolean).join(" · "),
            tap: function () {
              confirmDlg(_T("disconnect_this_matter_app_from_the_bridge"), function () {
                call("hue_plus", "remove_matter_fabric", { fabric: x.id, confirm: true });
                closeLayer();
              });
            },
          });
        })
      )
    );
  b.appendChild(hmCallout(_T("hm_matter_pairing_code_note")));
}

function hmApps(b) {
  hmBox(b);
  hmLoad(b, ["apps"], function (box, r, again) {
    var list = r.apps || [];
    if (!list.length) box.appendChild(hmCallout(_T("nothing_found")));
    else
      box.appendChild(
        hmGroup(
          list.map(function (a) {
            return hmRow({
              icon: "lock",
              title: a.name || a.id,
              sub: a.last_used ? _T("hm_last_used") + " " + String(a.last_used).slice(0, 10) : "",
              tap: function () {
                confirmDlg(_T("take_this_app_s_access_away_it_can_no_longer_use_the_bridge"), function () {
                  hpDo(again, "revoke_app", { app: a.id, confirm: true });
                });
              },
            });
          })
        )
      );
    box.appendChild(hmCallout(_T("hm_tap_an_app_to_remove_its_access")));
  });
}

/* ---- routines and automations ---- */

function hmRoutines(b) {
  hmBox(b);
  hmLoad(b, ["automations"], function (box, r) {
    var list = r.automations || [];
    if (!list.length) box.appendChild(hmCallout(_T("nothing_found")));
    else
      box.appendChild(
        hmGroup(
          list.map(function (x) {
            return hmRow({
              icon: "clock",
              title: x.name,
              sub: x.script || "",
              val: x.enabled ? _T("on_2") : _T("off"),
              tap: "hue-routine:" + x.id,
            });
          })
        )
      );
    box.appendChild(hmGroup([hmRow({ icon: "plus", title: _T("hw_new_automation"), tap: "hue-newauto" })]));
  });
}

function hmRoutine(b, id) {
  hmBox(b);
  hmLoad(b, ["automations"], function (box, r, again) {
    var x = (r.automations || []).filter(function (y) {
      return y.id === id;
    })[0];
    if (!x) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    box.appendChild(hmTitle("clock", x.name, x.script || ""));
    box.appendChild(
      hmGroup([
        hmRow({
          title: _T("hm_enabled"),
          toggle: {
            get: function () {
              return !!x.enabled;
            },
            set: function () {
              x.enabled = !x.enabled;
              hpDo(again, "update_automation", { automation: x.id, enabled: x.enabled });
            },
          },
        }),
      ])
    );
    if (hwEditable(x))
      box.appendChild(
        hmGroup([
          hmRow({
            icon: "edit",
            title: _T("hw_edit_settings"),
            tap: function () {
              hwStartAutomation(hwKindOf(x), x);
            },
          }),
        ])
      );
    if (hwRunnable(x))
      box.appendChild(
        hmGroup(
          [["start", "play", "hw_start"], ["stop", "stop", "hw_stop"]].map(function (t) {
            return hmRow({
              icon: t[1],
              title: _T(t[2]),
              sub: t[0] === "start" ? hwRunText(x) : "",
              tap: function () {
                hpDo(again, "trigger_automation", { automation: x.id, action: t[0] });
              },
            });
          })
        )
      );
    if (x.last_error) box.appendChild(hmCallout(x.last_error));
    box.appendChild(
      hmActions([
        hmButton(_T("hm_delete"), "danger", function () {
          confirmDlg(_T("delete_this_routine_from_the_bridge"), function () {
            call("hue_plus", "delete_automation", { automation: x.id, confirm: true });
            closeLayer();
          });
        }),
      ])
    );
  });
}

/* ---- entertainment areas ---- */

var HM_END = ["last_state", "off", "pause", "scene"];

function hmAreas(b) {
  hmBox(b);
  hmLoad(b, ["entertainment_areas"], function (box, r) {
    var list = r.entertainment_areas || [];
    if (!list.length) box.appendChild(hmCallout(_T("nothing_found")));
    else
      box.appendChild(
        hmGroup(
          list.map(function (x) {
            return hmRow({
              icon: "eq",
              title: x.name,
              sub: cntS((x.lights || []).length, _T("hm_light"), _T("hm_lights")),
              tap: "hue-area:" + x.id,
            });
          })
        )
      );
  });
}

function hmArea(b, id) {
  hmBox(b);
  hmGuard(hmdKey("area", id));
  hmLoad(b, ["entertainment_areas", "scenes"], function (box, r, again) {
    var x = hmEntArea(id);
    if (!x) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    box.appendChild(hmTitle("eq", x.name));
    box.appendChild(
      hmGroup([
        hmRow({
          title: _T("hm_lights_label"),
          val: String((x.lights || []).length),
        }),
        hmRow({
          title: _T("hm_light_placement"),
          sub: _T("hm_where_the_lights_are_in_the_room"),
          tap: function () {
            hpEditOnBridge(x, again);
          },
        }),
        hmRow({
          title: _T("hm_performance"),
          val: function () {
            return hmAreaPerf(x).mode === "manual" ? _T("hm_manual") : _T("hm_auto");
          },
          tap: "hue-perf:" + x.id,
        }),
        hmRow({
          title: _T("hm_when_sync_stops"),
          val: function () {
            return _T("end_" + hmAreaEnd(x).end_state);
          },
          tap: "hue-end:" + x.id,
        }),
      ])
    );
    box.appendChild(hmCallout(_T("experimental_only_the_last_state_has_been_seen_on_a_real_bridge")));
    box.appendChild(
      hmActions([
        hmButton(_T("hm_delete"), "danger", function () {
          confirmDlg(_T("hm_delete_this_entertainment_area"), function () {
            hmdDiscard(hmdKey("area", x.id));
            call("hue_plus", "delete_entertainment_area", { area: x.id, confirm: true });
            HM_READY = false;
            closeLayer();
            hmEnsure();
          });
        }),
        hmButton(_T("show_red_for_5_seconds"), "ghost", function () {
          call("hue_plus", "stream_colors", { area: x.id, colors: [[255, 0, 0]], duration: 5 });
        }),
        hmButton(_T("stop_streaming"), "ghost", function () {
          call("hue_plus", "stop_streaming", { area: x.id });
        }),
      ])
    );
  });
}

/* What happens when a sync stops: the area's own setting is staged, and sent when the area is saved. */
function hmEnd(b, id) {
  hmBox(b);
  hmGuard(hmdKey("area", id), true);
  hmLoad(b, ["entertainment_areas", "scenes"], function (box) {
    var x = hmEntArea(id);
    if (!x) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    box.appendChild(
      hmGroup(
        HM_END.map(function (v) {
          return hmRow({
            title: _T("end_" + v),
            sub: _T("hm_end_" + v),
            check: function () {
              return hmAreaEnd(x).end_state === v;
            },
            tap: function () {
              if (v === "scene") {
                showPopup("hue-escene:" + id, true);
                return;
              }
              hmdStage(hmdKey("area", id), "end", { end_state: v }, { end_state: x.end_state || "last_state" });
              popBack();
            },
          });
        })
      )
    );
  });
}

function hmEndScene(b, id) {
  hmBox(b);
  hmGuard(hmdKey("area", id), true);
  hmLoad(b, ["entertainment_areas", "scenes"], function (box, r) {
    var x = hmEntArea(id),
      scenes = (r.scenes || []).filter(function (s) {
        return s.group_id;
      });
    if (!x) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    if (!scenes.length) box.appendChild(hmCallout(_T("nothing_found")));
    box.appendChild(
      hmGroup(
        scenes.map(function (s) {
          return hmRow({
            icon: "scene",
            title: s.name,
            tap: function () {
              hmdStage(hmdKey("area", id), "end", { end_state: "scene", scene: s.id }, { end_state: x.end_state || "last_state" });
              popBack();
              popBack();
            },
          });
        })
      )
    );
  });
}

/* Who streams for an area: the bridge picks (auto), or one light of the area does (manual). Staged like the rest. */
function hmPerf(b, id) {
  hmBox(b);
  hmGuard(hmdKey("area", id), true);
  hmLoad(b, ["entertainment_areas"], function (box) {
    var x = hmEntArea(id);
    if (!x) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var set = function (mode, light) {
      hmdStage(hmdKey("area", id), "performance", { mode: mode, light: light || null }, { mode: x.performance === "manual" ? "manual" : "auto", light: x.performance_light || null });
      popBack();
    };
    box.appendChild(
      hmGroup(
        [
          hmRow({
            title: _T("hm_auto"),
            sub: _T("hm_the_bridge_picks"),
            check: function () {
              return hmAreaPerf(x).mode !== "manual";
            },
            tap: function () {
              set("auto");
            },
          }),
        ].concat(
          (x.lights || [])
            .filter(function (l) {
              return l.light_id;
            })
            .map(function (l) {
              return hmRow({
                title: l.name || l.light_id,
                sub: _T("hm_this_light_streams"),
                check: function () {
                  var p = hmAreaPerf(x);
                  return p.mode === "manual" && p.light === l.light_id;
                },
                tap: function () {
                  set("manual", l.light_id);
                },
              });
            })
        )
      )
    );
    box.appendChild(hmCallout(_T("experimental_not_yet_tried_on_a_real_bridge")));
  });
}

/* ---- MotionAware areas ---- */

function hmMotion(b) {
  hmBox(b);
  hmLoad(b, ["motion_areas"], function (box, r) {
    var list = (r.motion_areas || {}).areas || [];
    if (list.length)
      box.appendChild(
        hmGroup(
          list.map(function (x) {
            return hmRow({
              icon: "motion",
              title: x.name || x.id,
              val: x.enabled ? _T("on_2") : _T("off"),
              tap: "hue-marea:" + x.id,
            });
          })
        )
      );
    else box.appendChild(hmCallout(_T("no_motion_areas")));
    box.appendChild(
      hmGroup([
        hmRow({
          icon: "plus",
          title: _T("hmw_create_area"),
          tap: hmwStart,
        }),
      ])
    );
  });
}

/* ---- switches ---- */

function hmSwitches(b) {
  hmBox(b);
  hmLoad(b, ["accessories"], function (box, r) {
    var list = r.accessories || [];
    if (!list.length) box.appendChild(hmCallout(_T("nothing_found")));
    else
      box.appendChild(
        hmGroup(
          list.map(function (x) {
            return hmRow({
              icon: "cog",
              title: x.name,
              sub: cntS((x.buttons || []).length, _T("hm_button"), _T("hm_buttons")) + (x.dials ? " · " + cntS(x.dials, _T("hm_dial"), _T("hm_dials")) : ""),
              tap: "hue-switch:" + x.id,
            });
          })
        )
      );
  });
}

/* What a press does, from the way the bridge writes it: "brighten", "dim", "off", "nothing", "scene", "cycle" or "time" (a kind this menu shows but cannot write yet). */
function hmPressKind(spec) {
  if (!spec) return "nothing";
  if (spec.recall_single_extended) return "scene";
  if (spec.scene_cycle_extended) return "cycle";
  if (spec.time_based_extended) return "time";
  return { dim_up: "brighten", dim_down: "dim", all_off: "off", home_off: "homeoff" }[spec.action] || "nothing";
}

/* The scene ids a press recalls, in order. */
function hmPressScenes(spec) {
  var cfg = spec && (spec.recall_single_extended || spec.scene_cycle_extended || spec.time_based_extended);
  if (!cfg) return [];
  var slots = spec.scene_cycle_extended ? cfg.slots || [] : spec.time_based_extended ? (cfg.slots || []).map(function (s) { return s.actions || []; }) : [cfg.actions || []];
  return slots
    .map(function (slot) {
      var a = (slot[0] || {}).action || {};
      return a.recall && a.recall.rid;
    })
    .filter(Boolean);
}

function hmPressWithOff(spec) {
  var cfg = spec && (spec.recall_single_extended || spec.scene_cycle_extended || spec.time_based_extended);
  return !!(cfg && cfg.with_off && cfg.with_off.enabled);
}

var HM_PRESSES = [
  ["short", "hm_press", "on_short_release"],
  ["long", "hm_long_press", "on_long_press"],
];

/* The accessory, button and press a button page is about, from the page key "<accessory>|<button number>|<press>|<slot>". */
function hmBtnKey(id) {
  var p = String(id).split("|");
  return { acc: p[0], n: Number(p[1]), press: p[2] || "short", slot: p[3] === undefined ? -1 : Number(p[3]) };
}

/* What a press does: the staged choice if the switch has one (the bridge's way of writing it, see hmSpecFrom), else what the bridge holds. */
function hmPressSpec(acc, btn, press) {
  var staged = hmdStaged(hmdKey("acc", acc.id), btn.id + "|" + press);
  if (staged) return hmSpecFrom(staged.what);
  return ((acc.actions || {})[btn.id] || {})[HM_PRESSES.filter(function (x) { return x[0] === press; })[0][2]];
}

/* The press a page is about is read again whenever it is asked for, so it shows a choice staged since the page was drawn. */
function hmBtnFind(r, k) {
  var acc = (r.accessories || []).filter(function (x) {
      return x.id === k.acc;
    })[0],
    btn = acc && (acc.buttons || []).filter(function (b) {
      return b.number === k.n;
    })[0];
  return { acc: acc, btn: btn, spec: acc && btn ? hmPressSpec(acc, btn, k.press) : null };
}

function hmSceneName(r, id) {
  var s = (r.scenes || []).filter(function (x) {
    return x.id === id;
  })[0];
  return s ? s.name : _T("hm_unknown_scene");
}

/* What the bridge calls the rooms and zones a button acts on, and the scenes that belong to them (a button recalls scenes of its own room). */
function hmBtnTargets(r, acc, btn) {
  var ids = ((acc.targets || {})[btn.id] || []).slice(),
    names = {};
  (r.rooms || []).concat(r.zones || []).forEach(function (g) {
    names[g.id] = g.name;
  });
  return {
    ids: ids,
    name: ids
      .map(function (i) {
        return names[i] || _T("hm_the_whole_home");
      })
      .join(", "),
  };
}

function hmBtnScenes(r, targets) {
  return (r.scenes || []).filter(function (s) {
    return !targets.ids.length || targets.ids.indexOf(s.group_id) >= 0;
  });
}

function hmPressSummary(r, spec) {
  var kind = hmPressKind(spec),
    names = hmPressScenes(spec).map(function (id) {
      return hmSceneName(r, id);
    });
  if (kind === "scene") return _T("hm_single_scene") + (names[0] ? " · " + names[0] : "");
  if (kind === "cycle") return _T("hm_scene_cycle") + " · " + cntS(names.length, _T("hm_scene"), _T("hm_scenes"));
  if (kind === "time") return _T("hm_time_based_light") + " · " + cntS(names.length, _T("hm_time"), _T("hm_times"));
  return _T("hm_kind_" + kind);
}

function hmSwitch(b, id) {
  hmBox(b);
  hmGuard(hmdKey("acc", id));
  hmLoad(b, ["accessories", "scenes", "rooms", "zones"], function (box, r) {
    var x = (r.accessories || []).filter(function (y) {
      return y.id === id;
    })[0];
    if (!x) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    box.appendChild(hmTitle("cog", x.name));
    box.appendChild(hmLabel(_T("hm_buttons")));
    box.appendChild(
      hmGroup(
        (x.buttons || []).map(function (btn) {
          return hmRow({
            title: _T("hm_button_label") + " " + btn.number,
            sub: function () {
              return hmPressSummary(r, hmPressSpec(x, btn, "short"));
            },
            tap: "hue-button:" + x.id + "|" + btn.number,
          });
        })
      )
    );
    box.appendChild(
      hmActions([
        hmButton(_T("hm_delete"), "danger", function () {
          hmRemoveDevice(x.id, null);
        }),
      ])
    );
  });
}

function hmButtonPage(b, id) {
  hmBox(b);
  hmGuard(hmdKey("acc", hmBtnKey(id).acc), true);
  hmLoad(b, ["accessories", "scenes", "rooms", "zones"], function (box, r) {
    var k = hmBtnKey(id),
      f = hmBtnFind(r, Object.assign({}, k, { press: "short" }));
    if (!f.acc || !f.btn) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var t = hmBtnTargets(r, f.acc, f.btn);
    box.appendChild(hmTitle("cog", _T("hm_button_label") + " " + k.n, f.acc.name));
    box.appendChild(
      hmGroup(
        HM_PRESSES.map(function (p) {
          return hmRow({
            title: _T(p[1]),
            val: function () {
              return hmPressSummary(r, hmPressSpec(f.acc, f.btn, p[0]));
            },
            tap: "hue-press:" + f.acc.id + "|" + k.n + "|" + p[0],
          });
        })
      )
    );
    box.appendChild(hmLabel(_T("hm_behavior")));
    box.appendChild(hmGroup([hmRow({ title: _T("hm_selected_lights"), val: t.name || _T("hm_the_whole_home") })]));
    box.appendChild(hmCallout(_T("hm_experimental_buttons")));
  });
}

/* Stages what a press does, in what configure_button is given. It is sent when the switch is saved (hmSaveSwitch). */
function hmStagePress(k, f, what) {
  hmdStage(hmdKey("acc", k.acc), f.btn.id + "|" + k.press, { k: { acc: k.acc, n: k.n, press: k.press }, what: what });
}

var HM_CHOICES = [
  ["hm_lights_turn_on", [["time", "time_based", "hm_time_based_light"], ["cycle", "scene_cycle", "hm_scene_cycle"], ["scene", "scene", "hm_single_scene"]]],
  ["hm_lights_brighten_or_dim", [["brighten", "dim_up", "hm_brighten"], ["dim", "dim_down", "hm_dim"]]],
  ["hm_lights_turn_off", [["off", "all_off", "hm_lights_off"], ["homeoff", "home_off", "hm_entire_home_off"]]],
  ["hm_nothing_happens", [["nothing", "do_nothing", "hm_do_nothing"]]],
];

function hmPress(b, id) {
  hmBox(b);
  hmGuard(hmdKey("acc", hmBtnKey(id).acc), true);
  hmLoad(b, ["accessories", "scenes", "rooms", "zones"], function (box, r) {
    var k = hmBtnKey(id),
      f = hmBtnFind(r, k);
    if (!f.acc || !f.btn) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var kind = hmPressKind(f.spec),
      cur = function () {
        return hmPressSpec(f.acc, f.btn, k.press);
      },
      done = function () {
        popBack();
      };
    HM_CHOICES.forEach(function (group) {
      box.appendChild(hmLabel(_T(group[0])));
      box.appendChild(
        hmGroup(
          group[1].map(function (c) {
            return hmRow({
              title: _T(c[2]),
              sub: _T(c[2] + "_sub"),
              check: function () {
                return kind === c[0];
              },
              tap: function () {
                if (c[0] === "scene") showPopup("hue-scene:" + id, true);
                else if (c[0] === "cycle") showPopup("hue-cycle:" + id, true);
                else if (c[0] === "time") showPopup("hue-time:" + id, true);
                else {
                  hmStagePress(k, f, { action: c[1] });
                  done();
                }
              },
            });
          })
        )
      );
    });
    if (kind === "scene" || kind === "cycle" || kind === "time") {
      box.appendChild(hmLabel(_T("hm_advanced")));
      box.appendChild(
        hmGroup([
          hmRow({
            title: _T("hm_smart_on_off"),
            toggle: {
              get: function () {
                return hmPressWithOff(cur());
              },
              set: function () {
                var spec = cur(),
                  off = !hmPressWithOff(spec),
                  ids = hmPressScenes(spec),
                  seconds = ((spec.scene_cycle_extended || spec.time_based_extended || {}).repeat_timeout || {}).seconds || 3;
                hmStagePress(
                  k,
                  f,
                  kind === "scene"
                    ? { action: "scene", scene: ids[0], with_off: off }
                    : kind === "cycle"
                      ? { action: "scene_cycle", scenes: ids, with_off: off, repeat_timeout: seconds }
                      : { action: "time_based", slots: hmTimeSlots(spec), with_off: off, repeat_timeout: seconds }
                );
                refresh();
              },
            },
          }),
        ])
      );
      box.appendChild(hmCallout(_T("hm_smart_on_off_note")));
    }
  });
}

/* One scene for a press. */
function hmScenePick(b, id) {
  hmBox(b);
  hmGuard(hmdKey("acc", hmBtnKey(id).acc), true);
  hmLoad(b, ["accessories", "scenes", "rooms", "zones"], function (box, r) {
    var k = hmBtnKey(id),
      f = hmBtnFind(r, k);
    if (!f.acc || !f.btn) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var scenes = hmBtnScenes(r, hmBtnTargets(r, f.acc, f.btn)),
      current = hmPressScenes(f.spec)[0];
    if (!scenes.length) box.appendChild(hmCallout(_T("nothing_found")));
    box.appendChild(
      hmGroup(
        scenes.map(function (s) {
          return hmRow({
            icon: "scene",
            title: s.name,
            check: function () {
              return current === s.id;
            },
            tap: function () {
              hmStagePress(k, f, { action: "scene", scene: s.id, with_off: hmPressWithOff(f.spec) });
              popBack();
              popBack();
            },
          });
        })
      )
    );
  });
}

/* A cycle of scenes: the order is the order of the presses. The draft is kept here and written when it is saved, since a cycle needs at least two scenes. */
var HM_CYCLE = null;

function hmCycle(b, id) {
  hmBox(b);
  hmGuard(hmdKey("acc", hmBtnKey(id).acc), true);
  hmLoad(b, ["accessories", "scenes", "rooms", "zones"], function (box, r) {
    var k = hmBtnKey(id),
      f = hmBtnFind(r, k);
    if (!f.acc || !f.btn) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var scenes = hmBtnScenes(r, hmBtnTargets(r, f.acc, f.btn));
    if (!HM_CYCLE || HM_CYCLE.id !== id) {
      var cfg = (f.spec && f.spec.scene_cycle_extended) || {};
      HM_CYCLE = {
        id: id,
        scenes: hmPressScenes(f.spec).slice(),
        with_off: hmPressWithOff(f.spec),
        timeout: (cfg.repeat_timeout && cfg.repeat_timeout.seconds) || 3,
        names: r,
        pool: scenes,
      };
    }
    HM_CYCLE.names = r;
    HM_CYCLE.pool = scenes;
    var d = HM_CYCLE,
      ords = ["hm_first", "hm_second", "hm_third", "hm_fourth", "hm_fifth", "hm_sixth", "hm_seventh", "hm_eighth", "hm_ninth", "hm_tenth"];
    box.appendChild(hmLabel(_T("hm_behavior")));
    box.appendChild(
      hmGroup(
        d.scenes.map(function (sid, i) {
          return hmRow({
            icon: "scene",
            title: _T(ords[i]) + " " + _T("hm_press_word"),
            val: hmSceneName(r, sid),
            tap: "hue-cslot:" + id + "|" + i,
          });
        })
      )
    );
    if (d.scenes.length < 10)
      box.appendChild(
        hmGroup([
          hmRow({
            icon: "plus",
            title: _T("hm_add_a_scene"),
            tap: "hue-cslot:" + id + "|" + d.scenes.length,
          }),
        ])
      );
    box.appendChild(hmLabel(_T("hm_advanced")));
    box.appendChild(
      hmGroup([
        hmRow({
          title: _T("hm_smart_on_off"),
          toggle: {
            get: function () {
              return d.with_off;
            },
            set: function () {
              d.with_off = !d.with_off;
              refresh();
            },
          },
        }),
      ])
    );
    box.appendChild(
      hmChips([2, 3, 5, 10], function () { return d.timeout; }, function (v) { d.timeout = v; }, function (v) { return v + " " + _T("hm_sec"); })
    );
    box.appendChild(hmCallout(_T("hm_cycle_timeout_note")));
    box.appendChild(
      hmActions([
        hmButton(_T("hm_done"), "primary", function () {
          if (d.scenes.length < 2) {
            toast(_T("hm_a_cycle_needs_two_scenes"));
            return;
          }
          hmStagePress(k, f, { action: "scene_cycle", scenes: d.scenes.slice(), with_off: d.with_off, repeat_timeout: d.timeout });
          HM_CYCLE = null;
          popBack();
          popBack();
        }),
      ])
    );
  });
}

/* One place of a cycle: which scene it is, and moving or removing it. A new place (one past the end) only asks for the scene. */
function hmCycleSlot(b, id) {
  hmBox(b);
  hmGuard(hmdKey("acc", String(id).split("|")[0]), true);
  var parts = String(id).split("|"),
    slot = Number(parts.pop()),
    key = parts.join("|"),
    d = HM_CYCLE;
  if (!d || d.id !== key) {
    b.appendChild(hmCallout(_T("nothing_found")));
    return;
  }
  var isNew = slot >= d.scenes.length,
    back = function () {
      popBack();
    };
  b.appendChild(
    hmGroup(
      d.pool.map(function (s) {
        return hmRow({
          icon: "scene",
          title: s.name,
          check: function () {
            return d.scenes[slot] === s.id;
          },
          tap: function () {
            d.scenes[slot] = s.id;
            back();
          },
        });
      })
    )
  );
  if (!isNew) {
    var moves = [];
    if (slot > 0)
      moves.push(
        hmRow({
          icon: "up",
          title: _T("hm_move_earlier"),
          tap: function () {
            d.scenes.splice(slot - 1, 0, d.scenes.splice(slot, 1)[0]);
            back();
          },
        })
      );
    if (slot < d.scenes.length - 1)
      moves.push(
        hmRow({
          icon: "down",
          title: _T("hm_move_later"),
          tap: function () {
            d.scenes.splice(slot + 1, 0, d.scenes.splice(slot, 1)[0]);
            back();
          },
        })
      );
    moves.push(
      hmRow({
        icon: "trash",
        title: _T("hm_remove_from_the_cycle"),
        danger: true,
        tap: function () {
          d.scenes.splice(slot, 1);
          back();
        },
      })
    );
    b.appendChild(hmLabel(_T("hm_order")));
    b.appendChild(hmGroup(moves));
  }
}

/* The times of a time-based light as {time: "07:00", scene} items, in the order of the day. */
function hmTimeSlots(spec) {
  return (((spec || {}).time_based_extended || {}).slots || []).map(function (s) {
    var a = ((s.actions || [])[0] || {}).action || {};
    return {
      time: String((s.start_time || {}).hour).padStart(2, "0") + ":" + String((s.start_time || {}).minute).padStart(2, "0"),
      scene: a.recall && a.recall.rid,
    };
  });
}

/* The schedule the Hue app starts with: these scenes of the button's room, by name. */
var HM_DEFAULT_TIMES = [["07:00", "Energize"], ["10:00", "Concentrate"], ["17:00", "Read"], ["20:00", "Relax"], ["23:00", "Nightlight"]];

function hmDefaultTimes(pool) {
  var out = [];
  HM_DEFAULT_TIMES.forEach(function (d) {
    var s = pool.filter(function (x) {
      return String(x.name).toLowerCase() === d[1].toLowerCase();
    })[0];
    if (s) out.push({ time: d[0], scene: s.id });
  });
  return out.length === HM_DEFAULT_TIMES.length ? out : [];
}

var HM_TIME = null;

function hmTimeSort(d) {
  d.slots.sort(function (a, b) {
    return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
  });
}

function hmTimePage(b, id) {
  hmBox(b);
  hmGuard(hmdKey("acc", hmBtnKey(id).acc), true);
  hmLoad(b, ["accessories", "scenes", "rooms", "zones"], function (box, r) {
    var k = hmBtnKey(id),
      f = hmBtnFind(r, k);
    if (!f.acc || !f.btn) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var pool = hmBtnScenes(r, hmBtnTargets(r, f.acc, f.btn));
    if (!HM_TIME || HM_TIME.id !== id) {
      var cfg = (f.spec && f.spec.time_based_extended) || {},
        own = hmTimeSlots(f.spec);
      HM_TIME = {
        id: id,
        slots: own.length ? own : hmDefaultTimes(pool),
        with_off: hmPressWithOff(f.spec),
        timeout: (cfg.repeat_timeout && cfg.repeat_timeout.seconds) || 3,
      };
    }
    HM_TIME.names = r;
    HM_TIME.pool = pool;
    var d = HM_TIME;
    box.appendChild(hmLabel(_T("hm_behavior")));
    box.appendChild(
      hmGroup(
        d.slots.map(function (s, i) {
          return hmRow({ icon: "clock", title: s.time, val: hmSceneName(r, s.scene), tap: "hue-tslot:" + id + "|" + i });
        })
      )
    );
    if (d.slots.length < 10)
      box.appendChild(hmGroup([hmRow({ icon: "plus", title: _T("hm_add_a_time"), tap: "hue-tslot:" + id + "|" + d.slots.length })]));
    var def = hmDefaultTimes(pool);
    if (def.length)
      box.appendChild(
        hmGroup([
          hmRow({
            icon: "restart",
            title: _T("hm_use_the_default_schedule"),
            sub: _T("hm_the_hue_apps_own_times"),
            tap: function () {
              d.slots = def.slice();
              refresh();
              showPopup("hue-time:" + id, false);
            },
          }),
        ])
      );
    box.appendChild(hmLabel(_T("hm_advanced")));
    box.appendChild(
      hmGroup([
        hmRow({
          title: _T("hm_smart_on_off"),
          toggle: {
            get: function () {
              return d.with_off;
            },
            set: function () {
              d.with_off = !d.with_off;
              refresh();
            },
          },
        }),
      ])
    );
    box.appendChild(hmChips([2, 3, 5, 10], function () { return d.timeout; }, function (v) { d.timeout = v; }, function (v) { return v + " " + _T("hm_sec"); }));
    box.appendChild(hmCallout(_T("hm_time_based_note")));
    box.appendChild(
      hmActions([
        hmButton(_T("hm_done"), "primary", function () {
          if (d.slots.length < 2) {
            toast(_T("hm_a_time_based_light_needs_two_times"));
            return;
          }
          var seen = {};
          for (var i = 0; i < d.slots.length; i++) {
            if (seen[d.slots[i].time]) {
              toast(_T("hm_two_times_cannot_be_the_same"));
              return;
            }
            seen[d.slots[i].time] = 1;
          }
          hmStagePress(k, f, {
            action: "time_based",
            slots: d.slots.map(function (s) {
              return { time: s.time, scene: s.scene };
            }),
            with_off: d.with_off,
            repeat_timeout: d.timeout,
          });
          HM_TIME = null;
          popBack();
          popBack();
        }),
      ])
    );
  });
}

/* One time of a time-based light: the time (a time input) and the scene, and removing it. */
function hmTimeSlot(b, id) {
  hmBox(b);
  hmGuard(hmdKey("acc", String(id).split("|")[0]), true);
  var parts = String(id).split("|"),
    slot = Number(parts.pop()),
    key = parts.join("|"),
    d = HM_TIME;
  if (!d || d.id !== key) {
    b.appendChild(hmCallout(_T("nothing_found")));
    return;
  }
  var isNew = slot >= d.slots.length,
    cur = isNew ? { time: "12:00", scene: (d.pool[0] || {}).id } : d.slots[slot];
  var inp = mk("input", "hm-time");
  inp.type = "time";
  inp.value = cur.time;
  inp.setAttribute("aria-label", _T("hm_time"));
  b.appendChild(hmLabel(_T("hm_time")));
  b.appendChild(hmGroup([(function () { var w = mk("div", "hm-row"); w.appendChild(inp); return w; })()]));
  b.appendChild(hmLabel(_T("hm_scene")));
  b.appendChild(
    hmGroup(
      d.pool.map(function (s) {
        return hmRow({
          icon: "scene",
          title: s.name,
          check: function () {
            return cur.scene === s.id;
          },
          tap: function () {
            cur.scene = s.id;
            refresh();
          },
        });
      })
    )
  );
  var actions = [
    hmButton(_T("hm_done"), "primary", function () {
      if (!/^\d\d:\d\d$/.test(inp.value)) {
        toast(_T("hm_pick_a_time"));
        return;
      }
      if (!cur.scene) {
        toast(_T("hm_pick_a_scene"));
        return;
      }
      cur.time = inp.value;
      if (isNew) d.slots.push(cur);
      hmTimeSort(d);
      popBack();
    }),
  ];
  if (!isNew)
    actions.push(
      hmButton(_T("hm_remove_this_time"), "danger", function () {
        d.slots.splice(slot, 1);
        popBack();
      })
    );
  b.appendChild(hmActions(actions));
}

/* ---- the pages ---- */

HP_PAGES["stg-hue"] = ["hue_plus", HP_ICON, hmRoot];
HP_PAGES["hue-devices"] = ["hm_devices", "lights", hmDevices];
HP_PAGES["hue-lights"] = ["hm_lights_and_smart_plugs", "lamp", hmLights];
HP_PAGES["hue-light"] = ["light_setup", "lamp", hmLight];
HP_PAGES["hue-fn"] = ["hm_function", "lamp", hmPick("hue-fn")];
HP_PAGES["hue-pw"] = ["hm_power_on", "power", hmPick("hue-pw")];
HP_PAGES["hue-or"] = ["mounting_direction", "axis", hmPick("hue-or")];
HP_PAGES["hue-od"] = ["segment_order", "swap", hmPick("hue-od")];
HP_PAGES["hue-switches"] = ["hm_switches", "cog", hmSwitches];
HP_PAGES["hue-switch"] = ["hm_switch_one", "cog", hmSwitch];
HP_PAGES["hue-button"] = ["hm_button_label", "cog", hmButtonPage];
HP_PAGES["hue-press"] = ["hm_press", "cog", hmPress];
HP_PAGES["hue-scene"] = ["hm_single_scene", "scene", hmScenePick];
HP_PAGES["hue-cycle"] = ["hm_scene_cycle", "scene", hmCycle];
HP_PAGES["hue-time"] = ["hm_time_based_light", "clock", hmTimePage];
HP_PAGES["hue-tslot"] = ["hm_time", "clock", hmTimeSlot];
HP_PAGES["hue-cslot"] = ["hm_scene", "scene", hmCycleSlot];
HP_PAGES["hue-bridge"] = ["hm_bridges", "plug", hmBridge];
HP_PAGES["hue-updates"] = ["hm_software_update", "restart", hmUpdates];
HP_PAGES["hue-matter"] = ["hm_smart_home", "scene", hmMatter];
HP_PAGES["hue-apps"] = ["hm_applications", "lock", hmApps];
HP_PAGES["hue-routines"] = ["routines_and_automations", "clock", hmRoutines];
HP_PAGES["hue-routine"] = ["routine", "clock", hmRoutine];
HP_PAGES["hue-ent"] = ["entertainment_areas", "target", hmAreas];
HP_PAGES["hue-area"] = ["entertainment_area", "target", hmArea];
HP_PAGES["hue-end"] = ["hm_when_sync_stops", "target", hmEnd];
HP_PAGES["hue-perf"] = ["hm_performance", "target", hmPerf];
HP_PAGES["hue-escene"] = ["hp_scene", "scene", hmEndScene];
HP_PAGES["hue-motion"] = ["hm_motionaware_areas", "motion", hmMotion];

/* The Hue app's wizards in the Hue Plus menu: what the pages of one wizard share (the state in progress, a heading, Next, a name, a time, the days, a room or zone to choose) and the
 automation wizards ("What kind of automation do you want to create?": wake up, go to sleep, timer, lighting schedule, coming home, leaving home). The pieces are the menu's own (hmRow,
 hmGroup, hmButton, hmChips, sliderRow, the time input of the time-based light); this file only adds the order of the steps. MotionAware's wizard is in humotion.js. */

/* The wizard in progress: {kind, steps, depth, ...its answers}. Pages open from a row of the menu, so one page is pushed on the popup stack per step (depth) and Save goes back to where the wizard began. */
var HW = null;

function hwBegin(state) {
  HW = state;
  HW.depth = 0;
  HW.steps = HW.steps || [];
}

function hwPush(key) {
  if (HW) HW.depth++;
  showPopup(key, true);
}

/* Leaves the wizard: back to the page it began on. */
function hwLeave() {
  var n = HW ? HW.depth : 0;
  HW = null;
  for (var i = 0; i < n; i++) popBack();
}

/* Every page of a wizard starts here. Without a wizard in progress (a page opened again after a reload) it says nothing was found. */
function hwOpen(b, key) {
  hmBox(b);
  if (!HW) {
    b.appendChild(hmCallout(_T("nothing_found")));
    return false;
  }
  if (key) HW.at = HW.steps.indexOf(key);
  return true;
}

/* The step after this one, or the end of the wizard. */
function hwAdvance() {
  var i = HW.at + 1;
  if (i < HW.steps.length) hwPush(HW.steps[i]);
  else HW.finish();
}

function hwNext(label, fn) {
  return hmActions([hmButton(label || _T("hn_next"), "primary", fn || hwAdvance)]);
}

function hwHint(b, text) {
  if (text) b.appendChild(mkHint(text));
}

/* Rooms and zones with their lights, from what the menu read. */
function hwGroups(r) {
  var out = [];
  [["room", r.rooms], ["zone", r.zones]].forEach(function (t) {
    (t[1] || []).forEach(function (g) {
      out.push({ id: g.id, name: g.name, type: t[0], lights: g.lights || [], children: g.children || [] });
    });
  });
  return out;
}

function hwGroupRows(box, groups, isOn, pick) {
  [["room", "hn_rooms", "home"], ["zone", "hn_zones", "target"]].forEach(function (t) {
    var list = groups.filter(function (g) {
      return g.type === t[0];
    });
    if (!list.length) return;
    box.appendChild(hmLabel(_T(t[1])));
    box.appendChild(
      hmGroup(
        list.map(function (g) {
          return hmRow({
            icon: t[2],
            title: g.name,
            sub: cntS(g.lights.length, _T("hm_light"), _T("hm_lights")),
            check: function () {
              return isOn(g);
            },
            tap: function () {
              pick(g);
              refresh();
            },
          });
        })
      )
    );
  });
}

/* A time of day as a time input in a row (the same input the time-based light uses). `get()` and `set(value)` are "HH:MM". */
function hwTimeRow(title, get, set) {
  var row = mk("div", "hm-row"),
    label = mk("span", "hm-t"),
    inp = mk("input", "hm-time");
  label.appendChild(mk("span", "hm-n")).textContent = title;
  inp.type = "time";
  inp.value = get() || "";
  inp.setAttribute("aria-label", title);
  inp.addEventListener("input", function () {
    set(inp.value);
  });
  row.appendChild(label);
  row.appendChild(inp);
  return row;
}

var HW_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/* The days of the week as seven buttons; `days` is the list of names that are on. */
function hwDays(days) {
  var box = mk("div", "hm-chips");
  HW_WEEK.forEach(function (d, i) {
    var c = mk("button", "hm-chip");
    c.type = "button";
    c.textContent = _T("hw_day_" + d);
    c.setAttribute("aria-label", _T("hw_day_long_" + d));
    c.addEventListener("click", function () {
      var at = days.indexOf(d);
      if (at >= 0) days.splice(at, 1);
      else days.push(d);
      refresh();
    });
    c.refresh = function () {
      c.classList.toggle("on", days.indexOf(d) >= 0);
    };
    reg(c.refresh);
    box.appendChild(c);
  });
  return box;
}

function hwMinutesText(n) {
  return n >= 60 && n % 60 === 0 ? n / 60 + " " + _T("hw_h") : n + " " + _T("hm_min");
}

/* A name asked for on its own page, as the Hue app does at the end of a wizard. */
function hwNamePage(b) {
  if (!hwOpen(b, "hue-wz-name")) return;
  b.appendChild(hmTitle(HW.icon || "edit", HW.nameHeading));
  var w = mk("div", "sqw pane"),
    inp = mk("input", "sq");
  inp.type = "text";
  inp.maxLength = 32;
  inp.placeholder = _T("hw_name");
  inp.value = HW.name || "";
  inp.addEventListener("input", function () {
    HW.name = inp.value;
  });
  w.appendChild(inp);
  b.appendChild(w);
  b.appendChild(
    hwNext(HW.last === "hw_save" ? _T("hw_save") : _T("hn_next"), function () {
      HW.name = (inp.value || "").trim();
      if (!HW.name) {
        toast(_T("hw_give_it_a_name"));
        inp.focus();
        return;
      }
      if (HW.onName) HW.onName();
      else hwAdvance();
    })
  );
  setTimeout(function () {
    inp.focus();
  }, 150);
}

/* A short list of choices on its own page ("Style", "Turn lights off"): options [{value, title, sub}], get(), set(value). */
function hwPickPage(b) {
  if (!hwOpen(b)) return;
  var p = HW.pick;
  if (!p) {
    b.appendChild(hmCallout(_T("nothing_found")));
    return;
  }
  hwHint(b, p.hint);
  b.appendChild(
    hmGroup(
      p.options.map(function (o) {
        return hmRow({
          title: o.title,
          sub: o.sub,
          check: function () {
            return p.get() === o.value;
          },
          tap: function () {
            p.set(o.value);
            popBack();
          },
        });
      })
    )
  );
}

function hwChoose(pick) {
  HW.pick = pick;
  showPopup("hue-wz-pick", true);
}

/* ---- the automations: what kind ---- */

var HW_AUTOMATIONS = [
  { kind: "wake_up", icon: "bright", title: "hw_wake_up", sub: "hw_wake_up_sub", steps: ["hue-wz-lights", "hue-wz-when", "hue-wz-settings", "hue-wz-name"] },
  { kind: "go_to_sleep", icon: "moon", title: "hw_go_to_sleep", sub: "hw_go_to_sleep_sub", steps: ["hue-wz-lights", "hue-wz-start", "hue-wz-when", "hue-wz-settings", "hue-wz-name"] },
  { kind: "coming_home", icon: "home", title: "hw_coming_home", sub: "hw_coming_home_sub", steps: ["hue-wz-lights", "hue-wz-whenhome", "hue-wz-scene", "hue-wz-name"] },
  { kind: "leaving_home", icon: "home", title: "hw_leaving_home", sub: "hw_leaving_home_sub", steps: ["hue-wz-lights", "hue-wz-name"] },
  { kind: "mimic_presence", icon: "home", title: "hw_mimic_presence", sub: "hw_mimic_presence_sub", steps: ["hue-wz-lights", "hue-wz-mimic", "hue-wz-summary"], one: "PM" },
  { kind: "timer", icon: "clock", title: "hw_timer", sub: "hw_timer_sub", steps: ["hue-wz-lights", "hue-wz-length", "hue-wz-scene", "hue-wz-name"] },
  { kind: "schedule", icon: "clock", title: "hw_lighting_schedule", sub: "hw_lighting_schedule_sub", steps: ["hue-wz-lights", "hue-wz-when", "hue-wz-scene", "hue-wz-name"] },
];

function hwAutomation(kind) {
  return HW_AUTOMATIONS.filter(function (a) {
    return a.kind === kind;
  })[0];
}

/* The bridge keeps one automation of some kinds (Mimic presence): the kind then opens the one there is. */
function hwExisting(a) {
  return a.one
    ? hmList("automations").filter(function (x) {
        return x.script === a.one;
      })[0]
    : null;
}

function hwNewAutomation(b) {
  hmBox(b);
  b.appendChild(hmTitle("plus", _T("hw_what_kind_of_automation")));
  hwHint(b, _T("hw_what_kind_of_automation_sub"));
  b.appendChild(
    hmGroup(
      HW_AUTOMATIONS.map(function (a) {
        var have = hwExisting(a);
        return hmRow({
          icon: a.icon,
          title: _T(a.title),
          sub: have ? _T("hw_one_only") : _T(a.sub),
          tap: function () {
            hwStartAutomation(a.kind, have || null);
          },
        });
      })
    )
  );
}

/* The answers of an automation wizard, from a routine on the bridge when it is being changed, else the Hue app's starting values. */
/* {hour, minute} as "HH:MM". */
function hwHhmm(t) {
  return String(t.hour).padStart(2, "0") + ":" + String(t.minute).padStart(2, "0");
}

function hwClock(point) {
  var t = (point && point.time_point && point.time_point.time) || {};
  return t.hour === undefined ? "" : String(t.hour).padStart(2, "0") + ":" + String(t.minute).padStart(2, "0");
}

/* A start or an end of a schedule: "time", "sunrise" or "sunset" (and "none" for an end that is not there). */
function hwPointType(point) {
  return point && point.time_point ? point.time_point.type : "none";
}

function hwAutomationState(kind, x) {
  var a = hwAutomation(kind),
    c = (x && x.configuration) || {},
    when = c.when || {},
    point = (when.time_point || {}).time || {},
    ext = c.when_extended || {},
    between = (c.when_constrained || {}).type === "between" ? c.when_constrained : null,
    recall = ((c.what || [])[0] || {}).recall || {},
    firstAction = ((((c.what || [])[0] || {}).actions || [])[0] || {}).action || null,
    group = ((c.where || [])[0] || {}).group || {},
    st = {
      kind: kind,
      icon: a.icon,
      steps: a.steps.slice(),
      edit: x ? x.id : null,
      group: group.rid ? { id: group.rid, type: group.rtype } : null,
      name: x ? x.name : "",
      time: when.time_point ? String(point.hour).padStart(2, "0") + ":" + String(point.minute).padStart(2, "0") : hwClock(ext.start_at) || (kind === "wake_up" ? "07:00" : kind === "go_to_sleep" ? "22:00" : ""),
      startType: ext.start_at ? hwPointType(ext.start_at) : "time",
      until: hwClock(ext.end_at),
      untilType: ext.end_at ? hwPointType(ext.end_at) : "none",
      days: (when.recurrence_days || ext.recurrence_days || HW_WEEK).slice(),
      minutes: c.fade_in_duration ? c.fade_in_duration.seconds / 60 : c.fade_out_duration ? c.fade_out_duration.seconds / 60 : kind === "go_to_sleep" ? 15 : 30,
      brightness: c.end_brightness ? Math.round(c.end_brightness) : 100,
      style: c.style || (kind === "go_to_sleep" ? "sunset" : "sunrise"),
      endState: c.end_state || (kind === "mimic_presence" ? "do_nothing" : "turn_off"),
      mode: c.mode || "24h",
      excluded: c.excluded_lights || "turn_off",
      whenType: between ? "between" : (c.when_constrained || {}).type || "always",
      between: between,
      manual: kind === "go_to_sleep" && !!x && !x.enabled,
      offAfter: c.turn_lights_off_after ? c.turn_lights_off_after.minutes || Math.round(c.turn_lights_off_after.seconds / 60) : 0,
      randomize: (ext.randomization || {}).minutes || 0,
      scene: recall.rid || "",
      action: firstAction && firstAction.on ? (firstAction.on.on ? "on" : "off") : "scene",
      hours: c.duration ? Math.floor((c.duration.minutes || 0) / 60) : 0,
      mins: c.duration ? (c.duration.minutes || 0) % 60 : 1,
      finish: hwSaveAutomation,
      nameHeading: _T("hw_name_your_automation"),
      last: "hw_save",
    };
  if (!st.name) st.name = hwDefaultName(kind);
  if (kind === "go_to_sleep" && st.manual) st.steps = hwSleepSteps(true);
  return st;
}

/* Go to sleep that starts by hand has no time page: the bridge still wants a time, which is kept and never used. */
function hwSleepSteps(manual) {
  return manual ? ["hue-wz-lights", "hue-wz-start", "hue-wz-settings", "hue-wz-name"] : ["hue-wz-lights", "hue-wz-start", "hue-wz-when", "hue-wz-settings", "hue-wz-name"];
}

var hwSeen = null; /* the automations read when the wizard began, to number a default name */

function hwDefaultName(kind) {
  var base = _T("hw_name_" + kind),
    names = {};
  (hwSeen || []).forEach(function (x) {
    names[x.name] = 1;
  });
  if (!names[base]) return base;
  for (var i = 2; names[base + " " + i]; i++);
  return base + " " + i;
}

/* The page the wizard was chosen on (the list of kinds, or the routine being changed) is left with it: Save goes back to the list of automations. */
function hwStartAutomation(kind, x) {
  hwSeen = hmList("automations");
  hwBegin(hwAutomationState(kind, x));
  HW.depth = 1;
  hwPush(HW.steps[0]);
}

/* Which room or zone: one of them (the bridge's templates are made for one). */
function hwLightsPage(b) {
  if (!hwOpen(b, "hue-wz-lights")) return;
  hmLoad(b, ["rooms", "zones"], function (box, r) {
    var groups = hwGroups(r);
    box.appendChild(hmTitle("lamp", _T("hn_choose_your_lights")));
    if (!groups.length) box.appendChild(hmCallout(_T("hn_no_hue_room")));
    hwGroupRows(
      box,
      groups,
      function (g) {
        return !!HW.group && HW.group.id === g.id;
      },
      function (g) {
        HW.group = { id: g.id, type: g.type };
      }
    );
    box.appendChild(
      hwNext(null, function () {
        if (!HW.group) {
          toast(_T("hn_choose_a_room"));
          return;
        }
        hwAdvance();
      })
    );
  });
}

/* Sunrise and sunset need the bridge to know where home is. */
function hwHasLocation() {
  return !!(HM.home_and_away && HM.home_and_away.configured);
}

var HW_POINTS = ["time", "sunrise", "sunset"];

function hwPointText(t) {
  return _T(t === "none" ? "hw_no_end_time" : t === "time" ? "hw_at_a_specific_time" : "hw_" + t);
}

/* A start or an end that is a time, sunrise, sunset (or, for an end, nothing): its picker row. */
function hwPointRow(title, key, withNone) {
  return hmRow({
    title: title,
    val: function () {
      return hwPointText(HW[key]);
    },
    tap: function () {
      hwChoose({
        hint: hwHasLocation() ? "" : _T("hw_sun_needs_home_location"),
        options: (withNone ? ["none"] : []).concat(HW_POINTS).map(function (t) {
          return { value: t, title: hwPointText(t) };
        }),
        get: function () {
          return HW[key];
        },
        set: function (v) {
          if ((v === "sunrise" || v === "sunset") && !hwHasLocation()) {
            toast(_T("hw_sun_needs_home_location"));
            return;
          }
          HW[key] = v;
        },
      });
    },
  });
}

/* When: wake up, go to sleep and the schedule differ in what goes with the time. */
function hwWhenPage(b) {
  if (!hwOpen(b, "hue-wz-when")) return;
  var kind = HW.kind,
    schedule = kind === "schedule";
  b.appendChild(hmTitle("clock", _T(kind === "wake_up" ? "hw_when_do_you_want_to_wake_up" : kind === "go_to_sleep" ? "hw_when_do_you_want_to_go_to_sleep" : "hw_when_do_you_want_to_schedule")));
  if (schedule) {
    b.appendChild(hmGroup([hwPointRow(_T("hw_start_at"), "startType", false)]));
    if (HW.startType === "time") b.appendChild(hmGroup([hwTimeRow(_T("time"), function () { return HW.time; }, function (v) { HW.time = v; })]));
    b.appendChild(hmGroup([hwPointRow(_T("hw_end_at"), "untilType", true)]));
    if (HW.untilType === "time") b.appendChild(hmGroup([hwTimeRow(_T("time"), function () { return HW.until; }, function (v) { HW.until = v; })]));
  } else b.appendChild(hmGroup([hwTimeRow(_T("time"), function () { return HW.time; }, function (v) { HW.time = v; })]));
  if (kind === "wake_up") {
    b.appendChild(hmLabel(_T("hw_fade_duration")));
    b.appendChild(hmChips([5, 10, 15, 20, 30, 45, 60], function () { return HW.minutes; }, function (v) { HW.minutes = v; }, hwMinutesText));
  }
  b.appendChild(hmLabel(_T("hw_repeat")));
  b.appendChild(hwDays(HW.days));
  if (schedule) {
    b.appendChild(hmLabel(_T("hw_extra_options")));
    b.appendChild(
      hmGroup([
        hmRow({
          title: _T("hw_randomize_times"),
          val: function () {
            return HW.randomize ? hwMinutesText(HW.randomize) : _T("hw_no");
          },
          tap: function () {
            hwChoose({
              hint: _T("hw_randomize_times_hint"),
              options: [0, 5, 10, 15, 30, 60].map(function (m) {
                return { value: m, title: m ? hwMinutesText(m) : _T("hw_no") };
              }),
              get: function () { return HW.randomize; },
              set: function (v) { HW.randomize = v; },
            });
          },
        }),
      ])
    );
  }
  b.appendChild(
    hwNext(null, function () {
      if ((!schedule || HW.startType === "time") && !/^\d\d:\d\d$/.test(HW.time)) {
        toast(_T("hm_pick_a_time"));
        return;
      }
      if (schedule && HW.untilType === "time" && !/^\d\d:\d\d$/.test(HW.until)) {
        toast(_T("hm_pick_a_time"));
        return;
      }
      if (schedule && HW.startType === "time" && HW.untilType === "time" && HW.until === HW.time) {
        toast(_T("hm_two_times_cannot_be_the_same"));
        return;
      }
      if (!HW.days.length) {
        toast(_T("hw_choose_a_day"));
        return;
      }
      hwAdvance();
    })
  );
}

/* "How should Go to sleep start?": at a time, or only by the play button. */
function hwStartPage(b) {
  if (!hwOpen(b, "hue-wz-start")) return;
  b.appendChild(hmTitle("moon", _T("hw_how_should_go_to_sleep_start")));
  function row(manual, icon, title, sub) {
    return hmRow({
      icon: icon,
      title: title,
      sub: sub,
      check: function () {
        return HW.manual === manual;
      },
      tap: function () {
        HW.manual = manual;
        HW.steps = hwSleepSteps(manual);
        hwAdvance();
      },
    });
  }
  b.appendChild(
    hmGroup([
      row(false, "clock", _T("hw_at_a_certain_time"), _T("hw_at_a_certain_time_sub")),
      row(true, "play", _T("hw_with_a_button_press"), _T("hw_with_a_button_press_sub")),
    ])
  );
}

/* Coming home: every time, or only when the sun is down. */
function hwHomeWhenPage(b) {
  if (!hwOpen(b, "hue-wz-whenhome")) return;
  b.appendChild(hmTitle("home", _T("hw_when_should_your_lights_turn_on")));
  function row(type, icon, title, sub) {
    return hmRow({
      icon: icon,
      title: title,
      sub: sub,
      check: function () {
        return HW.whenType === type;
      },
      tap: function () {
        if (type === "nighttime" && !hwHasLocation()) {
          toast(_T("hw_sun_needs_home_location"));
          return;
        }
        HW.whenType = type;
        hwAdvance();
      },
    });
  }
  b.appendChild(
    hmGroup([
      row("always", "bright", _T("hw_always"), _T("hw_always_sub")),
      row("nighttime", "moon", _T("hw_at_night"), _T("hw_at_night_sub")),
    ])
  );
  if (!hwHasLocation()) b.appendChild(hmCallout(_T("hw_sun_needs_home_location")));
}

/* Mimic presence, step two: all day or only when it is dark. */
function hwMimicPage(b) {
  if (!hwOpen(b, "hue-wz-mimic")) return;
  b.appendChild(hmTitle("home", _T("hw_when_should_your_lights_turn_on_active")));
  function row(mode, icon, title, sub) {
    return hmRow({
      icon: icon,
      title: title,
      sub: sub,
      check: function () {
        return HW.mode === mode;
      },
      tap: function () {
        HW.mode = mode;
        if (HW.fromSummary) {
          HW.fromSummary = false;
          popBack();
        } else hwAdvance();
      },
    });
  }
  b.appendChild(
    hmGroup([
      row("24h", "bright", _T("hw_all_day"), _T("hw_all_day_sub")),
      row("nighttime", "moon", _T("hw_only_when_its_dark"), _T("hw_only_when_its_dark_sub")),
    ])
  );
}

function hwGroupName() {
  var found = null;
  hwGroups({ rooms: hmList("rooms"), zones: hmList("zones") }).forEach(function (g) {
    if (HW.group && g.id === HW.group.id) found = g.name;
  });
  return found || "";
}

/* "This is how your automation works": where, when and what it ends with, then Save. */
function hwSummaryPage(b) {
  if (!hwOpen(b, "hue-wz-summary")) return;
  HW.fromSummary = false;
  b.appendChild(hmTitle("home", _T("hw_this_is_how_your_automation_works")));
  hwHint(b, _T("hw_mimic_presence_explanation"));
  b.appendChild(
    hmGroup([
      hmRow({ title: _T("hw_where"), val: hwGroupName }),
      hmRow({
        title: _T("hw_when"),
        val: function () {
          return _T(HW.mode === "24h" ? "hw_all_day" : "hw_only_when_its_dark");
        },
        tap: function () {
          HW.fromSummary = true;
          showPopup("hue-wz-mimic", true);
        },
      }),
      hmRow({
        title: _T("hw_end_with"),
        val: function () {
          return _T(HW.endState === "turn_off" ? "hw_lights_off" : "hw_do_nothing");
        },
        tap: function () {
          hwChoose({
            options: ["do_nothing", "turn_off"].map(function (v) {
              return { value: v, title: _T(v === "turn_off" ? "hw_lights_off" : "hw_do_nothing") };
            }),
            get: function () {
              return HW.endState;
            },
            set: function (v) {
              HW.endState = v;
            },
          });
        },
      }),
    ])
  );
  b.appendChild(hwNext(_T("hw_save"), HW.finish));
}

function hwStyleText(style) {
  return _T(style === "basic" ? (HW.kind === "wake_up" ? "hw_style_basic_up" : "hw_style_basic_down") : "hw_style_" + style);
}

/* Settings of wake up and go to sleep: style, brightness or fade duration, and what happens at the end. */
function hwSettingsPage(b) {
  if (!hwOpen(b, "hue-wz-settings")) return;
  var wake = HW.kind === "wake_up",
    styles = wake ? ["sunrise", "basic"] : ["sunset", "basic"];
  b.appendChild(hmTitle("tune", _T("hw_choose_your_settings")));
  var rows = [
    hmRow({
      title: _T("hw_style"),
      val: function () {
        return hwStyleText(HW.style);
      },
      tap: function () {
        hwChoose({
          hint: _T(wake ? "hw_sunrise_hint" : "hw_sunset_hint"),
          options: styles.map(function (v) {
            return { value: v, title: hwStyleText(v) };
          }),
          get: function () { return HW.style; },
          set: function (v) { HW.style = v; },
        });
      },
    }),
  ];
  if (!wake) {
    rows.push(
      hmRow({
        title: _T("hw_fade_duration"),
        val: function () {
          return hwMinutesText(HW.minutes);
        },
        tap: function () {
          hwChoose({
            options: [5, 10, 15, 20, 30, 45, 60].map(function (m) {
              return { value: m, title: hwMinutesText(m) };
            }),
            get: function () { return HW.minutes; },
            set: function (v) { HW.minutes = v; },
          });
        },
      }),
      hmRow({
        title: _T("hw_end_with"),
        val: function () {
          return _T("hw_end_" + HW.endState);
        },
        tap: function () {
          hwChoose({
            options: ["turn_off", "minimum_brightness", "nightlight"].map(function (v) {
              return { value: v, title: _T("hw_end_" + v) };
            }),
            get: function () {
              return HW.endState;
            },
            set: function (v) {
              HW.endState = v;
            },
          });
        },
      })
    );
  }
  b.appendChild(hmGroup(rows));
  if (wake) {
    b.appendChild(
      sliderRow({
        icon: "bright",
        name: _T("hw_maximum_brightness"),
        min: 1,
        max: 100,
        step: 1,
        get: function () { return HW.brightness; },
        fmt: function (v) { return v + "%"; },
        on: function () { return true; },
        commit: function (v) { HW.brightness = v; },
      })
    );
    b.appendChild(
      hmGroup([
        hmRow({
          title: _T("hw_turn_lights_off"),
          val: function () {
            return HW.offAfter ? hwMinutesText(HW.offAfter) : _T("hw_no");
          },
          tap: function () {
            hwChoose({
              hint: _T("hw_turn_lights_off_hint"),
              options: [0, 5, 10, 15, 30, 60].map(function (m) {
                return { value: m, title: m ? hwMinutesText(m) : _T("hw_no") };
              }),
              get: function () { return HW.offAfter; },
              set: function (v) { HW.offAfter = v; },
            });
          },
        }),
      ])
    );
  }
  b.appendChild(hwNext());
}

/* The scenes of the room or zone chosen, from what the menu read. A lighting schedule can also switch the lights on or off. */
function hwSceneRows(box, r) {
  var scenes = (r.scenes || []).filter(function (s) {
    return HW.group && s.group_id === HW.group.id;
  });
  if (HW.kind === "schedule")
    box.appendChild(
      hmGroup(
        [["on", "bright", "hw_on"], ["off", "power", "hw_off"]].map(function (t) {
          return hmRow({
            icon: t[1],
            title: _T(t[2]),
            check: function () {
              return HW.action === t[0];
            },
            tap: function () {
              HW.action = t[0];
              HW.scene = "";
              refresh();
            },
          });
        })
      )
    );
  if (HW.kind === "schedule") box.appendChild(hmLabel(_T("hw_custom")));
  if (!scenes.length) box.appendChild(hmCallout(_T("hw_no_scenes_here")));
  box.appendChild(
    hmGroup(
      scenes.map(function (s) {
        return hmRow({
          icon: "scene",
          title: s.name,
          check: function () {
            return HW.action === "scene" && HW.scene === s.id;
          },
          tap: function () {
            HW.action = "scene";
            HW.scene = s.id;
            refresh();
          },
        });
      })
    )
  );
}

function hwScenePage(b) {
  if (!hwOpen(b, "hue-wz-scene")) return;
  hmLoad(b, ["scenes"], function (box, r) {
    box.appendChild(hmTitle("scene", _T("hw_what_should_your_lights_do")));
    hwSceneRows(box, r);
    box.appendChild(
      hwNext(null, function () {
        if (HW.action === "scene" && !HW.scene) {
          toast(_T("hm_pick_a_scene"));
          return;
        }
        hwAdvance();
      })
    );
  });
}

function hwNumberRow(title, unit, get, set, max) {
  var row = mk("div", "hm-row"),
    label = mk("span", "hm-t"),
    inp = mk("input", "hm-time");
  label.appendChild(mk("span", "hm-n")).textContent = title;
  inp.type = "number";
  inp.min = 0;
  inp.max = max;
  inp.step = 1;
  inp.inputMode = "numeric";
  inp.value = get();
  inp.setAttribute("aria-label", title);
  inp.addEventListener("input", function () {
    set(Math.max(0, Math.min(max, Math.floor(Number(inp.value) || 0))));
  });
  row.appendChild(label);
  row.appendChild(inp);
  return row;
}

function hwLengthPage(b) {
  if (!hwOpen(b, "hue-wz-length")) return;
  b.appendChild(hmTitle("clock", _T("hw_how_long_should_your_timer_last")));
  b.appendChild(
    hmGroup([
      hwNumberRow(_T("hw_hours"), "h", function () { return HW.hours; }, function (v) { HW.hours = v; }, 23),
      hwNumberRow(_T("hm_min"), "min", function () { return HW.mins; }, function (v) { HW.mins = v; }, 59),
    ])
  );
  b.appendChild(
    hwNext(null, function () {
      if (HW.hours * 60 + HW.mins < 1) {
        toast(_T("hw_a_timer_needs_a_minute"));
        return;
      }
      hwAdvance();
    })
  );
}

/* The call that makes (or changes) the routine, then back to the list of automations. */
function hwSaveAutomation() {
  var d = HW,
    pad = function (t) {
      return t + ":00";
    },
    body = { name: d.name, group: d.group.id, group_type: d.group.type };
  if (d.kind === "wake_up" || d.kind === "go_to_sleep" || d.kind === "schedule") {
    var timed = d.kind !== "schedule" || d.startType === "time";
    if (timed) body.time = pad(d.time);
    body.days = d.days.length === 7 ? [] : d.days;
  }
  if (d.kind === "wake_up") {
    body.minutes = d.minutes;
    body.end_brightness = d.brightness;
    body.style = d.style;
    if (d.offAfter) body.turn_off_after_minutes = d.offAfter;
  }
  if (d.kind === "go_to_sleep") {
    body.minutes = d.minutes;
    body.style = d.style;
    body.end_state = d.endState;
    body.enabled = !d.manual;
  }
  if (d.kind === "schedule") {
    body.start_type = d.startType;
    if (d.untilType !== "none") {
      body.until_type = d.untilType;
      if (d.untilType === "time") body.until = pad(d.until);
    }
    if (d.randomize) body.randomize_minutes = d.randomize;
    body.action = d.action;
  }
  if (d.kind === "mimic_presence") {
    body.mode = d.mode;
    body.end_state = d.endState;
    body.excluded_lights = d.excluded;
  }
  if (d.kind === "coming_home") {
    if (d.whenType === "between" && d.between) {
      body.time = pad(hwHhmm(d.between.start));
      body.until = pad(hwHhmm(d.between.end));
    } else body.when_type = d.whenType;
  }
  if (d.kind === "timer") body.minutes = d.hours * 60 + d.mins;
  if (d.kind === "timer" || d.kind === "coming_home" || (d.kind === "schedule" && d.action === "scene")) body.scene = d.scene;
  if (d.edit) body.automation = d.edit;
  else body.routine = d.kind;
  hpCall("hue_plus", d.edit ? "update_routine" : "create_routine", body).then(
    function () {
      HM_READY = false;
      hwLeave();
      hmEnsure();
    },
    function () {
      toast(_T("hw_couldn_t_save_the_automation"));
    }
  );
}

/* A routine made from one of the bridge's templates can be changed with the same pages it was made with. */
function hwEditable(x) {
  return !!x.script && ["Basic wake up routine", "Native Go To Sleep", "Timers", "Schedule", "Coming home", "Leaving home", "PM"].indexOf(x.script) >= 0;
}

/* The automations that have the app's play button: they start and stop by hand, whether or not they are switched on. */
function hwRunnable(x) {
  return ["Basic wake up routine", "Native Go To Sleep", "Timers", "PM"].indexOf(x.script) >= 0;
}

/* Whether it is running now, from the state the bridge keeps for it (gts_state, pm_state, ...). */
function hwRunText(x) {
  var st = x.state || {},
    running = Object.keys(st).some(function (k) {
      return /_state$/.test(k) && (st[k] === "started" || st[k] === "running");
    });
  return running ? _T("hw_running") : "";
}

function hwKindOf(x) {
  return { "Basic wake up routine": "wake_up", "Native Go To Sleep": "go_to_sleep", Timers: "timer", Schedule: "schedule", "Coming home": "coming_home", "Leaving home": "leaving_home", PM: "mimic_presence" }[x.script];
}

HP_PAGES["hue-newauto"] = ["hw_new_automation", "plus", hwNewAutomation];
HP_PAGES["hue-wz-lights"] = ["hn_choose_your_lights", "lamp", hwLightsPage];
HP_PAGES["hue-wz-when"] = ["hm_time", "clock", hwWhenPage];
HP_PAGES["hue-wz-settings"] = ["hw_choose_your_settings", "tune", hwSettingsPage];
HP_PAGES["hue-wz-start"] = ["hw_go_to_sleep", "moon", hwStartPage];
HP_PAGES["hue-wz-whenhome"] = ["hw_coming_home", "home", hwHomeWhenPage];
HP_PAGES["hue-wz-mimic"] = ["hw_mimic_presence", "home", hwMimicPage];
HP_PAGES["hue-wz-summary"] = ["hw_mimic_presence", "home", hwSummaryPage];
HP_PAGES["hue-wz-scene"] = ["hm_scene", "scene", hwScenePage];
HP_PAGES["hue-wz-length"] = ["hw_timer", "clock", hwLengthPage];
HP_PAGES["hue-wz-name"] = ["hw_name_your_automation", "edit", hwNamePage];
HP_PAGES["hue-wz-pick"] = ["hw_choose", "tune", hwPickPage];

/* MotionAware areas as the Hue app has them: "Create a MotionAware area" (three pages of advice, the room, three or four devices, a name, then what the area does when it senses motion)
 and the area's own page (name, on or off, the times and scenes of "Control lights", the motion-sensitive devices, sensitivity and daylight). The steps use the wizard pieces of huewizard.js;
 the bridge's request for each is in docs/bridge-findings.md. */

/* The default times of the Hue app when it finishes the wizard: scenes of the room by name, with the minutes without motion before the lights go off. */
var HMW_DEFAULTS = [["07:00", "Concentrate", 10], ["17:00", "Read", 15], ["23:00", "Nightlight", 10]];

function hmwCandidates() {
  var owners = {};
  ((HM.motion_areas || {}).candidates || []).forEach(function (c) {
    owners[(c.owner || {}).rid] = c.id;
  });
  return owners;
}

/* The devices of a room that can take part in a MotionAware area. */
function hmwDevicesOf(group) {
  var owners = hmwCandidates();
  return group.children.filter(function (c) {
    return owners[c.id];
  });
}

/* The devices that already belong to an area: a device is in one area only. */
function hmwUsed() {
  var used = {};
  hmMotionAreas().forEach(function (x) {
    hmwOwners(x).forEach(function (d) {
      used[d] = true;
    });
  });
  return used;
}

/* The devices of a room that can still be chosen. */
function hmwFreeDevicesOf(group) {
  var used = hmwUsed();
  return hmwDevicesOf(group).filter(function (c) {
    return !used[c.id];
  });
}

var HMW_MAX_AREAS = 4;

function hmwStart() {
  if (hmMotionAreas().length >= HMW_MAX_AREAS) {
    toast(_T("hmw_four_areas"));
    return;
  }
  hwBegin({
    kind: "motion",
    icon: "motion",
    steps: ["hue-mw-intro", "hue-mw-tip1", "hue-mw-tip2", "hue-mw-tip3", "hue-mw-where", "hue-mw-devices", "hue-mw-leave", "hue-mw-calibrating", "hue-wz-name", "hue-mw-created", "hue-mw-choice", "hue-mw-groups", "hue-mw-done"],
    group: null,
    devices: {},
    name: _T("hm_motionaware_area"),
    nameHeading: _T("hmw_name_your_area"),
    finish: hmwSetLights,
    onName: hmwRename1,
    last: "hn_next",
    slots: [],
    groups: [],
    dark: null,
  });
  hwPush("hue-mw-intro");
}

/* A page of advice: a heading, the paragraphs, Next. */
function hmwInfo(key, title, texts, label, next) {
  return function (b) {
    if (!hwOpen(b, key)) return;
    b.appendChild(hmTitle("motion", _T(title)));
    texts.forEach(function (t) {
      hwHint(b, _T(t));
    });
    b.appendChild(hwNext(label ? _T(label) : null, next));
  };
}

function hmwWherePage(b) {
  if (!hwOpen(b, "hue-mw-where")) return;
  hmLoad(b, ["rooms", "zones", "motion_areas"], function (box, r) {
    box.appendChild(hmTitle("motion", _T("hmw_where_are_the_lights")));
    hwHint(box, _T("hmw_where_hint"));
    var rooms = hwGroups(r).filter(function (g) {
      return g.type === "room";
    });
    box.appendChild(hmLabel(_T("hn_rooms")));
    box.appendChild(
      hmGroup(
        rooms.map(function (g) {
          var n = hmwFreeDevicesOf(g).length;
          return hmRow({
            icon: "home",
            title: g.name,
            sub: cntS(n, _T("hmw_available_device"), _T("hmw_available_devices")),
            check: function () {
              return !!HW.group && HW.group.id === g.id;
            },
            tap: function () {
              if (n < 3) {
                toast(_T("hmw_needs_three"));
                return;
              }
              if (!HW.group || HW.group.id !== g.id) {
                HW.group = g;
                HW.devices = {};
                hmwFreeDevicesOf(g)
                  .slice(0, 3)
                  .forEach(function (c) {
                    HW.devices[c.id] = true;
                  });
              }
              refresh();
            },
          });
        })
      )
    );
    box.appendChild(
      hwNext(null, function () {
        if (!HW.group) {
          toast(_T("hn_choose_a_room"));
          return;
        }
        hwAdvance();
      })
    );
  });
}

function hmwChosen() {
  return Object.keys(HW.devices).filter(function (k) {
    return HW.devices[k];
  });
}

function hmwDevicesPage(b) {
  if (!hwOpen(b, "hue-mw-devices")) return;
  hmLoad(b, ["rooms", "zones", "motion_areas"], function (box) {
    var list = hmwDevicesOf(HW.group),
      used = hmwUsed();
    box.appendChild(hmTitle("motion", _T("hmw_choose_devices")));
    hwHint(box, _T("hmw_choose_devices_hint"));
    box.appendChild(hmLabel(HW.group.name));
    box.appendChild(
      hmGroup(
        list.map(function (c) {
          return hmRow({
            icon: "lamp",
            title: c.name,
            sub: used[c.id] ? _T("hmw_in_use") : "",
            check: function () {
              return !!HW.devices[c.id];
            },
            tap: function () {
              if (used[c.id]) {
                toast(_T("hmw_in_use_hint"));
                return;
              }
              if (!HW.devices[c.id] && hmwChosen().length >= 4) {
                toast(_T("hmw_three_or_four"));
                return;
              }
              HW.devices[c.id] = !HW.devices[c.id];
              refresh();
            },
          });
        })
      )
    );
    box.appendChild(
      hwNext(null, function () {
        var n = hmwChosen().length;
        if (n < 3 || n > 4) {
          toast(_T("hmw_three_or_four"));
          return;
        }
        hwAdvance();
      })
    );
  });
}

/* "Leave the area" was read: the area is made on the bridge with the name it will be called until it is named, and switched on, which calibrates it. Nobody may be in the room for about 20 seconds. */
function hmwStartCalibration() {
  var before = {};
  hmMotionAreas().forEach(function (x) {
    before[x.id] = 1;
  });
  var made = HW.areaId
    ? Promise.resolve()
    : hpCall("hue_plus", "create_motion_area", { name: HW.name, group: HW.group.id, group_type: "room", lights: hmwChosen() }).then(function () {
        return hueplus.resources(["motion_areas", "automations"]).then(function (r) {
          HM.motion_areas = r.motion_areas;
          HM.automations = r.automations;
          var area = ((r.motion_areas || {}).areas || []).filter(function (x) {
            return !before[x.id];
          })[0];
          if (!area) throw new Error("not found");
          HW.areaId = area.id;
        });
      });
  made
    .then(function () {
      return hpCall("hue_plus", "set_motion_area", { area: HW.areaId, enabled: true });
    })
    .then(
      function () {
        HW.calibrationStart = Date.now();
        hwPush("hue-mw-calibrating");
      },
      function () {
        toast(_T("hmw_couldn_t_create_the_area"));
      }
    );
}

/* The bridge calls the area healthy once its devices have measured the room. */
function hmwCalibrated(x) {
  return !!x && x.health === "healthy" && (x.participants || []).every(function (p) {
    return !p.status || p.status.health === "healthy";
  });
}

var HMW_CALIBRATION_SECONDS = 20;
var HMW_CALIBRATION_GIVE_UP_SECONDS = 120;

/* "Calibrating area…": a count down while the bridge is asked every two seconds; when the area is healthy the wizard goes on to the name. */
function hmwCalibratingPage(b) {
  if (!hwOpen(b, "hue-mw-calibrating")) return;
  b.appendChild(hmTitle("motion", _T("hmw_calibrating_area")));
  hwHint(b, _T("hmw_calibrating_hint"));
  var status = hmRow({
      title: function () {
        var left = HMW_CALIBRATION_SECONDS - Math.floor((Date.now() - HW.calibrationStart) / 1000);
        return left > 0 ? cntS(left, _T("hmw_second_to_go"), _T("hmw_seconds_to_go")) : _T("hmw_almost_done");
      },
    }),
    box = hmGroup([status]),
    stopped = false,
    timer = null;
  b.appendChild(box);
  function leave() {
    stopped = true;
    clearInterval(timer);
  }
  function check() {
    if (stopped || !b.isConnected) return leave();
    refresh();
    if (Date.now() - HW.calibrationStart > HMW_CALIBRATION_GIVE_UP_SECONDS * 1000) {
      leave();
      b.appendChild(hmCallout(_T("hmw_calibration_didn_t_finish")));
      b.appendChild(
        hmActions([
          hmButton(_T("hmw_try_again"), "primary", function () {
            popBack();
          }),
        ])
      );
      return;
    }
    hueplus.resources(["motion_areas"]).then(function (r) {
      if (stopped) return;
      HM.motion_areas = r.motion_areas;
      var x = hmMotionArea1(HW.areaId);
      if (hmwCalibrated(x) && Date.now() - HW.calibrationStart > HMW_CALIBRATION_SECONDS * 1000 - 5000) {
        leave();
        HW.depth--;
        popBack();
        hwPush("hue-wz-name");
      }
    });
  }
  timer = setInterval(check, 2000);
}

/* The area exists and is calibrated: if it was given a name other than the one it was made with, it is renamed, then the wizard goes on. */
function hmwRename1() {
  var d = HW,
    area = hmMotionArea1(d.areaId);
  if (area && area.name === d.name) {
    hwAdvance();
    return;
  }
  hpCall("hue_plus", "set_motion_area", { area: d.areaId, name: d.name }).then(
    function () {
      if (area) area.name = d.name;
      hwAdvance();
    },
    function () {
      toast(_T("hmw_couldn_t_save"));
    }
  );
}

/* The scenes of the rooms (or the zone) the area controls, by name, for the Hue app's default times. */
function hmwDefaultSlots() {
  var scenes = hmList("scenes"),
    ids = HW.groups.map(function (g) {
      return g.id;
    }),
    here = scenes.filter(function (s) {
      return ids.indexOf(s.group_id) >= 0;
    }),
    out = [];
  HMW_DEFAULTS.forEach(function (d) {
    var s = here.filter(function (x) {
      return String(x.name).toLowerCase() === d[1].toLowerCase();
    })[0];
    if (s) out.push({ sun: null, offset: 0, time: d[0], scene: s.id, off: d[2] });
  });
  return out.length === HMW_DEFAULTS.length ? out : [];
}

/* "What should your MotionAware area do?": the app offers three; here the bridge can do the first (the other two are a sensor group, and alerts that are a Signify subscription). */
function hmwChoicePage(b) {
  if (!hwOpen(b, "hue-mw-choice")) return;
  b.appendChild(hmTitle("motion", _T("hmw_what_should_your_area_do")));
  b.appendChild(
    hmGroup([
      hmRow({
        icon: "lamp",
        title: _T("hmw_control_lights"),
        sub: _T("hmw_control_lights_sub"),
        tap: hwAdvance,
      }),
    ])
  );
  hwHint(b, _T("hmw_choice_footer"));
}

function hmwGroupsPage(b) {
  if (!hwOpen(b, "hue-mw-groups")) return;
  hmLoad(b, ["rooms", "zones", "scenes"], function (box, r) {
    if (!HW.groups.length) HW.groups = [{ id: HW.group.id, type: "room" }];
    var groups = hwGroups(r),
      has = function (g) {
        return HW.groups.some(function (x) {
          return x.id === g.id;
        });
      };
    box.appendChild(hmTitle("lamp", _T("hmw_which_lights")));
    hwHint(box, _T("hmw_which_lights_hint"));
    hwGroupRows(box, groups, has, function (g) {
      if (has(g)) {
        HW.groups = HW.groups.filter(function (x) {
          return x.id !== g.id;
        });
        return;
      }
      var zone = g.type === "zone" || HW.groups.some(function (x) { return x.type === "zone"; });
      if (zone) HW.groups = [{ id: g.id, type: g.type }];
      else if (HW.groups.length >= 3) toast(_T("hmw_three_rooms"));
      else HW.groups.push({ id: g.id, type: g.type });
    });
    box.appendChild(
      hwNext(null, function () {
        if (!HW.groups.length) {
          toast(_T("hn_choose_a_room"));
          return;
        }
        HW.slots = hmwDefaultSlots();
        hwAdvance();
      })
    );
  });
}

/* "Success!": what the area will do, the Hue app's way of saying it, with Customize and Done. */
function hmwDonePage(b) {
  if (!hwOpen(b, "hue-mw-done")) return;
  b.appendChild(hmTitle("check", _T("hmw_success")));
  hwHint(b, _T("hmw_default_settings"));
  b.appendChild(hmwSlotRows(true));
  if (!HW.slots.length) b.appendChild(hmCallout(_T("hmw_no_default_scenes")));
  b.appendChild(
    hmActions([
      hmButton(_T("hmw_customize"), "ghost", function () {
        hmwOpenSlots(HW.areaId);
      }),
      hmButton(_T("hm_done"), "primary", function () {
        if (!HW.slots.length) {
          toast(_T("hmw_add_a_time"));
          return;
        }
        HW.finish();
      }),
    ])
  );
}

/* ---- what an area does: the times, as rows ---- */

function hmwNext(i) {
  return HW.slots[(i + 1) % HW.slots.length];
}

function hmwSceneName(id) {
  var s = hmList("scenes").filter(function (x) {
    return x.id === id;
  })[0];
  return s ? s.name : "";
}

/* A slot starts at a time of day, or at sunrise or sunset shifted by some minutes. */
function hmwSunText(sun, offset) {
  var n = Math.abs(offset || 0);
  if (!n) return _T("hw_" + sun);
  return n + " " + _T("hm_min") + " " + _T(offset < 0 ? "hmw_before" : "hmw_after") + " " + _T("hw_" + sun).toLowerCase();
}

function hmwStartText(s) {
  return s.sun ? hmwSunText(s.sun, s.offset) : s.time;
}

/* Where a slot falls in the day, to put them in order (sunrise and sunset count as 06:00 and 18:00 here, as on the bridge's side). */
function hmwOrder(s) {
  if (!s.sun) return Number(s.time.slice(0, 2)) * 60 + Number(s.time.slice(3, 5));
  return (s.sun === "sunrise" ? 360 : 1080) + (s.offset || 0);
}

function hmwSorted() {
  return HW.slots.slice().sort(function (a, b) {
    return hmwOrder(a) - hmwOrder(b);
  });
}

/* One row for each time: from when to when, the scene (or no lights), the minutes without motion before the lights go off. `plain` rows are not pressable. */
function hmwSlotRows(plain) {
  var sorted = hmwSorted();
  return hmGroup(
    sorted.map(function (s, i) {
      var to = sorted[(i + 1) % sorted.length];
      return hmRow({
        icon: "clock",
        title: hmwStartText(s) + " – " + hmwStartText(to),
        sub: (s.scene ? hmwSceneName(s.scene) : _T("hmw_no_lights")) + (s.scene && s.off ? " · " + hwMinutesText(s.off) : ""),
        tap: plain
          ? null
          : function () {
              HW.edit = HW.slots.indexOf(s);
              showPopup("hue-mslot", true);
              HW.depth++;
            },
      });
    })
  );
}

/* The area's times from its automation on the bridge: the scene each time recalls and the minutes before the lights go off. */
function hmwAutomationOf(areaId) {
  return hmList("automations").filter(function (a) {
    return ((a.configuration || {}).source || {}).rid === areaId;
  })[0];
}

function hmwSlotsFrom(a) {
  return (((a.configuration || {}).when || {}).timeslots || []).map(function (t) {
    var start = t.start_time || {},
      tm = start.time || {},
      action = (((t.on_motion || {}).recall_single || [])[0] || {}).action,
      slot = {
        sun: start.type === "sunrise" || start.type === "sunset" ? start.type : null,
        offset: (start.offset || {}).minutes || 0,
        time: tm.hour === undefined ? "" : String(tm.hour).padStart(2, "0") + ":" + String(tm.minute).padStart(2, "0"),
        scene: (action && action.recall && action.recall.rid) || "",
        off: ((t.on_no_motion || {}).after || {}).minutes || 0,
      };
    return slot;
  });
}

function hmwStartSlots(areaId) {
  var a = hmwAutomationOf(areaId),
    c = (a && a.configuration) || {};
  hwBegin({
    kind: "mslots",
    icon: "clock",
    areaId: areaId,
    steps: [],
    groups: (c.where || []).length
      ? c.where.map(function (w) {
          return { id: w.group.rid, type: w.group.rtype };
        })
      : hmwDefaultGroup(areaId),
    slots: a ? hmwSlotsFrom(a) : [],
    dark: ((c.settings || {}).daylight_sensitivity || {}).dark_threshold,
    finish: hmwSetLights,
  });
}

/* The wizard's Customize opens the times it is holding. */
function hmwOpenSlots(areaId) {
  showPopup("hue-mslots:" + areaId, true);
  HW.depth++;
}

/* The page of the times. From an area's page it starts from what the bridge holds (the area page drops edits that were walked away from); from the wizard it shows the wizard's own. */
function hmwSlotsPage(b, id) {
  hmBox(b);
  hmLoad(b, ["scenes", "automations", "rooms", "zones"], function (box) {
    if (!HW || (HW.kind !== "motion" && !(HW.kind === "mslots" && HW.areaId === id))) {
      hmwStartSlots(id);
      HW.depth = 1;
    }
    box.appendChild(hmTitle("clock", _T("hmw_control_lights")));
    hwHint(box, _T("hmw_control_lights_hint"));
    box.appendChild(hmwSlotRows(false));
    if (HW.slots.length < 10)
      box.appendChild(
        hmGroup([
          hmRow({
            icon: "plus",
            title: _T("hm_add_a_time"),
            tap: function () {
              HW.edit = HW.slots.length;
              showPopup("hue-mslot", true);
              HW.depth++;
            },
          }),
        ])
      );
    box.appendChild(
      hmActions([
        hmButton(_T("hm_done"), "primary", function () {
          if (!HW.slots.length) {
            toast(_T("hmw_add_a_time"));
            return;
          }
          if (HW.kind === "mslots") HW.finish();
          else {
            HW.depth--;
            popBack();
          }
        }),
      ])
    );
  });
}

/* An area with no automation yet controls the lights of its own room. */
function hmwDefaultGroup(areaId) {
  var x = hmMotionArea1(areaId);
  return x && x.group ? [{ id: x.group.rid, type: x.group.rtype }] : [];
}

var HMW_OFFSETS = [-60, -30, -15, 0, 15, 30, 60];

function hmwSlotPage(b) {
  hmBox(b);
  if (!HW || HW.edit === undefined) {
    b.appendChild(hmCallout(_T("nothing_found")));
    return;
  }
  var isNew = HW.edit >= HW.slots.length,
    cur = isNew ? { sun: null, offset: 0, time: "12:00", scene: "", off: 10 } : Object.assign({}, HW.slots[HW.edit]),
    ids = HW.groups.map(function (g) {
      return g.id;
    }),
    scenes = hmList("scenes").filter(function (s) {
      return ids.indexOf(s.group_id) >= 0;
    });
  b.appendChild(hmLabel(_T("hmw_starts")));
  b.appendChild(
    hmGroup(
      [["", "hw_at_a_specific_time"], ["sunrise", "hw_sunrise"], ["sunset", "hw_sunset"]].map(function (t) {
        return hmRow({
          title: _T(t[1]),
          check: function () {
            return (cur.sun || "") === t[0];
          },
          tap: function () {
            if (t[0] && !hwHasLocation()) {
              toast(_T("hw_sun_needs_home_location"));
              return;
            }
            cur.sun = t[0] || null;
            refresh();
            hmwShowStart();
          },
        });
      })
    )
  );
  var timeBox = mk("div"),
    sunBox = mk("div");
  b.appendChild(timeBox);
  b.appendChild(sunBox);
  timeBox.appendChild(hmGroup([hwTimeRow(_T("time"), function () { return cur.time; }, function (v) { cur.time = v; })]));
  sunBox.appendChild(hmLabel(_T("hmw_shifted_by")));
  sunBox.appendChild(hmChips(HMW_OFFSETS, function () { return cur.offset; }, function (v) { cur.offset = v; }, function (v) { return v ? (v > 0 ? "+" : "−") + Math.abs(v) : "0"; }));
  function hmwShowStart() {
    timeBox.style.display = cur.sun ? "none" : "";
    sunBox.style.display = cur.sun ? "" : "none";
  }
  hmwShowStart();
  b.appendChild(hmLabel(_T("hm_scene")));
  b.appendChild(
    hmGroup(
      [{ id: "", name: _T("hmw_dont_trigger_lights") }].concat(scenes).map(function (s) {
        return hmRow({
          icon: s.id ? "scene" : "power",
          title: s.name,
          check: function () {
            return cur.scene === s.id;
          },
          tap: function () {
            cur.scene = s.id;
            refresh();
          },
        });
      })
    )
  );
  b.appendChild(hmLabel(_T("hmw_lights_off_after")));
  b.appendChild(hmChips([0, 5, 10, 15, 30, 60], function () { return cur.off; }, function (v) { cur.off = v; }, function (v) { return v ? hwMinutesText(v) : _T("hmw_stay_on"); }));
  var actions = [
    hmButton(_T("hm_done"), "primary", function () {
      if (!cur.sun && !/^\d\d:\d\d$/.test(cur.time)) {
        toast(_T("hm_pick_a_time"));
        return;
      }
      var clash = HW.slots.some(function (s, i) {
        return i !== HW.edit && hmwStartText(s) === hmwStartText(cur);
      });
      if (clash) {
        toast(_T("hm_two_times_cannot_be_the_same"));
        return;
      }
      if (isNew) HW.slots.push(cur);
      else HW.slots[HW.edit] = cur;
      HW.depth--;
      popBack();
    }),
  ];
  if (!isNew && HW.slots.length > 1)
    actions.push(
      hmButton(_T("hm_remove_this_time"), "danger", function () {
        HW.slots.splice(HW.edit, 1);
        HW.depth--;
        popBack();
      })
    );
  b.appendChild(hmActions(actions));
}

/* Writes what the area does to the bridge. At the end of the wizard it goes back to the list of areas; from an area's own page, back to the area. */
function hmwSetLights() {
  var d = HW,
    body = {
      area: d.areaId,
      groups: d.groups.map(function (g) {
        return g.id;
      }),
      slots: d.slots.map(function (s) {
        var slot = s.sun ? { sun: s.sun } : { time: s.time };
        if (s.sun && s.offset) slot.offset_minutes = s.offset;
        if (s.scene) slot.scene = s.scene;
        if (s.scene && s.off) slot.off_after_minutes = s.off;
        return slot;
      }),
    };
  if (d.dark !== null && d.dark !== undefined) body.dark_threshold = d.dark;
  hpCall("hue_plus", "set_motion_area_lights", body).then(
    function () {
      HM_READY = false;
      hwLeave();
      hmEnsure();
    },
    function () {
      toast(_T("hmw_couldn_t_save"));
    }
  );
}

/* ---- an area that exists ---- */

function hmwHealthText(x) {
  return _T("hmw_health_" + (x.health || "unknown"));
}

function hmwService(x) {
  var id = ((x.services || []).filter(function (s) { return s.rtype === "convenience_area_motion"; })[0] || {}).rid;
  return ((HM.motion_areas || {}).services || []).filter(function (s) { return s.id === id; })[0];
}

function hmMotionArea(b, id) {
  hmBox(b);
  hmGuard(hmdKey("marea", id));
  if (HW && HW.kind === "mslots") HW = null;
  HMW_DAY = null;
  var key = hmdKey("marea", id);
  hmLoad(b, ["motion_areas", "automations", "scenes", "rooms", "zones"], function (box) {
    var x = hmMotionArea1(id);
    if (!x) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var name = function () {
        return hmdValue(key, "name", x.name || id);
      },
      enabled = function () {
        return hmdValue(key, "enabled", !!x.enabled);
      },
      svc = hmwService(x),
      level = function () {
        return hmdValue(key, "sensitivity", svc && svc.sensitivity ? svc.sensitivity.sensitivity : 0);
      },
      a = hmwAutomationOf(id);
    box.appendChild(hmTitle("motion", name));
    box.appendChild(
      hmGroup([
        hmRow({
          title: _T("hmw_name"),
          val: name,
          tap: "hue-mname:" + id,
        }),
        hmRow({
          title: _T("hm_enabled"),
          toggle: {
            get: enabled,
            set: function () {
              hmdStage(key, "enabled", !enabled(), !!x.enabled);
              refresh();
            },
          },
        }),
        hmInfo(_T("hm_status"), function () {
          return hmwHealthText(x);
        }),
      ])
    );
    box.appendChild(hmLabel(_T("hmw_what_it_does")));
    box.appendChild(
      hmGroup([
        hmRow({
          icon: "lamp",
          title: _T("hmw_control_lights"),
          sub: a ? cntS(hmwSlotsFrom(a).length, _T("hmw_time_n"), _T("hmw_times_n")) : _T("hmw_nothing_set"),
          tap: "hue-mslots:" + id,
        }),
      ])
    );
    box.appendChild(hmLabel(_T("hmw_general_settings")));
    box.appendChild(
      hmGroup([
        hmRow({
          icon: "motion",
          title: _T("hmw_motion_sensitive_devices"),
          sub: function () {
            return cntS(hmdValue(key, "lights", hmwOwners(x)).length, _T("hm_light"), _T("hm_lights"));
          },
          tap: "hue-mdev:" + id,
        }),
        svc && svc.sensitivity
          ? hmRow({
              icon: "walk",
              title: _T("hmw_motion_sensitivity"),
              val: function () {
                return hmwLevelText(level(), svc.sensitivity.sensitivity_max);
              },
              tap: "hue-msens:" + id,
            })
          : null,
        a
          ? hmRow({
              icon: "bright",
              title: _T("hmw_daylight_settings"),
              val: hmwDaylightOn(hmwSlotsFrom(a)) ? _T("hmw_sunrise_sunset") : _T("hmw_disabled"),
              tap: "hue-mday:" + id,
            })
          : null,
      ])
    );
    box.appendChild(
      hmActions([
        hmButton(_T("hm_delete"), "danger", function () {
          confirmDlg(_T("delete_this_motion_area"), function () {
            hmdDiscard(key);
            call("hue_plus", "delete_motion_area", { area: x.id, confirm: true });
            HM_READY = false;
            closeLayer();
            hmEnsure();
          });
        }),
      ])
    );
  });
}

/* The levels the bridge offers are 0 to its maximum; five of them (the bridge it was tried on) are the app's Very low, Low, Medium, High and Very high. Two or three are low and high (and medium); other counts have no names of their own. */
function hmwLevelText(v, max) {
  if (max === 1) return [_T("hmw_low"), _T("hmw_high")][v];
  if (max === 2) return [_T("hmw_low"), _T("hmw_medium"), _T("hmw_high")][v];
  if (max === 4) return [_T("hmw_very_low"), _T("hmw_low"), _T("hmw_medium"), _T("hmw_high"), _T("hmw_very_high")][v];
  return _T("hmw_level") + " " + v;
}

function hmwRename(b, id) {
  hmBox(b);
  var key = hmdKey("marea", id),
    x = hmMotionArea1(id);
  hmGuard(key, true);
  if (!x) {
    b.appendChild(hmCallout(_T("nothing_found")));
    return;
  }
  var w = mk("div", "sqw pane"),
    inp = mk("input", "sq");
  inp.type = "text";
  inp.maxLength = 32;
  inp.value = hmdValue(key, "name", x.name || "");
  w.appendChild(inp);
  b.appendChild(w);
  b.appendChild(
    hmActions([
      hmButton(_T("hm_done"), "primary", function () {
        var v = inp.value.trim();
        if (!v) {
          toast(_T("hw_give_it_a_name"));
          return;
        }
        hmdStage(key, "name", v, x.name);
        popBack();
      }),
    ])
  );
}

/* The devices of an area: the owners of its participants (the candidates are keyed by the device they belong to). */
function hmwOwners(x) {
  var owner = {};
  ((HM.motion_areas || {}).candidates || []).forEach(function (c) {
    owner[c.id] = (c.owner || {}).rid;
  });
  return (x.participants || []).map(function (p) {
    return owner[p.resource.rid];
  });
}

/* The devices an area can use: those of its room that the bridge offers, plus the ones it already has. */
function hmwEligible(x) {
  var owners = hmwCandidates(),
    room = hmList("rooms").filter(function (g) {
      return g.id === (x.group || {}).rid;
    })[0],
    have = hmwOwners(x),
    names = {};
  hmList("devices").forEach(function (d) {
    names[d.id] = d.name;
  });
  var ids = (room ? room.children.map(function (c) { return c.id; }) : Object.keys(owners)).filter(function (d) {
    return owners[d];
  });
  have.forEach(function (d) {
    if (ids.indexOf(d) < 0) ids.push(d);
  });
  return ids.map(function (d) {
    return { id: d, name: names[d] || d };
  });
}

/* Which devices the area has: three or four, chosen on this page and kept in the area's draft until it is saved. */
function hmwDevices(b, id) {
  hmBox(b);
  var key = hmdKey("marea", id);
  hmGuard(key, true);
  hmLoad(b, ["motion_areas", "devices", "rooms"], function (box) {
    var x = hmMotionArea1(id);
    if (!x) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var actual = hmwOwners(x).slice().sort(),
      chosen = hmdValue(key, "lights", actual).slice();
    hwHint(box, _T("hmw_choose_devices_hint"));
    box.appendChild(
      hmGroup(
        hmwEligible(x).map(function (c) {
          return hmRow({
            icon: "lamp",
            title: c.name,
            check: function () {
              return chosen.indexOf(c.id) >= 0;
            },
            tap: function () {
              var at = chosen.indexOf(c.id);
              if (at >= 0) chosen.splice(at, 1);
              else if (chosen.length >= 4) {
                toast(_T("hmw_three_or_four"));
                return;
              } else chosen.push(c.id);
              refresh();
            },
          });
        })
      )
    );
    box.appendChild(
      hmActions([
        hmButton(_T("hm_done"), "primary", function () {
          if (chosen.length < 3 || chosen.length > 4) {
            toast(_T("hmw_three_or_four"));
            return;
          }
          hmdStage(key, "lights", chosen.slice().sort(), actual);
          popBack();
        }),
      ])
    );
  });
}

function hmwSensitivity(b, id) {
  hmBox(b);
  var key = hmdKey("marea", id);
  hmGuard(key, true);
  hmLoad(b, ["motion_areas"], function (box) {
    var x = hmMotionArea1(id),
      svc = x && hmwService(x);
    if (!svc || !svc.sensitivity) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var max = svc.sensitivity.sensitivity_max || 0,
      levels = [];
    for (var i = 0; i <= max; i++) levels.push(i);
    box.appendChild(
      hmGroup(
        levels.map(function (v) {
          return hmRow({
            title: hmwLevelText(v, max),
            check: function () {
              return hmdValue(key, "sensitivity", svc.sensitivity.sensitivity) === v;
            },
            tap: function () {
              hmdStage(key, "sensitivity", v, svc.sensitivity.sensitivity);
              popBack();
            },
          });
        })
      )
    );
  });
}

/* Whether the area is left dark by day: a time that starts at sunrise and triggers no lights. */
function hmwDaylightOn(slots) {
  return slots.some(function (s) {
    return s.sun === "sunrise" && !s.scene;
  });
}

/* Turns "only when it's dark" on or off in the times of the area. On: the times of the day (between sunrise and sunset) are replaced by one that starts at sunset with the scene the evening had,
   and a time that starts at sunrise and triggers no lights. Off: those two are removed. */
function hmwApplyDaylight(on, startOffset, stopOffset) {
  var timed = HW.slots.filter(function (s) {
    return !s.sun;
  });
  if (!on) {
    if (!timed.length) return false;
    HW.slots = timed;
    return true;
  }
  var sunrise = 360 + stopOffset,
    sunset = 1080 + startOffset,
    day = timed
      .filter(function (s) {
        return hmwOrder(s) > sunrise && hmwOrder(s) < sunset;
      })
      .sort(function (a, b) {
        return hmwOrder(a) - hmwOrder(b);
      }),
    rest = timed.filter(function (s) {
      return day.indexOf(s) < 0;
    }),
    basis = day.length ? day[day.length - 1] : rest.slice().sort(function (a, b) { return hmwOrder(a) - hmwOrder(b); })[0];
  if (!basis || !basis.scene) return false;
  HW.slots = rest.concat([
    { sun: "sunset", offset: startOffset, time: "", scene: basis.scene, off: basis.off },
    { sun: "sunrise", offset: stopOffset, time: "", scene: "", off: 0 },
  ]);
  return true;
}

/* The daylight choice being made, kept while a page that picks minutes is open on top of it; the area's page drops it. */
var HMW_DAY = null;

function hmwDaylight(b, id) {
  hmBox(b);
  hmLoad(b, ["automations", "scenes", "home_and_away"], function (box) {
    var a = hmwAutomationOf(id);
    if (!a) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    if (!HMW_DAY || HMW_DAY.id !== id) {
      var slots = hmwSlotsFrom(a),
        sunsetSlot = slots.filter(function (s) { return s.sun === "sunset"; })[0],
        sunriseSlot = slots.filter(function (s) { return s.sun === "sunrise" && !s.scene; })[0];
      HMW_DAY = { id: id, st: { on: hmwDaylightOn(slots), start: sunsetSlot ? sunsetSlot.offset : 0, stop: sunriseSlot ? sunriseSlot.offset : 0 } };
    }
    var st = HMW_DAY.st;
    hwHint(box, _T("hmw_daylight_hint"));
    box.appendChild(
      hmGroup(
        [[false, "hmw_disabled"], [true, "hmw_sunrise_sunset"]].map(function (t) {
          return hmRow({
            title: _T(t[1]),
            check: function () {
              return st.on === t[0];
            },
            tap: function () {
              if (t[0] && !hwHasLocation()) {
                toast(_T("hw_sun_needs_home_location"));
                return;
              }
              st.on = t[0];
              refresh();
              show();
            },
          });
        })
      )
    );
    var more = mk("div");
    box.appendChild(more);
    function show() {
      more.innerHTML = "";
      if (!st.on) return;
      [["start", "hmw_start_triggering", "sunset"], ["stop", "hmw_stop_triggering", "sunrise"]].forEach(function (t) {
        more.appendChild(hmLabel(_T(t[1])));
        more.appendChild(
          hmGroup([
            hmRow({
              title: _T("hmw_when_x"),
              val: function () {
                return hmwSunText(t[2], st[t[0]]);
              },
              tap: function () {
                hmwPickOffset(st, t[0], t[2]);
              },
            }),
          ])
        );
      });
      refresh();
    }
    show();
    box.appendChild(
      hmActions([
        hmButton(_T("hm_done"), "primary", function () {
          hmwStartSlots(id);
          HW.depth = 1;
          if (!hmwApplyDaylight(st.on, st.start, st.stop)) {
            toast(_T("hmw_add_a_time_with_a_scene"));
            return;
          }
          HW.finish();
        }),
      ])
    );
  });
}

/* The minutes before or after sunrise or sunset, chosen on a page of their own. */
function hmwPickOffset(st, key, sun) {
  hwBegin({ kind: "pick-holder", steps: [], depth: 0 });
  hwChoose({
    options: HMW_OFFSETS.map(function (v) {
      return { value: v, title: hmwSunText(sun, v) };
    }),
    get: function () {
      return st[key];
    },
    set: function (v) {
      st[key] = v;
    },
  });
}

HP_PAGES["hue-mw-intro"] = ["hmw_create_a_motionaware_area", "motion", hmwInfo("hue-mw-intro", "hmw_create_a_motionaware_area", ["hmw_intro_1", "hmw_intro_2"], "hmw_create_area")];
HP_PAGES["hue-mw-tip1"] = ["hmw_before_you_choose_devices", "motion", hmwInfo("hue-mw-tip1", "hmw_before_you_choose_devices", ["hmw_tip1_1"])];
HP_PAGES["hue-mw-tip2"] = ["hmw_before_you_choose_devices", "motion", hmwInfo("hue-mw-tip2", "hmw_before_you_choose_devices", ["hmw_tip2_1", "hmw_tip2_2"])];
HP_PAGES["hue-mw-tip3"] = ["hmw_before_you_choose_devices", "motion", hmwInfo("hue-mw-tip3", "hmw_before_you_choose_devices", ["hmw_tip3_1", "hmw_tip3_2"])];
HP_PAGES["hue-mw-where"] = ["hmw_create_a_motionaware_area", "motion", hmwWherePage];
HP_PAGES["hue-mw-devices"] = ["hmw_choose_devices", "motion", hmwDevicesPage];
HP_PAGES["hue-mw-leave"] = ["hmw_leave_the_area", "motion", hmwInfo("hue-mw-leave", "hmw_leave_the_area", ["hmw_leave_hint"], null, hmwStartCalibration)];
HP_PAGES["hue-mw-calibrating"] = ["hmw_calibrating_area", "motion", hmwCalibratingPage];
HP_PAGES["hue-mw-created"] = ["hmw_area_created", "motion", hmwInfo("hue-mw-created", "hmw_area_created", ["hmw_area_created_sub"])];
HP_PAGES["hue-mw-choice"] = ["hmw_what_should_your_area_do", "motion", hmwChoicePage];
HP_PAGES["hue-mw-groups"] = ["hmw_which_lights", "lamp", hmwGroupsPage];
HP_PAGES["hue-mw-done"] = ["hmw_success", "check", hmwDonePage];
HP_PAGES["hue-mslots"] = ["hmw_control_lights", "clock", hmwSlotsPage];
HP_PAGES["hue-mslot"] = ["hm_time", "clock", hmwSlotPage];
HP_PAGES["hue-mname"] = ["hmw_name", "edit", hmwRename];
HP_PAGES["hue-mdev"] = ["hmw_motion_sensitive_devices", "motion", hmwDevices];
HP_PAGES["hue-msens"] = ["hmw_motion_sensitivity", "walk", hmwSensitivity];
HP_PAGES["hue-mday"] = ["hmw_daylight_settings", "bright", hmwDaylight];
HP_PAGES["hue-marea"] = ["motion_area", "motion", hmMotionArea];

/* Rooms and zones, and the settings of the bridge itself that the Hue app lets you change: a room holds devices (a device is in one room), a zone holds lights (a light can be in several);
 the bridge's name and its Zigbee channel. The pages use the same pieces as the other wizards (huewizard.js). */

/* The devices a room can hold: every device of the bridge except the bridge itself. A zone can hold any light. */
function hrwMembers(type) {
  if (type === "zone")
    return hueplus.lights(H()).map(function (id) {
      return { id: A(id).hue_light_id, name: hpName(id) };
    });
  return hmList("devices")
    .filter(function (d) {
      return (d.services || []).indexOf("bridge") < 0;
    })
    .map(function (d) {
      return { id: d.id, name: d.name };
    });
}

function hrwStart(type, g) {
  var members = {};
  if (g)
    g.children.forEach(function (c) {
      members[c.id] = true;
    });
  hwBegin({ kind: "group", type: type, id: g ? g.id : null, name: g ? g.name : "", members: members, icon: type === "zone" ? "target" : "home" });
  HW.depth = 1;
  showPopup("hue-group", true);
}

function hrwList(b) {
  hmBox(b);
  hmLoad(b, ["rooms", "zones"], function (box, r) {
    var groups = hwGroups(r);
    [["room", "hn_rooms", "home", "hrw_create_a_room"], ["zone", "hn_zones", "target", "hrw_create_a_zone"]].forEach(function (t) {
      var list = groups.filter(function (g) {
        return g.type === t[0];
      });
      box.appendChild(hmLabel(_T(t[1])));
      box.appendChild(
        hmGroup(
          list
            .map(function (g) {
              return hmRow({
                icon: t[2],
                title: g.name,
                sub: cntS(g.lights.length, _T("hm_light"), _T("hm_lights")),
                tap: function () {
                  hrwStart(t[0], g);
                },
              });
            })
            .concat([
              hmRow({
                icon: "plus",
                title: _T(t[3]),
                tap: function () {
                  hrwStart(t[0], null);
                },
              }),
            ])
        )
      );
    });
  });
}

function hrwEditor(b) {
  if (!hwOpen(b) || HW.kind !== "group") return;
  var zone = HW.type === "zone";
  hmLoad(b, ["rooms", "zones", "devices"], function (box) {
    box.appendChild(
      hmTitle(HW.icon, function () {
        return HW.name || _T(zone ? "hrw_new_zone" : "hrw_new_room");
      })
    );
    box.appendChild(
      hmGroup([
        hmRow({
          title: _T("hw_name"),
          val: function () {
            return HW.name;
          },
          tap: "hue-gname",
        }),
      ])
    );
    box.appendChild(hmLabel(_T(zone ? "hrw_lights" : "hrw_devices")));
    var members = hrwMembers(HW.type);
    if (!members.length) box.appendChild(hmCallout(_T("nothing_found")));
    box.appendChild(
      hmGroup(
        members.map(function (m) {
          return hmRow({
            icon: zone ? "lamp" : "cog",
            title: m.name,
            check: function () {
              return !!HW.members[m.id];
            },
            tap: function () {
              HW.members[m.id] = !HW.members[m.id];
              refresh();
            },
          });
        })
      )
    );
    var actions = [hmButton(_T("hw_save"), "primary", hrwSave)];
    if (HW.id)
      actions.push(
        hmButton(_T("hm_delete"), "danger", function () {
          confirmDlg(_T(zone ? "hrw_delete_this_zone" : "hrw_delete_this_room"), function () {
            var d = HW,
              body = { confirm: true };
            body[d.type] = d.id;
            hpCall("hue_plus", "delete_" + d.type, body).then(
              function () {
                HM_READY = false;
                hwLeave();
                hmEnsure();
              },
              function () {
                toast(_T("hrw_couldn_t_save"));
              }
            );
          });
        })
      );
    box.appendChild(hmActions(actions));
  });
}

function hrwSave() {
  var d = HW,
    chosen = Object.keys(d.members).filter(function (k) {
      return d.members[k];
    });
  if (!d.name.trim()) {
    toast(_T("hw_give_it_a_name"));
    return;
  }
  var body = { name: d.name.trim(), members: chosen };
  if (d.id) body[d.type] = d.id;
  hpCall("hue_plus", (d.id ? "update_" : "create_") + d.type, body).then(
    function () {
      HM_READY = false;
      hwLeave();
      hmEnsure();
    },
    function () {
      toast(_T("hrw_couldn_t_save"));
    }
  );
}

/* A name on its own page: for a room or zone it is kept in the wizard state, for the bridge it is sent when Done is pressed. */
function hrwNamePage(b) {
  if (!hwOpen(b) || HW.kind !== "group") return;
  var w = mk("div", "sqw pane"),
    inp = mk("input", "sq");
  inp.type = "text";
  inp.maxLength = 32;
  inp.value = HW.name;
  w.appendChild(inp);
  b.appendChild(w);
  b.appendChild(
    hmActions([
      hmButton(_T("hm_done"), "primary", function () {
        var v = inp.value.trim();
        if (!v) {
          toast(_T("hw_give_it_a_name"));
          return;
        }
        HW.name = v;
        popBack();
      }),
    ])
  );
  setTimeout(function () {
    inp.focus();
  }, 150);
}

/* ---- the bridge: its name and Zigbee channel ---- */

function hrwBridgeName(b) {
  hmBox(b);
  var w = mk("div", "sqw pane"),
    inp = mk("input", "sq");
  inp.type = "text";
  inp.maxLength = 32;
  inp.value = (HM.bridge && HM.bridge.name) || "";
  w.appendChild(inp);
  b.appendChild(w);
  b.appendChild(
    hmActions([
      hmButton(_T("hm_done"), "primary", function () {
        var v = inp.value.trim();
        if (!v) {
          toast(_T("hw_give_it_a_name"));
          return;
        }
        hpCall("hue_plus", "configure_bridge", { name: v }).then(
          function () {
            if (HM.bridge) HM.bridge.name = v;
            popBack();
          },
          function () {
            toast(_T("hrw_couldn_t_save"));
          }
        );
      }),
    ])
  );
  setTimeout(function () {
    inp.focus();
  }, 150);
}

/* The channels the bridge accepts; 11, 15, 20 and 25 are the ones that keep clear of Wi-Fi. */
var HRW_CHANNELS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
var HRW_CLEAR = [11, 15, 20, 25];

function hrwZigbeeChannel(b) {
  hmBox(b);
  hmEnsure();
  var E = hpBridgeEnts(),
    cur = function () {
      return E.zigbee_channel ? Number(V_(E.zigbee_channel)) : 0;
    };
  hwHint(b, _T("hrw_zigbee_hint"));
  b.appendChild(
    hmGroup(
      HRW_CHANNELS.map(function (c) {
        return hmRow({
          title: String(c),
          sub: HRW_CLEAR.indexOf(c) >= 0 ? _T("hrw_keeps_clear_of_wifi") : "",
          check: function () {
            return cur() === c;
          },
          tap: function () {
            if (cur() === c) return;
            confirmDlg(_T("hrw_change_the_zigbee_channel"), function () {
              hpCall("hue_plus", "set_zigbee_channel", { channel: c, confirm: true }).then(
                function () {
                  popBack();
                },
                function () {
                  toast(_T("hrw_couldn_t_save"));
                }
              );
            });
          },
        });
      })
    )
  );
}

/* The bridge's home location, from Home Assistant's own, after asking: the bridge needs it for sunrise and sunset and for the automations that depend on where home is. */
function hrwSetHomeLocation() {
  var c = H().config || {};
  if (typeof c.latitude !== "number" || typeof c.longitude !== "number") {
    toast(_T("hrw_no_home_location_in_home_assistant"));
    return;
  }
  confirmDlg(_T("hrw_set_the_home_location"), function () {
    hpCall("hue_plus", "set_home_location", { latitude: c.latitude, longitude: c.longitude }).then(
      function () {
        toast(_T("hrw_home_location_set"));
        hueplus.resources(["home_and_away"]).then(function (r) {
          HM.home_and_away = r.home_and_away;
          refresh();
        });
      },
      function () {
        toast(_T("hrw_couldn_t_save"));
      }
    );
  });
}

HP_PAGES["hue-groups"] = ["hrw_rooms_and_zones", "home", hrwList];
HP_PAGES["hue-group"] = ["hrw_rooms_and_zones", "home", hrwEditor];
HP_PAGES["hue-gname"] = ["hw_name", "edit", hrwNamePage];
HP_PAGES["hue-bname"] = ["hw_name", "edit", hrwBridgeName];
HP_PAGES["hue-zch"] = ["zigbee_channel", "plug", hrwZigbeeChannel];

/* ---- Hue Spotify sync (the sync module of the Philips Hue Plus integration) ---- */

var HUESYNC = {
 /* What each of its entities is for. The registry's unique_id of an entity is "<bridge>_sync_<key>". */
 keys:["sync","now_playing","brightness","light_delay","intensity","palette","style","area"],
 keyOf:function(h,id){
  var e=h.entities[id];
  if(!e||e.platform!=="hue_plus"||!e.unique_id)return null;
  return HUESYNC.keys.filter(function(k){var tail="_sync_"+k;return e.unique_id.length>tail.length&&e.unique_id.slice(-tail.length)===tail})[0]||null;
 },
 /* The entities of the bridge that owns entity `id`, as {sync, now_playing, brightness, light_delay, intensity, palette, style, area}
  (a key is missing when that entity is disabled), or null when `id` is not a sync entity. */
 entities:function(h,id){
  var key=HUESYNC.keyOf(h,id);
  if(!key)return null;
  var uid=h.entities[id].unique_id,bridge=uid.slice(0,uid.length-key.length-6),out={};
  Object.keys(h.entities).forEach(function(k){
   var e=h.entities[k],kk=e.platform==="hue_plus"&&e.unique_id&&e.unique_id.indexOf(bridge+"_sync_")===0?HUESYNC.keyOf(h,k):null;
   if(kk&&e.unique_id===bridge+"_sync_"+kk)out[kk]=k;
  });
  return out.sync?out:null;
 },
 isSync:function(h,id){return HUESYNC.keyOf(h,id)==="sync"}
};

/* ---- Hue Play HDMI Sync Box (an entry of the Philips Hue Plus integration) ---- */

var HUESYNCBOX = {
 /* What each of its entities is for. The registry's unique_id of an entity is "<box>_syncbox_<key>". */
 keys:["sync","mode","source","intensity","brightness","hdmi_signal"],
 keyOf:function(h,id){
  var e=h.entities[id];
  if(!e||e.platform!=="hue_plus"||!e.unique_id)return null;
  var at=e.unique_id.indexOf("_syncbox_");
  if(at<0)return null;
  var key=e.unique_id.slice(at+9);
  return HUESYNCBOX.keys.indexOf(key)>=0?key:null;
 },
 /* The entities of the box that owns entity `id`, as {sync, mode, source, intensity, brightness, hdmi_signal}, or null when `id` is not
  an entity of a sync box (or the box has no sync switch). */
 entities:function(h,id){
  var key=HUESYNCBOX.keyOf(h,id);
  if(!key)return null;
  var uid=h.entities[id].unique_id,box=uid.slice(0,uid.indexOf("_syncbox_")),out={};
  Object.keys(h.entities).forEach(function(k){
   var e=h.entities[k],kk=e.platform==="hue_plus"&&e.unique_id&&e.unique_id.indexOf(box+"_syncbox_")===0?HUESYNCBOX.keyOf(h,k):null;
   if(kk&&e.unique_id===box+"_syncbox_"+kk)out[kk]=k;
  });
  return out.sync?out:null;
 },
 isBox:function(h,id){return HUESYNCBOX.keyOf(h,id)==="sync"}
};

/* Spotify sync (the sync module of the Philips Hue Plus integration, Hue's music sync): its row, which looks like a light, its popup, laid out like the Hue app's Sync tab (what plays, four settings, the area and the button that starts and stops the sync), and which lights it plays on. A setting opens a popup over the main one, as the effect settings do over the lights popup, so that popup stays as it is underneath. */

var HS_STYLE_ICON = { Classic: "eq", Pulse: "pulsebars" };
var HS_WAVE = { auto: "sparkle", subtle: "wave1", moderate: "wave2", high: "wave3", extreme: "wave4" };

/* The popups opened over the main one: key -> [title string, icon, builder]. */
var HS_PICK = {
  "hsync-style": ["style", "eq", hsStylePopup],
  "hsync-intensity": ["intensity", "wave3", hsIntensityPopup],
  "hsync-colour": ["colour", "palette", hsColourPopup],
  "hsync-area": ["area", "lights", hsAreaPopup],
  "hsync-delay": ["light_delay", "clock", hsDelayPopup],
};

function hsKnown(id) {
  var v = V_(id);
  return v !== "unknown" && v !== "unavailable" && v !== "";
}

function hsNumber(id) {
  return hsKnown(id) && !isNaN(Number(V_(id))) ? Number(V_(id)) : null;
}

/* The colours of a palette as a CSS gradient, or "" for a palette without colours (Auto). */
function hsGradient(rgbs) {
  return rgbs && rgbs.length
    ? "linear-gradient(90deg," +
        rgbs
          .map(function (c) {
            return "rgb(" + c.join(",") + ")";
          })
          .join(",") +
        ")"
    : "";
}

function hsPick(E, key, option) {
  call("select", "select_option", { entity_id: E[key], option: option });
  closeLayer();
}

function hsOpenLayer(key, id) {
  showPopup(key + ":" + id, false, true);
}

/* A control that is not a button element: it answers Enter and Space as a click does. */
function hsPress(el, fn) {
  el.tabIndex = 0;
  el.addEventListener("click", fn);
  el.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  });
}

/* ---- the row, and the lights it plays on ---- */

/* The Spotify sync as a row of the Lights section: it looks and works like a light. The bar is the brightness, the icon starts and stops the sync (while it runs the icon shows the stop button, as while an effect plays), a tap or a press and hold opens the popup. */
function hsyncRow(d) {
  var id = d.id,
    E = HUESYNC.entities(H(), id),
    pk = "hsync:" + id,
    icon = d.icon || "syncring";
  if (!E)
    return pill(icon, d.name, {
      tap: function () {
        showPopup(pk, true);
      },
    });
  var r = mk("div", "pill pane slide");
  r.innerHTML =
    "<div class='fill'></div>" +
    ic(icon) +
    "<span class='tx'><span class='nm'></span><span class='sb'></span></span><span class='vl'></span>";
  r.dataset.pin = JSON.stringify(pinPop(pk, id, d.name, icon));
  r.querySelector(".nm").textContent = d.name;
  var fill = r.querySelector(".fill"),
    vl = r.querySelector(".vl"),
    sb = r.querySelector(".sb"),
    drag = false,
    was = null,
    liveT = 0,
    liveAt = 0;
  function pct() {
    return isOn(id) ? hsNumber(E.brightness) || 0 : 0;
  }
  /* While dragging the brightness follows: at most one command every 150 ms, and the last position always arrives. */
  function sendLive(p) {
    var wait = liveAt + 150 - Date.now();
    clearTimeout(liveT);
    function go() {
      liveAt = Date.now();
      callLive("hs-bri", "number", "set_value", { entity_id: E.brightness, value: p });
    }
    if (wait <= 0) go();
    else liveT = setTimeout(go, wait);
  }
  attachSlide(r, {
    onMove: function (f) {
      drag = true;
      var p = Math.max(1, Math.round(f * 100));
      fill.style.width = p + "%";
      vl.textContent = p + "%";
      inkRow(r, r._ink, p);
      sendLive(p);
    },
    onCommit: function (f) {
      var p = Math.max(1, Math.round(f * 100));
      clearTimeout(liveT);
      call("number", "set_value", { entity_id: E.brightness, value: p });
      if (!isOn(id)) call("switch", "turn_on", { entity_id: id });
      setTimeout(function () {
        drag = false;
      }, 800);
    },
    onCancel: function () {
      drag = false;
    },
    onHold: function () {
      showPopup(pk, true);
    },
    onTap: function (t) {
      drag = false;
      if (t && t.closest(".ic")) call("switch", isOn(id) ? "turn_off" : "turn_on", { entity_id: id });
      else showPopup(pk, true);
    },
  });
  r.refresh = function () {
    var on = isOn(id),
      i = r.querySelector(".ic"),
      cc = on && pageFill();
    i.classList.toggle("fx", on);
    if (on && !i.querySelector(".ic-stop")) i.appendChild(mk("span", "ic-stop", "<i></i>"));
    r.classList.toggle("on", on);
    if (was !== null && on !== was) pop(r);
    was = on;
    r._ink = on ? cssToRgb(pageFill()) : null;
    sb.textContent = on && hsKnown(E.now_playing) ? V_(E.now_playing) : "";
    if (cc) {
      fill.style.background =
        "linear-gradient(180deg,color-mix(in srgb," + cc + " 88%,transparent),color-mix(in srgb," + cc + " 64%,transparent))";
      fill.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,.35)";
    } else {
      fill.style.background = "";
      fill.style.boxShadow = "";
    }
    if (drag) return;
    fill.style.width = pct() + "%";
    vl.textContent = on ? pct() + "%" : V_(id) === "unavailable" ? _T("unavailable") : _T("off");
    inkRow(r, r._ink, pct());
  };
  reg(r.refresh);
  return r;
}

/* The Hue ids of the lights each running Spotify sync plays on (the lights of its area): [{sw, rids}]. Every light row asks, so it is rebuilt at most every 400 ms. */
var HS_RUN = { at: 0, list: [] };

function hsRunning() {
  var now = Date.now();
  if (now - HS_RUN.at < 400) return HS_RUN.list;
  HS_RUN.at = now;
  HS_RUN.list = [];
  var h = H();
  Object.keys(h.entities || {}).forEach(function (k) {
    if (!HUESYNC.isSync(h, k) || !isOn(k)) return;
    var E = HUESYNC.entities(h, k);
    HS_RUN.list.push({ sw: k, rids: (E && E.area && A(E.area).light_ids) || [] });
  });
  return HS_RUN.list;
}

/* The id Hue knows a light by: a Hue light's own id, or the one a light made of zones (Hue gradient zones) is built on. */
function hsLightRid(id) {
  var e = (H().entities || {})[id];
  return A(id).hue_light_id || (e && e.platform === "hue" && dom(id) === "light" ? e.unique_id : null);
}

/* The Spotify sync switch that plays on light `id` (the light itself, or any member of a group), or "". */
function lightSyncPlays(id, seen) {
  var run = hsRunning();
  if (!run.length) return "";
  var rid = hsLightRid(id),
    hit = rid
      ? run.filter(function (x) {
          return x.rids.indexOf(rid) >= 0;
        })[0]
      : null;
  if (hit) return hit.sw;
  seen = seen || {};
  seen[id] = 1;
  var found = "";
  lightMembers(id).forEach(function (m) {
    if (!found && !seen[m]) found = lightSyncPlays(m, seen);
  });
  return found;
}

/* The brightness the Spotify sync `sw` plays at, for a light row that shows it. */
function hsyncPct(sw) {
  var E = HUESYNC.entities(H(), sw);
  return (E && hsNumber(E.brightness)) || 0;
}

/* ---- the popup ---- */

/* The cover comes from Spotify's own image servers; anything else is not shown. */
var HS_ART_OK = /^https:\/\/[a-z0-9.-]+\.scdn\.co\//;

function hsArt(box, url) {
  var want = url && HS_ART_OK.test(url) ? url : "";
  if (box.dataset.art === want) return;
  box.dataset.art = want;
  var img = box.querySelector("img");
  if (img) img.remove();
  box.classList.toggle("has-art", !!want);
  if (!want) return;
  img = mk("img");
  img.alt = "";
  img.referrerPolicy = "no-referrer";
  img.addEventListener("error", function () {
    img.remove();
    box.classList.remove("has-art");
  });
  img.src = want;
  box.appendChild(img);
}

function hsNow(E) {
  var box = mk("div", "hs-now"),
    art = mk("div", "hs-art", svg("note")),
    st = mk("div", "hs-st"),
    tt = mk("div", "hs-tt"),
    sub = mk("div", "hs-sub");
  [art, st, tt, sub].forEach(function (el) {
    box.appendChild(el);
  });
  reg(function () {
    var a = A(E.now_playing),
      has = hsKnown(E.now_playing);
    st.textContent =
      V_(E.sync) === "unavailable"
        ? _T("unavailable")
        : !has
          ? _T("nothing_playing")
          : a.is_playing === true
            ? _T("playing")
            : a.is_playing === false
              ? _T("paused")
              : "";
    tt.textContent = has ? V_(E.now_playing) : "";
    sub.textContent = has
      ? [(a.artists || []).join(", "), a.album].filter(Boolean).join(" • ")
      : "";
    tt.style.display = sub.style.display = has ? "" : "none";
    hsArt(art, has ? a.album_art_url : "");
  });
  return box;
}

/* One of the settings: a caption over a round-ended button that opens its popup. `paint(button, icon)` fills it and returns what it shows in words, for screen readers. */
function hsTile(caption, key, id, paint) {
  var col = mk("div", "hs-col"),
    t = mk("div", "hs-tile", "<span class='hs-i'></span>"),
    i = t.querySelector(".hs-i");
  col.appendChild(mk("div", "hs-cap")).textContent = caption;
  t.setAttribute("role", "button");
  hsPress(t, function () {
    hsOpenLayer(key, id);
  });
  reg(function () {
    var words = paint(t, i);
    t.setAttribute("aria-label", caption + ": " + words);
    t.title = words;
  });
  col.appendChild(t);
  return col;
}

/* Style, intensity and colour open a popup each; brightness is the button of the light popup, with its slider that rises from it. `root` is dimmed while that slider is open. */
function hsSettings(id, E, root) {
  var g = mk("div", "hs-set");
  g.appendChild(
    hsTile(_T("style"), "hsync-style", id, function (t, i) {
      var s = V_(E.style);
      i.innerHTML = svg(HS_STYLE_ICON[s] || "eq");
      return hsKnown(E.style) ? s : "–";
    })
  );
  g.appendChild(
    hsTile(_T("intensity"), "hsync-intensity", id, function (t, i) {
      var s = V_(E.intensity);
      i.innerHTML = svg(HS_WAVE[s] || "wave3");
      return hsKnown(E.intensity) ? cap(s) : "–";
    })
  );
  g.appendChild(
    hsTile(_T("colour"), "hsync-colour", id, function (t, i) {
      var s = V_(E.palette),
        grad = hsGradient((A(E.palette).colors || {})[s] || []);
      t.style.background = grad;
      t.classList.toggle("hs-grad", !!grad);
      i.innerHTML = grad ? "" : svg("sparkle");
      return hsKnown(E.palette) ? cap(s) : "–";
    })
  );
  var col = mk("div", "hs-col");
  col.appendChild(mk("div", "hs-cap")).textContent = _T("brightness");
  col.appendChild(
    briControl({
      pct: function () {
        return hsNumber(E.brightness) || 0;
      },
      lit: function () {
        return isOn(E.sync);
      },
      live: function (v) {
        callLive("hs-bri", "number", "set_value", { entity_id: E.brightness, value: Math.max(1, v) });
      },
      commit: function (v) {
        call("number", "set_value", { entity_id: E.brightness, value: Math.max(1, v) });
      },
      stage: function () {
        return root;
      },
    })
  );
  g.appendChild(col);
  return g;
}

/* The bar at the bottom, as in the Hue app: where the music plays, the button that starts and stops the sync, and the area. */
function hsBar(id, E) {
  var bar = mk("div", "hs-bar pane"),
    left = mk("div", "hs-side"),
    right = mk("div", "hs-side hs-btn"),
    go = mk("div", "hs-go", svg("syncring")),
    dev = mk("div", "hs-nm"),
    area = mk("div", "hs-nm");
  left.innerHTML = ic("speaker");
  left.appendChild(mk("div", "hs-cap")).textContent = _T("playing_on");
  left.appendChild(dev);
  right.innerHTML = ic("lights");
  right.appendChild(mk("div", "hs-cap")).textContent = _T("area");
  right.appendChild(area);
  right.setAttribute("role", "button");
  hsPress(right, function () {
    hsOpenLayer("hsync-area", id);
  });
  go.setAttribute("role", "switch");
  go.setAttribute("aria-label", _T("spotify_sync"));
  hsPress(go, function () {
    call("switch", isOn(E.sync) ? "turn_off" : "turn_on", { entity_id: E.sync });
  });
  var was = null;
  reg(function () {
    var on = isOn(E.sync);
    go.classList.toggle("on", on);
    go.setAttribute("aria-checked", on ? "true" : "false");
    if (was !== null && on !== was) pop(go);
    was = on;
    dev.textContent = A(E.now_playing).playback_device || "–";
    area.textContent = hsKnown(E.area) ? V_(E.area) : "–";
  });
  bar.appendChild(left);
  bar.appendChild(go);
  bar.appendChild(right);
  return bar;
}

function hsyncPopup(b, id) {
  var E = HUESYNC.entities(H(), id);
  if (!E) {
    b.appendChild(pill("info", _T("nothing_found"), {}));
    return;
  }
  var root = mk("div", "hs");
  b.appendChild(root);
  root.appendChild(hsNow(E));
  root.appendChild(hsSettings(id, E, root));
  root.appendChild(hsBar(id, E));
  if (E.light_delay)
    root.appendChild(
      pill("clock", _T("light_delay"), {
        val: function () {
          var n = hsNumber(E.light_delay);
          return n === null ? "–" : n + " s";
        },
        tap: function () {
          hsOpenLayer("hsync-delay", id);
        },
      })
    );
  reg(function () {
    root.classList.toggle("hs-off", V_(E.sync) === "unavailable");
  });
}

/* ---- the popups over the main one ---- */

function hsEnts(id) {
  return HUESYNC.entities(H(), id) || {};
}

function hsStylePopup(b, id) {
  var E = hsEnts(id),
    g = mk("div", "gridl g2 lp-modes"),
    tiles = {};
  (A(E.style).options || []).forEach(function (name) {
    var el = mk("div", "lp-mode hs-m", svg(HS_STYLE_ICON[name] || "eq"));
    el.appendChild(mk("div", "lp-mode-n")).textContent = name;
    el.setAttribute("role", "button");
    hsPress(el, function () {
      hsPick(E, "style", name);
    });
    tiles[name] = el;
    g.appendChild(el);
  });
  b.appendChild(g);
  reg(function () {
    Object.keys(tiles).forEach(function (name) {
      tiles[name].classList.toggle("picked", V_(E.style) === name);
    });
  });
}

/* One row for each option of a select entity, the chosen one checked; choosing sends it and closes this popup. */
function hsChoice(b, id, key, icon, label) {
  var E = hsEnts(id);
  (A(E[key]).options || []).forEach(function (name) {
    var row = pill(icon(name), label(name), {
      check: function () {
        return V_(E[key]) === name;
      },
      tap: function () {
        hsPick(E, key, name);
      },
    });
    b.appendChild(row);
    var grad = key === "palette" ? hsGradient((A(E.palette).colors || {})[name] || []) : "";
    if (grad) {
      var sw = mk("span", "hs-sw");
      sw.style.background = grad;
      row.insertBefore(sw, row.querySelector(".ck"));
    }
  });
}

function hsIntensityPopup(b, id) {
  hsChoice(
    b,
    id,
    "intensity",
    function (n) {
      return HS_WAVE[n] || "wave3";
    },
    cap
  );
}

function hsColourPopup(b, id) {
  hsChoice(
    b,
    id,
    "palette",
    function (n) {
      return n === "auto" ? "sparkle" : "palette";
    },
    cap
  );
}

function hsAreaPopup(b, id) {
  hsChoice(
    b,
    id,
    "area",
    function () {
      return "lights";
    },
    function (n) {
      return n;
    }
  );
}

function hsDelayPopup(b, id) {
  var E = hsEnts(id);
  b.appendChild(
    sliderRow({
      icon: "clock",
      name: _T("light_delay"),
      min: 0,
      max: 10,
      step: 1,
      off: "–",
      get: function () {
        return hsNumber(E.light_delay);
      },
      fmt: function (v) {
        return v + " s";
      },
      on: function () {
        return true;
      },
      commit: function (v) {
        call("number", "set_value", { entity_id: E.light_delay, value: v });
      },
    })
  );
}

/* Hue Play HDMI Sync Box (an entry of the Philips Hue Plus integration): its row, which looks like a light, and its popup. Built from the shared controls only. */

/* The brightness of the box runs from 0 to 200, where 100 is the normal brightness of the lights. */
var HB_MAX = 200;

function hbNumber(id) {
  var v = V_(id);
  return v !== "unknown" && v !== "unavailable" && v !== "" && !isNaN(Number(v)) ? Number(v) : null;
}

function hbBrightness(E, name, icon, onTap) {
  return sliderRow({
    onTap: onTap,
    name: name,
    icon: icon,
    min: 0,
    max: HB_MAX,
    step: 1,
    fmt: function (v) {
      return v + "%";
    },
    get: function () {
      return hbNumber(E.brightness);
    },
    on: function () {
      return isOn(E.sync);
    },
    live: function (v) {
      callLive("hb-bri", "number", "set_value", { entity_id: E.brightness, value: v });
    },
    commit: function (v) {
      call("number", "set_value", { entity_id: E.brightness, value: v });
    },
  });
}

/* The box as a row of the Lights section. The bar is the brightness, the icon starts and stops the sync, the rest of the row opens the popup. */
function hsboxRow(d) {
  var id = d.id,
    E = HUESYNCBOX.entities(H(), id),
    pk = "hsbox:" + id,
    icon = d.icon || "syncring";
  if (!E)
    return pill(icon, d.name, {
      tap: function () {
        showPopup(pk, true);
      },
    });
  var r = hbBrightness(E, d.name, icon, function (t) {
    if (t && t.closest && t.closest(".ic")) toggleEnt(id);
    else showPopup(pk, true);
  });
  r.dataset.pin = JSON.stringify(pinPop(pk, id, d.name, icon));
  return r;
}

function hsboxSelect(E, key, label, icon) {
  var t = dropRow(
    label,
    function () {
      return A(E[key]).options || [];
    },
    function () {
      return V_(E[key]);
    },
    function (v) {
      call("select", "select_option", { entity_id: E[key], option: v });
    },
    icon
  );
  return t;
}

/* The brightness of the box in the popup: the button of the light popup with the slider that rises from it, as on the Spotify sync. The slider is in percent of the box's range (0 to 200, where the middle is the normal brightness of the lights), and the number it shows is the box's own. */
function hbBrightnessButton(E, root) {
  var g = mk("div", "hs-set one"),
    col = mk("div", "hs-col");
  function toBox(v) {
    return Math.round((v * HB_MAX) / 100);
  }
  col.appendChild(mk("div", "hs-cap")).textContent = _T("brightness");
  col.appendChild(
    briControl({
      pct: function () {
        return Math.round(((hbNumber(E.brightness) || 0) * 100) / HB_MAX);
      },
      lit: function () {
        return isOn(E.sync);
      },
      fmt: function (v) {
        return toBox(v) + "%";
      },
      live: function (v) {
        callLive("hb-bri", "number", "set_value", { entity_id: E.brightness, value: toBox(v) });
      },
      commit: function (v) {
        call("number", "set_value", { entity_id: E.brightness, value: toBox(v) });
      },
      stage: function () {
        return root;
      },
    })
  );
  g.appendChild(col);
  return g;
}

function hsboxPopup(b, id) {
  var E = HUESYNCBOX.entities(H(), id);
  if (!E) {
    b.appendChild(pill("info", _T("nothing_found"), {}));
    return;
  }
  /* `hs` is what dims the rest of the popup while the brightness slider is open. */
  var root = mk("div", "hs");
  b.appendChild(root);
  root.appendChild(switchPill("syncring", _T("sync"), E.sync));
  root.appendChild(hsboxSelect(E, "mode", _T("mode"), "tv"));
  root.appendChild(hsboxSelect(E, "source", _T("hdmi_input"), "plug"));
  /* The box keeps an intensity for video, game and music only, so there is nothing to choose in the other modes. */
  var intensity = hsboxSelect(E, "intensity", _T("intensity"), "wave3");
  root.appendChild(intensity);
  reg(function () {
    intensity.style.display = V_(E.intensity) === "unavailable" ? "none" : "";
  });
  root.appendChild(hbBrightnessButton(E, root));
  root.appendChild(
    pill("tv", _T("hdmi_signal"), {
      val: function () {
        return isOn(E.hdmi_signal) ? _T("on_2") : _T("off");
      },
    })
  );
}

/* Hue scenes (the scene entities of the Hue integration and of Hue Plus): playing one live at a speed, freezing it, its popup, reading its colours from the bridge to
 import it as a live scene, and the room's scenes in the light panel. A scene kind and a scene import source registered with the dashboard (see epilogue.js). */

var HUESCENES = {
 /* Philips Hue: a scene entity says nothing about being on, but the room has a "Scene" select entity (same device) whose state is the name of the scene that is on. */
 /* Hue Plus runs the Hue integration's scenes itself (platform hue_plus), with the same attributes, and its own activate_scene service. */
 isHue:function(h,id){var e=h.entities[id];return id.indexOf("scene.")===0&&!!e&&(e.platform==="hue"||e.platform==="hue_plus")},
 /* The light that stands for the whole room of a Hue scene: the Hue group light on the same device. Its "dynamics" attribute says whether a live scene is playing. */
 group:function(h,id){
  var e=h.entities[id];
  if(!e||!e.device_id)return null;
  return Object.keys(h.states).filter(function(k){var x=h.entities[k];return k.indexOf("light.")===0&&x&&x.device_id===e.device_id&&h.states[k].attributes.is_hue_group})[0]||null;
 },
 /* The service call that starts a scene live, at a speed (0 to 100) and brightness (1 to 255). It is the only way to change a scene's speed; dynamic:false does not stop a live scene. */
 start:function(h,id,speed,brightness){
  return[h.entities[id].platform==="hue_plus"?"hue_plus":"hue","activate_scene",{entity_id:id,dynamic:true,speed:Math.max(0,Math.min(100,Math.round(speed))),brightness:Math.max(1,Math.min(255,Math.round(brightness)))}];
 },
 /* The Hue app sets a scene's speed in 12 steps. The service takes 0 to 100, so step 1 is 0 and step 12 is 100. */
 speedSteps:12,
 stepToSpeed:function(step){return Math.round((step-1)/(this.speedSteps-1)*100)},
 speedToStep:function(speed){return Math.max(1,Math.min(this.speedSteps,Math.round(speed/100*(this.speedSteps-1))+1))},
 /* Each Hue light reports "dynamic_palette" in its dynamics attribute while a live scene plays on it (an off light keeps the word). */
 playing:function(h,grp){
  return !!grp&&(h.states[grp].attributes.entity_id||[]).some(function(m){var s=h.states[m];return s&&s.state==="on"&&s.attributes.dynamics==="dynamic_palette"});
 },
 /* Freezing a live scene: every light that is on is told the colour and brightness it shows right now, as a plain command. Hue then stops animating it. Returns service calls as [domain, service, data]. */
 freeze:function(h,grp){
  var out=[];
  (h.states[grp].attributes.entity_id||[]).forEach(function(m){
   var s=h.states[m];
   if(!s||s.state!=="on")return;
   var a=s.attributes,d={entity_id:m,transition:0};
   if(a.brightness)d.brightness=a.brightness;
   if(a.color_mode==="color_temp"&&a.color_temp_kelvin)d.color_temp_kelvin=a.color_temp_kelvin;
   else if(a.xy_color)d.xy_color=a.xy_color;
   else if(a.hs_color)d.hs_color=a.hs_color;
   out.push(["light","turn_on",d]);
  });
  return out;
 },
 active:function(h,id){
  var nm=h.states[id]&&h.states[id].attributes.name,e=h.entities[id];
  if(!nm||!e||(e.platform!=="hue"&&e.platform!=="hue_plus")||!e.device_id)return false;
  return Object.keys(h.states).some(function(k){
   var se=h.entities[k];
   return k.indexOf("select.")===0&&se&&se.platform===e.platform&&se.device_id===e.device_id&&(h.states[k].attributes.options||[]).indexOf(nm)>=0&&h.states[k].state===nm;
  });
 }
};

/* The Hue live scenes of the home: the ones that can be imported, by room. */
function hueLiveScenes() {
  var h = H();
  return Object.keys(h.states)
    .filter(function (id) {
      return HUESCENES.isHue(h, id) && A(id).is_dynamic !== false;
    })
    .sort(function (x, y) {
      return (
        String(A(x).group_name || "").localeCompare(String(A(y).group_name || "")) ||
        String(A(x).name || x).localeCompare(String(A(y).name || y))
      );
    });
}

/* The Hue static scenes of the home (the bridge says a scene does not play by itself): the ones that can be imported as classic scenes, by room. */
function hueStaticScenes() {
  var h = H();
  return Object.keys(h.states)
    .filter(function (id) {
      return HUESCENES.isHue(h, id) && A(id).is_dynamic === false;
    })
    .sort(function (x, y) {
      return (
        String(A(x).group_name || "").localeCompare(String(A(y).group_name || "")) ||
        String(A(x).name || x).localeCompare(String(A(y).name || y))
      );
    });
}

/* Reading a Hue scene from the bridge, to import it, is a service of Hue Plus. */
function hueImportable() {
  var s = H().services;
  return !!(s && s.hue_plus && s.hue_plus.import_hue_scene);
}

/* The colours of a Hue scene, read once from the bridge, as CSS colours for the light panel's scene tiles. */
var LP_SCENEPAL = {};

function hueScenePalette(id, done) {
  if (LP_SCENEPAL[id]) return done(LP_SCENEPAL[id]);
  if (!hueImportable()) return;
  serviceResponse("hue_plus", "import_hue_scene", { entity_id: id })
    .then(function (r) {
      if (!r || !r.palette || !r.palette.length) return;
      LP_SCENEPAL[id] = r.palette.map(function (c) {
        return cssRgb(c.k ? kelvinRgb(c.k) : liveXyRgb(c.xy[0], c.xy[1]));
      });
      done(LP_SCENEPAL[id]);
    })
    .catch(function () {});
}

/* Speed and brightness a Hue scene is started with, kept on this device. */
function hueSceneSet(id) {
  var s = deviceGet("db_hsc_" + id, {});
  return {
    speed: typeof s.speed === "number" ? s.speed : Math.round((A(id).speed || 0.5) * 100),
    bri: typeof s.bri === "number" ? s.bri : Math.round((A(id).brightness || 255) / 2.55),
  };
}

function hueSceneSave(id, st) {
  deviceSet("db_hsc_" + id, st);
}

/* The room's Hue group light of the scene that was frozen last, so the Freeze button can show it. */
var HFROZEN = {};

/* Starts the scene live with the saved speed, keeping the brightness the room has now. */
function hueSceneStart(id) {
  var st = hueSceneSet(id),
    grp = HUESCENES.group(H(), id),
    bri = grp && V_(grp) === "on" ? (A(grp).brightness || 0) / 2.55 : st.bri;
  if (grp) {
    delete HFROZEN[grp];
    liveStopOn([grp]);
  }
  var c = HUESCENES.start(H(), id, st.speed, Math.max(1, bri) * 2.55);
  call(c[0], c[1], c[2]);
}

/* Freezes the scene where it is: the lights keep the colours they show now. */
function hueSceneFreeze(id) {
  var grp = HUESCENES.group(H(), id);
  if (!grp || V_(grp) !== "on") return;
  HUESCENES.freeze(H(), grp).forEach(function (c) {
    call(c[0], c[1], c[2]);
  });
  HFROZEN[grp] = id;
}

/* A static scene is switched on as a classic scene is: it sets its lights, with no speed. */
function hueSceneToggle(id) {
  var grp = HUESCENES.group(H(), id);
  if (HUESCENES.active(H(), id)) {
    if (grp) call("light", "turn_off", { entity_id: grp });
  } else if (A(id).is_dynamic === false) call("scene", "turn_on", { entity_id: id });
  else hueSceneStart(id);
}

/* The popup of a Hue scene. A static scene has only what a classic scene has (importing it as one, hiding it); a live one has: brightness (follows the room live), speed (starts the scene again at the new speed), play (live) and freeze (a still picture). */
function hueScenePopup(b, id, room) {
  var P = HUESCENES,
    stat = A(id).is_dynamic === false;
  function grp() {
    return P.group(H(), id);
  }
  function playing() {
    return P.active(H(), id) && P.playing(H(), grp());
  }
  function live() {
    var g = grp();
    return P.active(H(), id) && !!g && V_(g) === "on";
  }
  if (!stat) {
    b.appendChild(
      sliderRow({
        icon: "bright",
        name: _T("brightness"),
        min: 1,
        max: 100,
        step: 1,
        get: function () {
          var g = grp();
          return g && V_(g) === "on" ? Math.max(1, Math.round((A(g).brightness || 0) / 2.55)) : hueSceneSet(id).bri;
        },
        fmt: function (v) {
          return v + "%";
        },
        on: function () {
          return P.active(H(), id);
        },
        live: function (v) {
          if (live()) callLive(grp(), "light", "turn_on", { entity_id: grp(), brightness_pct: v });
        },
        commit: function (v) {
          var st = hueSceneSet(id);
          st.bri = v;
          hueSceneSave(id, st);
          if (live()) call("light", "turn_on", { entity_id: grp(), brightness_pct: v });
        },
      })
    );
    b.appendChild(
      sliderRow({
        icon: "tune",
        name: _T("speed"),
        min: 1,
        max: P.speedSteps,
        step: 1,
        get: function () {
          return P.speedToStep(hueSceneSet(id).speed);
        },
        fmt: function (v) {
          return v + " / " + P.speedSteps;
        },
        on: function () {
          return P.active(H(), id);
        },
        commit: function (v) {
          var st = hueSceneSet(id);
          st.speed = P.stepToSpeed(v);
          hueSceneSave(id, st);
          if (playing()) hueSceneStart(id);
        },
      })
    );
    var g2 = mk("div", "gridl g2");
    g2.appendChild(
      pill("play", _T("play"), {
        on: playing,
        tap: function () {
          hueSceneStart(id);
        },
      })
    );
    g2.appendChild(
      pill("pause", _T("freeze"), {
        on: function () {
          var g = grp();
          return !!g && HFROZEN[g] === id && V_(g) === "on" && !P.playing(H(), g);
        },
        tap: function () {
          hueSceneFreeze(id);
        },
      })
    );
    b.appendChild(g2);
  }
  if (isAdmin() && hueImportable())
    b.appendChild(
      pill(stat ? "scene" : "palette", _T(stat ? "import_as_a_classic_scene" : "import_as_a_live_scene"), {
        sub: function () {
          return _T(stat ? "a_copy_you_can_edit_with_the_lights_as_it_sets_them" : "a_copy_you_can_edit_and_place_on_your_lights");
        },
        tap: function () {
          importLiveScene(stat ? "hue-classic" : "hue", id);
        },
      })
    );
  /* In edit mode, the scene can be changed the way the Hue app changes it, and it is written to the bridge. */
  if (isEditing() && isAdmin() && hueplus.has(H(), "update_scene") && stat) {
    b.appendChild(
      pill("light", _T("hn_change_the_lights"), {
        sub: function () {
          return _T("hn_change_the_lights_sub");
        },
        tap: function () {
          hueSceneEdit(id, room);
        },
      })
    );
    b.appendChild(
      pill("edit", _T("hn_rename"), {
        tap: function () {
          hueSceneRename(id);
        },
      })
    );
  }
  if (isEditing() && isAdmin() && hueplus.has(H(), "delete_scene"))
    b.appendChild(
      pill("trash", _T("hn_delete_scene"), {
        tap: function () {
          confirmDlg(_T("hn_delete_scene") + ": " + (A(id).name || id) + "?", function () {
            hueSceneRemove(id).then(function () {
              closeSheet();
            });
          });
        },
      })
    );
  if (isEditing() && room)
    b.appendChild(
      pill("eye", sceneEntHidden(room, id) ? _T("show_this_scene") : _T("hide_this_scene"), {
        sub: function () {
          return sceneEntHidden(room, id) ? _T("hidden") : _T("visible");
        },
        tap: function () {
          sceneEntSetHidden(room, id, !sceneEntHidden(room, id));
          closeSheet();
        },
      })
    );
}

/* Making and changing Hue scenes from the dashboard's scenes section, the way the Hue app does ("Add a scene"): choose the room or zone, then a custom scene (the lights set
 in the dashboard's light popup, then saved), the current settings saved as a scene, an all-day scene (scenes by time of day) or a colour palette taken from a photo. Everything is written
 to the bridge (hue_plus.create_scene, update_scene, delete_scene, create_daily_smart_scene). Dynamic scenes cannot be made here: the Hue app only has them from its cloud gallery. */

/* g: the room or zone chosen {id, name, type, lights: [the bridge's light ids]}; sel: the bridge's light ids of it (a scene sets every light of its room or zone: the bridge refuses one that leaves a light out); data: what the bridge says about its rooms, zones and scenes. */
var HUENEW = { scope: "", g: null, sel: {}, mode: "", name: "", slots: [], days: [1, 1, 1, 1, 1, 1, 1], open: {}, restrict: "", target: "", data: null };

/* ---- what the bridge has ---- */

function hueLoadData() {
  return hueplus.resources(["rooms", "zones", "scenes"]).then(function (r) {
    var groups = (r.rooms || [])
      .map(function (g) {
        return { id: g.id, name: g.name, type: "room", lights: g.lights || [] };
      })
      .concat(
        (r.zones || []).map(function (g) {
          return { id: g.id, name: g.name, type: "zone", lights: g.lights || [] };
        })
      );
    HUENEW.data = { groups: groups, scenes: r.scenes || [] };
    return HUENEW.data;
  });
}

/* The Home Assistant light that stands for one of the bridge's lights. */
function hueLightEntity(lightId) {
  var h = H();
  return (
    hueplus.lights(h).filter(function (id) {
      return A(id).hue_light_id === lightId;
    })[0] || null
  );
}

function hueLightName(lightId) {
  var e = hueLightEntity(lightId);
  return e ? A(e).friendly_name || e : lightId;
}

/* The lights that have an entity (a light of the bridge Home Assistant does not show cannot be set from here). */
function hueGroupLightIds(g) {
  return g.lights.filter(function (id) {
    return !!hueLightEntity(id);
  });
}

function hueSelectedIds() {
  return Object.keys(HUENEW.sel).filter(function (id) {
    return HUENEW.sel[id];
  });
}

/* The entities of the lights chosen, to set in the light popup. */
function hueSelectedEntities() {
  return hueSelectedIds()
    .map(hueLightEntity)
    .filter(function (e) {
      return !!e;
    });
}

/* The room or zone of the page the scene is made from, if it is one of the bridge's: by its name (the Hue Plus light of a room carries the room's name). */
function hueGroupOfPage(scope) {
  var h = H(),
    room = scope && scope !== "home" ? roomById(scope) : null,
    groups = hueGroups().filter(function (k) {
      return room && room.area && h.entities[k].area_id === room.area;
    });
  if (groups.length !== 1 && room) {
    groups = hueGroups().filter(function (k) {
      return A(k).friendly_name === room.name;
    });
  }
  return groups.length === 1 ? A(groups[0]).friendly_name : null;
}

/* The Hue Plus lights that stand for a room or zone of the bridge. */
function hueGroups() {
  var h = H();
  return Object.keys(h.states).filter(function (k) {
    var e = h.entities[k];
    return k.indexOf("light.") === 0 && e && e.platform === "hue_plus" && h.states[k].attributes.is_hue_group;
  });
}

/* The bridge's own id of a scene entity (its unique id). */
function hueSceneUid(id) {
  var e = H().entities[id];
  return e && e.unique_id;
}

function mkHint(text) {
  var d = mk("div", "notec pane dim");
  d.textContent = text;
  return d;
}

/* ---- the start: the Hue app's "Add a scene" ---- */

function hueStartMaker(scope) {
  HUENEW = { scope: scope, g: null, sel: {}, mode: "", name: "", slots: [], days: [1, 1, 1, 1, 1, 1, 1], open: {}, restrict: "", target: "", data: null };
  hueLoadData().then(
    function () {
      showPopup("hue-add-scene", true);
    },
    function () {
      toast(_T("hn_couldn_t_read_the_hue_bridge"));
    }
  );
}

function hueAddScenePage(b) {
  var grid = mk("div", "gridl g2"),
    items = [
      ["edit", "hn_custom_scene", "hn_custom_scene_sub", "custom"],
      ["check", "hn_save_current", "hn_save_current_sub", "current"],
      ["clock", "hn_all_day", "hn_all_day_sub", "allday"],
      ["cam", "hn_from_photo", "hn_from_photo_sub", "photo"],
    ];
  b.appendChild(mkHint(_T("hn_add_a_scene_hint")));
  items.forEach(function (it) {
    grid.appendChild(
      pill(it[0], _T(it[1]), {
        sub: function () {
          return _T(it[2]);
        },
        tap: function () {
          hueChooseLights(it[3]);
        },
      })
    );
  });
  b.appendChild(grid);
}

/* ---- choose your lights: rooms and zones, each with its lights ---- */

/* Opens the choice for a way of making a scene. The room of the page is chosen, with all its lights, to begin with. */
function hueChooseLights(mode) {
  HUENEW.mode = mode;
  var name = hueGroupOfPage(HUENEW.scope),
    g = name
      ? HUENEW.data.groups.filter(function (x) {
          return x.name === name;
        })[0]
      : null;
  HUENEW.sel = {};
  HUENEW.g = null;
  if (g) hueSelectGroup(g);
  showPopup("hue-lights", true);
}

function hueSelectGroup(g) {
  HUENEW.g = g;
  HUENEW.sel = {};
  g.lights.forEach(function (id) {
    HUENEW.sel[id] = true;
  });
}

function hueLightsPage(b) {
  var box = mk("div"),
    groups = HUENEW.data.groups.filter(function (g) {
      return !HUENEW.restrict || g.id === HUENEW.restrict;
    });
  b.appendChild(box);
  if (HUENEW.mode === "edit") HUENEW.open[HUENEW.restrict] = true;
  function groupRow(g) {
    var wrap = mk("div"),
      row = pill(g.type === "zone" ? "target" : "home", g.name, {
        check: function () {
          return !!HUENEW.g && HUENEW.g.id === g.id;
        },
        sub: function () {
          return cntS(g.lights.length, _T("light"), _T("lights"));
        },
        tap: function () {
          hueSelectGroup(g);
          refresh();
        },
      }),
      chev = mk("span", "chev", svg("chev"));
    chev.addEventListener("click", function (e) {
      e.stopPropagation();
      HUENEW.open[g.id] = !HUENEW.open[g.id];
      draw();
    });
    row.appendChild(chev);
    wrap.appendChild(row);
    if (HUENEW.open[g.id]) {
      /* The lights of the room or zone, for information: the scene sets all of them (any one can be set to off in the light popup). */
      var grid = mk("div", "gridl g2");
      g.lights.forEach(function (id) {
        grid.appendChild(pill("light", hueLightName(id), {}));
      });
      wrap.appendChild(grid);
    }
    return wrap;
  }
  function draw() {
    box.innerHTML = "";
    box.appendChild(mkHint(_T(HUENEW.mode === "edit" ? "hn_choose_hint_edit" : "hn_choose_hint")));
    [["zone", "hn_zones"], ["room", "hn_rooms"]].forEach(function (t) {
      var list = groups.filter(function (g) {
        return g.type === t[0];
      });
      if (!list.length) return;
      box.appendChild(sep(_T(t[1]), t[0] === "zone" ? "target" : "home"));
      list.forEach(function (g) {
        box.appendChild(groupRow(g));
      });
    });
    if (!groups.length) box.appendChild(mkHint(_T("hn_no_hue_room")));
    box.appendChild(
      pill("check", _T("hn_next"), {
        tap: function () {
          if (!HUENEW.g) {
            toast(_T("hn_choose_a_room"));
            return;
          }
          hueAfterLights();
        },
      })
    );
  }
  draw();
}

function hueAfterLights() {
  var m = HUENEW.mode;
  if (m === "allday") hueStartAllDay();
  else if (m === "photo") showPopup("hue-photo", true);
  else if (m === "edit") hueEditOpen();
  else hueAskName(m);
}

/* ---- a name ---- */

function hueAskName(mode) {
  HUENEW.mode = mode;
  showPopup("hue-scene-name", true);
}

function hueNamePage(b) {
  var w = mk("div", "sqw pane"),
    inp = mk("input", "sq");
  inp.type = "text";
  inp.maxLength = 32;
  inp.placeholder = _T("hn_name_of_the_scene");
  inp.value = HUENEW.name;
  inp.addEventListener("input", function () {
    HUENEW.name = inp.value;
  });
  w.appendChild(inp);
  b.appendChild(w);
  b.appendChild(
    pill("check", _T("hn_next"), {
      tap: function () {
        var name = (HUENEW.name || "").trim();
        if (!name) {
          toast(_T("hn_give_it_a_name"));
          inp.focus();
          return;
        }
        HUENEW.name = name;
        if (HUENEW.mode === "rename") hueRenameNow(name);
        else if (HUENEW.mode === "current") hueSaveCurrent();
        else hueOpenEditor();
      },
    })
  );
  setTimeout(function () {
    inp.focus();
  }, 150);
}

/* A scene of the room or zone chosen: what every one of its lights shows now, which is what the light popup has set. */
function hueCreate() {
  return callRaw("hue_plus", "create_scene", { name: HUENEW.name, group: HUENEW.g.id, group_type: HUENEW.g.type });
}

/* The lights as they are now, saved. */
function hueSaveCurrent() {
  Promise.resolve(hueCreate()).then(
    function () {
      toast(_T("hn_scene_saved") + HUENEW.name);
      closeSheet();
    },
    function () {
      toast(_T("hn_couldn_t_save_the_scene"));
    }
  );
}

/* The dashboard's light popup for the lights chosen: set them, press the checkmark, and what they show is the scene. */
function hueOpenEditor() {
  var lights = hueSelectedEntities();
  if (!lights.length) {
    toast(_T("hn_no_hue_lights_here"));
    return;
  }
  var name = HUENEW.name;
  editLights({
    name: name,
    icon: "palette",
    lights: lights,
    onSave: function () {
      return Promise.resolve(hueCreate()).then(
        function () {
          toast(_T("hn_scene_saved") + name);
          return true;
        },
        function () {
          toast(_T("hn_couldn_t_save_the_scene"));
          return false;
        }
      );
    },
    after: function () {
      closeSheet();
    },
  });
}

/* ---- all-day scene: scenes by time of day ---- */

/* The still scenes of the room or zone chosen (a moving scene cannot be a time slot of a smart scene made here). */
function hueRoomScenes() {
  var h = H(),
    g = HUENEW.g;
  return Object.keys(h.states)
    .filter(function (k) {
      return k.indexOf("scene.") === 0 && h.entities[k] && ["hue", "hue_plus"].indexOf(h.entities[k].platform) >= 0 && A(k).group_name === g.name && A(k).group_type === g.type && A(k).is_dynamic === false;
    })
    .sort(function (x, y) {
      return (A(x).name || x).localeCompare(A(y).name || y);
    });
}

function hueStartAllDay() {
  var scenes = hueRoomScenes();
  if (!scenes.length) {
    toast(_T("hn_make_a_scene_first"));
    return;
  }
  HUENEW.slots = [
    { time: "07:00", scene: scenes[0] },
    { time: "18:00", scene: scenes[scenes.length > 1 ? 1 : 0] },
  ];
  HUENEW.days = [1, 1, 1, 1, 1, 1, 1];
  HUENEW.name = "";
  HUENEW.mode = "allday";
  showPopup("hue-all-day", true);
}

/* The bridge's names of the days, in the order of the day buttons (Sunday first, as in the Hue app). */
var HUE_DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

var HUE_DAYS = ["hn_day_sun", "hn_day_mon", "hn_day_tue", "hn_day_wed", "hn_day_thu", "hn_day_fri", "hn_day_sat"];

function hueAllDayPage(b) {
  var box = mk("div");
  b.appendChild(box);
  var scenes = hueRoomScenes();
  function draw() {
    box.innerHTML = "";
    var w = mk("div", "sqw pane"),
      inp = mk("input", "sq");
    inp.type = "text";
    inp.maxLength = 32;
    inp.placeholder = _T("hn_name_of_the_scene");
    inp.value = HUENEW.name;
    inp.addEventListener("input", function () {
      HUENEW.name = inp.value;
    });
    w.appendChild(inp);
    box.appendChild(w);
    box.appendChild(mkHint(_T("hn_all_day_hint")));
    HUENEW.slots.forEach(function (s, i) {
      var r = mk("div", "pill pane hn-slot"),
        t = mk("input", "sq hn-time"),
        sel = mk("select", "hn-pick");
      t.type = "time";
      t.value = s.time;
      t.addEventListener("change", function () {
        if (t.value) s.time = t.value;
      });
      scenes.forEach(function (k) {
        var o = mk("option");
        o.value = k;
        o.textContent = A(k).name || k;
        if (k === s.scene) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener("change", function () {
        s.scene = sel.value;
      });
      var rm = mk("div", "rnd pane sm", svg("close"));
      rm.addEventListener("click", function () {
        if (HUENEW.slots.length <= 1) return;
        HUENEW.slots.splice(i, 1);
        draw();
      });
      r.appendChild(t);
      r.appendChild(sel);
      r.appendChild(rm);
      box.appendChild(r);
    });
    box.appendChild(
      pill("plus", _T("hm_add_a_time"), {
        tap: function () {
          if (HUENEW.slots.length >= 8) return;
          HUENEW.slots.push({ time: "12:00", scene: scenes[0] });
          draw();
        },
      })
    );
    var days = mk("div", "hn-days");
    HUE_DAYS.forEach(function (key, i) {
      var d = mk("div", "rnd pane hn-day" + (HUENEW.days[i] ? " on" : ""));
      d.textContent = _T(key);
      d.setAttribute("role", "button");
      d.addEventListener("click", function () {
        HUENEW.days[i] = HUENEW.days[i] ? 0 : 1;
        d.classList.toggle("on", !!HUENEW.days[i]);
      });
      days.appendChild(d);
    });
    box.appendChild(days);
    box.appendChild(
      pill("check", _T("hn_save"), {
        tap: function () {
          hueSaveAllDay();
        },
      })
    );
  }
  draw();
}

function hueSaveAllDay() {
  var name = (HUENEW.name || "").trim();
  if (!name) {
    toast(_T("hn_give_it_a_name"));
    return;
  }
  if (!HUENEW.days.some(Boolean)) {
    toast(_T("hn_pick_a_day"));
    return;
  }
  var slots = HUENEW.slots
    .slice()
    .sort(function (x, y) {
      return x.time.localeCompare(y.time);
    })
    .map(function (s) {
      return { time: s.time, scene: hueSceneUid(s.scene) };
    });
  serviceResponse("hue_plus", "create_daily_smart_scene", {
    name: name,
    group: HUENEW.g.id,
    group_type: HUENEW.g.type,
    slots: slots,
    days: HUENEW.days
      .map(function (on, i) {
        return on ? HUE_DAY_NAMES[i] : "";
      })
      .filter(Boolean),
  }).then(
    function () {
      toast(_T("hn_scene_saved") + name);
      closeSheet();
    },
    function () {
      toast(_T("hn_couldn_t_save_the_scene"));
    }
  );
}

/* ---- colour palette from a photo ---- */

/* k colours from the pixels (as [r,g,b]), by k-means; the most common first. A photo is shrunk first, so this is quick. */
function huePalette(pixels, k) {
  if (!pixels.length) return [];
  var centers = [];
  for (var i = 0; i < k; i++) centers.push(pixels[Math.floor(((i + 0.5) * pixels.length) / k)].slice());
  var groups;
  for (var step = 0; step < 8; step++) {
    groups = centers.map(function () {
      return [];
    });
    pixels.forEach(function (p) {
      var best = 0,
        bd = 1e12;
      centers.forEach(function (c, ci) {
        var d = (p[0] - c[0]) * (p[0] - c[0]) + (p[1] - c[1]) * (p[1] - c[1]) + (p[2] - c[2]) * (p[2] - c[2]);
        if (d < bd) {
          bd = d;
          best = ci;
        }
      });
      groups[best].push(p);
    });
    centers = centers.map(function (c, ci) {
      var g = groups[ci];
      if (!g.length) return c;
      return [0, 1, 2].map(function (x) {
        return Math.round(
          g.reduce(function (s, p) {
            return s + p[x];
          }, 0) / g.length
        );
      });
    });
  }
  return centers
    .map(function (c, ci) {
      return { c: c, n: groups[ci].length };
    })
    .filter(function (x) {
      return x.n > 0;
    })
    .sort(function (x, y) {
      return y.n - x.n;
    })
    .map(function (x) {
      return x.c;
    });
}

function huePhotoPixels(img) {
  var c = document.createElement("canvas"),
    scale = Math.min(1, 48 / Math.max(img.naturalWidth, img.naturalHeight));
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  var ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, c.width, c.height);
  var d = ctx.getImageData(0, 0, c.width, c.height).data,
    out = [];
  for (var i = 0; i < d.length; i += 4) {
    var lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
    if (d[i + 3] > 200 && lum > 25) out.push([d[i], d[i + 1], d[i + 2]]); /* near-black pixels would only make dark lights */
  }
  return out;
}

function huePhotoPage(b) {
  var lights = hueSelectedEntities(),
    sw = mk("div", "hn-swatches"),
    file = mk("input");
  file.type = "file";
  file.accept = "image/*";
  b.appendChild(mkHint(_T("hn_photo_hint")));
  b.appendChild(
    pill("cam", _T("hn_choose_a_photo"), {
      tap: function () {
        file.click();
      },
    })
  );
  b.appendChild(sw);
  file.addEventListener("change", function () {
    var f = file.files && file.files[0];
    if (!f) return;
    var img = new Image();
    img.onload = function () {
      var colors = huePalette(huePhotoPixels(img), Math.min(5, Math.max(2, lights.length)));
      URL.revokeObjectURL(img.src);
      if (!colors.length) {
        toast(_T("hn_no_colours_in_that_photo"));
        return;
      }
      sw.innerHTML = "";
      colors.forEach(function (c) {
        var s = mk("span", "hn-sw");
        s.style.background = "rgb(" + c.join(",") + ")";
        sw.appendChild(s);
      });
      /* Each light gets one of the colours, in turn; the lights show it at once. */
      lights.forEach(function (id, i) {
        callRaw("light", "turn_on", { entity_id: id, rgb_color: colors[i % colors.length], brightness: 255 });
      });
      b.appendChild(
        pill("check", _T("hn_use_these_colours"), {
          tap: function () {
            hueAskName("custom");
          },
        })
      );
    };
    img.onerror = function () {
      toast(_T("hn_couldn_t_open_that_photo"));
    };
    img.src = URL.createObjectURL(f);
  });
}

/* ---- changing a scene that exists ---- */

/* The scene's own room or zone is shown, then its lights are set as the scene has them, the light popup opens on all of them, and the checkmark records what they show as the scene. */
function hueSceneEdit(id) {
  var uid = hueSceneUid(id);
  if (!uid) {
    toast(_T("hn_no_hue_lights_here"));
    return;
  }
  hueLoadData().then(
    function (data) {
      var scene = data.scenes.filter(function (s) {
          return s.id === uid;
        })[0],
        g = scene && data.groups.filter(function (x) { return x.id === scene.group_id; })[0];
      if (!g) {
        toast(_T("hn_no_hue_lights_here"));
        return;
      }
      HUENEW = { scope: "", g: g, sel: {}, mode: "edit", name: A(id).name || A(id).friendly_name || "", slots: [], days: [], open: {}, restrict: g.id, target: id, data: data };
      hueSelectGroup(g);
      showPopup("hue-lights", true);
    },
    function () {
      toast(_T("hn_couldn_t_read_the_hue_bridge"));
    }
  );
}

function hueEditOpen() {
  var id = HUENEW.target,
    uid = hueSceneUid(id),
    name = HUENEW.name,
    lights = hueSelectedEntities();
  if (!uid || !lights.length) {
    toast(_T("hn_no_hue_lights_here"));
    return;
  }
  call("scene", "turn_on", { entity_id: id });
  setTimeout(function () {
    editLights({
      name: name,
      icon: "palette",
      lights: lights,
      onSave: function () {
        return Promise.resolve(callRaw("hue_plus", "update_scene", { scene: uid, record_current: true })).then(
          function () {
            toast(_T("hn_scene_saved") + name);
            return true;
          },
          function () {
            toast(_T("hn_couldn_t_save_the_scene"));
            return false;
          }
        );
      },
      after: function () {
        closeSheet();
      },
    });
  }, 900);
}

function hueSceneRename(id) {
  HUENEW.target = id;
  HUENEW.name = A(id).name || "";
  hueAskName("rename");
}

function hueRenameNow(name) {
  var uid = hueSceneUid(HUENEW.target);
  if (!uid) return;
  Promise.resolve(callRaw("hue_plus", "set_name", { resource: "scene", id: uid, name: name })).then(
    function () {
      toast(_T("hn_scene_saved") + name);
      closeSheet();
    },
    function () {
      toast(_T("hn_couldn_t_save_the_scene"));
    }
  );
}

/* Deleting a scene from the bridge, after a question; used by the trash of the section and by the scene's page. */
function hueSceneRemove(id) {
  var uid = hueSceneUid(id);
  if (!uid) return Promise.reject(new Error("no id"));
  return Promise.resolve(callRaw("hue_plus", "delete_scene", { scene: uid, confirm: true })).then(function () {
    toast(_T("hn_scene_deleted"));
  });
}

/* The styles of these pages. */
var HUE_NEW_CSS =
  ".hn-slot{display:flex;align-items:center;gap:10px;padding:8px 12px}\n.hn-time{width:auto;flex:none;background:transparent;color:inherit;border:0;font-size:var(--fs-m)}\n.hn-pick{flex:1;min-width:0;background:transparent;color:inherit;border:0;font-size:var(--fs-m)}\n.hn-days{display:flex;justify-content:space-between;gap:6px;margin:var(--sp) 0}\n.hn-day{width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-weight:600}\n.hn-day.on{background:color-mix(in srgb,var(--acc) 55%,var(--f-card))}\n.hn-swatches{display:flex;gap:8px;margin:var(--sp) 0}\n.hn-sw{flex:1;height:40px;border-radius:var(--r-m);border:1px solid var(--f-line)}";

/* The styles of a Hue light made of zones (a gradient tube or strip), as in the Hue app: pins with a smooth blend (Linear, Mirrored) or colours of their own
 (Scattered, Segmented). The dashboard shows a Style button on a light panel when a registered light style applies to the light (see epilogue.js). */

/* Whether the light has styles to choose: Hue Plus lists them in the light's gradient_modes. */
function hueStyleApplies(id) {
  return !!A(id).gradient_modes;
}

/* Whether the zones are blended into a line (the Linear and Mirrored styles); in Scattered and Segmented every zone is a colour of its own. */
function hueStyleBlends(id) {
  var m = A(id).gradient_mode;
  return !m || m === "interpolated_palette" || m === "interpolated_palette_mirrored";
}

/* The styles of a light made of zones, as in the Hue app: pins with a smooth blend (Linear, Mirrored) or colours of their own (Scattered, Segmented). */
var LP_STYLES = [
  ["interpolated_palette", "linear", "<circle cx='5' cy='8' r='2.4'/><circle cx='12' cy='8' r='2.4'/><circle cx='19' cy='8' r='2.4'/><path d='M3 16h18'/>"],
  ["interpolated_palette_mirrored", "mirrored", "<circle cx='6' cy='8' r='2.4'/><circle cx='18' cy='8' r='2.4'/><path d='M12 3v16M3 16h18'/>"],
  ["random_pixelated", "scattered", "<circle cx='5' cy='11' r='2.4'/><circle cx='12' cy='6' r='2.4'/><circle cx='19' cy='12' r='2.4'/>"],
  ["segmented_palette", "segmented", "<circle cx='5' cy='8' r='2.4'/><circle cx='12' cy='8' r='2.4'/><circle cx='19' cy='8' r='2.4'/><path d='M3 16h4M10 16h4M17 16h4'/>"],
];

function lpStyleIcon(mode) {
  var s = LP_STYLES.filter(function (x) {
    return x[0] === mode;
  })[0];
  return "<svg viewBox='0 0 24 24'>" + (s ? s[2] : LP_STYLES[0][2]) + "</svg>";
}

/* The popup of the style button. Tapping a style changes the light at once; the orientation turns the zones around (Linear and Mirrored). */
function lpStylePopup(b, id) {
  var box = mk("div"),
    tiles = {};
  b.appendChild(sep(_T("mode"), "palette"));
  var g = mk("div", "gridl g2 lp-modes");
  LP_STYLES.forEach(function (s) {
    var el = mk("div", "lp-mode", "<svg viewBox='0 0 24 24'>" + s[2] + "</svg>");
    el.appendChild(mk("div", "lp-mode-n")).textContent = _T(s[1]);
    el.setAttribute("role", "button");
    el.addEventListener("click", function () {
      call("hue_plus", "set_style", { light: A(id).hue_light_id, style: s[1] });
    });
    tiles[s[0]] = el;
    g.appendChild(el);
  });
  b.appendChild(g);
  b.appendChild(box);
  function paint() {
    var mode = A(id).gradient_mode,
      offered = A(id).gradient_modes || [];
    Object.keys(tiles).forEach(function (k) {
      tiles[k].classList.toggle("picked", k === mode);
      tiles[k].style.display = offered.indexOf(k) < 0 ? "none" : "";
    });
    box.innerHTML = "";
    if (mode === "interpolated_palette" || mode === "interpolated_palette_mirrored") {
      box.appendChild(sep(_T("orientation"), "swap"));
      box.appendChild(
        pill("swap", _T("turn_the_colours_around"), {
          tap: function () {
            call("hue_plus", "set_style", { light: A(id).hue_light_id, flip: true });
          },
        })
      );
    }
  }
  paint();
  reg(function () {
    if (b.isConnected) paint();
  });
}

/* The Hue dashboard panel (Hue Plus, dashboard module): the Hue app's tabs and tab bar. Home and its pages are in home.js and light.js, Sync in syncpage.js; Automations and Settings are the Hue Plus menu
 pages themselves, drawn in the tab. Everything sits inside the plugin's scope, so it uses the same pages and helpers as the menu. The Explore tab of the app (a gallery from Signify's cloud) has nothing behind
 it here. Nothing is kept in Home Assistant: the panel shows the bridge and writes to it. */

HOST_ICONS.bolt = "<path d='M13 2L5 14h6l-1 8 8-12h-6z'/>";
HOST_ICONS.dots = "<circle cx='5' cy='12' r='1.7' fill='currentColor'/><circle cx='12' cy='12' r='1.7' fill='currentColor'/><circle cx='19' cy='12' r='1.7' fill='currentColor'/>";

var HPAPP = { tab: "", el: null, bridge: "", modules: null, sigOf: null, lastSig: "" };
var HPAPI = window.HueHost && window.HueHost.api;

/* The tabs, in the order of the Hue app's tab bar. */
function hpTabs() {
  return [
    { id: "home", title: _T("home"), icon: "home", build: hpHomeTab },
    { id: "automations", title: _T("automations"), icon: "bolt", build: hpAutomationsTab },
    { id: "sync", title: _T("app_sync"), icon: "syncring", build: hpSyncTab },
    { id: "settings", title: _T("app_settings"), icon: "cog", build: hpSettingsTab },
  ];
}

/* A tab that is a page of the Hue Plus menu: the heading of the app's tab, then the page. */
function hpMenuTab(box, title, page) {
  var head = mk("div", "hd", "<h1></h1>");
  head.querySelector("h1").textContent = title;
  box.appendChild(head);
  var inner = mk("div");
  box.appendChild(inner);
  HP_PAGES[page][2](inner);
}

function hpAutomationsTab(box) {
  hpMenuTab(box, _T("automations"), "hue-routines");
}

function hpSettingsTab(box) {
  hpMenuTab(box, _T("app_settings"), "stg-hue");
}

function hpShowTab(id) {
  var tab = hpTabs().filter(function (t) {
    return t.id === id;
  })[0];
  if (!tab) return;
  HPAPP.tab = id;
  HPAPP.sigOf = null;
  HPAPI.tabList.length = 0;
  HPAPI.resetSession();
  HPAPP.main.innerHTML = "";
  HPAPP.view.scrollTop = 0;
  Array.prototype.forEach.call(HPAPP.nav.querySelectorAll("button"), function (b) {
    var on = b.dataset.tab === id;
    b.classList.toggle("on", on);
    if (on) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  HPAPI.setBuilding(HPAPI.tabList);
  try {
    tab.build(HPAPP.main);
  } finally {
    HPAPI.setBuilding(null);
  }
  HPAPP.lastSig = HPAPP.sigOf ? HPAPP.sigOf() : "";
  refresh();
}

/* What the home screen is made of changes when a room or zone is added or removed: the tab draws itself again then. */
function hpWatch() {
  if (HPAPP.sigOf && HPAPP.sigOf() !== HPAPP.lastSig && !HPAPI.hasSheet()) hpShowTab(HPAPP.tab);
}

function hpStart() {
  HPAPI.ws({ type: "hue_plus/capabilities" }).then(
    function (r) {
      var b = ((r && r.bridges) || [])[0];
      HPAPP.bridge = b ? b.name : "";
      HPAPP.modules = b ? b.modules : null;
      if (HPAPP.tab === "home") hpShowTab("home");
    },
    function () {}
  );
  hpTabs().forEach(function (t) {
    var b = mk("button", "", svg(t.icon) + "<span></span>");
    b.type = "button";
    b.dataset.tab = t.id;
    b.querySelector("span").textContent = t.title;
    b.addEventListener("click", function () {
      if (HPAPI.hasSheet()) HPAPI.closeSheet();
      hpShowTab(t.id);
    });
    HPAPP.nav.querySelector(".in").appendChild(b);
  });
  window.HueHost.onUpdate = hpWatch;
  var closed = window.HueHost.onSheetClosed;
  window.HueHost.onSheetClosed = function () {
    if (closed) closed();
    hpShowTab(HPAPP.tab);
  };
  hpShowTab("home");
}

window.HuePlusApp = {
  attach: function (hass) {
    HPAPI.attach(hass);
  },
  mount: function (el, hass) {
    HPAPI.attach(hass);
    HC.addStyles(HOST_CSS);
    el.innerHTML = "<div id='hp'><div class='view'><div class='in'></div></div><nav class='tabs' aria-label='" + _T("app_tabs") + "'><div class='in'></div></nav></div>";
    HPAPP.el = el;
    HPAPP.view = el.querySelector(".view");
    HPAPP.main = el.querySelector(".view>.in");
    HPAPP.nav = el.querySelector("nav");
    HPAPP.main.appendChild(mk("div", "empty")).textContent = _T("loading");
    /* The panel starts when the registries are in, or after a short wait; the lists fill in by themselves. */
    Promise.race([
      HPAPI.ready(),
      new Promise(function (resolve) {
        setTimeout(resolve, 6000);
      }),
    ]).then(hpStart);
  },
};

/* The Home tab and a room's page, as in the Hue app: the home's name over a card for each room and zone (its icon, name, a switch and a brightness bar, gold while the lights are on), and a room's page with
 its coloured header, its scenes, its lights and its controls. The scenes are played, stopped and adjusted with the functions the dashboard's scene rows use (huescenes.js); making one is the app's "Add a scene"
 (huenewscene.js); a light opens as the colour screen (light.js). Everything shown is what the bridge says; nothing is kept in Home Assistant. */

var HP_ROOM_ICONS = {
  bedroom: "bed",
  kids_bedroom: "bed",
  guest_room: "bed",
  living_room: "sofa",
  lounge: "sofa",
  family_room: "sofa",
  bathroom: "drop",
  toilet: "drop",
  media_room: "tv",
  home_theater: "tv",
  recreation: "tv",
  garage: "home",
};

/* The Hue lights that stand for a room or a zone: one entity each. When Hue Plus hides the Hue integration's own, the visible one is used; with both visible, Hue Plus's. */
function hpGroups() {
  var h = H(),
    by = {};
  Object.keys(h.states).forEach(function (id) {
    var a = h.states[id].attributes,
      e = h.entities[id];
    if (id.indexOf("light.") !== 0 || !a.is_hue_group || (a.hue_type !== "room" && a.hue_type !== "zone") || (e && e.hidden)) return;
    var key = a.hue_type + "|" + a.friendly_name;
    if (!by[key] || (e && e.platform === "hue_plus")) by[key] = id;
  });
  return Object.keys(by)
    .map(function (k) {
      return by[k];
    })
    .sort(function (x, y) {
      return A(x).hue_type === A(y).hue_type ? String(A(x).friendly_name).localeCompare(String(A(y).friendly_name)) : A(x).hue_type === "room" ? -1 : 1;
    });
}

function hpGroupLights(id) {
  return (A(id).entity_id || []).filter(function (m) {
    return m.indexOf("light.") === 0 && H().states[m];
  });
}

function hpGroupIcon(id) {
  var kind = HP_ROOM_ARCHETYPES[A(id).hue_type + "|" + A(id).friendly_name];
  return A(id).hue_type === "zone" ? "target" : HP_ROOM_ICONS[kind] || "home";
}

/* The icon type of each room and zone, read from the bridge once. */
var HP_ROOM_ARCHETYPES = {};

function hpLoadArchetypes() {
  if (!hueplus.has(H(), "get_resources")) return;
  hueplus.resources(["rooms", "zones"]).then(
    function (r) {
      (r.rooms || []).forEach(function (g) {
        HP_ROOM_ARCHETYPES["room|" + g.name] = g.archetype;
      });
      (r.zones || []).forEach(function (g) {
        HP_ROOM_ARCHETYPES["zone|" + g.name] = g.archetype;
      });
      refresh();
    },
    function () {}
  );
}

function hpPct(id) {
  return isOn(id) ? Math.max(1, Math.round((A(id).brightness || 0) / 2.55)) : 0;
}

/* ---- the colour a lit card takes: the light's own, lightened at the top and deepened at the bottom, as the app draws it ---- */

function hpMix(a, b, t) {
  return [0, 1, 2].map(function (i) {
    return Math.round(a[i] + (b[i] - a[i]) * t);
  });
}

function hpRgbOf(id) {
  var a = A(id);
  if (a.color_mode === "color_temp" || !a.hs_color) return a.color_temp_kelvin ? HC.ui.kelvinRgb(a.color_temp_kelvin) : [246, 205, 114];
  var hs = a.hs_color,
    c = (hs[1] / 100) * 0.8,
    h = hs[0] / 60,
    x = c * (1 - Math.abs((h % 2) - 1)),
    t = [
      [c, x, 0],
      [x, c, 0],
      [0, c, x],
      [0, x, c],
      [x, 0, c],
      [c, 0, x],
    ][Math.floor(h) % 6],
    m = 0.95 - c;
  return t.map(function (v) {
    return Math.round((v + m) * 255);
  });
}

/* Gives a card or a tile the two colours of its gradient from the lights that are on in it, and tells whether it is lit. */
function hpGold(el, ids) {
  var on = ids.filter(isOn);
  el.classList.toggle("on-gold", on.length > 0);
  if (!on.length) return;
  var rgb = hpRgbOf(on[0]);
  el.style.setProperty("--gold1", "rgb(" + hpMix(rgb, [255, 255, 255], 0.38).join(",") + ")");
  el.style.setProperty("--gold2", "rgb(" + hpMix(rgb, [90, 70, 30], 0.2).join(",") + ")");
}

/* ---- the parts ---- */

function hpToggle(label, get, set) {
  var t = mk("button", "tg", "<i></i>");
  t.type = "button";
  t.setAttribute("role", "switch");
  t.setAttribute("aria-label", label);
  t.addEventListener("click", function (e) {
    e.stopPropagation();
    set();
  });
  t.refresh = function () {
    var on = get();
    t.classList.toggle("on", on);
    t.setAttribute("aria-checked", on ? "true" : "false");
  };
  reg(t.refresh);
  return t;
}

function hpLightToggle(id, label) {
  return hpToggle(
    label,
    function () {
      return isOn(id);
    },
    function () {
      call("light", "toggle", { entity_id: id });
    }
  );
}

/* A light's or a group's brightness: a drag sets it, a tap on the bar sets that brightness. */
function hpSlider(id) {
  var s = mk("div", "sl", "<span class='kn'></span>"),
    kn = s.querySelector(".kn"),
    drag = false,
    at = 0;
  s.setAttribute("role", "slider");
  s.setAttribute("aria-label", _T("brightness"));
  s.tabIndex = 0;
  function put(p) {
    kn.style.left = p + "%";
    s.setAttribute("aria-valuenow", Math.round(p));
  }
  attachSlide(s, {
    onMove: function (f) {
      drag = true;
      var v = Math.max(1, Math.round(f * 100));
      put(v);
      if (Date.now() - at > 150) {
        at = Date.now();
        callLive("hp-bri-" + id, "light", "turn_on", { entity_id: id, brightness_pct: v });
      }
    },
    onCommit: function (f) {
      var v = Math.max(1, Math.round(f * 100));
      put(v);
      call("light", "turn_on", { entity_id: id, brightness_pct: v });
      setTimeout(function () {
        drag = false;
      }, 600);
    },
    onCancel: function () {
      drag = false;
    },
  });
  s.addEventListener("click", function (e) {
    e.stopPropagation();
  });
  s.refresh = function () {
    if (!drag) put(hpPct(id));
  };
  reg(s.refresh);
  return s;
}

/* A round button of the page's top: an icon, a label for the screen reader, and what it does. */
function hpRound(icon, label, fn) {
  var b = mk("button", "rbt", svg(icon));
  b.type = "button";
  b.setAttribute("aria-label", label);
  b.addEventListener("click", fn);
  return b;
}

function hpActive(el, open) {
  el.tabIndex = 0;
  el.setAttribute("role", "button");
  el.addEventListener("click", open);
  el.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target === el) {
      e.preventDefault();
      open();
    }
  });
}

/* ---- Home ---- */

function hpRoomCard(id) {
  var name = A(id).friendly_name,
    card = mk("div", "room", "<div class='rh'><span class='ic'></span><span class='rn'></span></div>"),
    ico = card.querySelector(".ic");
  card.querySelector(".rn").textContent = name;
  card.setAttribute("aria-label", name);
  card.querySelector(".rh").appendChild(hpLightToggle(id, name));
  card.appendChild(hpSlider(id));
  hpActive(card, function () {
    showPopup("app-room:" + id, true);
  });
  card.refresh = function () {
    hpGold(card, [id]);
    ico.innerHTML = svg(hpGroupIcon(id));
  };
  reg(card.refresh);
  return card;
}

function hpHomeTab(box) {
  hpLoadArchetypes();
  var groups = hpGroups();
  HPAPP.sigOf = function () {
    return hpGroups().join("|");
  };
  var rooms = groups.filter(function (id) {
    return A(id).hue_type === "room";
  });
  var head = mk("div", "hd", "<h1></h1><div class='acts'></div>");
  head.querySelector("h1").textContent = HPAPP.bridge || _T("home");
  if (rooms.length)
    head.querySelector(".acts").appendChild(
      hpToggle(
        _T("app_all_lights"),
        function () {
          return rooms.some(isOn);
        },
        function () {
          call("light", rooms.some(isOn) ? "turn_off" : "turn_on", { entity_id: rooms });
        }
      )
    );
  box.appendChild(head);
  if (!groups.length) {
    box.appendChild(mk("div", "empty")).textContent = _T("app_no_rooms");
    return;
  }
  [
    ["room", "rooms"],
    ["zone", "hn_zones"],
  ].forEach(function (t) {
    var list = groups.filter(function (id) {
      return A(id).hue_type === t[0];
    });
    if (!list.length) return;
    box.appendChild(mk("div", "lb")).textContent = _T(t[1]);
    var grid = mk("div", "rooms");
    list.forEach(function (id) {
      grid.appendChild(hpRoomCard(id));
    });
    box.appendChild(grid);
  });
}

/* ---- a room's page ---- */

/* The scenes of the bridge that belong to a room or zone. */
function hpScenesOf(id) {
  var h = H(),
    a = A(id);
  return Object.keys(h.states)
    .filter(function (s) {
      return HUESCENES.isHue(h, s) && A(s).group_name === a.friendly_name && A(s).group_type === a.hue_type && !(h.entities[s] && h.entities[s].hidden);
    })
    .sort(function (x, y) {
      return String(A(x).name || x).localeCompare(String(A(y).name || y));
    });
}

function hpSceneTile(sid) {
  var t = mk("div", "stile", "<div class='dots'></div><b></b>");
  t.querySelector("b").textContent = A(sid).name || sid;
  t.setAttribute("aria-label", A(sid).name || sid);
  var dots = t.querySelector(".dots");
  hueScenePalette(sid, function (cols) {
    dots.innerHTML = "";
    cols.slice(0, 6).forEach(function (c) {
      var d = mk("i");
      d.style.setProperty("--c", c);
      dots.appendChild(d);
    });
  });
  var gear = mk("button", "gear", svg("tune"));
  gear.type = "button";
  gear.setAttribute("aria-label", _T("app_scene_settings"));
  gear.addEventListener("click", function (e) {
    e.stopPropagation();
    showPopup("hue-scene:" + sid + "~", true);
  });
  t.appendChild(gear);
  hpActive(t, function () {
    hueSceneToggle(sid);
  });
  t.refresh = function () {
    t.classList.toggle("on-gold", HUESCENES.active(H(), sid));
  };
  reg(t.refresh);
  return t;
}

/* The icon of a light from the shape the Hue app draws for its archetype (a name check: the bridge's archetype is not on the entity). */
function hpLightIcon(lid) {
  var n = String(A(lid).friendly_name || "").toLowerCase();
  if (/strip|tube|play|gradient/.test(n)) return "strip";
  if (/ceiling|pendant|top/.test(n)) return "ceiling";
  if (/floor/.test(n)) return "floor";
  if (/desk|table|lamp/.test(n)) return "lamp";
  return "light";
}

function hpLightTile(lid) {
  var name = A(lid).friendly_name || lid,
    t = mk("div", "ltile", "<div class='up'><span class='ic'></span><b></b></div><div class='dn'></div>");
  t.querySelector(".ic").innerHTML = svg(hpLightIcon(lid));
  t.querySelector("b").textContent = name;
  t.setAttribute("aria-label", name);
  t.querySelector(".dn").appendChild(hpLightToggle(lid, name));
  hpActive(t, function () {
    showPopup("app-light:" + lid, true);
  });
  t.refresh = function () {
    hpGold(t, [lid]);
    t.classList.toggle("gone", V_(lid) === "unavailable");
  };
  reg(t.refresh);
  return t;
}

/* The switches and dials the bridge has in this room: the app lists them under Controls. */
function hpControls(box, id) {
  if (!hueplus.has(H(), "get_resources")) return;
  hueplus.resources(["accessories", "rooms", "zones"]).then(
    function (r) {
      var type = A(id).hue_type,
        group = (type === "zone" ? r.zones : r.rooms || []).filter(function (x) {
          return x.name === A(id).friendly_name;
        })[0],
        inside = {};
      if (group)
        (group.children || []).forEach(function (c) {
          inside[c.id] = true;
        });
      var list = (r.accessories || []).filter(function (x) {
        return inside[x.id];
      });
      if (!list.length || !box.isConnected) return;
      box.appendChild(mk("div", "lb")).textContent = _T("app_controls");
      var tiles = mk("div", "ctiles");
      list.forEach(function (x) {
        var c = mk("div", "ctile", "<span class='ic'></span><div><b></b><i></i></div>");
        c.querySelector(".ic").innerHTML = svg("cog");
        c.querySelector("b").textContent = x.name;
        c.querySelector("i").textContent = cntS((x.buttons || []).length, _T("hm_button"), _T("hm_buttons"));
        hpActive(c, function () {
          showPopup("hue-switch:" + x.id, true);
        });
        tiles.appendChild(c);
      });
      box.appendChild(tiles);
    },
    function () {}
  );
}

/* The list under the three dots of the room's page, as the app's: a sheet from the bottom with its choices and Cancel. */
function hpActions(items) {
  var scrim = mk("div", "scrim"),
    sheet = mk("div", "asheet");
  items.concat([{ label: _T("cancel") }]).forEach(function (it, i, all) {
    var b = mk("button", "arow" + (it.danger ? " danger" : "") + (i === all.length - 1 ? " cancel" : ""));
    b.type = "button";
    b.textContent = it.label;
    b.addEventListener("click", function () {
      scrim.remove();
      sheet.remove();
      if (it.fn) it.fn();
    });
    sheet.appendChild(b);
  });
  scrim.addEventListener("click", function () {
    scrim.remove();
    sheet.remove();
  });
  document.body.appendChild(scrim);
  document.body.appendChild(sheet);
  requestAnimationFrame(function () {
    scrim.classList.add("in");
  });
}

function hpRoomPage(body, id) {
  if (!H().states[id]) {
    body.appendChild(mk("div", "empty")).textContent = _T("nothing_found");
    return;
  }
  body.parentNode.classList.add("roompg");
  var name = A(id).friendly_name,
    zone = A(id).hue_type === "zone",
    admin = isAdmin(),
    head = mk("div", "rhead", "<div class='rr'><span class='nm'></span></div>"),
    row = head.querySelector(".rr");
  head.querySelector(".nm").textContent = name;
  row.insertBefore(hpRound("back", _T("back"), popBack), row.firstChild);
  if (admin) {
    row.appendChild(
      hpRound("plus", _T("app_add"), function () {
        showPopup("app-add:" + id, true);
      })
    );
    row.appendChild(
      hpRound("dots", _T("app_more"), function () {
        hpActions([
          {
            label: _T(zone ? "app_edit_zone" : "app_edit_room"),
            fn: function () {
              hpEditGroup(id);
            },
          },
          {
            label: _T(zone ? "app_delete_zone" : "app_delete_room"),
            danger: true,
            fn: function () {
              hpDeleteGroup(id);
            },
          },
        ]);
      })
    );
  }
  row.appendChild(hpLightToggle(id, name));
  head.appendChild(hpSlider(id));
  head.refresh = function () {
    hpGold(head, [id]);
  };
  reg(head.refresh);
  body.appendChild(head);

  var page = mk("div", "rbody");
  body.appendChild(page);

  var scenes = hpScenesOf(id),
    canMake = admin && hueplus.has(H(), "create_scene");
  page.appendChild(mk("div", "lb")).textContent = _T("app_my_scenes");
  var grid = mk("div", "stiles");
  scenes.forEach(function (sid) {
    grid.appendChild(hpSceneTile(sid));
  });
  if (!scenes.length && !canMake) grid.appendChild(mk("div", "empty")).textContent = _T("hw_no_scenes_here");
  page.appendChild(grid);

  page.appendChild(mk("div", "lb")).textContent = _T("lights");
  var tiles = mk("div", "ltiles");
  hpGroupLights(id).forEach(function (lid) {
    tiles.appendChild(hpLightTile(lid));
  });
  page.appendChild(tiles);

  hpControls(page, id);
}

/* What can be added to a room, as the app asks it: a scene, devices, an automation, a MotionAware area. */
function hpAddPage(body, id) {
  var items = [
    [
      "palette",
      _T("app_add_scene"),
      function () {
        hueStartMaker("app:" + id);
      },
    ],
    [
      "plus",
      _T("app_add_devices"),
      function () {
        showPopup("hue-devices", true);
      },
    ],
    [
      "bolt",
      _T("app_add_automation"),
      function () {
        showPopup("hue-newauto", true);
      },
    ],
    [
      "motion",
      _T("app_add_motionaware"),
      function () {
        showPopup("hue-mw-intro", true);
      },
    ],
  ];
  var title = mk("div", "lb");
  title.textContent = _T("app_tap_to_add") + A(id).friendly_name;
  title.style.margin = "22px 20px 12px";
  body.appendChild(title);
  var grid = mk("div", "addgrid");
  items.forEach(function (it) {
    var t = mk("div", "atile", "<span class='ci'></span><span></span>");
    t.querySelector(".ci").innerHTML = svg(it[0]);
    t.lastChild.textContent = it[1];
    hpActive(t, it[2]);
    grid.appendChild(t);
  });
  body.appendChild(grid);
}

/* The room's or zone's own page for changing its name, devices or lights (the Hue Plus menu's, huerooms.js). */
function hpFindGroup(id, then) {
  hueplus.resources(["rooms", "zones"]).then(
    function (r) {
      var type = A(id).hue_type,
        g = (type === "zone" ? r.zones : r.rooms || []).filter(function (x) {
          return x.name === A(id).friendly_name;
        })[0];
      if (g) then(type, g);
      else toast(_T("nothing_found"));
    },
    function () {
      toast(_T("hn_couldn_t_read_the_hue_bridge"));
    }
  );
}

function hpEditGroup(id) {
  hpFindGroup(id, hrwStart);
}

function hpDeleteGroup(id) {
  hpFindGroup(id, function (type, g) {
    confirmDlg(_T(type === "zone" ? "hrw_delete_this_zone" : "hrw_delete_this_room"), function () {
      var data = { confirm: true };
      data[type] = g.id;
      callRaw("hue_plus", "delete_" + type, data).then(
        function () {
          closeSheet();
        },
        function () {
          toast(_T("hrw_couldn_t_save"));
        }
      );
    });
  });
}

HC.registerPage(
  "app-room",
  function (id) {
    return A(id).friendly_name || _T("home");
  },
  "home",
  hpRoomPage
);
HC.registerPage(
  "app-add",
  function (id) {
    return A(id).friendly_name || _T("home");
  },
  "plus",
  hpAddPage
);

/* The light screens of the Hue app: a light's or a room's colour wheel, the white and effects pages and the brightness button, and the scene editor (the same screen with SAVE).
 The panel itself is Home Control's, run as it is in a frame of its own (popup.html, with a copy of Home Control's dashboard code in lights/); this file only gives it a page: the bar above it, and the
 frame under the bar. Nothing is kept in Home Assistant: what a change does goes to the lights, which are the bridge's. */

var HP_BASE = document.currentScript ? new URL(".", document.currentScript.src).href : "/hue_plus_static/";
var HP_VERSION = document.currentScript ? new URL(document.currentScript.src).searchParams.get("v") || "" : "";

var HPLF = { el: null, win: null, ready: false, waiting: [] };

/* The frame starts when the first light screen is asked for and stays, so the next one opens at once. */
function hpLightFrame(then) {
  if (HPLF.ready) {
    then(HPLF.win);
    return;
  }
  HPLF.waiting.push(then);
  if (HPLF.el) return;
  var f = mk("iframe", "lightframe");
  f.title = _T("app_light_panel");
  f.src = new URL("popup.html", HP_BASE).href + (HP_VERSION ? "?v=" + encodeURIComponent(HP_VERSION) : "");
  document.body.appendChild(f);
  HPLF.el = f;
  var wait = setInterval(function () {
    var w = f.contentWindow;
    if (!w || !w.HuePopup) return;
    if (!HPLF.win) {
      HPLF.win = w;
      w.HuePopup.attach(HPAPI.hass());
    }
    if (w.HuePopup.isReady()) {
      clearInterval(wait);
      HPLF.ready = true;
      HPLF.waiting.splice(0).forEach(function (fn) {
        fn(w);
      });
    }
  }, 60);
}

/* The frame gets Home Assistant's hass whenever the panel does, so the lights in it follow their states. */
window.HueHost.onHass = function (h) {
  if (HPLF.win && HPLF.win.HuePopup) HPLF.win.HuePopup.attach(h);
};

function hpFrameShow(on) {
  if (!HPLF.el) return;
  var bar = document.querySelector(".pg .pbar");
  HPLF.el.style.top = bar ? bar.offsetHeight + "px" : "0";
  HPLF.el.classList.toggle("show", !!on);
}

/* Every page that is drawn takes the frame away; a light screen puts it back. */
window.HueHost.onRender = function () {
  hpFrameShow(false);
};

function hpLightScreen(body, ids, name) {
  var wait = mk("div", "empty");
  wait.textContent = _T("loading");
  body.appendChild(wait);
  var token = (HC.sheet.light = {});
  hpLightFrame(function (win) {
    if (HC.sheet.light !== token) return;
    wait.remove();
    win.HuePopup.panel(ids, name);
    hpFrameShow(true);
  });
}

/* A light or a group: its page is the panel. */
function hpLightPage(body, id) {
  hpLightScreen(body, [id], A(id).friendly_name || id);
}

/* The editor of a scene's lights (the Hue app's "New scene" and a scene's lights): the same screen, with SAVE. The lights show what is set while it is open; leaving after a change asks, and discarding
 puts them back as they were. o = { name, lights, onSave(acts), after }; onSave answers true (or a promise of true) when it kept the scene. */
var HPEDIT = null;

function hpEditLights(o) {
  HPEDIT = { o: o, snap: null };
  call("light", "turn_on", { entity_id: o.lights });
  showPopup("app-edit", true);
}

function hpEditPage(body) {
  if (!HPEDIT) {
    body.appendChild(mk("div", "empty")).textContent = _T("nothing_found");
    return;
  }
  var E = HPEDIT,
    o = E.o,
    token = (HC.sheet.light = {}),
    wait = mk("div", "empty");
  wait.textContent = _T("loading");
  body.appendChild(wait);
  hpLightFrame(function (win) {
    if (HC.sheet.light !== token) return;
    wait.remove();
    /* The lights were just switched on: the picture is taken when they have settled, so that "changed" means changed by the person. */
    setTimeout(function () {
      if (HC.sheet.light !== token) return;
      E.snap = win.HuePopup.snapshot(o.lights);
      win.HuePopup.panel(o.lights, o.name);
      hpFrameShow(true);
    }, 700);
  });
  guardUnsaved({
    dirty: function () {
      return !!(E.snap && HPLF.win && HPLF.win.HuePopup.snapshot(o.lights) !== E.snap);
    },
    discard: function () {
      if (E.snap) HPLF.win.HuePopup.restore(E.snap);
    },
    save: function (leave) {
      return Promise.resolve(o.onSave(HPLF.win.HuePopup.acts(o.lights))).then(function (ok) {
        if (ok === false) return false;
        E.snap = null;
        if (o.after) o.after();
        else leave();
        return true;
      });
    },
  });
}

window.HueHost.editLights = hpEditLights;

HC.registerPage(
  "app-light",
  function (id) {
    return A(id).friendly_name || _T("light");
  },
  "lamp",
  hpLightPage
);
HC.registerPage(
  "app-edit",
  function () {
    return HPEDIT && HPEDIT.o.name ? HPEDIT.o.name : _T("app_edit_the_lights");
  },
  "palette",
  hpEditPage
);

/* The Sync tab: what the Hue app's Sync tab has that Hue Plus can do: the Spotify sync (music), the Hue Play HDMI Sync Box (TV and games), and the bridge's entertainment areas.
 The rows and their pages are the ones the Hue Plus menu already has (huesync.js, huemenu.js). */

function hpSyncEntities(test) {
  var h = H();
  return Object.keys(h.states)
    .filter(function (id) {
      var e = h.entities[id];
      return test(h, id) && !(e && e.hidden);
    })
    .sort();
}

function hpSyncTab(outer) {
  var head = mk("div", "hd", "<h1></h1>");
  head.querySelector("h1").textContent = _T("app_sync");
  outer.appendChild(head);
  var box = mk("div");
  outer.appendChild(box);
  hmBox(box);
  var sync = hpSyncEntities(function (h, id) {
      return HUESYNC.isSync(h, id);
    }),
    boxes = hpSyncEntities(function (h, id) {
      return HUESYNCBOX.isBox(h, id);
    });
  box.appendChild(hmLabel(_T("app_music")));
  if (sync.length) {
    sync.forEach(function (id) {
      box.appendChild(hsyncRow({ id: id, name: _T("spotify_sync"), icon: "syncring" }));
    });
  } else box.appendChild(hmCallout(_T("app_no_spotify_sync")));
  box.appendChild(hmLabel(_T("app_tv_and_games")));
  if (boxes.length) {
    boxes.forEach(function (id) {
      box.appendChild(hsboxRow({ id: id, name: _T("hue_play_hdmi_sync_box"), icon: "syncring" }));
    });
  } else box.appendChild(hmCallout(_T("app_no_sync_box")));
  box.appendChild(hmLabel(_T("entertainment_areas")));
  hmLoad(box, ["entertainment_areas"], function (inner, r) {
    var list = r.entertainment_areas || [];
    if (!list.length) {
      inner.appendChild(hmCallout(_T("app_no_entertainment_areas")));
      return;
    }
    inner.appendChild(
      hmGroup(
        list.map(function (x) {
          return hmRow({
            icon: "eq",
            title: x.name,
            sub: cntS((x.lights || []).length, _T("hm_light"), _T("hm_lights")),
            tap: "hue-area:" + x.id,
          });
        })
      )
    );
  });
}


  /* Registration with the dashboard. */
  HC.addStrings(PLUGIN_STRINGS);
  Object.keys(HP_PAGES).forEach(function (key) {
    HC.registerPage(key, HP_PAGES[key][0], HP_PAGES[key][1], HP_PAGES[key][2]);
  });
  HC.registerSettings({
    id: "hue",
    title: "hue_plus",
    icon: "lights",
    page: "stg-hue",
    sub: function () {
      return _T("firmware_zigbee_matter_and_apps");
    },
    visible: hpShown,
    keywords: "hue plus bridge firmware updates zigbee matter routines automations entertainment motion lights",
  });
  /* The Spotify sync and the Hue Play HDMI Sync Box: rows of the Lights section that look like lights, their popups, and what plays on a light. */
  HC.addStyles(HUE_PLUS_CSS);
  HC.addStyles(HUE_NEW_CSS);
  HC.registerPage("hsync", "spotify_sync", "syncring", function (body, id) {
    hsyncPopup(body, id);
  });
  HC.registerPage("hsbox", "hue_play_hdmi_sync_box", "syncring", function (body, id) {
    hsboxPopup(body, id);
  });
  Object.keys(HS_PICK).forEach(function (key) {
    HC.registerPage(key, HS_PICK[key][0], HS_PICK[key][1], HS_PICK[key][2]);
  });
  HC.registerDeviceKind({
    match: function (id) {
      return HUESYNC.isSync(H(), id);
    },
    pop: "hsync",
    icon: "syncring",
    search: "light",
    row: hsyncRow,
  });
  HC.registerDeviceKind({
    match: function (id) {
      return HUESYNCBOX.isBox(H(), id);
    },
    pop: "hsbox",
    icon: "syncring",
    search: "light",
    row: hsboxRow,
  });
  HC.registerPlayback({
    plays: function (id) {
      var sw = lightSyncPlays(id);
      return sw
        ? {
            entity: sw,
            label: _T("spotify_sync"),
            pct: function () {
              return hsyncPct(sw);
            },
          }
        : null;
    },
  });

  /* Hue's scenes: the room's scene rows, their popup, the scene tiles of the light panel, and importing one as a live scene. */
  HC.registerPage(
    "hue-scene",
    function (id) {
      return A(id.split("~")[0]).name || A(id.split("~")[0]).friendly_name || _T("scenes");
    },
    "palette",
    function (body, id) {
      var q = id.split("~");
      hueScenePopup(body, q[0], q[1] ? roomById(q[1]) : null);
    }
  );
  HC.registerSceneKind({
    match: function (id) {
      return HUESCENES.isHue(H(), id);
    },
    icon: "palette",
    popup: "hue-scene",
    active: function (id) {
      return HUESCENES.active(H(), id);
    },
    toggle: hueSceneToggle,
    remove: hueSceneRemove,
    start: hueSceneStart,
    dynamic: function (id) {
      return A(id).is_dynamic !== false;
    },
    palette: hueScenePalette,
  });
  /* The Hue app's "Add a scene", in the new-scene popup of a scenes section. */
  HC.registerPage("hue-lights", "hn_choose_your_lights", "palette", function (body) {
    hueLightsPage(body);
  });
  HC.registerPage("hue-add-scene", "hn_add_a_scene", "palette", function (body) {
    hueAddScenePage(body);
  });
  HC.registerPage("hue-scene-name", "hn_name_your_scene", "palette", function (body) {
    hueNamePage(body);
  });
  HC.registerPage("hue-all-day", "hn_all_day_scene", "clock", function (body) {
    hueAllDayPage(body);
  });
  HC.registerPage("hue-photo", "hn_from_photo", "cam", function (body) {
    huePhotoPage(body);
  });
  HC.registerSceneMaker({
    id: "hue",
    title: "hn_hue_scene",
    sub: "hn_hue_scene_sub",
    icon: "palette",
    available: function () {
      return hueplus.has(H(), "create_scene") && hueGroups().length > 0;
    },
    start: hueStartMaker,
  });
  HC.registerSceneImport({
    id: "hue",
    title: "import_a_live_scene_from_hue",
    sub: "copies_its_colours_and_speed",
    unavailable: "importing_a_hue_scene_needs_hue_plus",
    empty: "no_hue_scenes_found",
    failed: "couldn_t_read_that_scene_from_the_hue_bridge",
    available: hueImportable,
    list: function () {
      return hueLiveScenes().map(function (id) {
        return { id: id, name: A(id).name || id, group: A(id).group_name || "" };
      });
    },
    read: function (id) {
      return serviceResponse("hue_plus", "import_hue_scene", { entity_id: id });
    },
  });

  /* Importing a static scene: a classic scene with what the bridge sets each of its lights to, as "save the lights as they are" makes from the lights now. */
  HC.registerSceneImport({
    id: "hue-classic",
    classic: true,
    title: "import_a_classic_scene_from_hue",
    sub: "copies_what_it_sets_each_light_to",
    unavailable: "importing_a_hue_scene_needs_hue_plus",
    empty: "no_static_hue_scenes_found",
    failed: "couldn_t_read_that_scene_from_the_hue_bridge",
    available: hueImportable,
    list: function () {
      return hueStaticScenes().map(function (id) {
        return { id: id, name: A(id).name || id, group: A(id).group_name || "" };
      });
    },
    read: function (id) {
      return serviceResponse("hue_plus", "import_hue_scene", { entity_id: id }).then(function (r) {
        return { name: r.name, lights: r.states };
      });
    },
  });

  /* The styles of a Hue light made of zones. */
  HC.registerLightStyle({
    applies: hueStyleApplies,
    blends: hueStyleBlends,
    icon: function (id) {
      return lpStyleIcon(A(id).gradient_mode);
    },
    popup: lpStylePopup,
  });

  HC.registerAreaHooks("hue_plus", {
    importRow: hpAreaImport,
    actions: hpAreaActions,
    lights: hpBridgeLights,
    save: hpSaveBridge,
    /* What the area editor shows for each light of an area on the bridge: how bright it is next to the others. */
    lightRows: function () {
      return [
        {
          field: "balance",
          label: "hm_brightness_balance",
          min: 0.2,
          max: 2,
          step: 0.1,
          def: 1,
          round: function (v) {
            return Math.round(v * 10) / 10;
          },
          fmt: function (v) {
            return v.toFixed(1) + "×";
          },
        },
      ];
    },
  });
})();
