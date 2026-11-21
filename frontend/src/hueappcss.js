/* The pieces of the panel's pages, drawn in Home Control's own theme (its raised surfaces, thin lines, rounded rows and accent). They apply inside Home Control's popup only (`.sheet`): the panel draws the same pages in the Hue
 app's way with its own style sheet. */
HUE_PLUS_CSS += "\n/* the pages of the panel, in Home Control's theme */\n" +
  ".sheet .rbt{width:34px;height:34px;border-radius:50%;border:1px solid var(--f-line2);background:var(--f-raise);color:var(--ink);display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none;padding:0}\n" +
  ".sheet .rbt svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}\n" +
  ".sheet .rbt.blue{background:var(--acc);border-color:transparent;color:#03140f}\n" +
  ".sheet .disc{display:block;width:100%;height:100%;border-radius:50%;background:#f9d27a;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}\n" +
  ".sheet .disc.dark{display:flex;align-items:center;justify-content:center;background:var(--f-raise);color:var(--ink)}\n" +
  ".sheet .disc.dark svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round}\n" +
  ".sheet .empty{color:var(--ink2);text-align:center;padding:30px 12px;font-size:var(--fs-l)}\n" +
  ".sheet .lbrow{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:var(--sp-head)}\n" +
  ".sheet .lbrow .hm-label{flex:1;margin:0}\n" +
  ".sheet .lbtitle{flex:1;font-size:var(--fs-l);font-weight:600}\n" +
  ".sheet .pintro{padding:6px 6px 10px;font-size:var(--fs-m);line-height:1.5;color:var(--ink2)}\n" +
  ".sheet .pintro b{color:var(--ink);font-weight:600}\n" +
  ".sheet .pintro.small{font-size:var(--fs-s)}\n" +
  ".sheet .hm-row .rend{flex:none;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;margin-left:6px}\n" +
  ".sheet .hm-row .rend .disc{width:40px;height:40px}\n" +
  ".sheet .hm-row .rend.ico{background:var(--f-raise);border:1px solid var(--f-line2);color:var(--ink)}\n" +
  ".sheet .hm-row .rend.ico svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.9}\n" +
  ".sheet .hm .hm-row.nochev .hm-c{display:none}\n" +
  /* a switch: its name with its picture, the buttons as tiles, the lights it acts on */
  ".sheet .swhead{display:flex;align-items:center;gap:14px;padding:4px 6px 14px}\n" +
  ".sheet .swhead .ic{flex:none}\n" +
  ".sheet .swhead .ic svg{width:30px;height:30px;fill:none;stroke:currentColor;stroke-width:1.8}\n" +
  ".sheet .swhead .nm{flex:1;font-size:22px;font-weight:700;line-height:1.15;overflow-wrap:anywhere}\n" +
  ".sheet .btiles{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 14px;scrollbar-width:none}\n" +
  ".sheet .btiles::-webkit-scrollbar{display:none}\n" +
  ".sheet .btile{flex:none;width:96px;height:104px;border-radius:var(--r-s);background:var(--f-raise);border:1px solid var(--f-line2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;cursor:pointer}\n" +
  ".sheet .btile.sel{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc)}\n" +
  ".sheet .btile .ic svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}\n" +
  ".sheet .btile b{font-size:var(--fs-s);font-weight:500;text-align:center;padding:0 6px}\n" +
  ".sheet .selroom{display:flex;align-items:center;gap:12px;margin:0 0 var(--sp);padding:12px 14px;border-radius:var(--r-row);background:var(--f-raise);border:1px solid var(--f-line2)}\n" +
  ".sheet .selroom .ic svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8}\n" +
  ".sheet .selroom b{display:block;font-size:var(--fs-m);font-weight:600}\n" +
  ".sheet .selroom i{display:block;font-style:normal;font-size:var(--fs-s);color:var(--ink2)}\n" +
  /* scenes: round tiles with the colours of the scene, a scene's page */
  ".sheet .pgrid{display:flex;flex-wrap:wrap;gap:10px;padding:2px 0 var(--sp)}\n" +
  ".sheet .sitem{flex:none;width:calc(25% - 8px);min-width:74px;height:96px;border-radius:var(--r-row);background:var(--f-raise);border:1px solid var(--f-line2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:6px;cursor:pointer}\n" +
  ".sheet .sitem .dc{width:44px;height:44px}\n" +
  ".sheet .sitem.on{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc)}\n" +
  ".sheet .sitem b{font-size:var(--fs-s);font-weight:500;line-height:1.2;text-align:center;max-width:100%;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}\n" +
  ".sheet .pgrid.scrows{display:block;overflow-x:auto;scrollbar-width:none}\n" +
  ".sheet .pgrid.scrows .scr{display:flex;align-items:center;gap:10px;width:max-content;margin-bottom:10px}\n" +
  ".sheet .pgrid.scrows .sitem{width:88px}\n" +
  ".sheet .scenepg{--bg:transparent}\n" +
  ".sheet .schead{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;padding:18px 16px 16px;margin:0 0 var(--sp);border-radius:var(--r-m);background:linear-gradient(160deg,color-mix(in srgb,var(--sc1,#8a7a4a) 55%,transparent),color-mix(in srgb,var(--sc2,#2a2a2c) 45%,transparent) 70%,transparent)}\n" +
  ".sheet .schead .big{flex:0 0 100%;order:-1;width:46px;height:46px}\n" +
  ".sheet .schead .big .disc{width:46px;height:46px}\n" +
  ".sheet .schead .nm{flex:1;font-size:26px;font-weight:700;line-height:1.1;overflow-wrap:anywhere}\n" +
  ".sheet .lightsbar{margin:var(--sp-head)}\n" +
  ".sheet .colorsbtn,.sheet .resetbtn,.sheet .deletebtn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid var(--f-line2);border-radius:999px;background:var(--f-raise);color:var(--ink);padding:10px 18px;font-size:var(--fs-m);font-weight:600;cursor:pointer}\n" +
  ".sheet .colorsbtn svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}\n" +
  ".sheet .resetbtn,.sheet .deletebtn{display:flex;margin:12px auto}\n" +
  ".sheet .deletebtn{border-color:#c0504e;color:#ff9b97}\n" +
  ".sheet .spsheet{padding:20px 16px 8px;text-align:center}\n" +
  ".sheet .spcap{display:block;font-size:var(--fs-xs);letter-spacing:.14em;color:var(--ink2)}\n" +
  ".sheet .spval{display:block;font-size:var(--fs-l);font-weight:600;margin:4px 0 20px}\n" +
  ".sheet .sptrack{position:relative;height:8px;border-radius:4px;background:var(--f-line2);margin:0 12px;touch-action:none;cursor:pointer}\n" +
  ".sheet .spfill{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:var(--acc)}\n" +
  ".sheet .spthumb{position:absolute;top:50%;width:22px;height:22px;border-radius:50%;background:#fff;margin:-11px 0 0 -11px;box-shadow:0 1px 4px rgba(0,0,0,.4)}\n" +
  ".sheet .spticks{display:flex;justify-content:space-between;margin:12px 2px 0;font-size:var(--fs-xs);color:var(--ink2)}\n" +
  /* entertainment areas and what is chosen among lights */
  ".sheet .ltiles{display:flex;gap:10px;overflow-x:auto;padding:0 0 6px;scrollbar-width:none}\n" +
  ".sheet .ptile.sm{position:relative;flex:none;width:92px;height:108px;border-radius:var(--r-s);background:var(--f-raise);border:1px solid var(--f-line2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font-size:var(--fs-s);text-align:center}\n" +
  ".sheet .ptile .ic svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8}\n" +
  ".sheet .ptile b{font-weight:500;padding:0 6px}\n" +
  ".sheet .ptile .minus{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);width:24px;height:24px;border-radius:50%;border:0;background:#d8353b;color:#fff;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer}\n" +
  ".sheet .ptile .minus svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.4}\n" +
  /* automations: groups of cards */
  ".sheet .agroup{margin-top:var(--sp)}\n" +
  ".sheet .ahead{display:flex;align-items:center;gap:12px;padding:6px 4px 10px}\n" +
  ".sheet .ahead .ic svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.7}\n" +
  ".sheet .ahead b{flex:1;font-size:var(--fs-m);font-weight:600}\n" +
  ".sheet .ahead i{font-style:normal;color:var(--ink2);font-size:var(--fs-s)}\n" +
  ".sheet .agroup.folded .acards{display:none}\n" +
  ".sheet .acards{display:flex;flex-direction:column;gap:var(--sp)}\n" +
  ".sheet .acard{display:flex;align-items:center;gap:12px;background:var(--f-raise);border:1px solid var(--f-line2);border-radius:var(--r-m);padding:14px 16px;cursor:pointer}\n" +
  ".sheet .acard .tx{flex:1;min-width:0}\n" +
  ".sheet .acard b{display:block;font-size:var(--fs-m);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n" +
  ".sheet .acard i{display:block;font-style:normal;font-size:var(--fs-s);color:var(--ink2);margin-top:2px}\n" +
  /* time wheels (the time updates are installed) and the scene cycle's rows */
  ".sheet .wheels{position:relative;display:flex;justify-content:center;padding:6px 16px 10px;background:var(--f-raise)}\n" +
  ".sheet .wheels .band{position:absolute;left:16px;right:16px;top:50%;height:36px;margin-top:-12px;border-radius:10px;background:var(--f-line2);opacity:.6;pointer-events:none}\n" +
  ".sheet .wheel{position:relative;flex:1;height:180px;overflow-y:auto;scroll-snap-type:y mandatory;scrollbar-width:none;text-align:center}\n" +
  ".sheet .wheel::-webkit-scrollbar{display:none}\n" +
  ".sheet .wheel .pad{height:72px}\n" +
  ".sheet .wheel .wv{height:36px;line-height:36px;scroll-snap-align:center;font-size:17px;font-variant-numeric:tabular-nums}\n" +
  ".sheet .lifting{position:relative;z-index:60;box-shadow:0 10px 28px rgba(0,0,0,.45);filter:brightness(1.2);transition:none!important}\n" +
  ".sheet .hm-group.cyc .hm-row{touch-action:pan-y;user-select:none;-webkit-user-select:none}\n" +
  ".sheet .hm .hm-group.card{overflow:hidden}\n"
  + ".sheet .htabs{display:flex;gap:6px;padding:4px;margin:0 0 var(--sp);border-radius:var(--r-row);background:var(--f-raise);border:1px solid var(--f-line2)}\n"
  + ".sheet .htabb{flex:1;border:0;border-radius:calc(var(--r-row) - 4px);background:none;color:var(--ink2);padding:9px 6px;font-size:var(--fs-m);font-weight:600;cursor:pointer}\n"
  + ".sheet .htabb.on{background:var(--f-line2);color:var(--ink)}\n"
  + ".sheet .hd h1{display:none}\n"
  + ".sheet .hd .acts{display:flex;justify-content:flex-end;margin-bottom:var(--sp)}\n"
  + ".sheet button.tg{width:46px;height:28px;border-radius:14px;border:0;background:var(--f-line2);position:relative;cursor:pointer;flex:none;padding:0}\n"
  + ".sheet button.tg i{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s}\n"
  + ".sheet button.tg.on{background:var(--acc)}\n"
  + ".sheet button.tg.on i{transform:translateX(18px)}\n";
