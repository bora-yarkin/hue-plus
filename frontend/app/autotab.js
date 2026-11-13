/* The Automations tab, as the Hue app draws it: a blue top, the title with a round plus, and the bridge's automations in a group for each kind (its icon, its name, how many, and a button that folds it), each automation a card with
 its time and name, the days it repeats, and a switch. A card opens the automation's own page (the Hue Plus menu's); the plus is the new-automation wizard. */

var HP_AUTO_KINDS = [
  ["wake_up", "app_k_wake_up", "bright"],
  ["go_to_sleep", "hw_go_to_sleep", "moon"],
  ["coming_home", "hw_coming_home", "home"],
  ["leaving_home", "hw_leaving_home", "leave"],
  ["mimic_presence", "hw_mimic_presence", "home"],
  ["timer", "hw_timer", "clock"],
  ["schedule", "hw_lighting_schedule", "clock"],
];

var HP_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
var HP_FOLDED = {};

/* The first value under `key` anywhere in what the bridge keeps for an automation. */
function hpDeep(node, key) {
  if (!node || typeof node !== "object") return undefined;
  if (node[key] !== undefined) return node[key];
  var names = Object.keys(node);
  for (var i = 0; i < names.length; i++) {
    var found = hpDeep(node[names[i]], key);
    if (found !== undefined) return found;
  }
  return undefined;
}

function hpPad(n) {
  return (n < 10 ? "0" : "") + n;
}

/* "06:00" from the automation's time point, when it has one. */
function hpAutoTime(x) {
  var t = hpDeep(x.configuration, "time_point");
  t = t && t.time;
  return t && typeof t.hour === "number" ? hpPad(t.hour) + ":" + hpPad(t.minute || 0) : "";
}

/* "Every Wednesday", "Every day", "Weekdays" from the days it repeats. */
function hpAutoDays(x) {
  var d = hpDeep(x.configuration, "recurrence_days");
  if (!Array.isArray(d) || !d.length) return "";
  var set = HP_DAYS.filter(function (n) {
    return d.indexOf(n) >= 0;
  });
  if (set.length === 7) return _T("app_every_day");
  if (set.length === 5 && set.indexOf("saturday") < 0 && set.indexOf("sunday") < 0) return _T("app_weekdays");
  return _T("app_every") + set
    .map(function (n) {
      return _T("hw_day_long_" + n);
    })
    .join(", ");
}

function hpAutoCard(x, again) {
  var card = mk("div", "acard", "<div class='tx'><b></b><i></i></div>"),
    time = hpAutoTime(x);
  card.querySelector("b").textContent = (time ? time + " • " : "") + x.name;
  card.querySelector("i").textContent = hpAutoDays(x) || x.script || "";
  var tg = hpToggle(
    x.name,
    function () {
      return !!x.enabled;
    },
    function () {
      x.enabled = !x.enabled;
      hpDo(again, "update_automation", { automation: x.id, enabled: x.enabled });
      refresh();
    }
  );
  card.appendChild(tg);
  hpActive(card, function () {
    showPopup("hue-routine:" + x.id, true);
  });
  return card;
}

function hpAutomationsTab(box) {
  var head = mk("div", "hd", "<h1></h1><div class='acts'></div>");
  head.querySelector("h1").textContent = _T("automations");
  if (isAdmin()) head.querySelector(".acts").appendChild(hpRound("plus", _T("hw_new_automation"), function () {
    showPopup("hue-newauto", true);
  }));
  head.querySelector(".acts .rbt") && head.querySelector(".acts .rbt").classList.add("blue");
  box.appendChild(head);
  hmLoad(box, ["automations"], function (inner, r, again) {
    var list = r.automations || [];
    if (!list.length) {
      inner.appendChild(mk("div", "empty")).textContent = _T("nothing_found");
      return;
    }
    HP_AUTO_KINDS.forEach(function (k) {
      var mine = list.filter(function (x) {
        return hwKindOf(x) === k[0];
      });
      if (!mine.length) return;
      var g = mk("div", "agroup"),
        top = mk("div", "ahead", "<span class='ic'></span><b></b><i></i>"),
        fold = hpRound("chev", _T("app_fold"), function () {
          HP_FOLDED[k[0]] = !HP_FOLDED[k[0]];
          g.classList.toggle("folded", !!HP_FOLDED[k[0]]);
        });
      top.querySelector(".ic").innerHTML = svg(k[2]);
      top.querySelector("b").textContent = _T(k[1]);
      top.querySelector("i").textContent = String(mine.length);
      fold.classList.add("fold");
      top.appendChild(fold);
      g.classList.toggle("folded", !!HP_FOLDED[k[0]]);
      g.appendChild(top);
      var cards = mk("div", "acards");
      mine.forEach(function (x) {
        cards.appendChild(hpAutoCard(x, again));
      });
      g.appendChild(cards);
      inner.appendChild(g);
    });
    /* The bridge's own automations (its dimmer switches, the light state after streaming) are not in the app's list. */
  });
}
