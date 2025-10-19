import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "@/lib/api";
import { Loader2, BarChart3 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type Zone = "green" | "yellow" | "red";

interface Teacher {
  id: number;
  teacher_id: string;
  first_name: string;
  last_name: string;
  department: string;
  zone: Zone;
  enrolled_students?: number;
  p1_failed?: number; p1_percent?: number; p1_category?: string;
  p2_failed?: number; p2_percent?: number; p2_category?: string;
  p3_failed?: number; p3_percent?: number; p3_category?: string;
}

const TeacherReports = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // New state for summary
  const [programs, setPrograms] = useState<{ id: number; program_name: string }[]>([]);
  const [filters, setFilters] = useState({
    program: "",
    schoolYear: "2025-2026",
    semester: "1st",
    period: "All" as "All" | "P1" | "P2" | "P3",
  });
  const [summary, setSummary] = useState<{ period: string; total_teachers: number | null; green_count: number | null; green_percent: number | null; yellow_count: number | null; yellow_percent: number | null; red_count: number | null; red_percent: number | null }[]>([]);
  const [consistentCounts, setConsistentCounts] = useState<{ green: number; yellow: number; red: number }>({ green: 0, yellow: 0, red: 0 });

  // New: interactive active zone for department line chart
  // New: hover state for department interactive line chart
  const [activeDeptHover, setActiveDeptHover] = useState<Zone | null>(null);

  // New: active zone hover for periods chart
  const [activeZoneHover, setActiveZoneHover] = useState<Zone | null>(null);

  // Build line data across periods from summary
  const zonePeriodsLineData = useMemo(() => {
    const rows = (summary || []).filter((r) => r.period && r.period !== 'SEMESTRAL');
    return rows.map((r) => ({
      period: r.period,
      green: Number(r.green_count || 0),
      yellow: Number(r.yellow_count || 0),
      red: Number(r.red_count || 0),
    }));
  }, [summary]);

  // Monthly department zone counts (current year up to current month)
  const [deptMonthlyCounts, setDeptMonthlyCounts] = useState<{
    month_num: number;
    month_label: string;
    green: number;
    yellow: number;
    red: number;
    top_departments: { green: string | null; yellow: string | null; red: string | null };
  }[]>([]);

  // Colors for monthly department chart (as requested)
  const ZONE_COLORS = { green: "#16a34a", yellow: "#facc15", red: "#dc2626" } as const;

  // Top 10 failure percent based on selected period
  const top10Data = useMemo(() => {
    const toNum = (x: any) => {
      if (typeof x === 'number') return x;
      const n = parseFloat(x || '0');
      return isNaN(n) ? 0 : n;
    };
    const rows = (teachers || []).map(t => {
      const p1 = toNum(t.p1_percent);
      const p2 = toNum(t.p2_percent);
      const p3 = toNum((t as any).p3_percent);
      let percent = 0;
      if (filters.period === 'P1') percent = p1;
      else if (filters.period === 'P2') percent = p2;
      else if (filters.period === 'P3') percent = p3;
      else percent = Math.max(p1, p2, p3);
      return { teacher: `${t.first_name} ${t.last_name}`, percent };
    })
    .filter(r => Number.isFinite(r.percent));
    rows.sort((a,b) => b.percent - a.percent);
    return rows.slice(0, 10);
  }, [teachers, filters.period]);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await fetch(apiUrl('programs.php'));
        let data: any = [];
        try {
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const parsed = await res.json();
            data = Array.isArray(parsed) ? parsed : [];
          }
        } catch (_) {
          data = [];
        }
        if (Array.isArray(data)) setPrograms(data);
      } catch (e) {
        console.warn('Failed to load programs:', e);
      }
    };
    fetchPrograms();
  }, []);

  const generateReport = async () => {
    try {

      const params = new URLSearchParams({
        school_year: filters.schoolYear,
        semester: filters.semester,
        period: filters.period,
      });
      if (filters.program) {
        params.set('program_id', filters.program);
      }
      const res = await fetch(apiUrl(`teacher_summary.php?${params.toString()}`));
      let data: any = {};
      try {
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          data = await res.json();
        }
      } catch (_) {
        data = {};
      }
      setSummary(Array.isArray(data.summary) ? data.summary : []);
      setConsistentCounts(data.consistent_zone_counts || { green: 0, yellow: 0, red: 0 });
    } catch (e: any) {
      console.error('Failed to generate report:', e);

    } finally {

    }
  };

  // Fetch monthly department summary (current year up to current month)
  const fetchMonthlyDeptSummary = async () => {
    try {
      const params = new URLSearchParams({
        school_year: filters.schoolYear,
        semester: filters.semester,
      });
      if (filters.program) {
        params.set('program_id', filters.program);
      }
      const res = await fetch(apiUrl(`teacher_monthly_department_summary.php?${params.toString()}`));
      let payload: any = {};
      try {
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          payload = await res.json();
        }
      } catch (_) {
        payload = {};
      }
      const monthly = Array.isArray(payload.monthly_zone_counts) ? payload.monthly_zone_counts : [];
      setDeptMonthlyCounts(monthly);
    } catch (err) {
      console.error('Failed to fetch monthly department summary', err);
      setDeptMonthlyCounts([]);
    }
  };

  useEffect(() => {
    // Auto-update on filter change to meet dynamic update requirement
    generateReport();
  }, [filters.program, filters.schoolYear, filters.semester, filters.period]);

  useEffect(() => {
    // Update monthly chart whenever program/year/semester changes
    fetchMonthlyDeptSummary();
  }, [filters.program, filters.schoolYear, filters.semester]);
  // Ensure teachers load via effect; remove stray top-level call
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const tParams = new URLSearchParams({
          recompute: '1',
          school_year: filters.schoolYear,
          semester: filters.semester,
        });
        if (filters.program) {
          tParams.set('program_id', filters.program);
        }
        const response = await fetch(apiUrl(`teachers.php?${tParams.toString()}`));
        let data: any = [];
        try {
          const ct = response.headers.get('content-type') || '';
          if (response.ok && ct.includes('application/json')) {
            const parsed = await response.json();
            data = Array.isArray(parsed) ? parsed : [];
          }
        } catch (_) {
          data = [];
        }
        setTeachers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching teachers for reports:', err);
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, [filters.program, filters.schoolYear, filters.semester]);



  // Period-aware keys using filters.period (supports All)
  const totalsData = useMemo(() => {
    const totalEnrolled = (teachers || []).reduce((sum, t) => sum + (Number(t.enrolled_students) || 0), 0);
    const totalFailed = (teachers || []).reduce((sum, t) => {
      if (filters.period === 'All') {
        // Prefer overall failed_students; fallback to max of period fails if missing
        const overallFailedRaw = (t as any).failed_students;
        const overallFailed = Number(overallFailedRaw);
        if (isFinite(overallFailed) && overallFailed > 0) {
          return sum + overallFailed;
        }
        const f1 = Number((t as any).p1_failed) || 0;
        const f2 = Number((t as any).p2_failed) || 0;
        const f3 = Number((t as any).p3_failed) || 0;
        const fallback = Math.max(f1, f2, f3);
        return sum + fallback;
      } else {
        const key = `${filters.period.toLowerCase()}_failed` as keyof Teacher;
        return sum + (Number((t as any)[key]) || 0);
      }
    }, 0);
    return [{ label: `Totals ${filters.period}`, enrolled: totalEnrolled, failed: totalFailed }];
  }, [teachers, filters.period]);

  const categoryDistribution = useMemo(() => {
    if (filters.period === 'All') {
      const green = Number(consistentCounts.green || 0);
      const yellow = Number(consistentCounts.yellow || 0);
      const red = Number(consistentCounts.red || 0);
      return [
        { name: 'GREEN', value: green },
        { name: 'YELLOW', value: yellow },
        { name: 'RED', value: red },
      ];
    }
    const match = (summary || []).find((row) => row.period === filters.period);
    const green = Number(match?.green_count || 0);
    const yellow = Number(match?.yellow_count || 0);
    const red = Number(match?.red_count || 0);
    return [
      { name: 'GREEN', value: green },
      { name: 'YELLOW', value: yellow },
      { name: 'RED', value: red },
    ];
  }, [summary, filters.period, consistentCounts]);

  const percentChartConfig = {
    percent: { label: "% Failed" },
  };

  const COLOR_GREEN = "#22c55e"; // green-500
  const COLOR_YELLOW = "#facc15"; // yellow-400
  const COLOR_RED = "#ef4444"; // red-500

  const getColorForPercent = (pct: number) => {
    if (pct === 0) return COLOR_GREEN;
    if (pct <= 10) return COLOR_GREEN;
    if (pct <= 40) return COLOR_YELLOW;
    return COLOR_RED;
  };




  // Compute aggregated failed percent for totals chart
  const totalsPercent = useMemo(() => {
    const row = (totalsData && totalsData[0]) ? totalsData[0] : null;
    if (!row) return null;
    const e = Number(row.enrolled || 0);
    const f = Number(row.failed || 0);
    if (!isFinite(e) || e <= 0 || !isFinite(f)) return null;
    return (f / e) * 100;
  }, [totalsData]);

  // Dynamic colors: failed bar reflects zone thresholds (green/yellow/red)
  const totalsChartConfig = useMemo(() => ({
    enrolled: { label: "Enrolled", color: COLOR_GREEN },
    failed: { label: "Failed", color: totalsPercent !== null ? getColorForPercent(totalsPercent) : COLOR_RED },
  }), [totalsPercent]);

  // Colors for category chart
  const categoryChartColors = {
    GREEN: COLOR_GREEN,
    YELLOW: COLOR_YELLOW,
    RED: COLOR_RED,
  } as const;

  const categoryChartConfig = {
    GREEN: { label: "GREEN", color: categoryChartColors.GREEN },
    YELLOW: { label: "YELLOW", color: categoryChartColors.YELLOW },
    RED: { label: "RED", color: categoryChartColors.RED },
  };

  // Total teachers for the selected period (for percentage display)
  const totalTeachersSelected = useMemo(() => {
    const rows = (summary || []).filter((row) => row.period !== 'SEMESTRAL');
    if (filters.period === 'All') {
      // Use actual count of teachers loaded to avoid mismatched denominators
      return (teachers || []).length;
    }
    const match = rows.find((r) => r.period === filters.period);
    return match ? Number(match.total_teachers || 0) : 0;
  }, [summary, filters.period, teachers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Teacher Reports</h1>
          <p className="text-muted-foreground">Charts and insights based on faculty performance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => navigate('/teachers')}>
            Back to Teachers
          </Button>
          <Button onClick={() => navigate('/teachers')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Manage Teachers
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle>Failure Percent by Teacher (Top 10)</CardTitle>
            <CardDescription>Sorted by highest % for {filters.period}</CardDescription>
          </div>
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4 w-full md:w-auto">
            <Select value={filters.program} onValueChange={(v) => setFilters((f) => ({ ...f, program: v === '__ALL__' ? '' : v }))}>
              <SelectTrigger className="h-8 w-full text-sm"><SelectValue placeholder="All programs" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">All</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.program_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.schoolYear} onValueChange={(v) => setFilters((f) => ({ ...f, schoolYear: v }))}>
              <SelectTrigger className="h-8 w-full text-sm"><SelectValue placeholder="School Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2023-2024">2023-2024</SelectItem>
                <SelectItem value="2024-2025">2024-2025</SelectItem>
                <SelectItem value="2025-2026">2025-2026</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.semester} onValueChange={(v) => setFilters((f) => ({ ...f, semester: v }))}>
              <SelectTrigger className="h-8 w-full text-sm"><SelectValue placeholder="Semester" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1st">1st</SelectItem>
                <SelectItem value="2nd">2nd</SelectItem>
                <SelectItem value="Summer">Summer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.period} onValueChange={(v) => setFilters((f) => ({ ...f, period: v as any }))}>
              <SelectTrigger className="h-8 w-full text-sm"><SelectValue placeholder="Period" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="P1">P1</SelectItem>
                <SelectItem value="P2">P2</SelectItem>
                <SelectItem value="P3">P3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={percentChartConfig}>
            <BarChart data={top10Data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="teacher" hide={isMobile} tick={{ fontSize: 10 }} interval={0} angle={-30} dy={20} />
              <YAxis tickFormatter={(v) => `${v}%`} />
              <ChartTooltip content={<ChartTooltipContent nameKey="percent" />} />
              <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
                {top10Data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorForPercent(entry.percent)} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Department Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Zone Distribution by Department (All)</CardTitle>
          <CardDescription>Monthly counts per zone across departments</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              green: { label: "Green", color: ZONE_COLORS.green },
              yellow: { label: "Yellow", color: ZONE_COLORS.yellow },
              red: { label: "Red", color: ZONE_COLORS.red },
            }}
          >
            <LineChart data={deptMonthlyCounts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month_label" />
              <YAxis allowDecimals={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(value) => `Month: ${value}`}
                    formatter={(value, name, item: any, _index, dataPayload: any) => {
                      const zoneKey = String(item?.dataKey || name || "").toLowerCase();
                      const deptName = dataPayload?.top_departments?.[zoneKey] ?? null;
                      return (
                        <div className="flex flex-1 justify-between items-center leading-none">
                          <div className="grid gap-0.5">
                            <span className="text-muted-foreground">{name}</span>
                            <span className="text-muted-foreground">Dept: {deptName || "—"}</span>
                          </div>
                          <span className="font-mono font-medium tabular-nums text-foreground">{Number(value).toLocaleString()}</span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="green"
                name="Green"
                stroke="var(--color-green)"
                strokeWidth={activeDeptHover === "green" ? 3 : 2}
                strokeOpacity={activeDeptHover && activeDeptHover !== "green" ? 0.35 : 1}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
                onMouseOver={() => setActiveDeptHover("green")}
                onMouseOut={() => setActiveDeptHover(null)}
              />
              <Line
                type="monotone"
                dataKey="yellow"
                name="Yellow"
                stroke="var(--color-yellow)"
                strokeWidth={activeDeptHover === "yellow" ? 3 : 2}
                strokeOpacity={activeDeptHover && activeDeptHover !== "yellow" ? 0.35 : 1}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
                onMouseOver={() => setActiveDeptHover("yellow")}
                onMouseOut={() => setActiveDeptHover(null)}
              />
              <Line
                type="monotone"
                dataKey="red"
                name="Red"
                stroke="var(--color-red)"
                strokeWidth={activeDeptHover === "red" ? 3 : 2}
                strokeOpacity={activeDeptHover && activeDeptHover !== "red" ? 0.35 : 1}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
                onMouseOver={() => setActiveDeptHover("red")}
                onMouseOut={() => setActiveDeptHover(null)}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution ({filters.period})</CardTitle>
            <CardDescription>GREEN vs YELLOW vs RED across teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={categoryChartConfig}>
              <PieChart>
                <Pie data={categoryDistribution} dataKey="value" nameKey="name" outerRadius={isMobile ? 80 : 100} label>
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`var(--color-${entry.name})`} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="value" />} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Enrolled vs Failed ({filters.period})</CardTitle>
            <CardDescription>Enrolled vs Failed totals</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={totalsChartConfig}>
              <BarChart data={totalsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="enrolled" fill="var(--color-enrolled)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" fill="var(--color-failed)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Zone Distribution Across Periods */}
      <Card>
        <CardHeader>
          <CardTitle>Zone Distribution Across Periods</CardTitle>
          <CardDescription>Green, Yellow, Red over P1–P3</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              green: { label: 'Green', color: '#16a34a' },
              yellow: { label: 'Yellow', color: '#facc15' },
              red: { label: 'Red', color: '#dc2626' },
            }}
          >
            <LineChart data={zonePeriodsLineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="green"
                name="Green"
                stroke="var(--color-green)"
                strokeWidth={activeZoneHover === 'green' ? 3 : 2}
                strokeOpacity={activeZoneHover && activeZoneHover !== 'green' ? 0.35 : 1}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
                onMouseOver={() => setActiveZoneHover('green')}
                onMouseOut={() => setActiveZoneHover(null)}
              />
              <Line
                type="monotone"
                dataKey="yellow"
                name="Yellow"
                stroke="var(--color-yellow)"
                strokeWidth={activeZoneHover === 'yellow' ? 3 : 2}
                strokeOpacity={activeZoneHover && activeZoneHover !== 'yellow' ? 0.35 : 1}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
                onMouseOver={() => setActiveZoneHover('yellow')}
                onMouseOut={() => setActiveZoneHover(null)}
              />
              <Line
                type="monotone"
                dataKey="red"
                name="Red"
                stroke="var(--color-red)"
                strokeWidth={activeZoneHover === 'red' ? 3 : 2}
                strokeOpacity={activeZoneHover && activeZoneHover !== 'red' ? 0.35 : 1}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
                onMouseOver={() => setActiveZoneHover('red')}
                onMouseOut={() => setActiveZoneHover(null)}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Existing content below remains unchanged */}
      {/* ... existing code ... */}
    </div>
  );
};

export default TeacherReports;
{/* Existing content below remains unchanged */}
{/* ... existing code ... */}