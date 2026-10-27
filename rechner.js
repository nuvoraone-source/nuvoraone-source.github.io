/* Nuvora – Rechner-Oberfläche.
   Hier steht KEINE Rechenlogik: Die Berechnung läuft auf dem Server (Cloudflare Worker).
   Die Adresse des Servers steht in config.js. */
(function () {
  "use strict";

  var LANG = document.documentElement.lang === "en" ? "en" : "de";
  var API = (window.NUVORA_CALC_API || "").replace(/\/+$/, "");

  var T = {
    de: {
      bauart: "Bauart", length: "Länge (m)", height: "Höhe (m)", kunstleder: "Kunstleder (g/m²)",
      bahnbreite: "Bahnbreite", hinterlegt: "Hinterlegt mit", bahnen: "Hinterlegte Bahnen",
      okprofil: "OK-Profil (mm)", hubrohr: "Hubrohr (mm)", netztyp: "Netztyp (mm)", netzhoehe: "Netzhöhe (m)",
      welle: "Welle Ø (mm)", sicher: "Sicherheitswicklungen", gurt: "Gurtbanddicke (mm)",
      reib: "Reibungsfaktor", zweite: "2te Profillage", zmotor: "Zähne Motor", zwelle: "Zähne Welle",
      custom: "Eigener Wert …", customPh: "Wert eingeben",
      b_wellenanlage: "Wellenanlage", b_zentral: "Zentrale Wickelwelle", b_zwei: "Zwei Wellenausführung",
      b_netz: "Ballfangnetz Motorisch (nur Netz)", b_hallenteiler: "Hallenteiler (oben Netz, unten Leder)",
      ganz: "Ganze Bahnen", halb: "Halbe Bahnen", nein: "Nein", ja: "Ja",
      baumwolle: "Baumwolle", molton: "Molton", vlies: "Vlies",
      rohr114: "Rohr 1 1/4", kein: "kein Hubrohr",
      calc: "Berechnen", results: "Ergebnis",
      r_technik: "Gewicht Technik", r_behang: "Gewicht Behang", r_gesamt: "Gesamtgewicht", r_hub: "Hubgewicht",
      r_motor: "Getriebemotor", r_maxtorque: "Max. Drehmoment", r_ratio: "Übersetzung",
      r_req: "Erforderliches Drehmoment", r_res: "Drehmomentreserve", r_limit: "Max. Endschalter",
      r_fang: "Fangvorrichtung", r_fangm: "Fangmoment", r_maxrpm: "Max. Betriebsdrehzahl",
      r_motorrpm: "Motordrehzahl", r_speed: "Geschwindigkeit", r_time: "Öffnungszeit",
      r_ganz: "Ganze Bahnen", r_halb: "Halbe Bahnen", r_viertel: "Viertel Bahnen",
      notAllowed: "Nicht zulässig", special: "Sonderkonstruktion", rpm: "U/min", min: "min.",
      errValues: "Bitte Werte eingeben.", checkHeight: "Bitte Höhe überprüfen.",
      checkTrans: "Bitte Übersetzung überprüfen.", errServer: "Der Rechner ist gerade nicht erreichbar. Bitte später erneut versuchen.",
      errLimit: "Zu viele Anfragen. Bitte kurz warten.", notConnected: "Der Rechner ist noch nicht freigeschaltet.",
      busy: "Berechne …"
    },
    en: {
      bauart: "Design", length: "Length (m)", height: "Height (m)", kunstleder: "Artificial leather (g/m²)",
      bahnbreite: "Panel width", hinterlegt: "Backed with", bahnen: "Backed panels",
      okprofil: "Top profile (mm)", hubrohr: "Lifting tube (mm)", netztyp: "Net type (mm)", netzhoehe: "Net height (m)",
      welle: "Shaft Ø (mm)", sicher: "Safety windings", gurt: "Strap thickness (mm)",
      reib: "Friction factor", zweite: "2nd profile layer", zmotor: "Teeth motor", zwelle: "Teeth shaft",
      custom: "Custom value …", customPh: "Enter value",
      b_wellenanlage: "Shaft system", b_zentral: "Central winding shaft", b_zwei: "Two-shaft design",
      b_netz: "Motorised ball-stop net (net only)", b_hallenteiler: "Hall divider (net on top, leather below)",
      ganz: "Full panels", halb: "Half panels", nein: "No", ja: "Yes",
      baumwolle: "Cotton", molton: "Molton", vlies: "Fleece",
      rohr114: "Tube 1 1/4", kein: "no lifting tube",
      calc: "Calculate", results: "Result",
      r_technik: "Weight technology", r_behang: "Weight curtain", r_gesamt: "Total weight", r_hub: "Lifting weight",
      r_motor: "Gear motor", r_maxtorque: "Max. torque", r_ratio: "Ratio",
      r_req: "Required torque", r_res: "Torque reserve", r_limit: "Max. limit switch",
      r_fang: "Safety brake", r_fangm: "Catch torque", r_maxrpm: "Max. operating speed",
      r_motorrpm: "Motor speed", r_speed: "Speed", r_time: "Opening time",
      r_ganz: "Full panels", r_halb: "Half panels", r_viertel: "Quarter panels",
      notAllowed: "Not permitted", special: "Special construction", rpm: "rpm", min: "min.",
      errValues: "Please enter values.", checkHeight: "Please check the height.",
      checkTrans: "Please check the gear ratio.", errServer: "The calculator is not reachable right now. Please try again later.",
      errLimit: "Too many requests. Please wait a moment.", notConnected: "The calculator is not enabled yet.",
      busy: "Calculating …"
    }
  }[LANG];

  var NETZTYPEN = ["40 x 2,0", "40 x 3,0", "45 x 1,6", "45 x 2,0", "45 x 2,5", "45 x 3,0", "45 x 4,0",
    "100 x 2,0", "100 x 2,5", "100 x 3,0", "100 x 4,0"];

  var state = {
    bauart: "wellenanlage", length: "27", height: "7", bahnbreite: "ganz", hinterlegt: "nein",
    bahnen: "0", okProfil: "40", hubrohr: "60", netztyp: "45 x 2,0", netzHoehe: "3,5",
    kunstleder: "1200", wdurch: "75", sicherWickl: "3", gurtband: "1,2", reib: "1,067",
    zweiteProfil: "nein", zaehneMotor: "14", zaehneWelle: "56"
  };
  var bahnenOptions = ["0"];
  var optTimer = null;

  var form = document.getElementById("calc-form");
  var out = document.getElementById("calc-out");
  var btn = document.getElementById("calc-btn");
  var note = document.getElementById("calc-note");

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { e.appendChild(c); });
    return e;
  }

  function field(label, control) {
    return el("label", { "class": "f" }, [el("span", { text: label }), control]);
  }

  function select(key, options, onChange, disabled) {
    var s = el("select", {});
    options.forEach(function (o) {
      var opt = el("option", { value: o[0], text: o[1] });
      if (String(state[key]) === String(o[0])) opt.selected = true;
      s.appendChild(opt);
    });
    if (disabled) s.disabled = true;
    s.addEventListener("change", function () { state[key] = s.value; changed(); if (onChange) onChange(); });
    return s;
  }

  function text(key, mode) {
    var i = el("input", { type: "text", inputmode: mode || "decimal", autocomplete: "off", value: state[key] });
    i.addEventListener("input", function () { state[key] = i.value; changed(); });
    return i;
  }

  // Auswahl mit Möglichkeit, einen eigenen Wert einzugeben
  function combo(key, values, mode) {
    var wrap = el("div", { "class": "combo" });
    var isCustom = values.indexOf(state[key]) === -1;
    var s = el("select", {});
    values.forEach(function (v) {
      var o = el("option", { value: v, text: v });
      if (!isCustom && state[key] === v) o.selected = true;
      s.appendChild(o);
    });
    var c = el("option", { value: "__custom", text: T.custom });
    if (isCustom) c.selected = true;
    s.appendChild(c);
    var i = el("input", { type: "text", inputmode: mode || "decimal", placeholder: T.customPh, value: isCustom ? state[key] : "" });
    i.hidden = !isCustom;
    s.addEventListener("change", function () {
      if (s.value === "__custom") { i.hidden = false; i.focus(); state[key] = i.value; }
      else { i.hidden = true; state[key] = s.value; }
      changed();
    });
    i.addEventListener("input", function () { state[key] = i.value; changed(); });
    wrap.appendChild(s); wrap.appendChild(i);
    return wrap;
  }

  function row() {
    var r = el("div", { "class": "row" });
    for (var k = 0; k < arguments.length; k++) if (arguments[k]) r.appendChild(arguments[k]);
    return r;
  }

  function applyPresets(b) {
    if (b === "hallenteiler") state.hubrohr = "rohr114";
    else if (b === "wellenanlage" || b === "zwei") { if (state.hubrohr === "rohr114" || state.hubrohr === "kein") state.hubrohr = "60"; }
    if (b === "zentral") {
      state.okProfil = "40"; state.hubrohr = "60"; state.wdurch = "50"; state.sicherWickl = "3";
      state.gurtband = "2,0"; state.zweiteProfil = "nein"; state.zaehneMotor = "14"; state.zaehneWelle = "56";
    }
    if (b === "netz" && state.hubrohr === "rohr114") state.hubrohr = "60";
  }

  function build() {
    var b = state.bauart;
    var isNet = b === "netz", isHall = b === "hallenteiler", isCentral = b === "zentral";
    form.textContent = "";

    var bauartSel = select("bauart", ["wellenanlage", "zentral", "zwei", "netz", "hallenteiler"].map(function (k) { return [k, T["b_" + k]]; }), function () {
      applyPresets(state.bauart); clearResult(); build(); loadOptions();
    });
    form.appendChild(field(T.bauart, bauartSel));

    form.appendChild(row(field(T.length, text("length")), field(T.height, text("height"))));
    var heightInput = form.querySelectorAll(".row")[0].querySelectorAll("input")[1];
    heightInput.addEventListener("input", function () { scheduleOptions(); });

    var netzSel = field(T.netztyp, select("netztyp", NETZTYPEN.map(function (n) { return [n, n]; })));
    var okSel = field(T.okprofil, select("okProfil", [["40", "40"], ["60", "60"]]));
    var bahnSel = field(T.bahnbreite, select("bahnbreite", [["ganz", T.ganz], ["halb", T.halb]], loadOptions));

    if (isNet) {
      form.appendChild(row(netzSel, okSel));
    } else {
      form.appendChild(row(field(T.kunstleder, combo("kunstleder", ["1200", "1450", "1600", "2000", "3000"])), bahnSel));
      if (isHall) {
        form.appendChild(row(netzSel, field(T.netzhoehe, text("netzHoehe"))));
      } else {
        var bahnenSel = el("select", { id: "bahnen-sel" });
        form.appendChild(row(
          field(T.hinterlegt, select("hinterlegt", [["nein", T.nein], ["baumwolle", T.baumwolle], ["molton", T.molton], ["vlies", T.vlies]], loadOptions)),
          field(T.bahnen, bahnenSel)
        ));
        fillBahnen();
        bahnenSel.addEventListener("change", function () { state.bahnen = bahnenSel.value; changed(); });
      }
      var hubOpts = isHall ? [["rohr114", T.rohr114], ["kein", T.kein]] : [["60", "60"], ["80", "80"]];
      form.appendChild(row(okSel, field(T.hubrohr, select("hubrohr", hubOpts))));
    }

    form.appendChild(row(
      field(T.welle, combo("wdurch", ["50", "75", "78,5", "82,5", "90,5"])),
      field(T.sicher, combo("sicherWickl", ["1", "2", "3", "4", "5", "6", "7"], "numeric"))
    ));

    var gurtField = field(T.gurt, select("gurtband", [["1,2", "1,2"], ["2,0", "2,0"]], null, isCentral));
    if (isCentral) gurtField.querySelector("select").value = "2,0";
    form.appendChild(row(
      gurtField,
      isCentral
        ? field(T.zweite, select("zweiteProfil", [["nein", T.nein], ["ja", T.ja]]))
        : field(T.reib, combo("reib", ["1,067", "1,100", "1,200"]))
    ));

    form.appendChild(row(
      field(T.zmotor, combo("zaehneMotor", ["13", "14", "15", "17", "19"], "numeric")),
      field(T.zwelle, combo("zaehneWelle", ["30", "42", "56"], "numeric"))
    ));
  }

  function fillBahnen() {
    var s = document.getElementById("bahnen-sel");
    if (!s) return;
    s.textContent = "";
    if (bahnenOptions.indexOf(state.bahnen) === -1) state.bahnen = bahnenOptions[0];
    bahnenOptions.forEach(function (o) {
      var opt = el("option", { value: o, text: o });
      if (o === state.bahnen) opt.selected = true;
      s.appendChild(opt);
    });
  }

  function post(path, data) {
    return fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (r) {
      return r.json().then(function (j) { j._status = r.status; return j; });
    });
  }

  function scheduleOptions() { clearTimeout(optTimer); optTimer = setTimeout(loadOptions, 400); }

  function loadOptions() {
    if (!API) return;
    var b = state.bauart;
    if (b === "netz" || b === "hallenteiler") return;
    post("/options", { bauart: b, height: state.height, bahnbreite: state.bahnbreite, hinterlegt: state.hinterlegt })
      .then(function (j) { if (j.options) { bahnenOptions = j.options; fillBahnen(); } })
      .catch(function () {});
  }

  function clearResult() { out.hidden = true; out.textContent = ""; note.hidden = true; note.textContent = ""; }
  function changed() { if (!out.hidden) clearResult(); }

  function showNote(msg) { note.textContent = msg; note.hidden = false; }

  function renderResult(r) {
    out.textContent = "";
    out.appendChild(el("h2", { text: T.results }));
    var dl = el("dl", { "class": "res" });
    function add(k, v) { dl.appendChild(el("div", {}, [el("dt", { text: k }), el("dd", { text: v })])); }
    add(T.r_technik, r.technik + " kg");
    add(T.r_behang, r.behang + " kg");
    add(T.r_gesamt, r.gesamt + " kg");
    add(T.r_hub, r.hub + " kg");
    (r.bahnen || []).forEach(function (b) { add(T["r_" + (b.key === "viertel" ? "viertel" : b.key)], String(b.n)); });
    add(T.r_motor, r.motorNotAllowed ? T.notAllowed : r.motor);
    add(T.r_maxtorque, r.maxTorque + (r.maxTorque === "-" ? "" : " Nm"));
    add(T.r_ratio, r.ratio);
    add(T.r_req, r.torqueRequired + " Nm");
    add(T.r_res, r.torqueReserve + " Nm");
    add(T.r_limit, r.limitSwitch);
    add(T.r_fang, r.fang === "special" ? T.special : r.fang);
    add(T.r_fangm, r.fangMoment + " Nm");
    add(T.r_maxrpm, r.maxRpm);
    add(T.r_motorrpm, r.motorRpm + " " + T.rpm);
    add(T.r_speed, r.speedMps + " m/s  |  " + r.speedCmps + " cm/s");
    add(T.r_time, r.time + " " + T.min);
    out.appendChild(dl);
    out.hidden = false;
    if (r.check === "translation") showNote(T.checkTrans);
    out.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function payload() {
    var s = state;
    return {
      bauart: s.bauart, length: s.length, height: s.height, kunstleder: s.kunstleder,
      bahnbreite: s.bahnbreite, hinterlegt: s.hinterlegt, hinterlegteBahnen: s.bahnen,
      okProfil: s.okProfil, hubrohr: s.hubrohr, wdurch: s.wdurch, sicherWickl: s.sicherWickl,
      gurtband: s.bauart === "zentral" ? "2,0" : s.gurtband, reib: s.reib,
      zweiteProfil: s.zweiteProfil, zaehneMotor: s.zaehneMotor, zaehneWelle: s.zaehneWelle,
      netztyp: s.netztyp, netzHoehe: s.netzHoehe
    };
  }

  btn.addEventListener("click", function () {
    clearResult();
    if (!API) { showNote(T.notConnected); return; }
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = T.busy;
    post("/calc", payload()).then(function (j) {
      if (j._status === 429 || j.error === "rate_limit") showNote(T.errLimit);
      else if (j.error) showNote(T.errValues);
      else if (j.check === "height") showNote(T.checkHeight);
      else if (j.result) renderResult(j.result);
      else showNote(T.errServer);
    }).catch(function () { showNote(T.errServer); })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  });

  btn.textContent = T.calc;
  build();
  loadOptions();
})();
