(function () {
  var LANG_KEY = "umeme_lang";
  var lang = "en";
  try { if (localStorage.getItem(LANG_KEY) === "sw") lang = "sw"; } catch (e) { /* ignore */ }

  // ---------- exact phrases: English -> Kiswahili ----------
  var DICT = {
    "Overview": "Muhtasari",
    "Planner": "Mpango",
    "Log": "Rekodi",
    "History": "Historia",
    "Appliances": "Vifaa",
    "Money": "Pesa",
    "Export": "Hamisha",
    // login / setup
    "Track your KPLC tokens, know your burn rate, and never get caught in the dark.": "Fuatilia tokeni zako za KPLC, jua kasi ya matumizi yako, na usiwahi kukwama gizani.",
    "Enter your 4-digit PIN": "Weka PIN yako ya tarakimu 4",
    "Unlock": "Fungua",
    "Use a different household": "Tumia kaya nyingine",
    "Set up your household": "Sanidi kaya yako",
    "Takes 30 seconds. Your PIN keeps your data private.": "Inachukua sekunde 30. PIN yako inaweka data yako siri.",
    "Household name": "Jina la kaya",
    "KPLC meter number": "Nambari ya mita ya KPLC",
    "Choose a 4-digit PIN": "Chagua PIN ya tarakimu 4",
    "Confirm PIN": "Thibitisha PIN",
    "Create household": "Unda kaya",
    "Already registered? Sign in": "Umeshasajiliwa? Ingia",
    "Switch household": "Badilisha kaya",
    "Enter the meter number and PIN of the household you want to view.": "Weka nambari ya mita na PIN ya kaya unayotaka kuitazama.",
    "Open household": "Fungua kaya",
    "Register a new household": "Sajili kaya mpya",
    "Back": "Rudi",
    "Lock": "Funga",
    "Install app": "Sakinisha programu",

    // stat cards
    "Units left (estimate)": "Uniti zilizobaki (makadirio)",
    "Burn rate": "Kasi ya matumizi",
    "Days remaining": "Siku zilizobaki",
    "Avg cost per unit": "Wastani wa gharama kwa uniti",
    "Units after your last top-up": "Uniti baada ya ununuzi wa mwisho",
    "No purchases yet": "Hakuna manunuzi bado",
    "Estimated from your last reading": "Makadirio kutoka usomaji wako wa mwisho",
    "Needs 2+ purchases": "Inahitaji manunuzi 2+",

    // status banner
    "Let's get started": "Tuanze",
    "Log your first KPLC token purchase to begin tracking your electricity.": "Rekodi ununuzi wako wa kwanza wa tokeni ya KPLC ili uanze kufuatilia umeme wako.",
    "One purchase logged": "Ununuzi mmoja umerekodiwa",
    "Log your next purchase with the meter reading to unlock your burn rate and run-out prediction.": "Rekodi ununuzi unaofuata pamoja na usomaji wa mita ili upate kasi ya matumizi na makadirio ya lini umeme utaisha.",
    "No usage detected": "Hakuna matumizi yaliyogunduliwa",
    "Your meter readings show no consumption between purchases.": "Usomaji wa mita yako hauonyeshi matumizi kati ya manunuzi.",
    "You're in good shape": "Uko salama",
    "Running lower, plan your next top-up": "Umeme unapungua, panga kununua tokeni",
    "Your units have probably run out": "Uniti zako huenda zimeisha",
    "Based on your usage, the meter should be at zero. Buy a token as soon as you can.": "Kulingana na matumizi yako, mita inapaswa kuwa sifuri. Nunua tokeni haraka iwezekanavyo.",
    "Top up soon!": "Nunua tokeni hivi karibuni!",
    "Less than a day of electricity left at your current burn rate.": "Umeme wa chini ya siku moja umebaki kwa kasi yako ya sasa ya matumizi.",

    // purchase form
    "Log a token purchase": "Rekodi ununuzi wa tokeni",
    "Edit purchase": "Hariri ununuzi",
    "Date": "Tarehe",
    "Amount paid (KES)": "Kiasi ulicholipa (KES)",
    "Units bought (kWh)": "Uniti ulizonunua (kWh)",
    "Units remaining on meter right now": "Uniti zilizobaki kwenye mita sasa hivi",
    "Read this BEFORE loading the new token.": "Soma hii KABLA ya kuingiza tokeni mpya.",
    "Add purchase": "Ongeza ununuzi",
    "Save changes": "Hifadhi mabadiliko",
    "Cancel": "Ghairi",
    "Pick a date.": "Chagua tarehe.",
    "The date can't be in the future.": "Tarehe haiwezi kuwa ya siku zijazo.",
    "Enter an amount greater than zero.": "Weka kiasi kinachozidi sifuri.",
    "Enter units greater than zero.": "Weka uniti zinazozidi sifuri.",
    "Enter the units on your meter (0 or more).": "Weka uniti zilizo kwenye mita yako (0 au zaidi).",

    // chart
    "Trends": "Mwenendo",
    "Daily usage": "Matumizi ya kila siku",
    "Cost / unit": "Gharama / uniti",
    "Spend": "Matumizi ya pesa",
    "Daily electricity use between consecutive purchases.": "Matumizi ya umeme kwa siku kati ya manunuzi yanayofuatana.",
    "What you paid per unit on each purchase.": "Ulicholipa kwa kila uniti katika kila ununuzi.",
    "Amount spent on each token purchase.": "Kiasi ulichotumia kwa kila ununuzi wa tokeni.",
    "kWh per day": "kWh kwa siku",
    "KES per kWh": "KES kwa kWh",
    "Log at least 2 purchases to see usage": "Rekodi angalau manunuzi 2 kuona matumizi",
    "Log a purchase to see cost per unit": "Rekodi ununuzi kuona gharama kwa uniti",
    "Log a purchase to see spending": "Rekodi ununuzi kuona matumizi ya pesa",
    "No data yet": "Hakuna data bado",

    // tables
    "Monthly spend": "Matumizi ya kila mwezi",
    "Month": "Mwezi",
    "Purchases": "Manunuzi",
    "Units (kWh)": "Uniti (kWh)",
    "Total spent": "Jumla iliyotumika",
    "Avg KES/kWh": "Wastani KES/kWh",
    "No purchases yet.": "Hakuna manunuzi bado.",
    "Purchase history": "Historia ya manunuzi",
    "Amount": "Kiasi",
    "KES / kWh": "KES / kWh",
    "Meter before": "Mita kabla",
    "No purchases yet. Log your first token above.": "Hakuna manunuzi bado. Rekodi tokeni yako ya kwanza hapo juu.",
    "Edit": "Hariri",
    "Delete": "Futa",
    "Delete this purchase?": "Futa ununuzi huu?",

    // appliances
    "Appliance cost breakdown": "Mchanganuo wa gharama za vifaa",
    "Save the appliances you own. Costs use (Watts × qty × hours ÷ 1000) × cost per unit.": "Hifadhi vifaa ulivyo navyo. Gharama hukokotolewa kwa (Wati × idadi × saa ÷ 1000) × gharama kwa uniti.",
    "Appliance": "Kifaa",
    "Custom name": "Jina lako",
    "Watts": "Wati",
    "Quantity": "Idadi",
    "Hours per day": "Saa kwa siku",
    "Save appliance": "Hifadhi kifaa",
    "Cost per unit (KES/kWh)": "Gharama kwa uniti (KES/kWh)",
    "Qty": "Idadi",
    "Hours/day": "Saa/siku",
    "kWh/day": "kWh/siku",
    "KES/day": "KES/siku",
    "KES/month": "KES/mwezi",
    "Share": "Mgawo",
    "Remove": "Ondoa",
    "Total": "Jumla",
    "No appliances saved yet. Add the ones you use above.": "Hakuna vifaa vilivyohifadhiwa bado. Ongeza unavyotumia hapo juu.",
    "Using your custom rate.": "Inatumia kiwango chako.",
    "Using your average cost per unit from logged purchases.": "Inatumia wastani wa gharama kwa uniti kutoka manunuzi uliyorekodi.",
    "Default estimate. Log purchases to get your real rate.": "Makadirio ya kawaida. Rekodi manunuzi upate kiwango chako halisi.",
    "Save your appliances to compare their estimated usage with your actual metered usage.": "Hifadhi vifaa vyako ulinganishe matumizi yake yaliyokadiriwa na matumizi halisi ya mita.",
    "Good match.": "Inalingana vizuri.",
    "Mismatch.": "Hailingani.",
    "Refrigerator": "Friji",
    "Deep Freezer": "Friza",
    "Electric Iron": "Pasi ya umeme",
    "Electric Kettle": "Birika ya umeme",
    "Television": "Televisheni",
    "LED Bulb": "Balbu ya LED",
    "Incandescent Bulb": "Balbu ya kawaida",
    "Washing Machine": "Mashine ya kufua",
    "Microwave": "Maikrowevu",
    "Desktop Computer": "Kompyuta ya mezani",
    "Laptop Charger": "Chaja ya laptop",
    "Electric Shower / Water Heater": "Shawa ya umeme / Hita ya maji",
    "Standing Fan": "Feni ya kusimama",
    "Wi-Fi Router": "Rauta ya Wi-Fi",
    "Phone Charger": "Chaja ya simu",
    "Custom appliance…": "Kifaa kingine…",
    "Enter a name for the appliance.": "Weka jina la kifaa.",
    "Watts must be a whole number from 1 to 20000.": "Wati lazima ziwe nambari kamili kati ya 1 na 20000.",
    "Quantity must be a whole number from 1 to 50.": "Idadi lazima iwe nambari kamili kati ya 1 na 50.",
    "Hours per day must be more than 0 and at most 24.": "Saa kwa siku lazima ziwe zaidi ya 0 na zisizidi 24.",

    // budget, planner, tips, share
    "Monthly budget": "Bajeti ya mwezi",
    "Set a limit and watch your spending.": "Weka kikomo na ufuatilie matumizi yako.",
    "Budget (KES per month)": "Bajeti (KES kwa mwezi)",
    "Save": "Hifadhi",
    "Set a monthly budget to track what you spend on tokens.": "Weka bajeti ya mwezi ufuatilie unachotumia kwa tokeni.",
    "You are over budget.": "Umezidi bajeti.",
    "Smart top-up planner": "Mpangaji mahiri wa tokeni",
    "Know what a token will give you before you pay.": "Jua tokeni itakupa nini kabla ya kulipa.",
    "If I spend (KES)": "Nikitumia (KES)",
    "I want it to last (days)": "Nataka idumu (siku)",
    "Token amount": "Kiasi cha tokeni",
    "You get": "Unapata",
    "Lasts about": "Inadumu takriban",
    "Enter an amount to see what it buys.": "Weka kiasi uone kinanunua nini.",
    "Enter the number of days to see how much to buy.": "Weka idadi ya siku uone kiasi cha kununua.",
    "Log at least two purchases so I can learn your daily usage.": "Rekodi angalau manunuzi mawili ili nijue matumizi yako ya kila siku.",
    "You already have enough": "Tayari una za kutosha",
    "Ways to save": "Njia za kuokoa",
    "Share & export": "Shiriki na hamisha",
    "Send an update to the family or keep a copy of your records.": "Tuma taarifa kwa familia au hifadhi nakala ya rekodi zako.",
    "Share on WhatsApp": "Shiriki kwa WhatsApp",
    "Download CSV": "Pakua CSV",
    "Print report": "Chapisha ripoti",
    "Test alerts": "Jaribu arifa",
    "Budget saved.": "Bajeti imehifadhiwa.",
    "Budget cleared.": "Bajeti imefutwa.",
    "Log a purchase first.": "Rekodi ununuzi kwanza.",
    "No purchases to export yet.": "Hakuna manunuzi ya kuhamisha bado.",

    // alerts
    "Low units": "Uniti zinapungua",
    "Last day to buy!": "Siku ya mwisho kununua!",
    "Your electricity should run out today. Buy a token now.": "Umeme wako unapaswa kuisha leo. Nunua tokeni sasa.",
    "Buy a token as soon as you can.": "Nunua tokeni haraka iwezekanavyo.",
    "Turn on notifications": "Washa arifa",
    "Dismiss": "Ficha",
    "Test alert": "Arifa ya majaribio",
    "Alerts work! You will be notified when your units run low.": "Arifa zinafanya kazi! Utaarifiwa uniti zako zikipungua.",
    "Notifications are on.": "Arifa zimewashwa.",
    "Notifications are blocked. Allow them in your browser's site settings.": "Arifa zimezuiwa. Ziruhusu kwenye mipangilio ya tovuti ya kivinjari chako.",
    "Your browser does not support notifications.": "Kivinjari chako hakiauni arifa.",

    // where your money goes
    "Where your money goes": "Pesa yako inaenda wapi",
    "A KPLC token pays for more than electricity. This is an estimate of the split.": "Tokeni ya KPLC inalipia zaidi ya umeme tu. Haya ni makadirio ya mgawanyo.",
    "Show for": "Onyesha kwa",
    "All my purchases": "Manunuzi yangu yote",
    "This month": "Mwezi huu",
    "A KES 1,000 token": "Tokeni ya KES 1,000",
    "Energy itself": "Umeme wenyewe",
    "Fuel & forex": "Mafuta na fedha za kigeni",
    "Taxes & levies": "Kodi na ushuru",
    "Item": "Kipengee",
    "Energy charge": "Gharama ya nishati",
    "Fuel energy cost": "Gharama ya mafuta ya kuzalisha umeme",
    "Forex adjustment": "Marekebisho ya fedha za kigeni",
    "REP levy": "Ushuru wa REP (umeme vijijini)",
    "EPRA levy": "Ushuru wa EPRA",
    "WRA levy": "Ushuru wa WRA (maji)",
    "All-in price per unit": "Bei kamili kwa uniti",
    "Edit the rates (they change every month)": "Hariri viwango (hubadilika kila mwezi)",
    "Energy charge (KES/kWh)": "Gharama ya nishati (KES/kWh)",
    "Fuel energy cost (KES/kWh)": "Gharama ya mafuta (KES/kWh)",
    "Forex adjustment (KES/kWh)": "Marekebisho ya fedha za kigeni (KES/kWh)",
    "WRA levy (KES/kWh)": "Ushuru wa WRA (KES/kWh)",
    "VAT (%)": "VAT (%)",
    "REP levy (% of energy)": "Ushuru wa REP (% ya nishati)",
    "EPRA levy (% of energy)": "Ushuru wa EPRA (% ya nishati)",
    "Rates change monthly. Check EPRA's gazette notices or your KPLC statement and update the numbers. They are saved on this device.": "Viwango hubadilika kila mwezi. Angalia matangazo ya gazeti la EPRA au taarifa yako ya KPLC kisha usasishe nambari. Zinahifadhiwa kwenye kifaa hiki.",
    "Reset to defaults": "Rudisha viwango asili",
    "Showing an example KES 1,000 token because you have no purchases for this period yet.": "Inaonyesha mfano wa tokeni ya KES 1,000 kwa sababu huna manunuzi katika kipindi hiki.",

    // toasts and messages
    "Purchase added.": "Ununuzi umeongezwa.",
    "Purchase updated.": "Ununuzi umesasishwa.",
    "Purchase deleted.": "Ununuzi umefutwa.",
    "Appliance saved.": "Kifaa kimehifadhiwa.",
    "Appliance removed.": "Kifaa kimeondolewa.",
    "PIN must be exactly 4 digits.": "PIN lazima iwe na tarakimu 4 kamili.",
    "Enter the meter number.": "Weka nambari ya mita.",
    "Enter a household name.": "Weka jina la kaya.",
    "Enter a valid meter number (letters and digits only).": "Weka nambari halali ya mita (herufi na tarakimu pekee).",
    "The two PINs do not match.": "PIN mbili hazilingani.",

    // server messages
    "Cannot reach the server. Is runserver still running?": "Seva haipatikani. Je, runserver bado inafanya kazi?",
    "The server sent an unexpected response.": "Seva imetuma jibu lisilotarajiwa.",
    "Invalid request.": "Ombi si sahihi.",
    "Enter a household name (100 characters max).": "Weka jina la kaya (herufi 100 juu).",
    "That meter number is already registered. Use 'Switch household' to sign in.": "Nambari hiyo ya mita imeshasajiliwa. Tumia 'Badilisha kaya' kuingia.",
    "Wrong meter number or PIN.": "Nambari ya mita au PIN si sahihi.",
    "Household not found.": "Kaya haijapatikana.",
    "Wrong or missing PIN. Please unlock the app again.": "PIN si sahihi au haipo. Tafadhali fungua programu tena.",
    "The date cannot be in the future.": "Tarehe haiwezi kuwa ya siku zijazo.",
    "Enter a valid date.": "Weka tarehe halali.",
    "Amount paid must be greater than zero.": "Kiasi kilicholipwa lazima kizidi sifuri.",
    "Units bought must be greater than zero.": "Uniti zilizonunuliwa lazima zizidi sifuri.",
    "Meter reading must be zero or more.": "Usomaji wa mita lazima uwe sifuri au zaidi.",
    "Purchase not found.": "Ununuzi haujapatikana.",
    "Appliance not found.": "Kifaa hakijapatikana.",
    "Appliance name is required (60 characters max).": "Jina la kifaa linahitajika (herufi 60 juu).",
    "Watts must be between 1 and 20000.": "Wati lazima ziwe kati ya 1 na 20000.",
    "Quantity must be between 1 and 50.": "Idadi lazima iwe kati ya 1 na 50."
  };

  var MONTHS_SHORT = { Jan: "Jan", Feb: "Feb", Mar: "Mac", Apr: "Apr", May: "Mei", Jun: "Jun", Jul: "Jul", Aug: "Ago", Sep: "Sep", Oct: "Okt", Nov: "Nov", Dec: "Des" };
  var MONTHS_FULL = {
    January: "Januari", February: "Februari", March: "Machi", April: "Aprili", May: "Mei", June: "Juni",
    July: "Julai", August: "Agosti", September: "Septemba", October: "Oktoba", November: "Novemba", December: "Desemba"
  };

  // ---------- sentences with numbers or names inside ----------
  var RULES = [
    [/^Welcome back, (.+)$/, "Karibu tena, $1"],
    [/^Meter (.+)$/, "Mita $1"],
    [/^Average: (.+) kWh\/day$/, "Wastani: $1 kWh/siku"],
    [/^(\d+) days$/, "siku $1"],
    [/^Runs out around (.+)$/, "Itaisha karibu $1"],
    [/^Total spent (KES .+)$/, "Jumla iliyotumika $1"],
    [/^VAT \((.+)%\)$/, "Kodi ya VAT ($1%)"],
    [/^(\d+)% of what you pay$/, "asilimia $1 ya unacholipa"],

    // status banner
    [/About (\d+) days of electricity left \(around (.+?)\)\./, "Umeme wa takriban siku $1 umebaki (karibu $2)."],
    [/About (\d+) days left at your current burn rate \(around (.+?)\)\./, "Zimebaki takriban siku $1 kwa kasi yako ya sasa ya matumizi (karibu $2)."],
    [/Only about (\d+) day\(s\) left at your current burn rate\./, "Zimebaki takriban siku $1 tu kwa kasi yako ya sasa ya matumizi."],
    [/About (\d+) day\(s\) of electricity left\. Plan your top-up now\./, "Zimebaki takriban siku $1 za umeme. Panga kununua tokeni sasa."],

    // appliance comparison
    [/Not enough metered usage yet\. Log at least two token purchases to compare this estimate with your real usage\./, "Hakuna data ya kutosha ya mita bado. Rekodi angalau manunuzi mawili ya tokeni ili kulinganisha makadirio haya na matumizi yako halisi."],
    [/Your appliances add up to (.+?) kWh\/day against (.+?) kWh\/day on the meter \((\d+)% (above|below)\)\./,
      function (m, a, b, c, d) { return "Vifaa vyako vinajumlisha " + a + " kWh/siku dhidi ya " + b + " kWh/siku kwenye mita (asilimia " + c + " " + (d === "above" ? "juu" : "chini") + ")."; }],
    [/Your appliances explain only (\d+)% of your metered usage \((.+?) vs (.+?) kWh\/day\)\. You may be missing appliances or underestimating hours\./,
      "Vifaa vyako vinaelezea asilimia $1 tu ya matumizi yaliyopimwa ($2 dhidi ya $3 kWh/siku). Huenda umesahau vifaa au umekadiria saa chache."],
    [/Your estimate of (.+?) kWh\/day is (\d+)% higher than the metered (.+?) kWh\/day\. Hours of use may be overestimated\./,
      "Makadirio yako ya $1 kWh/siku ni asilimia $2 juu kuliko yaliyopimwa ($3 kWh/siku). Huenda umekadiria saa nyingi."],
    [/Biggest cost: /, "Gharama kubwa zaidi: "],
    [/\((\d+)% of your appliance bill\)\./, "(asilimia $1 ya bili ya vifaa vyako)."],

    // budget
    [/ of (KES [\d,.]+) spent this month \(([\d,.]+)%\)\./, " kati ya $1 zimetumika mwezi huu ($2%)."],
    [/(KES [\d,.]+) left\./, "$1 zimebaki."],
    [/^Your usage costs roughly $/, "Matumizi yako yanagharimu takriban "],
    [/ a month \((.+?) kWh\/day × KES (.+?) × 30\)\./, " kwa mwezi ($1 kWh/siku × KES $2 × 30)."],
    [/That is above your budget\. See the saving tips in the appliance section\./, "Hiyo ni juu ya bajeti yako. Angalia vidokezo vya kuokoa kwenye sehemu ya vifaa."],

    // planner
    [/^(KES [\d,.]+) buys about $/, "$1 inanunua takriban "],
    [/\. With the ~(.+?) kWh you have left, that lasts about /, ". Ukiwa na ~$1 kWh iliyobaki, itadumu takriban "],
    [/\(until (.+?)\)\./, "(hadi $1)."],
    [/^ for (.+?) days at your current usage\.$/, " kwa siku $1 kwa matumizi yako ya sasa."],
    [/^To last (.+?) days you need about $/, "Ili idumu siku $1 unahitaji takriban "],
    [/^ more, roughly $/, " zaidi, takriban "],
    [/Estimates use your average of KES (.+?) per kWh/, "Makadirio yanatumia wastani wako wa KES $1 kwa kWh"],
    [/ \(default until you log purchases\)/, " (kiwango cha kawaida hadi urekodi manunuzi)"],
    [/\. Real KPLC tokens can differ slightly\./, ". Tokeni halisi za KPLC zinaweza kutofautiana kidogo."],

    // saving tips
    [/^Use your $/, "Tumia "],
    [/ 1 hour less each day and save about /, " saa 1 chini kila siku na uokoe takriban "],
    [/ a month\.$/, " kwa mwezi."],
    [/^Swap your $/, "Badilisha "],
    [/^(\d+) incandescent bulb\(s\)$/, "balbu $1 za kawaida"],
    [/ for LED and save about /, " kwa LED na uokoe takriban "],

    // where your money goes
    [/^Only about $/, "Takriban "],
    [/ of each token pays for the energy itself\./, " tu ya kila tokeni ndiyo hulipia umeme wenyewe."],
    [/On every KES 1,000 you buy about (.+?) kWh\./, "Kwa kila KES 1,000 unapata takriban $1 kWh."],
    [/Without VAT and levies you would get about (.+?) kWh\./, "Bila VAT na ushuru ungepata takriban $1 kWh."],
    [/Your real average is KES (.+?) per kWh; this estimate is KES (.+?)\. If they differ a lot, update the rates below\./,
      "Wastani wako halisi ni KES $1 kwa kWh; makadirio haya ni KES $2. Zikitofautiana sana, sasisha viwango hapa chini."],

    // server error with a number
    [/Server error \((\d+)\)\. Check the terminal running runserver\./, "Hitilafu ya seva ($1). Angalia terminal inayoendesha runserver."],

    // WhatsApp message lines
    [/^⚡ Umeme update: (.+)$/, "⚡ Taarifa ya Umeme: $1"],
    [/^Units left: about (.+) kWh$/, "Uniti zilizobaki: takriban $1 kWh"],
    [/^Burn rate: (.+) kWh\/day$/, "Kasi ya matumizi: $1 kWh/siku"],
    [/^Days left: about (\d+) \(around (.+)\)$/, "Siku zilizobaki: takriban $1 (karibu $2)"],
    [/^Average cost: KES (.+) per kWh$/, "Wastani wa gharama: KES $1 kwa kWh"],
    [/^Spent so far: (KES .+)$/, "Jumla iliyotumika hadi sasa: $1"],

    // dates and units (keep these last)
    [/\b(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, function (m, d, mon) { return d + " " + MONTHS_SHORT[mon]; }],
    [/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b(?= \d{4})/g, function (m, mon) { return MONTHS_FULL[mon]; }],
    [/kWh\/day/g, "kWh/siku"]
  ];

  function translate(s) {
    var core = s.trim();
    if (!core) return s;
    if (Object.prototype.hasOwnProperty.call(DICT, core)) {
      var at = s.indexOf(core);
      return s.slice(0, at) + DICT[core] + s.slice(at + core.length);
    }
    var out = s;
    for (var i = 0; i < RULES.length; i++) out = out.replace(RULES[i][0], RULES[i][1]);
    return out;
  }

  function translatePlaceholder(s) {
    return s.replace(/^e\.g\. /, "mf. ");
  }

  // ---------- walk the page and translate text ----------
  var originals = new WeakMap();
  var attrOriginals = new WeakMap();

  function skip(node) {
    var el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return true;
    var tag = el.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA") return true;
    return !!el.closest("[data-no-i18n]");
  }

  function applyToText(node) {
    if (skip(node)) return;
    if (lang === "sw") {
      if (!originals.has(node)) originals.set(node, node.nodeValue);
      var target = translate(originals.get(node));
      if (node.nodeValue !== target) node.nodeValue = target;
    } else if (originals.has(node)) {
      var en = originals.get(node);
      if (node.nodeValue !== en) node.nodeValue = en;
    }
  }

  function applyAttrs(root) {
    var list = [];
    if (root.nodeType === 1 && root.hasAttribute("placeholder")) list.push(root);
    if (root.querySelectorAll) {
      root.querySelectorAll("[placeholder]").forEach(function (el) { list.push(el); });
    }
    list.forEach(function (el) {
      if (el.closest("[data-no-i18n]")) return;
      if (!attrOriginals.has(el)) attrOriginals.set(el, el.getAttribute("placeholder"));
      var en = attrOriginals.get(el);
      el.setAttribute("placeholder", lang === "sw" ? translatePlaceholder(en) : en);
    });
  }

  function walk(root) {
    if (root.nodeType === 3) { applyToText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var nodes = [];
    var n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(applyToText);
    applyAttrs(root);
  }

  var OPTIONS = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder"] };

  var observer = new MutationObserver(function (records) {
    if (lang !== "sw") return;
    observer.disconnect();
    records.forEach(function (rec) {
      if (rec.type === "characterData") {
        originals.delete(rec.target);
        applyToText(rec.target);
      } else if (rec.type === "childList") {
        rec.addedNodes.forEach(function (node) { walk(node); });
      } else if (rec.type === "attributes") {
        attrOriginals.delete(rec.target);
        applyAttrs(rec.target);
      }
    });
    observer.observe(document.body, OPTIONS);
  });

  // ---------- things that are not page text ----------
  var baseDraw = drawChart;
  drawChart = function (canvas, points, kind, unit, emptyMsg) {
    if (lang !== "sw") { baseDraw(canvas, points, kind, unit, emptyMsg); return; }
    var pts = points.map(function (p) { return { label: translate(p.label), value: p.value }; });
    baseDraw(canvas, pts, kind, translate(unit), emptyMsg ? translate(emptyMsg) : emptyMsg);
  };

  var baseConfirm = window.confirm;
  window.confirm = function (message) {
    return baseConfirm.call(window, lang === "sw" ? translate(message) : message);
  };

  var baseOpen = window.open;
  window.open = function (url, target, features) {
    var prefix = "https://wa.me/?text=";
    if (lang === "sw" && typeof url === "string" && url.indexOf(prefix) === 0) {
      var text = decodeURIComponent(url.slice(prefix.length));
      var out = text.split("\n").map(function (line) { return translate(line); }).join("\n");
      url = prefix + encodeURIComponent(out);
    }
    return baseOpen.call(window, url, target, features);
  };

  // ---------- switching ----------
  function setLang(next) {
    lang = next;
    try { localStorage.setItem(LANG_KEY, next); } catch (e) { /* ignore */ }
    document.documentElement.lang = next === "sw" ? "sw" : "en";
    document.querySelectorAll(".lang-toggle").forEach(function (b) {
      b.textContent = next === "sw" ? "English" : "Kiswahili";
    });
    observer.disconnect();
    walk(document.body);
    observer.observe(document.body, OPTIONS);
    var appView = document.getElementById("app-view");
    if (typeof renderChart === "function" && state.household && !appView.classList.contains("hidden")) renderChart();
  }

  document.querySelectorAll(".tools").forEach(function (box) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tool-btn lang-toggle";
    b.addEventListener("click", function () { setLang(lang === "sw" ? "en" : "sw"); });
    box.insertBefore(b, box.firstChild);
  });

  window.I18N = {
    t: function (s) { return lang === "sw" ? translate(s) : s; },
    get lang() { return lang; }
  };

  setLang(lang);
})();
