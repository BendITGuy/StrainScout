import { useState, useRef } from "react";
import {
  Search, MapPin, Leaf, Bell, X, ExternalLink, ChevronRight,
  Loader2, CheckCircle2, AlertCircle, Tag, Zap, FlaskConical
} from "lucide-react";

// âââ Real Bend, OR dispensaries verified on Dutchie ââââââââââââââââââââââââââ
// Slugs sourced from dutchie.com/us/dispensaries/or-bend (April 2026)
const BEND_DISPENSARIES = [
  { id: 1, name: "Oregrown",                 slug: "oregrown",                         city: "Bend",   state: "OR" },
  { id: 2, name: "The Herb Center",          slug: "the-herb-center",                  city: "Bend",   state: "OR" },
  { id: 3, name: "Cannabend",                slug: "cannabend",                        city: "Bend",   state: "OR" },
  { id: 4, name: "Substance (Empire Ave)",   slug: "substance-empire",                 city: "Bend",   state: "OR" },
  { id: 5, name: "The Flower Room â Tumalo", slug: "The%20Flower%20Room%20-%20Tumalo", city: "Tumalo", state: "OR" },
];

// âââ Demo simulation data âââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Simulates what real results look like once connected to the Dutchie API.
// In production the frontend calls /api/search?slug=X&strain=Y and that
// Vercel serverless function queries Dutchie's GraphQL endpoint server-side
// (bypassing browser CORS). None of this is real inventory data.
const DEMO_RESULTS = {
  1: [ // Oregrown
    { id: "o1", type: "Flower",   price: "$38 / 3.5g", thc: "24.1%", cbd: "0.1%", brand: "Oregrown House" },
    { id: "o2", type: "Pre-roll", price: "$12 / 1g",   thc: "22.8%", cbd: "0.0%", brand: "Oregrown House" },
  ],
  3: [ // Cannabend
    { id: "c1", type: "Flower",      price: "$32 / 3.5g", thc: "23.5%", cbd: "0.2%", brand: "Cannabend Selections" },
    { id: "c2", type: "Concentrate", price: "$40 / 1g",   thc: "76.2%", cbd: "0.3%", brand: "Cannabend Extracts" },
  ],
};

const TYPE_COLORS = {
  Flower:      "bg-green-100 text-green-800",
  "Pre-roll":  "bg-yellow-100 text-yellow-800",
  Concentrate: "bg-purple-100 text-purple-800",
  Edible:      "bg-orange-100 text-orange-800",
  Vape:        "bg-blue-100 text-blue-800",
};

const DEALS = [
  { id: 1, store: "Oregrown",    title: "20% Off All Flower",          description: "Every Tuesday â use code TUESDAYBLAZE at checkout.", badge: "Weekly Deal", color: "from-green-500 to-emerald-600" },
  { id: 2, store: "Cannabend",   title: "Buy 2 Pre-rolls, Get 1 Free", description: "Mix and match any pre-rolls in-store.",              badge: "BOGO",        color: "from-purple-500 to-violet-600" },
  { id: 3, store: "Herb Center", title: "$5 Grams â First-Time Patients", description: "New members get a gram of any flower for $5.",   badge: "New Patient", color: "from-amber-500 to-orange-600" },
];

// âââ Utilities ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function buildDutchieListUrl(cityState) {
  const parts = cityState.trim().toLowerCase().replace(/,\s*/g, " ").split(" ");
  return `https://dutchie.com/us/dispensaries/${parts[1] || ""}-${parts[0]}`;
}

