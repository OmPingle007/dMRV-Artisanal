import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  Map as MapIcon,
  Activity,
  Bell,
  AlertTriangle,
  Download,
  Search,
} from "lucide-react";
import {
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

export function ManagementDashboard() {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState("kpi");

  const [funnelData, setFunnelData] = useState([
    { name: "S0: CREATED", value: 214, fill: "#e2e8f0" },
    { name: "S1: MOISTURE", value: 200, fill: "#cbd5e1" },
    { name: "S2: PRE-BURN", value: 180, fill: "#94a3b8" },
    { name: "S3: 50% BURN", value: 175, fill: "#64748b" },
    { name: "S4: TEMP", value: 160, fill: "#475569" },
    { name: "S5: 90% BURN", value: 155, fill: "#334155" },
    { name: "S6: QUENCH", value: 150, fill: "#1e293b" },
    { name: "S7: FINAL WT", value: 145, fill: "#0f172a" },
    { name: "S8: SPREAD", value: 140, fill: "#052c1a" },
    { name: "S9: SEALED", value: 130, fill: "#143225" },
  ]);

  const [mapData, setMapData] = useState([
    {
      id: 1,
      name: "Ramesh Patil Farm",
      lat: 21.1458,
      lng: 79.0882,
      flags: 0,
      status: "Active",
    },
    {
      id: 2,
      name: "Sunita Devi Farm",
      lat: 20.9374,
      lng: 77.7795,
      flags: 1,
      status: "Reject",
    },
    {
      id: 3,
      name: "Anil Kumar Block B",
      lat: 21.0,
      lng: 78.5,
      flags: 2,
      status: "Warn",
    },
    {
      id: 4,
      name: "Vikram Das Plot 1",
      lat: 20.8,
      lng: 76.9,
      flags: 0,
      status: "Active",
    },
    {
      id: 5,
      name: "Vikram Das Plot 2",
      lat: 20.85,
      lng: 76.95,
      flags: 3,
      status: "Reject",
    },
  ]);

  const [usersInfo, setUsersInfo] = useState<any[]>([]);
  const [allBatches, setAllBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);

  const [kpiData, setKpiData] = useState({
    verifiedCarbon: 4281,
    provisionalCarbon: 892,
    activeBatches: 214,
    awaitingReview: 18,
    activeFlags: 12,
    expiringSoon: 3,
    totalFarms: 54,
    recentBatches: [] as any[],
  });

  useEffect(() => {
    if (activeTab === "pipeline") {
      fetchPipelineData();
    } else if (activeTab === "heatmap") {
      fetchMapData();
    } else if (activeTab === "users") {
      fetchUsersData();
    } else if (activeTab === "kpi") {
      fetchKpiData();
    } else if (activeTab === "batches") {
      fetchAllBatches();
    }
  }, [activeTab]);

  const fetchAllBatches = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .order("created_at", { ascending: false });
      if (data && !error) {
        setAllBatches(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchKpiData = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const { data: batches, error } = await supabase
        .from("batches")
        .select("*");
      const { count: farmsCount } = await supabase
        .from("farms")
        .select("*", { count: "exact", head: true });

      if (batches && !error) {
        const active = batches.filter(
          (b) =>
            b.status === "IN_PROGRESS" ||
            b.status === "SUBMITTED" ||
            b.status === "UNDER_REVIEW",
        );
        const review = batches.filter((b) => b.status === "UNDER_REVIEW");

        const vCarbon = batches
          .filter(
            (b) => b.status === "APPROVED" || b.status === "CREDIT_ISSUED",
          )
          .reduce((acc, curr) => acc + (curr.net_tco2e || 0), 0);
        const pCarbon = batches
          .filter(
            (b) => b.status === "UNDER_REVIEW" || b.status === "SUBMITTED",
          )
          .reduce((acc, curr) => acc + (curr.provisional_carbon || 0), 0);

        let flags = 0;
        batches.forEach((b) => (flags += b.flags || 0));

        let sortedBatches = [...batches]
          .sort(
            (a, b) =>
              new Date(b.created_at || new Date()).getTime() -
              new Date(a.created_at || new Date()).getTime(),
          )
          .slice(0, 5);

        setKpiData((prev) => ({
          ...prev,
          verifiedCarbon: vCarbon > 0 ? vCarbon : prev.verifiedCarbon,
          provisionalCarbon: pCarbon > 0 ? pCarbon : prev.provisionalCarbon,
          activeBatches: active.length > 0 ? active.length : prev.activeBatches,
          awaitingReview:
            review.length > 0 ? review.length : prev.awaitingReview,
          activeFlags: flags > 0 ? flags : prev.activeFlags,
          expiringSoon:
            batches.filter((b) => b.age?.includes("hour")).length ||
            prev.expiringSoon,
          totalFarms: farmsCount ? farmsCount : prev.totalFarms,
          recentBatches:
            sortedBatches.length > 0 ? sortedBatches : prev.recentBatches,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsersData = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const { data, error } = await supabase.from("users").select("*");
      if (data && !error && data.length > 0) {
        setUsersInfo(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMapData = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const { data, error } = await supabase.from("farms").select("*");
      if (data && !error && data.length > 0) {
        const dynamicMap = data.map((farm: any) => ({
          id: farm.id || farm.farm_id,
          name: farm.name || "Registered Farm",
          lat: farm.latitude || 21.1458 + (Math.random() - 0.5) * 0.1,
          lng: farm.longitude || 79.0882 + (Math.random() - 0.5) * 0.1,
          flags: 0,
          status: "Active",
        }));
        setMapData(dynamicMap);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPipelineData = async () => {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      const { data, error } = await supabase
        .from("batches")
        .select("steps_completed, step");
      if (data && !error) {
        let s0 = 0,
          s1 = 0,
          s2 = 0,
          s3 = 0,
          s4 = 0,
          s5 = 0,
          s6 = 0,
          s7 = 0,
          s8 = 0,
          s9 = 0;
        data.forEach((b) => {
          const steps = b.steps_completed || [];
          if (steps.includes("S0")) s0++;
          if (steps.includes("S1")) s1++;
          if (steps.includes("S2")) s2++;
          if (steps.includes("S3")) s3++;
          if (steps.includes("S4")) s4++;
          if (steps.includes("S5")) s5++;
          if (steps.includes("S6")) s6++;
          if (steps.includes("S7")) s7++;
          if (steps.includes("S8")) s8++;
          if (steps.includes("S9")) s9++;
        });

        // To make it look like a funnel, sort them if you want or maintain strict step logic
        // We might have small data so we could add a base fallback or keep it raw
        setFunnelData([
          { name: "S0: EMPTY KILN", value: s0, fill: "#e2e8f0" },
          { name: "S1: MOISTURE", value: s1, fill: "#cbd5e1" },
          { name: "S2: PRE-BURN", value: s2, fill: "#94a3b8" },
          { name: "S3: 50% BURN", value: s3, fill: "#64748b" },
          { name: "S4: TEMP", value: s4, fill: "#475569" },
          { name: "S5: 90% BURN", value: s5, fill: "#334155" },
          { name: "S6: POST-QUENCH", value: s6, fill: "#1e293b" },
          { name: "S7: FINAL WT", value: s7, fill: "#0f172a" },
          { name: "S8: SPREAD", value: s8, fill: "#052c1a" },
          { name: "S9: SEALED", value: s9, fill: "#143225" },
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const downloadBatchDataCSV = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      alert("Database is not configured.");
      return;
    }
    
    try {
      const { data, error } = await supabase.from('batches').select('*');
      if (error) throw error;
      
      if (!data || data.length === 0) {
        alert("No batch data available to export.");
        return;
      }
      
      const headers = ["batch_id", "farmer", "kiln", "feedstock", "status", "step", "created_at", "lat", "lng", "flags"];
      
      const csvRows = [];
      csvRows.push(headers.join(','));
      
      for (const row of data) {
        const values = headers.map(header => {
          const val = row[header];
          if (val === null || val === undefined) return '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        });
        csvRows.push(values.join(','));
      }
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `batch_data_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to export batch data", e);
      alert("Failed to export batch data.");
    }
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "Reject":
        return "#DC2626"; // red
      case "Warn":
        return "#D97706"; // amber
      default:
        return "#16A34A"; // green
    }
  };

  return (
    <div className="flex bg-geo-bg min-h-screen text-geo-text font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-geo-border flex flex-col fixed h-full z-20 shadow-sm">
        <div className="p-6 border-b border-geo-border flex flex-col">
          <h1 className="text-sm font-bold text-geo-dark uppercase tracking-[0.2em]">
            PuroFarms
          </h1>
          <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-0.5">
            Management
          </p>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 px-4">
          <button
            onClick={() => {
              setActiveTab("kpi");
              setSelectedBatch(null);
            }}
            className={`flex items-center gap-3 w-full p-3 rounded-lg font-bold text-xs uppercase tracking-widest text-left transition-colors ${activeTab === "kpi" ? "bg-geo-dark text-white" : "text-slate-500 hover:bg-geo-input hover:text-geo-dark"}`}
          >
            <LayoutDashboard className="w-4 h-4" /> KPI Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab("pipeline");
              setSelectedBatch(null);
            }}
            className={`flex items-center gap-3 w-full p-3 rounded-lg font-bold text-xs uppercase tracking-widest text-left transition-colors ${activeTab === "pipeline" ? "bg-geo-dark text-white" : "text-slate-500 hover:bg-geo-input hover:text-geo-dark"}`}
          >
            <Activity className="w-4 h-4" /> Batch Pipeline
          </button>
          <button
            onClick={() => {
              setActiveTab("batches");
              setSelectedBatch(null);
            }}
            className={`flex items-center gap-3 w-full p-3 rounded-lg font-bold text-xs uppercase tracking-widest text-left transition-colors ${activeTab === "batches" && !selectedBatch ? "bg-geo-dark text-white" : "text-slate-500 hover:bg-geo-input hover:text-geo-dark"}`}
          >
            <LayoutDashboard className="w-4 h-4" /> All Batches
          </button>
          <button
            onClick={() => {
              setActiveTab("heatmap");
              setSelectedBatch(null);
            }}
            className={`flex items-center gap-3 w-full p-3 rounded-lg font-bold text-xs uppercase tracking-widest text-left transition-colors ${activeTab === "heatmap" ? "bg-geo-dark text-white" : "text-slate-500 hover:bg-geo-input hover:text-geo-dark"}`}
          >
            <MapIcon className="w-4 h-4" /> Anomaly Heatmap
          </button>
          <button
            onClick={() => {
              setActiveTab("users");
              setSelectedBatch(null);
            }}
            className={`flex items-center gap-3 w-full p-3 rounded-lg font-bold text-xs uppercase tracking-widest text-left transition-colors ${activeTab === "users" ? "bg-geo-dark text-white" : "text-slate-500 hover:bg-geo-input hover:text-geo-dark"}`}
          >
            <Users className="w-4 h-4" /> User Management
          </button>
          <button
            onClick={() => {
              setActiveTab("export");
              setSelectedBatch(null);
            }}
            className={`flex items-center gap-3 w-full p-3 rounded-lg font-bold text-xs uppercase tracking-widest text-left transition-colors ${activeTab === "export" ? "bg-geo-dark text-white" : "text-slate-500 hover:bg-geo-input hover:text-geo-dark"}`}
          >
            <FileBarChart className="w-4 h-4" /> Reports & Export
          </button>
        </nav>

        <div className="p-4 border-t border-geo-border bg-slate-50">
          <p className="text-[10px] mb-2 font-bold uppercase tracking-widest text-slate-400 px-2">
            {user?.name || "Admin User"}
          </p>
          <button
            onClick={logout}
            className="w-full text-left p-2 text-xs font-bold uppercase tracking-widest text-geo-dark hover:bg-geo-input rounded transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col">
        {/* Header */}
        <header className="bg-white h-16 border-b border-geo-border flex items-center justify-between px-8 sticky top-0 z-10 shrink-0 shadow-sm">
          <h2 className="text-lg font-bold text-geo-dark uppercase tracking-widest">
            {activeTab === "kpi" && "Platform Overview"}
            {activeTab === "batches" &&
              (selectedBatch
                ? `Batch Details: ${selectedBatch.batch_id}`
                : "All Submissions")}
            {activeTab === "pipeline" && "Batch Pipeline Funnel"}
            {activeTab === "heatmap" && "Anomaly Heatmap"}
            {activeTab === "users" && "User Management"}
            {activeTab === "export" && "Reports & Export"}
          </h2>
          <div className="flex items-center gap-4">
            <button className="relative bg-geo-input p-2 rounded-full text-geo-dark hover:bg-geo-border-light transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#DC2626] rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8 max-w-7xl mx-auto w-full">
          {activeTab === "kpi" && (
            <>
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-geo-border shadow-sm flex flex-col">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Total Verified Carbon
                  </p>
                  <p className="text-3xl font-black text-geo-dark">
                    {kpiData.verifiedCarbon.toLocaleString()}{" "}
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      tCO₂e
                    </span>
                  </p>
                  <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-4">
                    +1.2k this month
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-geo-border shadow-sm flex flex-col">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Provisional Carbon
                  </p>
                  <p className="text-3xl font-black text-geo-text">
                    {kpiData.provisionalCarbon.toLocaleString()}{" "}
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      tCO₂e
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                    Awaiting lab results
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-geo-border shadow-sm flex flex-col cursor-pointer hover:border-geo-dark transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Total Active Batches
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-geo-dark">
                      {kpiData.activeBatches}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400">
                      {kpiData.awaitingReview} AWAITING REVIEW
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                    Across {kpiData.totalFarms} registered farms
                  </p>
                </div>

                <div className="bg-[#FEF2F2] p-6 rounded-xl border border-[#FECACA] shadow-sm flex flex-col cursor-pointer hover:border-[#DC2626] transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#991B1B] mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" /> Active Flags
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-[#991B1B]">
                      {kpiData.activeFlags}
                    </p>
                    <span className="text-[10px] font-bold text-[#DC2626]">
                      {kpiData.expiringSoon} EXPIRING SOON
                    </span>
                  </div>
                  <p className="text-[10px] text-[#DC2626] font-bold uppercase tracking-widest mt-4">
                    4 Reject Severity
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-white p-6 rounded-xl border border-geo-border shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-geo-dark">
                      Recent Submissions (Action Needed)
                    </h3>
                    <button
                      onClick={() => setActiveTab("batches")}
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-geo-dark"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-geo-input text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                        <th className="pb-3 px-2">Batch ID</th>
                        <th className="pb-3 px-2">Farmer</th>
                        <th className="pb-3 px-2">Status</th>
                        <th className="pb-3 px-2 text-right">Flags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpiData.recentBatches.length > 0 ? (
                        kpiData.recentBatches.map((batch: any) => (
                          <tr
                            key={batch.batch_id}
                            onClick={() => {
                              setActiveTab("batches");
                              setSelectedBatch(batch);
                            }}
                            className="border-b border-geo-input hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <td className="py-4 px-2 text-xs font-mono font-bold text-geo-dark uppercase">
                              {batch.batch_id}
                            </td>
                            <td className="py-4 px-2 text-xs text-geo-text">
                              {batch.farmer || "Unknown Farmer"}
                            </td>
                            <td className="py-4 px-2">
                              <span
                                className={`px-2 py-1 border rounded text-[8px] font-bold uppercase tracking-widest ${
                                  batch.status === "UNDER_REVIEW"
                                    ? "bg-[#fff8e6] text-[#b38600] border-[#ffecb3]"
                                    : batch.status === "SUBMITTED"
                                      ? "bg-[#e6f7ff] text-[#0050b3] border-[#bae0ff]"
                                      : batch.status === "APPROVED"
                                        ? "bg-[#f6ffed] text-[#237804] border-[#d9f7be]"
                                        : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                {batch.status || "IN_PROGRESS"}
                              </span>
                            </td>
                            <td className="py-4 px-2 text-right">
                              {batch.flags > 0 ? (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                    batch.flags >= 2
                                      ? "text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]"
                                      : "text-amber-600 bg-amber-50 border-amber-200"
                                  }`}
                                >
                                  {batch.flags}{" "}
                                  {batch.flags >= 2 ? "REJECT" : "WARN"}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold">
                                  -
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-b border-geo-input hover:bg-slate-50 transition-colors cursor-pointer">
                          <td className="py-4 px-2 text-xs font-mono font-bold text-geo-dark uppercase">
                            KT300-FP1-CS-20260528
                          </td>
                          <td className="py-4 px-2 text-xs text-geo-text">
                            Ramesh Patil
                          </td>
                          <td className="py-4 px-2">
                            <span className="px-2 py-1 bg-[#fff8e6] text-[#b38600] border border-[#ffecb3] rounded text-[8px] font-bold uppercase tracking-widest">
                              UNDER_REVIEW
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <span className="text-[10px] text-slate-400 font-bold">
                              -
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white p-6 rounded-xl border border-geo-border shadow-sm flex flex-col">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-geo-dark mb-6">
                    Field Officer Leaderboard
                  </h3>
                  <div className="space-y-6 flex-1">
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <p className="text-xs font-bold text-geo-dark uppercase tracking-wide">
                          Rahul Sharma
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          92% CC
                        </p>
                      </div>
                      <div className="w-full bg-geo-input h-2 rounded-full overflow-hidden mb-1">
                        <div className="bg-geo-mid h-full w-[92%]"></div>
                      </div>
                      <div className="flex justify-between text-[10px] uppercase tracking-widest text-slate-400">
                        <span>18 Approved</span>
                        <span>2% Flag Rate</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <p className="text-xs font-bold text-geo-dark uppercase tracking-wide">
                          Amit Singh
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          78% CC
                        </p>
                      </div>
                      <div className="w-full bg-geo-input h-2 rounded-full overflow-hidden mb-1">
                        <div className="bg-geo-mid h-full w-[78%]"></div>
                      </div>
                      <div className="flex justify-between text-[10px] uppercase tracking-widest text-slate-400">
                        <span>14 Approved</span>
                        <span>12% Flag Rate</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <p className="text-xs font-bold text-[#DC2626] uppercase tracking-wide">
                          Vikram Das
                        </p>
                        <p className="text-[10px] font-mono text-[#DC2626]">
                          34% CC
                        </p>
                      </div>
                      <div className="w-full bg-[#FEF2F2] h-2 rounded-full overflow-hidden mb-1">
                        <div className="bg-[#DC2626] h-full w-[34%]"></div>
                      </div>
                      <div className="flex justify-between text-[10px] uppercase tracking-widest text-[#991B1B]">
                        <span>4 Approved</span>
                        <span>42% Flag Rate</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "batches" && !selectedBatch && (
            <div className="bg-white p-6 rounded-xl border border-geo-border shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-geo-dark">
                  All Submissions
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-geo-input text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      <th className="pb-3 px-2">Batch ID</th>
                      <th className="pb-3 px-2">Farmer / Location</th>
                      <th className="pb-3 px-2">Kiln</th>
                      <th className="pb-3 px-2">Created</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBatches.length > 0 ? (
                      allBatches.map((batch: any) => (
                        <tr
                          key={batch.batch_id}
                          onClick={() => setSelectedBatch(batch)}
                          className="border-b border-geo-input hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-2 text-xs font-mono font-bold text-geo-dark uppercase">
                            {batch.batch_id}
                          </td>
                          <td className="py-4 px-2 text-xs text-geo-text">
                            {batch.farmer || "Unknown Farmer"}
                          </td>
                          <td className="py-4 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {batch.kiln}
                          </td>
                          <td className="py-4 px-2 text-[10px] font-mono text-slate-400">
                            {new Date(
                              batch.created_at || new Date(),
                            ).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-2">
                            <span
                              className={`px-2 py-1 border rounded text-[8px] font-bold uppercase tracking-widest ${
                                batch.status === "UNDER_REVIEW"
                                  ? "bg-[#fff8e6] text-[#b38600] border-[#ffecb3]"
                                  : batch.status === "SUBMITTED"
                                    ? "bg-[#e6f7ff] text-[#0050b3] border-[#bae0ff]"
                                    : batch.status === "APPROVED" ||
                                        batch.status === "COMPLETED"
                                      ? "bg-[#f6ffed] text-[#237804] border-[#d9f7be]"
                                      : batch.status === "REJECTED"
                                        ? "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
                                        : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {batch.status || "IN_PROGRESS"}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <button className="text-[10px] uppercase font-bold tracking-widest text-geo-dark hover:underline">
                              View &rarr;
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest"
                        >
                          No batches found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "batches" && selectedBatch && (
            <div className="space-y-6">
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-geo-dark flex items-center gap-2 mb-4"
              >
                &larr; Back to all batches
              </button>

              <div className="bg-white p-6 rounded-xl border border-geo-border shadow-sm flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-black text-geo-dark font-mono uppercase mb-1">
                    {selectedBatch.batch_id}
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">
                    Created on:{" "}
                    {new Date(
                      selectedBatch.created_at || new Date(),
                    ).toLocaleString()}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Farmer
                      </p>
                      <p className="text-sm font-bold text-geo-dark">
                        {selectedBatch.farmer || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Kiln Used
                      </p>
                      <p className="text-sm font-bold text-geo-dark">
                        {selectedBatch.kiln || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Feedstock
                      </p>
                      <p className="text-sm font-bold text-geo-dark">
                        {selectedBatch.feedstock || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Current Status
                      </p>
                      <span
                        className={`px-2 py-1 border rounded text-[8px] font-bold uppercase tracking-widest ${
                          selectedBatch.status === "UNDER_REVIEW"
                            ? "bg-[#fff8e6] text-[#b38600] border-[#ffecb3]"
                            : selectedBatch.status === "SUBMITTED"
                              ? "bg-[#e6f7ff] text-[#0050b3] border-[#bae0ff]"
                              : selectedBatch.status === "APPROVED" ||
                                  selectedBatch.status === "COMPLETED"
                                ? "bg-[#f6ffed] text-[#237804] border-[#d9f7be]"
                                : selectedBatch.status === "REJECTED"
                                  ? "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {selectedBatch.status || "IN_PROGRESS"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-geo-border shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-geo-dark mb-6">
                  Verification Evidence Stream
                </h3>
                <div className="space-y-8 pl-4 border-l-2 border-geo-input relative">
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
                      <div key={step} className="relative pl-6">
                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#16A34A] border-2 border-white transform -translate-x-full"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                          Step: {step}
                        </p>
                        <h4 className="text-sm font-bold text-geo-dark mb-4 uppercase">
                          {step === "S0"
                            ? "Empty Kiln Initialized"
                            : step === "S1"
                              ? "Moisture Assessment"
                              : step === "S2"
                                ? "Pre-burn Assembly"
                                : step === "S4"
                                  ? "Temperature Logged"
                                  : step === "S7"
                                    ? "Final Biochar Weight"
                                    : step === "LAB"
                                      ? "Lab Test Report" 
                                      : `Operation ${step} Completed`}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-100 rounded-lg h-32 flex items-center justify-center border border-slate-200 border-dashed relative overflow-hidden group">
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
                                          <iframe src={selectedBatch.media.lab_report} className="w-full h-full bg-slate-50" title="Lab Report"></iframe>
                                       ) : (
                                          <img
                                            src={selectedBatch.media[step]}
                                            alt={step}
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                       )
                                    )
                                  ) : (
                              <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                                <div className="text-center p-4">
                                  <div className="w-10 h-10 mx-auto bg-white rounded flex items-center justify-center shadow-sm mb-2">
                                    <span className="text-[10px] font-bold text-geo-dark uppercase">
                                      Media
                                    </span>
                                  </div>
                                  <p className="text-[8px] font-mono text-slate-500">
                                    No visual evidence available
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="bg-slate-50 p-4 rounded-lg flex flex-col justify-center">
                            <p className="text-[10px] font-mono text-slate-500 mb-2">
                              Metadata attached:
                            </p>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-geo-dark">
                                <span>GPS LAT</span>
                                <span className="font-mono">
                                  {selectedBatch.lat ||
                                    (21.0 + Math.random() * 0.1).toFixed(4)}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs font-bold text-geo-dark">
                                <span>GPS LNG</span>
                                <span className="font-mono">
                                  {selectedBatch.lng ||
                                    (79.0 + Math.random() * 0.1).toFixed(4)}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs font-bold text-geo-dark">
                                <span>TIMESTAMP</span>
                                <span className="font-mono">
                                  {new Date().toISOString()}
                                </span>
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
          )}

          {activeTab === "pipeline" && (
            <div className="bg-white p-8 rounded-xl border border-geo-border shadow-sm flex flex-col items-center min-h-[500px]">
              <h3 className="text-sm font-bold uppercase tracking-widest text-geo-dark mb-2 w-full text-left">
                Batch Pipeline Funnel
              </h3>
              <p className="text-xs text-slate-400 w-full text-left mb-8 tracking-wide leading-relaxed">
                Interactive funnel visualization mapping the completion drop-off
                rates across all 10 field operator stages in real-time.
              </p>
              <div className="w-full max-w-3xl h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        fontSize: "10px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        borderRadius: "4px",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    <Funnel dataKey="value" data={funnelData} isAnimationActive>
                      <LabelList
                        position="right"
                        fill="#0F172A"
                        stroke="none"
                        dataKey="name"
                        style={{
                          fontSize: "10px",
                          fontWeight: "bold",
                          letterSpacing: "0.1em",
                        }}
                      />
                      <LabelList
                        position="inside"
                        fill="#fff"
                        stroke="none"
                        dataKey="value"
                        style={{ fontSize: "12px", fontWeight: "bold" }}
                      />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "heatmap" && (
            <div className="bg-white p-8 rounded-xl border border-geo-border shadow-sm flex flex-col items-center min-h-[500px]">
              <h3 className="text-sm font-bold uppercase tracking-widest text-geo-dark mb-2 w-full text-left">
                Anomaly Heatmap
              </h3>
              <p className="text-xs text-slate-400 w-full text-left mb-6 tracking-wide leading-relaxed">
                Mapbox cluster rendering of active farms across the Vidarbha
                region. Red pins indicate areas with high concentrations of
                rejection flags.
              </p>
              <div className="w-full h-[400px] bg-slate-50 border border-geo-border-light rounded-lg overflow-hidden relative z-0">
                <MapContainer
                  center={[20.9374, 78.5]}
                  zoom={7}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {mapData.map((farm) => (
                    <CircleMarker
                      key={farm.id}
                      center={[farm.lat, farm.lng]}
                      radius={8}
                      fillOpacity={0.8}
                      color={getMarkerColor(farm.status)}
                      fillColor={getMarkerColor(farm.status)}
                    >
                      <Popup>
                        <div className="p-1">
                          <p className="font-bold text-xs mb-1 text-geo-dark">
                            {farm.name}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                            Status: {farm.status}
                          </p>
                          {farm.flags > 0 && (
                            <p className="text-[10px] text-[#DC2626] uppercase tracking-widest font-bold">
                              {farm.flags} Active Flags
                            </p>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
              <div className="w-full mt-4 flex gap-6 text-[10px] uppercase tracking-widest font-bold text-slate-500 justify-start">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#16A34A]"></div> No
                  active flags
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#D97706]"></div>{" "}
                  Warning flags
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#DC2626]"></div>{" "}
                  Reject / Critical flags
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-geo-border shadow-sm">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-geo-dark mb-1">
                    User Management
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage field operators, verifiers, and lab technicians.
                  </p>
                </div>
                <button className="bg-geo-dark text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded shadow-sm hover:bg-[#143225] flex items-center gap-2">
                  + Create User
                </button>
              </div>

              <div className="bg-white rounded-xl border border-geo-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-geo-border bg-slate-50 flex gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="w-full pl-9 pr-4 py-2 bg-white border border-geo-border-light rounded outline-none text-xs font-mono focus:ring-1 focus:ring-geo-dark"
                    />
                  </div>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white border-b border-geo-input text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Assigned / Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-geo-input">
                    {usersInfo.length > 0 ? (
                      usersInfo.map((u: any) => (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <p className="text-xs font-bold text-geo-dark">
                              {u.name || "Unnamed User"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ID: {u.id?.slice(0, 8)}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-widest">
                              {u.role || "Farmer"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-500">
                            {u.mobile}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-[#f6ffed] text-[#237804] border border-[#d9f7be] rounded text-[8px] font-bold uppercase tracking-widest">
                              Active
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button className="text-[10px] font-bold text-geo-dark uppercase tracking-widest hover:underline">
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="text-xs font-bold text-geo-dark">
                              Ramesh Patil
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Last login: 2 hrs ago
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-widest">
                              Farmer
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-500">
                            +91 9876543210
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-[#f6ffed] text-[#237804] border border-[#d9f7be] rounded text-[8px] font-bold uppercase tracking-widest">
                              Active
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button className="text-[10px] font-bold text-geo-dark uppercase tracking-widest hover:underline">
                              Edit
                            </button>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="text-xs font-bold text-geo-dark">
                              Amit Singh
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Last login: 1 day ago
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-geo-input text-geo-dark rounded text-[10px] font-bold uppercase tracking-widest">
                              Field Officer
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-500">
                            +91 9988776655
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-[10px] font-bold text-slate-600 mb-1">
                              12 Farmers
                            </p>
                            <span className="px-2 py-1 bg-[#f6ffed] text-[#237804] border border-[#d9f7be] rounded text-[8px] font-bold uppercase tracking-widest">
                              Active
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button className="text-[10px] font-bold text-geo-dark uppercase tracking-widest hover:underline">
                              Edit
                            </button>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors opacity-75">
                          <td className="py-3 px-4">
                            <p className="text-xs font-bold text-geo-dark">
                              Vikram Das
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Last login: 5 days ago
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-geo-input text-geo-dark rounded text-[10px] font-bold uppercase tracking-widest">
                              Field Officer
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-500">
                            +91 9911223344
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-[10px] font-bold text-slate-600 mb-1">
                              4 Farmers
                            </p>
                            <span className="px-2 py-1 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] rounded text-[8px] font-bold uppercase tracking-widest">
                              Suspended
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button className="text-[10px] font-bold text-[#DC2626] uppercase tracking-widest hover:underline mr-3">
                              Reassign
                            </button>
                            <button className="text-[10px] font-bold text-geo-dark uppercase tracking-widest hover:underline">
                              Edit
                            </button>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "export" && (
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-geo-border shadow-sm">
                <div className="w-10 h-10 bg-[#e6f7ff] text-[#0050b3] rounded-full flex items-center justify-center mb-4">
                  <FileBarChart className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-geo-dark mb-2">
                  Registry Manifest
                </h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Export JSON/XML Puro.earth compatible manifest containing
                  batch details, evidence hashes, and auditor notes.
                </p>
                <button className="bg-geo-dark text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded shadow-sm hover:bg-[#143225] flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export XML
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl border border-geo-border shadow-sm">
                <div className="w-10 h-10 bg-[#F3E8FF] text-[#6B21A8] rounded-full flex items-center justify-center mb-4">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-geo-dark mb-2">
                  Raw Data CSV
                </h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Download raw data reports for internal analysis. Includes
                  field officer logs, flag metrics, and lab results.
                </p>
                <div className="flex gap-2">
                  <button onClick={downloadBatchDataCSV} className="border border-geo-border text-geo-dark text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded shadow-sm hover:bg-slate-50 flex items-center gap-2">
                    Batch Data
                  </button>
                  <button className="border border-geo-border text-geo-dark text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded shadow-sm hover:bg-slate-50 flex items-center gap-2">
                    Flag Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
