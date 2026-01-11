import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Camera,
  Upload,
  RotateCw,
  Layout,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Wand2,
  RefreshCcw,
  Sparkles,
  X,
  MessageSquare,
  ArrowRight,
  Download,
  Copy,
  Maximize2,
  Check,
  Lightbulb,
  Zap,
} from "lucide-react";
import "./App.css";

const TEXT_MODEL = "gemini-2.5-flash-preview-09-2025";
const IMAGE_MODEL = "gemini-2.5-flash-image-preview";

const fetchWithRetry = async (url, options, retries = 5, backoff = 1000) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};

const App = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [imageCount, setImageCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    console.log("TEXT_MODEL:", TEXT_MODEL);
    console.log("IMAGE_MODEL:", IMAGE_MODEL);
  }, []);

  // Modals & Interactivité
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customPromptText, setCustomPromptText] = useState("");
  const [activeImageId, setActiveImageId] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [textCopyFeedback, setTextCopyFeedback] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 6000);
  };

  const parseApiError = async (response) => {
    try {
      const data = await response.json();
      const errorMsg = data?.error?.message || data?.error?.status || "";
      if (errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
        return { type: "quota", message: "Quota Gemini atteint. Réessayez plus tard ou vérifiez votre plan API." };
      }
      if (response.status === 401 || errorMsg.includes("API_KEY") || errorMsg.includes("permission")) {
        return { type: "apikey", message: "Clé API invalide ou manquante. Vérifiez VITE_GEMINI_API_KEY." };
      }
      if (response.status === 429) {
        return { type: "rate_limit", message: "Trop de requêtes. Patience..." };
      }
      if (response.status === 400) {
        return { type: "bad_request", message: "Erreur de requête. L'image ou le prompt est peut-être trop volumineux." };
      }
      return { type: "unknown", message: errorMsg || `Erreur ${response.status}` };
    } catch {
      return { type: "unknown", message: `Erreur ${response.status}` };
    }
  };

  // Données de l'annonce
  const [adData, setAdData] = useState({
    title: "",
    description: "",
    price: "",
  });
  const [generatedImages, setGeneratedImages] = useState([]);
  const [processingStatus, setProcessingStatus] = useState("");
  const [tips, setTips] = useState([]);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
    });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setOriginalImage(base64);
    }
  };

  const generateAd = async () => {
    if (!originalImage) return;
    setLoading(true);
    setError(null);
    setProcessingStatus("Analyse de l'objet...");

    try {
      const textPrompt =
        "Analyse cette image d'un objet pour Leboncoin. Génère : 1. Un titre accrocheur. 2. Une description détaillée. 3. Un prix suggéré. 4. Trois conseils courts pour vendre cet objet plus vite. Réponds en JSON : {title, description, price, tips: []}";

      const textResponse = await fetchWithRetry(
        `/api/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: TEXT_MODEL,
            data: {
              contents: [
                {
                  parts: [
                    { text: textPrompt },
                    {
                      inlineData: { mimeType: "image/png", data: originalImage },
                    },
                  ],
                },
              ],
              generationConfig: { responseMimeType: "application/json" },
            },
          }),
        },
      );

      const adInfo = JSON.parse(
        textResponse.candidates[0].content.parts[0].text,
      );
      setAdData({
        title: adInfo.title,
        description: adInfo.description,
        price: adInfo.price || "",
      });
      setTips(adInfo.tips || []);

      setProcessingStatus("Création de l'image de couverture...");
      const neutralImg = await generateImageVariation(
        originalImage,
        "Professional product photography on a clean, solid neutral studio background.",
      );

      let images = [{ id: "neutral", url: neutralImg, type: "neutral" }];

      for (let i = 0; i < imageCount; i++) {
        setProcessingStatus(`Mise en situation (${i + 1}/${imageCount})...`);
        const actionImg = await generateImageVariation(
          originalImage,
          "Place this object in a realistic, high-quality, cozy home or lifestyle setting with natural lighting.",
        );
        images.push({ id: `action-${i}`, url: actionImg, type: "action" });
      }

      setGeneratedImages(images);
      setStep(2);
    } catch (err) {
      console.error("[generateAd] Erreur:", err);
      if (err.message?.includes("HTTP error")) {
        const status = parseInt(err.message.match(/\d+/)?.[0] || "0");
        if (status === 429) {
          showNotification("Quota Gemini atteint. Réessayez plus tard.", "error");
        } else if (status === 401 || status === 403) {
          showNotification("Clé API invalide. Vérifiez VITE_GEMINI_API_KEY.", "error");
        } else {
          showNotification(`Erreur API: ${err.message}`, "error");
        }
      } else {
        showNotification("Erreur lors de la génération. Vérifiez votre connexion.", "error");
      }
    } finally {
      setLoading(false);
      setProcessingStatus("");
    }
  };

  const generateImageVariation = async (base64, prompt) => {
    const response = await fetchWithRetry(
      `/api/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          data: {
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType: "image/png", data: base64 } },
                ],
              },
            ],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          },
        }),
      },
    );
    return `data:image/png;base64,${response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData?.data}`;
  };

  const copyToClipboard = (text, type) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      setTextCopyFeedback(type);
      setTimeout(() => setTextCopyFeedback(null), 2000);
    } catch (err) {
      console.error("Erreur de copie", err);
    }
    document.body.removeChild(textArea);
  };

  const copyImage = async (id, url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopyFeedback(id);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (e) {
      setError("Échec de la copie de l'image.");
    }
  };

  const downloadImage = (url, id) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `la-bonne-annonce-${id}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const optimizeText = async () => {
    setLoading(true);
    setProcessingStatus("Optimisation du texte...");
    try {
      const res = await fetchWithRetry(
        `/api/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: TEXT_MODEL,
            data: {
              contents: [
                {
                  parts: [
                    {
                      text: `Réécris cette description Leboncoin pour la rendre plus professionnelle et persuasive : ${adData.description}`,
                    },
                  ],
                },
              ],
            },
          }),
        },
      );
      setAdData({
        ...adData,
        description: res.candidates[0].content.parts[0].text,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomRegen = async () => {
    if (!customPromptText.trim()) return;
    setIsModalOpen(false);
    setLoading(true);
    setProcessingStatus("Régénération personnalisée...");
    try {
      const newUrl = await generateImageVariation(
        originalImage,
        customPromptText,
      );
      setGeneratedImages((prev) =>
        prev.map((img) =>
          img.id === activeImageId ? { ...img, url: newUrl } : img,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F7] text-slate-900 font-sans pb-10">
      <header className="bg-white border-b sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-[#FF6E14] p-1.5 rounded-lg text-white">
            <Sparkles size={20} />
          </div>
          <span className="font-black text-xl tracking-tight uppercase italic">
            La Bonne Annonce
          </span>
        </div>
        {step === 2 && (
          <button
            onClick={() => setStep(1)}
            className="text-sm font-bold text-slate-500 flex items-center gap-2 hover:text-[#FF6E14] transition-colors"
          >
            <RotateCw size={16} /> Recommencer
          </button>
        )}
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {step === 1 ? (
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-white space-y-6">
              <div className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 hover:border-[#FF6E14] transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                {originalImage ? (
                  <img
                    src={`data:image/png;base64,${originalImage}`}
                    className="w-full h-full object-cover"
                    alt="Objet"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                    <Upload size={48} />
                    <p className="font-bold">Chargez votre photo</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between font-bold text-sm">
                  <span>Mises en situation</span>
                  <span className="text-[#FF6E14]">{imageCount} images</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={imageCount}
                  onChange={(e) => setImageCount(e.target.value)}
                  className="w-full accent-[#FF6E14]"
                />

                <button
                  onClick={generateAd}
                  disabled={!originalImage || loading}
                  className="w-full bg-[#FF6E14] text-white font-black py-4 rounded-xl hover:bg-[#E85D00] transition-all flex justify-center items-center gap-2 disabled:bg-slate-300 shadow-lg shadow-orange-100"
                >
                  <Wand2 size={20} /> GÉNÉRER L'ANNONCE
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in">
            {/* Colonne Texte */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-lg flex items-center gap-2 text-slate-800">
                    <FileText size={20} className="text-[#FF6E14]" /> Détails
                  </h3>
                  <button
                    onClick={optimizeText}
                    className="text-xs font-bold bg-orange-50 text-[#FF6E14] px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors flex items-center gap-1"
                  >
                    <Zap size={14} /> Optimiser via IA
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Titre de l'annonce
                      </label>
                      <button
                        onClick={() => copyToClipboard(adData.title, "title")}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${textCopyFeedback === "title" ? "bg-green-500 text-white" : "text-[#FF6E14] hover:bg-orange-50"}`}
                      >
                        {textCopyFeedback === "title" ? (
                          <>
                            <Check size={12} /> Copié !
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copier
                          </>
                        )}
                      </button>
                    </div>
                    <input
                      value={adData.title}
                      onChange={(e) =>
                        setAdData({ ...adData, title: e.target.value })
                      }
                      className="w-full p-3.5 bg-slate-50 rounded-xl font-bold border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#FF6E14] outline-none transition-all"
                      placeholder="Titre"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                      Prix de vente
                    </label>
                    <div className="relative">
                      <input
                        value={adData.price}
                        onChange={(e) =>
                          setAdData({ ...adData, price: e.target.value })
                        }
                        className="w-full p-3.5 bg-slate-50 rounded-xl font-black text-[#FF6E14] border-none ring-1 ring-slate-100 outline-none"
                        placeholder="Ex: 50"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        €
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Description
                      </label>
                      <button
                        onClick={() =>
                          copyToClipboard(adData.description, "desc")
                        }
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${textCopyFeedback === "desc" ? "bg-green-500 text-white" : "text-[#FF6E14] hover:bg-orange-50"}`}
                      >
                        {textCopyFeedback === "desc" ? (
                          <>
                            <Check size={12} /> Copié !
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copier
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      rows="10"
                      value={adData.description}
                      onChange={(e) =>
                        setAdData({ ...adData, description: e.target.value })
                      }
                      className="w-full p-3.5 bg-slate-50 rounded-xl text-sm leading-relaxed border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#FF6E14] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {tips.length > 0 && (
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 space-y-3 shadow-sm shadow-blue-50">
                  <h4 className="font-bold text-blue-800 flex items-center gap-2 text-sm">
                    <Lightbulb size={18} /> Conseils de vente
                  </h4>
                  <ul className="space-y-2">
                    {tips.map((tip, i) => (
                      <li
                        key={i}
                        className="text-xs text-blue-700 leading-relaxed flex gap-2"
                      >
                        <span>•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Colonne Photos */}
            <div className="lg:col-span-7 grid md:grid-cols-2 gap-4 auto-rows-min">
              {generatedImages.map((img) => (
                <div
                  key={img.id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow"
                >
                  <div
                    className="aspect-[4/3] bg-slate-50 relative cursor-pointer"
                    onClick={() => setFullscreenImage(img.url)}
                  >
                    <img
                      src={img.url}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                      {img.type === "neutral" ? "Couverture" : "Mise en scène"}
                    </div>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="text-white" />
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <button
                      onClick={() => copyImage(img.id, img.url)}
                      className={`w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${copyFeedback === img.id ? "bg-green-500 text-white" : "bg-slate-900 text-white hover:bg-black"}`}
                    >
                      {copyFeedback === img.id ? (
                        <>
                          <Check size={14} /> Copié dans le presse-papier !
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copier l'image
                        </>
                      )}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => downloadImage(img.url, img.id)}
                        className="py-2.5 rounded-xl text-xs font-bold bg-orange-50 text-[#FF6E14] hover:bg-orange-100 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download size={14} /> Télécharger
                      </button>
                      <button
                        onClick={() => {
                          setActiveImageId(img.id);
                          setIsModalOpen(true);
                        }}
                        className="py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Wand2 size={14} /> Éditer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal Prompt Personnalisé */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-black text-xl mb-4 flex items-center gap-2">
              <MessageSquare className="text-[#FF6E14]" /> Votre instruction
            </h3>
            <textarea
              autoFocus
              value={customPromptText}
              onChange={(e) => setCustomPromptText(e.target.value)}
              placeholder="Ex: Sur une table en chêne rustique avec une plante verte à côté..."
              className="w-full p-4 bg-slate-50 rounded-2xl h-32 outline-none focus:ring-2 focus:ring-[#FF6E14] border-none mb-4 resize-none transition-all"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3.5 font-bold bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCustomRegen}
                className="flex-1 py-3.5 font-black bg-[#FF6E14] text-white rounded-2xl shadow-lg shadow-orange-100 hover:bg-[#E85D00] transition-all"
              >
                Générer <ArrowRight size={18} className="inline ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plein Écran */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
          onClick={() => setFullscreenImage(null)}
        >
          <img
            src={fullscreenImage}
            className="max-w-full max-h-full rounded shadow-2xl animate-in zoom-in-90"
          />
          <button className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
            <X size={32} />
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[200] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-[#FF6E14] rounded-full animate-spin mb-6"></div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            Magie Gemini en cours...
          </h3>
          <p className="text-slate-500 font-medium mt-2 max-w-xs">
            {processingStatus}
          </p>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[300] bg-white rounded-2xl shadow-xl border border-slate-100 p-4 max-w-sm animate-in slide-in-from-bottom-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full shrink-0 ${
              notification.type === "error" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
            }`}>
              <AlertCircle size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