function dispensaryUrl(slug) {
  return `https://dutchie.com/dispensary/${slug}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// âââ Components âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function TypeBadge({ type }) {
  const cls = TYPE_COLORS[type] || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {type}
    </span>
  );
}

function DemoBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
      <FlaskConical className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-sm text-amber-800">
        <strong>Prototype demo â simulated search results.</strong> Dispensary names and menu links are real.
        Live inventory requires Dutchie API access â that's the pitch.{" "}
        <a
          href="https://business.dutchie.com/integrations"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium"
        >
          Dutchie API info â
        </a>
      </div>
      <button onClick={() => setVisible(false)} className="text-amber-500 hover:text-amber-700 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ResultCard({ item, storeName, storeSlug, strainName, onSetAlert }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">{strainName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{item.brand}</p>
        </div>
        <TypeBadge type={item.type} />
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Price</span>
          <span className="font-bold text-gray-900">{item.price}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wide">THC</span>
          <span className="font-semibold text-green-700">{item.thc}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wide">CBD</span>
          <span className="font-semibold text-blue-700">{item.cbd}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-500 flex-1 truncate">{storeName}</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => onSetAlert(strainName)}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
          >
            <Bell className="w-3 h-3" />
            Alert
          </button>
          <a
            href={dispensaryUrl(storeSlug)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors"
          >
            Menu
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

function DealCard({ deal }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${deal.color} text-white p-5 flex flex-col gap-2`}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-0.5 rounded-full">{deal.badge}</span>
        <span className="text-xs opacity-70">{deal.store}</span>
      </div>
      <p className="font-bold text-lg leading-tight">{deal.title}</p>
      <p className="text-sm opacity-90">{deal.description}</p>
      <button className="mt-1 self-start flex items-center gap-1 text-xs font-semibold bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors px-3 py-1.5 rounded-lg">
        View Deal <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function AlertModal({ strainName, onClose }) {
  const [confirmed, setConfirmed] = useState(false);
  function handleConfirm() {
    setConfirmed(true);
    setTimeout(onClose, 1800);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        {confirmed ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="font-semibold text-gray-900 text-center">Alert set!</p>
            <p className="text-sm text-gray-500 text-center">
              We'll notify you daily when <strong>{strainName}</strong> is available near you.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900">Set Strain Alert</h3>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600">
              We'll notify you <span className="font-semibold">daily</span> when{" "}
              <span className="font-semibold text-indigo-700">{strainName}</span> is available at a dispensary near you.
            </p>
            <div className="bg-indigo-50 rounded-xl p-3 text-xs text-indigo-700">
              <strong>Coming soon:</strong> Email and push notifications. Leave your email to join the early access list.
            </div>
            <input
              type="email"
              placeholder="your@email.com (optional)"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleConfirm} className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors">Set Alert</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function HowItWorksModal({ onClose, onProceed, location, strain }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-900">How Search Works</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-600">
          StrainScout will check each dispensary's Dutchie menu for{" "}
          <span className="font-semibold text-green-700">{strain || "your strain"}</span> near{" "}
          <span className="font-semibold">{location}</span>.
        </p>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
          <strong>Demo mode active.</strong> This prototype uses real Bend, OR dispensary names and
          correct Dutchie menu links. Live results require Dutchie API credentials â see pitch deck.
        </div>
        <ul className="text-sm text-gray-600 flex flex-col gap-2">
          {[
            "Checks menus at every local Dutchie-powered dispensary",
            "Compares price, THC%, and product type side by side",
            "Set alerts to be notified when your strain is back in stock",
          ].map((t) => (
            <li key={t} className="flex gap-2 items-start">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              {t}
            </li>
          ))}
        </ul>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={onProceed}
            className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            Start Search
          </button>
        </div>
      </div>
    </div>
  );
}

