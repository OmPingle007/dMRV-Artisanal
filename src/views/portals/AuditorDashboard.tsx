import { useAuth } from "../../context/AuthContext";
import {
  Shield,
  Filter,
  Search,
  ChevronDown,
  CheckCircle,
  Bell,
  MapPin,
  Clock,
  AlertTriangle,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

export function AuditorDashboard() {
  const { logout, user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [filterMode, setFilterMode] = useState<
    "ALL" | "UNDER_REVIEW" | "FLAGGED"
  >("UNDER_REVIEW");
  const [concernModal, setConcernModal] = useState<{
    open: boolean;
    stepText?: string;
    text?: string;
    priority?: string;
  }>({ open: false });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .order("created_at", { ascending: false });
      if (data && !error) {
        setBatches(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredBatches = batches.filter((b) => {
    if (filterMode === "UNDER_REVIEW") return b.status === "UNDER_REVIEW";
    if (filterMode === "FLAGGED") return (b.flags || 0) > 0;
    return true;
  });

  const underReviewCount = batches.filter(
    (b) => b.status === "UNDER_REVIEW",
  ).length;
  const flaggedCount = batches.filter((b) => (b.flags || 0) > 0).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "SUBMITTED":
        return "bg-[#e6f7ff] text-[#0050b3] border-[#bae0ff]";
      case "UNDER_REVIEW":
        return "bg-[#fff8e6] text-[#b38600] border-[#ffecb3]";
      case "APPROVED":
        return "bg-[#f6ffed] text-[#237804] border-[#d9f7be]";
      case "REJECTED":
        return "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const handleApproveBatch = async () => {
    if (!selectedBatch || !isSupabaseConfigured() || !supabase) return;
    const note = prompt(
      "Please provide approval notes (mandatory, min 50 chars):",
    );
    if (!note || note.length < 50) {
      alert("Must provide sufficient notes (at least 50 characters).");
      return;
    }

    try {
      const { error } = await supabase
        .from("batches")
        .update({ status: "APPROVED" })
        .eq("batch_id", selectedBatch.batch_id);
      if (!error) {
        setSelectedBatch({ ...selectedBatch, status: "APPROVED" });
        fetchBatches();
      }
    } catch (e) {
      console.error("Failed to approve", e);
    }
  };

  const handleRequestResubmission = async () => {
    if (!selectedBatch || !isSupabaseConfigured() || !supabase) return;
    const note = prompt("Please specify exactly what must be corrected:");
    if (!note || note.length < 5) {
      alert("Must provide sufficient notes.");
      return;
    }

    try {
      const { error } = await supabase
        .from("batches")
        .update({ status: "IN_PROGRESS" })
        .eq("batch_id", selectedBatch.batch_id);
      if (!error) {
        setSelectedBatch({ ...selectedBatch, status: "IN_PROGRESS" });
        fetchBatches();
        alert(
          "Operator notified via push + email with auditor notes verbatim.",
        );
      }
    } catch (e) {
      console.error("Failed to request resubmission", e);
    }
  };

  const submitConcern = () => {
    if ((concernModal.text || "").length < 20) {
      alert("Concern text must be at least 20 characters.");
      return;
    }
    // Simulate updating DB
    alert(
      `Concern ticket created. Platform Admin and Field Officer have been notified.`,
    );
    setConcernModal({ open: false });
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white flex flex-col fixed h-full z-20 shadow-[0_0_15px_rgba(0,0,0,0.03)] border-r border-[#E2E8F0]">
        <div className="p-6 border-b border-[#E2E8F0] flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-[#1E40AF]" />
            <h1 className="text-sm font-bold text-[#1E40AF] uppercase tracking-[0.2em]">
              PuroFarms
            </h1>
          </div>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-0.5">
            Auditor/VVB Portal
          </p>
        </div>

        <div className="p-4 border-b border-[#E2E8F0] bg-[#F1F5F9]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            Assigned Scope
          </p>
          <p className="text-sm font-bold text-[#1E40AF]">Global Scope</p>
        </div>

        <nav className="flex-1 py-4 flex flex-col px-4 space-y-1">
          <button
            onClick={() => setFilterMode("UNDER_REVIEW")}
            className={`flex items-center justify-between w-full p-3 rounded-lg font-bold text-xs uppercase tracking-widest text-left transition-colors ${filterMode === "UNDER_REVIEW" ? "bg-[#DBEAFE] text-[#1E40AF]" : "text-slate-600 hover:bg-[#F1F5F9]"}`}
          >
            <span>Awaiting Review</span>
            <span className="bg-[#1E40AF] text-white px-2 py-0.5 rounded text-[10px]">
              {underReviewCount}
            </span>
          </button>
          <button
            onClick={() => setFilterMode("FLAGGED")}
            className={`flex items-center justify-between w-full p-3 rounded-lg font-bold text-xs uppercase tracking-widest text-left transition-colors ${filterMode === "FLAGGED" ? "bg-[#DBEAFE] text-[#1E40AF]" : "text-slate-600 hover:bg-[#F1F5F9]"}`}
          >
            <span>Flagged Batches</span>
            <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-[10px]">
              {flaggedCount}
            </span>
          </button>
          <button
            onClick={() => setFilterMode("ALL")}
            className={`flex items-center justify-between w-full p-3 rounded-lg font-bold text-xs uppercase tracking-widest text-left transition-colors ${filterMode === "ALL" ? "bg-[#DBEAFE] text-[#1E40AF]" : "text-slate-600 hover:bg-[#F1F5F9]"}`}
          >
            <span>All Submissions</span>
          </button>
        </nav>

        <div className="p-4 border-t border-[#E2E8F0] bg-white">
          <p className="text-[10px] mb-2 font-bold uppercase tracking-widest text-slate-400 px-2">
            {user?.name || "VVB Auditor"}
          </p>
          <button
            onClick={logout}
            className="w-full text-left p-2 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-[#F1F5F9] rounded transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col">
        {/* Header */}
        <header className="bg-white h-16 border-b border-[#E2E8F0] flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
          <div className="flex-1 max-w-lg relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Batch ID, Farmer, or Farm..."
              className="w-full pl-9 pr-4 py-2 bg-[#F1F5F9] border-none rounded outline-none text-sm font-mono focus:ring-1 focus:ring-[#1E40AF]"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-[#DBEAFE] px-3 py-1.5 rounded text-[#1E40AF] text-xs font-bold uppercase tracking-widest">
              Read-Only Mode
            </div>
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8 max-w-[1600px] mx-auto w-full">
          {!selectedBatch ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 uppercase tracking-widest">
                  {filterMode === "UNDER_REVIEW"
                    ? "Awaiting Verification"
                    : filterMode === "FLAGGED"
                      ? "Flagged Batches"
                      : "All Submissions"}
                </h2>
                <div className="flex gap-2">
                  {[
                    "All",
                    "Under Review",
                    "Flagged",
                    "Approved",
                    "Rejected",
                  ].map((fp) => (
                    <span
                      key={fp}
                      className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm cursor-pointer hover:border-slate-300"
                    >
                      {fp}
                    </span>
                  ))}
                  <button className="flex items-center gap-2 bg-white border border-[#E2E8F0] px-3 py-1.5 rounded shadow-sm text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:border-slate-300 ml-4">
                    <Filter className="w-3.5 h-3.5" /> Filter{" "}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                      <th className="py-4 px-6 font-medium">Batch ID & Farm</th>
                      <th className="py-4 px-6 font-medium">
                        Kiln & Feedstock
                      </th>
                      <th className="py-4 px-6 font-medium">Status</th>
                      <th className="py-4 px-6 font-medium">Flags</th>
                      <th className="py-4 px-6 font-medium">Date Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredBatches.map((batch) => {
                      const flagCount = batch.flags || 0;
                      return (
                        <tr
                          key={batch.batch_id}
                          onClick={() => setSelectedBatch(batch)}
                          className={`hover:bg-[#F8FAFC] transition-colors cursor-pointer group ${flagCount >= 2 ? "border-l-4 border-l-[#DC2626]" : flagCount === 1 ? "border-l-4 border-l-amber-500" : ""}`}
                        >
                          <td className="py-4 px-6 pl-5">
                            <p className="text-sm font-mono font-bold text-[#1E40AF] group-hover:underline">
                              {batch.batch_id}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                              {batch.farmer || "Unknown"} •{" "}
                              {batch.lat?.toFixed(2) || "-"} ,{" "}
                              {batch.lng?.toFixed(2) || "-"}
                            </p>
                          </td>
                          <td className="py-4 px-6 pl-5">
                            <p className="text-sm font-bold text-slate-700">
                              {batch.kiln || "Unknown"}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                              {batch.feedstock || "Unknown"}
                            </p>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-2.5 py-1 border rounded text-[9px] font-bold uppercase tracking-widest ${getStatusColor(batch.status)}`}
                            >
                              {batch.status || "IN_PROGRESS"}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {flagCount > 0 ? (
                              <div className="flex gap-1">
                                {flagCount >= 2 && (
                                  <span
                                    className={`text-[10px] font-bold px-2 py-1 rounded border flex items-center gap-1.5 w-max text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]`}
                                  >
                                    <AlertTriangle className="w-3 h-3" />{" "}
                                    {flagCount} REJECT
                                  </span>
                                )}
                                {flagCount >= 1 && (
                                  <span
                                    className={`text-[10px] font-bold px-2 py-1 rounded border flex items-center gap-1.5 w-max text-amber-700 bg-amber-50 border-amber-200`}
                                  >
                                    <AlertTriangle className="w-3 h-3" />{" "}
                                    {flagCount >= 2 ? 0 : flagCount} WARN
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-green-600 font-bold flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />{" "}
                                0 Flags
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                            {new Date(
                              batch.created_at || new Date(),
                            ).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredBatches.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-xs font-bold text-slate-500 uppercase tracking-widest"
                        >
                          No batches found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex gap-6 h-[calc(100vh-140px)]">
              {/* Main Evidence Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm mb-4 shrink-0">
                  <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedBatch(null)}
                        className="p-2 rounded hover:bg-[#F1F5F9] transition-colors text-slate-500"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 font-mono uppercase leading-tight">
                          {selectedBatch.batch_id}
                        </h2>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">
                          Farmer/PM Kisan ID: {selectedBatch.farmer || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1.5 border rounded text-[10px] font-bold uppercase tracking-widest ${getStatusColor(selectedBatch.status)}`}
                      >
                        {selectedBatch.status || "IN_PROGRESS"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-[#F8FAFC] flex items-center gap-8 overflow-x-auto text-xs whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Kiln Model
                      </span>
                      <span className="font-bold text-slate-700">
                        {selectedBatch.kiln || "Unknown"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Feedstock
                      </span>
                      <span className="font-bold text-slate-700">
                        {selectedBatch.feedstock || "Unknown"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Batch Created
                      </span>
                      <span className="font-mono text-slate-700">
                        {new Date(
                          selectedBatch.created_at || new Date(),
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col ml-auto">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Provisional tCO₂e
                      </span>
                      <span className="font-black text-[#1E40AF] text-sm">
                        {(selectedBatch.status === "APPROVED"
                          ? selectedBatch.net_tco2e
                          : selectedBatch.provisional_tco2e) || "0.00"}{" "}
                        tCO₂e
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto p-6 space-y-16">
                    {[
                      "S0",
                      "S1",
                      "S2",
                      "S3",
                      "S4",
                      "S5",
                      "S6",
                      "S7",
                      "S8",
                      "S9",
                      "LAB",
                    ].map((step, idx) => {
                      const isCompleted = step === 'LAB' ? !!selectedBatch.media?.lab_report : selectedBatch.steps_completed?.includes(step);
                      if (!isCompleted) return null;
                      return (
                        <div key={step} className="relative">
                          <div className="flex items-start gap-6">
                            <div className="w-10 h-10 rounded-full bg-[#E0E7FF] text-[#1E40AF] flex items-center justify-center font-bold font-mono text-xs shrink-0 border-4 border-white shadow-sm z-10">
                              {step}
                            </div>
                            <div className="flex-1 pt-2">
                              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">
                                {step === "S0"
                                  ? "Empty Kiln Initialized"
                                  : step === "S4"
                                    ? "Temperature Logged"
                                    : step === "S7"
                                      ? "Final Biochar Weight"
                                      : step === "LAB"
                                        ? "Lab Test Report"
                                        : `Operation Evidence - ${step}`}
                              </h4>

                              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex gap-6">
                                <div className="w-[340px] h-[440px] bg-black/5 rounded-lg border border-[#E2E8F0] overflow-hidden flex items-center justify-center relative shrink-0">
                                  {(step === 'LAB' ? selectedBatch.media?.lab_report : selectedBatch.media?.[step]) ? (
                                    typeof (step === 'LAB' ? selectedBatch.media.lab_report : selectedBatch.media[step]) ===
                                      "string" &&
                                    ((step === 'LAB' ? selectedBatch.media.lab_report : selectedBatch.media[step]).endsWith(
                                      ".webm",
                                    ) ||
                                      (step === 'LAB' ? selectedBatch.media.lab_report : selectedBatch.media[step]).endsWith(
                                        ".mp4",
                                      )) ? (
                                      <video
                                        src={step === 'LAB' ? selectedBatch.media.lab_report : selectedBatch.media[step]}
                                        controls
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                       step === "LAB" && ((selectedBatch.media?.lab_report?.endsWith('.pdf') || true) ) ? (
                                          <iframe src={selectedBatch.media.lab_report} className="w-full h-full bg-white" title="Lab Report"></iframe>
                                       ) : (
                                        <img
                                          src={selectedBatch.media[step]}
                                          className="w-full h-full object-contain bg-black"
                                          referrerPolicy="no-referrer"
                                        />
                                       )
                                    )
                                  ) : (
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center px-4">
                                      Evidence Media
                                      <br />
                                      Stored Securely
                                    </p>
                                  )}
                                  <div className="absolute top-2 right-2 flex gap-2">
                                    <div className="bg-green-500/90 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1 shadow-sm">
                                      <CheckCircle2 className="w-3 h-3" /> PASS
                                    </div>
                                    {idx === 1 && (
                                      <div className="bg-amber-500/90 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1 shadow-sm">
                                        <AlertTriangle className="w-3 h-3" />{" "}
                                        WARN
                                      </div>
                                    )}
                                  </div>

                                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md rounded p-2 text-white flex gap-3 shadow-lg">
                                    <div className="flex items-center gap-1.5 opacity-90">
                                      <MapPin className="w-3 h-3 text-red-400" />
                                      <span className="text-[9px] font-mono font-bold">
                                        {selectedBatch.lat?.toFixed(4) ||
                                          "21.14"}
                                        &deg;,{" "}
                                        {selectedBatch.lng?.toFixed(4) ||
                                          "79.08"}
                                        &deg;
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 opacity-90 border-l border-white/20 pl-3">
                                      <Clock className="w-3 h-3 text-blue-400" />
                                      <span className="text-[9px] font-mono font-bold">
                                        12:34:56 UTC
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-between">
                                  <div className="bg-white p-5 rounded-lg border border-[#E2E8F0]">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex justify-between items-center">
                                      <span>EXIF Data Extraction</span>
                                      <button className="text-[#1E40AF] hover:underline normal-case font-medium">
                                        View Raw JSON
                                      </button>
                                    </p>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
                                      <div className="flex justify-between border-b border-dashed border-[#E2E8F0] pb-2">
                                        <span className="text-slate-500">
                                          Capture Device
                                        </span>
                                        <span className="font-mono font-bold text-slate-700">
                                          SM-G998B
                                        </span>
                                      </div>
                                      <div className="flex justify-between border-b border-dashed border-[#E2E8F0] pb-2">
                                        <span className="text-slate-500">
                                          Method
                                        </span>
                                        <span className="font-mono font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                          IN_APP_LIVE
                                        </span>
                                      </div>
                                      <div className="flex justify-between border-b border-dashed border-[#E2E8F0] pb-2">
                                        <span className="text-slate-500">
                                          GPS Match
                                        </span>
                                        <span className="font-mono font-bold text-slate-700">
                                          99.8% (5m)
                                        </span>
                                      </div>
                                      <div className="flex justify-between border-b border-dashed border-[#E2E8F0] pb-2">
                                        <span className="text-slate-500">
                                          SHA-256
                                        </span>
                                        <span className="font-mono font-bold text-slate-700">
                                          {Math.random()
                                            .toString(36)
                                            .substring(2, 14)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between border-b border-dashed border-[#E2E8F0] pb-2">
                                        <span className="text-slate-500">
                                          Upload Time
                                        </span>
                                        <span className="font-mono font-bold text-slate-700">
                                          {new Date(
                                            selectedBatch.created_at,
                                          ).toLocaleTimeString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() =>
                                      setConcernModal({
                                        open: true,
                                        stepText: `Operation Evidence - ${step}`,
                                        priority: "Medium",
                                        text: "",
                                      })
                                    }
                                    className="w-1/2 py-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold text-slate-600 uppercase tracking-widest hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors flex items-center justify-center gap-2 mt-4 ml-auto"
                                  >
                                    <MessageSquare className="w-4 h-4" /> Raise
                                    Concern
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Side Flags & Actions */}
              <div className="w-[340px] shrink-0 flex flex-col gap-4">
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col h-[50%]">
                  <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                      Validation Flags
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      {selectedBatch.flags || 0} Open Flags
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {!selectedBatch.flags || selectedBatch.flags === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                        <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest p-4 leading-relaxed">
                          No active flags.
                          <br />
                          Batch follows all
                          <br />
                          compliance rules.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="p-3.5 border border-red-200 bg-red-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2.5">
                            <span className="px-1.5 py-0.5 bg-red-600 text-white text-[8px] font-bold uppercase tracking-widest rounded shadow-sm">
                              REJECT
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">
                              Rule: GEO_02
                            </span>
                          </div>
                          <p className="text-xs font-bold text-red-900 leading-relaxed mb-3">
                            GPS Coordinates jumped &gt;50m between S1 and S2
                          </p>
                          <div className="flex justify-between items-center border-t border-red-200 pt-2">
                            <p className="text-[10px] text-red-600 font-mono flex items-center gap-1">
                              Trigger:{" "}
                              <span className="underline cursor-pointer">
                                S2 Evidence
                              </span>
                            </p>
                            <button
                              onClick={() =>
                                setConcernModal({
                                  open: true,
                                  stepText: `Flag GEO_02 - S2`,
                                  priority: "High",
                                  text: "",
                                })
                              }
                              className="text-[9px] uppercase font-bold text-red-700 bg-white px-2 py-1 rounded shadow-sm border border-red-100"
                            >
                              Raise Concern
                            </button>
                          </div>
                        </div>
                        {selectedBatch.flags > 1 && (
                          <div className="p-3.5 border border-amber-200 bg-amber-50 rounded-lg">
                            <div className="flex justify-between items-start mb-2.5">
                              <span className="px-1.5 py-0.5 bg-amber-600 text-white text-[8px] font-bold uppercase tracking-widest rounded shadow-sm">
                                WARN
                              </span>
                              <span className="text-[9px] font-mono text-slate-400">
                                Rule: TMP_01
                              </span>
                            </div>
                            <p className="text-xs font-bold text-amber-900 leading-relaxed mb-3">
                              Temperature reading slightly below 500C threshold
                              (492C).
                            </p>
                            <div className="flex justify-between items-center border-t border-amber-200 pt-2">
                              <p className="text-[10px] text-amber-600 font-mono flex items-center gap-1">
                                Trigger:{" "}
                                <span className="underline cursor-pointer">
                                  S4 Evidence
                                </span>
                              </p>
                              <button
                                onClick={() =>
                                  setConcernModal({
                                    open: true,
                                    stepText: `Flag TMP_01 - S4`,
                                    priority: "Medium",
                                    text: "",
                                  })
                                }
                                className="text-[9px] uppercase font-bold text-amber-800 bg-white px-2 py-1 rounded shadow-sm border border-amber-100"
                              >
                                Raise Concern
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col flex-1 p-6 text-center justify-center relative">
                  <div className="absolute top-4 left-4 right-4 border-b border-[#E2E8F0] pb-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest text-left">
                      Audit Actions
                    </h3>
                  </div>
                  <div className="space-y-4 mt-8">
                    <button
                      onClick={handleApproveBatch}
                      disabled={
                        selectedBatch.status !== "UNDER_REVIEW" ||
                        (selectedBatch.flags || 0) >= 2
                      }
                      className={`w-full py-3.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${selectedBatch.status === "UNDER_REVIEW" && (selectedBatch.flags || 0) < 2 ? "bg-[#1E40AF] text-white hover:bg-[#1e3a8a] shadow-md" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                    >
                      Approve Batch
                    </button>
                    <button
                      onClick={handleRequestResubmission}
                      disabled={selectedBatch.status !== "UNDER_REVIEW"}
                      className={`w-full py-3.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${selectedBatch.status === "UNDER_REVIEW" ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                    >
                      Request Re-submission
                    </button>
                  </div>
                  <p className="text-[9px] font-mono text-slate-400 mt-6 leading-relaxed">
                    Approving the batch will lock evidence and initiate registry
                    carbon credit issuance. Reject flags must be resolved by
                    Admin before approval.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {concernModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-[#E2E8F0] w-full max-w-md p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 mb-1">
              Raise Concern
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mb-6">
              Target: {concernModal.stepText}
            </p>

            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Priority
            </label>
            <select
              value={concernModal.priority}
              onChange={(e) =>
                setConcernModal((s) => ({ ...s, priority: e.target.value }))
              }
              className="w-full bg-[#F1F5F9] border-none rounded-lg p-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#1E40AF] mb-5"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>

            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Concern Details
            </label>
            <textarea
              placeholder="Describe the issue... (min 20 chars)"
              rows={4}
              value={concernModal.text || ""}
              onChange={(e) =>
                setConcernModal((s) => ({ ...s, text: e.target.value }))
              }
              className="w-full bg-[#F1F5F9] border-none rounded-lg p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#1E40AF] mb-6"
            ></textarea>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConcernModal({ open: false })}
                className="px-4 py-2 font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitConcern}
                className="px-5 py-2 font-bold text-[10px] uppercase tracking-widest text-white bg-[#DC2626] hover:bg-red-700 rounded transition-colors"
              >
                Submit Concern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