// âââ Main App âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export default function StrainScout() {
  const [location, setLocation]               = useState("Bend, OR");
  const [strain, setStrain]                   = useState("");
  const [showHowItWorks, setShowHowItWorks]   = useState(false);
  const [searching, setSearching]             = useState(false);
  const [currentStoreIdx, setCurrentStoreIdx] = useState(-1);
  const [checkedStores, setCheckedStores]     = useState([]);
  const [results, setResults]                 = useState([]);
  const [searchComplete, setSearchComplete]   = useState(false);
  const [alertStrain, setAlertStrain]         = useState(null);
  const [searchedStrain, setSearchedStrain]   = useState("");
  const abortRef = useRef(false);

  function handleSearchClick() {
    if (!strain.trim()) return;
    setShowHowItWorks(true);
  }

  async function runSearch() {
    abortRef.current = false;
    setShowHowItWorks(false);
    setSearching(true);
    setSearchComplete(false);
    setResults([]);
    setCheckedStores([]);
    setCurrentStoreIdx(-1);
    setSearchedStrain(strain.trim());

    const allResults = [];

    for (let i = 0; i < BEND_DISPENSARIES.length; i++) {
      if (abortRef.current) break;
      const store = BEND_DISPENSARIES[i];
      setCurrentStoreIdx(i);
      await sleep(850 + Math.random() * 550);

      const storeResults = (DEMO_RESULTS[store.id] || []).map((r) => ({
        ...r,
        strain: strain.trim(),
        storeName: store.name,
        storeSlug: store.slug,
      }));

      setCheckedStores((prev) => [...prev, { ...store, found: storeResults.length > 0 }]);
      allResults.push(...storeResults);
      setResults([...allResults]);
    }

    setCurrentStoreIdx(-1);
    setSearching(false);
    setSearchComplete(true);
  }

  const dutchieListUrl = buildDutchieListUrl(location);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 font-sans">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">ð¿</span>
            <div>
              <span className="font-extrabold text-gray-900 text-lg tracking-tight">StrainScout</span>
              <span className="hidden sm:inline text-xs text-gray-400 ml-2">Find your strain across every dispensary near you</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 border border-dashed border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-400">
              <Tag className="w-3 h-3" />
              Sponsor
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <FlaskConical className="w-3 h-3" />
              Demo
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

        <DemoBanner />

        {/* Search card */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              Find your strain across every dispensary near you
            </h1>
            <p className="mt-2 text-gray-500 text-sm sm:text-base">One search. Every menu. Real-time availability.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State (e.g. Bend, OR)"
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-gray-50"
              />
            </div>
            <div className="relative flex-1">
              <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={strain}
                onChange={(e) => setStrain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
                placeholder="Strain name (e.g. Chernobyl)"
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-gray-50"
              />
            </div>
            <button
              onClick={handleSearchClick}
              disabled={searching || !strain.trim()}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-sm"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {searching ? "Searching..." : "Search All Stores"}
            </button>
          </div>
          <p className="text-xs text-center text-gray-400">
            Checking dispensaries on{" "}
            <a href={dutchieListUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
              Dutchie Â· {location}
            </a>
            {" "}Â· Powered by Claude + Dutchie API â results update daily
          </p>
        </section>

        {/* Sponsor banner */}
        <div className="w-full border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center py-5 text-gray-400 text-sm bg-white gap-2">
          <Tag className="w-4 h-4" />
          <span>Sponsor Banner â Your Ad Here</span>
        </div>

        {/* Store progress */}
        {(searching || searchComplete) && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              {searching
                ? <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                : <CheckCircle2 className="w-4 h-4 text-green-600" />}
              <h2 className="font-semibold text-gray-800 text-sm">
                {searching
                  ? `Checking dispensaries for "${searchedStrain}"...`
                  : `Search complete for "${searchedStrain}"`}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {BEND_DISPENSARIES.map((store, idx) => {
                const checked = checkedStores.find((s) => s.id === store.id);
                const isActive = searching && currentStoreIdx === idx;
                return (
                  <div
                    key={store.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all border ${
                      isActive ? "border-green-300 bg-green-50"
                        : checked
                          ? checked.found ? "border-green-200 bg-green-50" : "border-gray-100 bg-gray-50"
                          : "border-gray-100 bg-white text-gray-400"
                    }`}
                  >
                    {isActive ? (
                      <Loader2 className="w-3.5 h-3.5 text-green-600 animate-spin flex-shrink-0" />
                    ) : checked ? (
                      checked.found
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                        : <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0" />
                    )}
                    <span className={`font-medium ${checked ? "text-gray-700" : "text-gray-400"}`}>{store.name}</span>
                    {checked && (
                      <span className={`ml-auto font-semibold ${checked.found ? "text-green-700" : "text-gray-400"}`}>
                        {checked.found ? `${(DEMO_RESULTS[store.id] || []).length} found` : "None"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Results */}
        {results.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-bold text-gray-900 text-lg">
                {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
                <span className="text-green-700">"{searchedStrain}"</span>
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {checkedStores.filter((s) => s.found).length} of {checkedStores.length} stores have it
                </span>
                <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <FlaskConical className="w-3 h-3" /> Demo data
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((item) => (
                <ResultCard
                  key={item.id}
                  item={item}
                  storeName={item.storeName}
                  storeSlug={item.storeSlug}
                  strainName={item.strain}
                  onSetAlert={setAlertStrain}
                />
              ))}
            </div>
          </section>
        )}

        {/* No results */}
        {searchComplete && results.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">ð</span>
            <p className="font-semibold text-gray-800">No results found for "{searchedStrain}"</p>
            <p className="text-sm text-gray-500 max-w-xs">
              None of the dispensaries near {location} carry this strain in our demo data.
              Set an alert to be notified when it becomes available.
            </p>
            <button
              onClick={() => setAlertStrain(searchedStrain)}
              className="mt-2 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Bell className="w-4 h-4" />
              Set Alert for "{searchedStrain}"
            </button>
          </div>
        )}

        {/* Real dispensary directory */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <h2 className="font-bold text-gray-900 text-base">Dispensaries in {location}</h2>
            <span className="text-xs text-gray-400">verified on Dutchie</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {BEND_DISPENSARIES.map((store) => (
              <a
                key={store.id}
                href={dispensaryUrl(store.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-white border border-gray-100 hover:border-green-200 hover:shadow-sm rounded-xl px-4 py-3 text-sm transition-all group"
              >
                <span className="font-medium text-gray-800 group-hover:text-green-700">{store.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600" />
              </a>
            ))}
          </div>
        </section>

        {/* Featured Deals */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-gray-900 text-lg">Featured Deals</h2>
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Sample Data</span>
          </div>
          <p className="text-sm text-gray-500 -mt-2">Weekly deals from local dispensaries â placeholder content shown.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEALS.map((deal) => <DealCard key={deal.id} deal={deal} />)}
          </div>
        </section>

        {/* Sponsor placement */}
        <section className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center gap-2 text-center">
          <Tag className="w-5 h-5 text-gray-300" />
          <p className="font-semibold text-gray-400">Sponsor Placement</p>
          <p className="text-xs text-gray-400 max-w-sm">
            Reserved for dispensary partners, brands, or local advertisers.
            This slot supports StrainScout and keeps search free for everyone.
          </p>
          <button className="mt-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium">Advertise Here â</button>
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="text-base">ð¿</span>
            <span className="font-semibold text-gray-600">StrainScout</span>
            <span>Â·</span><span>Built with Claude</span>
            <span>Â·</span><span>Powered by Dutchie</span>
            <span>Â·</span><span>Bend, OR</span>
          </div>
          <div className="flex gap-4">
            {["About", "Advertise", "Privacy", "Terms"].map((l) => (
              <a key={l} href="#" className="hover:text-gray-600">{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showHowItWorks && (
        <HowItWorksModal
          location={location}
          strain={strain}
          onClose={() => setShowHowItWorks(false)}
          onProceed={runSearch}
        />
      )}
      {alertStrain && (
        <AlertModal strainName={alertStrain} onClose={() => setAlertStrain(null)} />
      )}
    </div>
  );
}
