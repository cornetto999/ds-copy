import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "@/lib/api";
import { Loader2, BarChart3 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [period, setPeriod] = useState<"P1" | "P2" | "P3">("P1");
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // New state for summary
  const [programs, setPrograms] = useState<{ id: number; program_name: string }[]>([]);
  const [filters, setFilters] = useState({
    program: "",
    schoolYear: "2024-2025",
    semester: "1st",
    period: "All" as "All" | "P1" | "P2" | "P3",
  });
  const [summary, setSummary] = useState<{ period: string; total_teachers: number | null; green_count: number | null; green_percent: number | null; yellow_count: number | null; yellow_percent: number | null; red_count: number | null; red_percent: number | null }[]>([]);
  const [consistentCounts, setConsistentCounts] = useState<{ green: number; yellow: number; red: number }>({ green: 0, yellow: 0, red: 0 });
  const [deptChart, setDeptChart] = useState<{ department: string; period: string; green: number; yellow: number; red: number }[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);

  // Zone modal state
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [zoneModalZone, setZoneModalZone] = useState<Zone | null>(null);

  // Compute teachers for selected zone and period
  const zoneTeachers = useMemo(() => {
    if (!zoneModalZone) return [] as Teacher[];
    const z = zoneModalZone.toUpperCase();
    const startsWithZone = (val?: string) => {
      const v = (val || '').toUpperCase().trim();
      return v.startsWith(z);
    };
    return (teachers || []).filter(t => {
      if (filters.period === 'All') {
        const raw = [t.p1_category, t.p2_category, (t as any).p3_category];
        const present = raw
          .map(c => (c || '').toUpperCase().trim())
          .filter(c => c.length > 0);
        if (present.length >= 2) {
          const allSameZone = present.every(c => c.startsWith(z));
          return allSameZone;
        }
        return false;
      }
      const key = filters.period.toLowerCase() + '_category';
      const cat = (t as any)[key] as string | undefined;
      return startsWithZone(cat);
    });
  }, [teachers, filters.period, zoneModalZone]);

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
    }).filter(r => r.percent > 0);
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
      setLoadingSummary(true);
      setErrorSummary(null);
      const params = new URLSearchParams({
        program: filters.program || '',
        school_year: filters.schoolYear,
        semester: filters.semester,
        period: filters.period,
      });
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
      setDeptChart(Array.isArray(data.department_chart) ? data.department_chart : []);
    } catch (e: any) {
      console.error('Failed to generate report:', e);
      setErrorSummary('Failed to generate report');
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    // Auto-update on filter change to meet dynamic update requirement
    generateReport();
  }, [filters.program, filters.schoolYear, filters.semester, filters.period]);
  // Ensure teachers load via effect; remove stray top-level call
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const response = await fetch(apiUrl('teachers.php'));
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
  }, []);

  const calcPercent = (failed?: number | string, enrolled?: number | string) => {
    const f = Number(failed);
    const e = Number(enrolled);
    if (!isFinite(f) || !isFinite(e) || e <= 0) return null;
    return (f / e) * 100;
  };

  const percentFromData = (
    dbPercent?: number | string,
    failed?: number | string,
    enrolled?: number | string
  ) => {
    const direct = Number(dbPercent);
    const calc = calcPercent(failed, enrolled);
    if (calc !== null) return calc;
    if (isFinite(direct)) return direct;
    return null;
  };

  const categoryFromPercentValue = (pct: number) => {
    if (pct === 0) return 'GREEN (0%)';
    if (pct <= 10) return 'GREEN (0.01%-10%)';
    if (pct <= 40) return 'YELLOW (10.01%-40%)';
    return 'RED (40.01%-100%)';
  };

  // Period-aware keys using filters.period (supports All)
  const totalsData = useMemo(() => {
    const totalEnrolled = (teachers || []).reduce((sum, t) => sum + (Number(t.enrolled_students) || 0), 0);
    const totalFailed = (teachers || []).reduce((sum, t) => {
      if (filters.period === 'All') {
        const f1 = Number((t as any).p1_failed) || 0;
        const f2 = Number((t as any).p2_failed) || 0;
        const f3 = Number((t as any).p3_failed) || 0;
        return sum + f1 + f2 + f3;
      } else {
        const key = `${filters.period.toLowerCase()}_failed` as keyof Teacher;
        return sum + (Number((t as any)[key]) || 0);
      }
    }, 0);
    return [{ label: `Totals ${filters.period}`, enrolled: totalEnrolled, failed: totalFailed }];
  }, [teachers, filters.period]);

  const categoryDistribution = useMemo(() => {
    const counts = { green: 0, yellow: 0, red: 0 };
    (teachers || []).forEach((t) => {
      if (filters.period === 'All') {
        const votes = { green: 0, yellow: 0, red: 0 };
        (['p1', 'p2', 'p3'] as const).forEach((pk) => {
          const cat = String((t as any)[`${pk}_category`] || '').toUpperCase();
          if (cat.startsWith('GREEN')) votes.green += 1;
          else if (cat.startsWith('YELLOW')) votes.yellow += 1;
          else if (cat.startsWith('RED')) votes.red += 1;
        });
        let winner: Zone = 'green';
        let maxVotes = -1;
        (['green', 'yellow', 'red'] as const).forEach((z) => {
          if (votes[z] > maxVotes) { maxVotes = votes[z]; winner = z; }
        });
        counts[winner] += 1;
      } else {
        const pk = filters.period.toLowerCase();
        const dbPercent = (t as any)[`${pk}_percent`];
        const failed = (t as any)[`${pk}_failed`];
        const pct = percentFromData(dbPercent, failed, t.enrolled_students);
        let bucket: Zone | null = null;
        if (pct !== null) {
          const label = categoryFromPercentValue(pct);
          if (label.startsWith('GREEN')) bucket = 'green';
          else if (label.startsWith('YELLOW')) bucket = 'yellow';
          else bucket = 'red';
        } else {
          const cat = String((t as any)[`${pk}_category`] || '').toUpperCase();
          if (cat.startsWith('GREEN')) bucket = 'green';
          else if (cat.startsWith('YELLOW')) bucket = 'yellow';
          else if (cat.startsWith('RED')) bucket = 'red';
        }
        if (bucket) counts[bucket] += 1;
      }
    });
    return [
      { name: 'GREEN', value: counts.green },
      { name: 'YELLOW', value: counts.yellow },
      { name: 'RED', value: counts.red },
    ];
  }, [teachers, filters.period]);

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

  const totalsChartConfig = {
    enrolled: { label: "Enrolled", color: COLOR_GREEN },
    failed: { label: "Failed", color: COLOR_RED },
  };

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
      const first = rows[0];
      return first ? Number(first.total_teachers || 0) : 0;
    }
    const match = rows.find((r) => r.period === filters.period);
    return match ? Number(match.total_teachers || 0) : 0;
  }, [summary, filters.period]);

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
                  <SelectItem key={p.id} value={p.program_name}>{p.program_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input className="h-8 w-full text-sm" placeholder="School Year" value={filters.schoolYear} onChange={(e) => setFilters((f) => ({ ...f, schoolYear: e.target.value }))} />
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

      {/* Charts moved below Department Distribution */}

      {/* New summary report section above existing charts */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Summary Level Report</CardTitle>
          <CardDescription>Aggregated counts by zone per period; updates with filters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Row */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <div>
              <Label className="text-sm">Program</Label>
              <Select value={filters.program} onValueChange={(v) => setFilters((f) => ({ ...f, program: v === '__ALL__' ? '' : v }))}>
                <SelectTrigger className="h-8 w-full text-sm"><SelectValue placeholder="All programs" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL__">All</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.program_name}>{p.program_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">School Year</Label>
              <Input className="h-8 w-full text-sm" value={filters.schoolYear} onChange={(e) => setFilters((f) => ({ ...f, schoolYear: e.target.value }))} />
            </div>
            <div>
              <Label className="text-sm">Semester</Label>
              <Select value={filters.semester} onValueChange={(v) => setFilters((f) => ({ ...f, semester: v }))}>
                <SelectTrigger className="h-8 w-full text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st">1st</SelectItem>
                  <SelectItem value="2nd">2nd</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Period</Label>
              <Select value={filters.period} onValueChange={(v) => setFilters((f) => ({ ...f, period: v as any }))}>
                <SelectTrigger className="h-8 w-full text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="P1">P1</SelectItem>
                  <SelectItem value="P2">P2</SelectItem>
                  <SelectItem value="P3">P3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {errorSummary && (
            <div className="rounded-md bg-red-50 text-red-600 text-sm p-2">{errorSummary}</div>
          )}

          {/* Summary table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Total Teachers</TableHead>
                  <TableHead>Under Green</TableHead>
                  <TableHead>% Green</TableHead>
                  <TableHead>Under Yellow</TableHead>
                  <TableHead>% Yellow</TableHead>
                  <TableHead>Under Red</TableHead>
                  <TableHead>% Red</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(summary || []).filter((row) => row.period !== 'SEMESTRAL').map((row) => (
                  <TableRow key={row.period}>
                    <TableCell>{row.period}</TableCell>
                    <TableCell>{row.total_teachers ?? '—'}</TableCell>
                    <TableCell>{row.green_count ?? '—'}</TableCell>
                    <TableCell>{typeof row.green_percent === 'number' ? `${row.green_percent.toFixed(2)}%` : '—'}</TableCell>
                    <TableCell>{row.yellow_count ?? '—'}</TableCell>
                    <TableCell>{typeof row.yellow_percent === 'number' ? `${row.yellow_percent.toFixed(2)}%` : '—'}</TableCell>
                    <TableCell>{row.red_count ?? '—'}</TableCell>
                    <TableCell>{typeof row.red_percent === 'number' ? `${row.red_percent.toFixed(2)}%` : '—'}</TableCell>
                  </TableRow>
                ))}
                {summary.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">No records found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Consistent teachers cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card onClick={() => { setZoneModalZone('green'); setZoneModalOpen(true); }} className="cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground">Consistent Green</div>
                <div className="text-2xl font-bold text-green-600">{consistentCounts.green}</div>
                <div className="text-xs text-muted-foreground">{totalTeachersSelected > 0 ? `${((consistentCounts.green / totalTeachersSelected) * 100).toFixed(2)}%` : '—'}</div>
              </CardContent>
            </Card>
            <Card onClick={() => { setZoneModalZone('yellow'); setZoneModalOpen(true); }} className="cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground">Consistent Yellow</div>
                <div className="text-2xl font-bold text-yellow-500">{consistentCounts.yellow}</div>
                <div className="text-xs text-muted-foreground">{totalTeachersSelected > 0 ? `${((consistentCounts.yellow / totalTeachersSelected) * 100).toFixed(2)}%` : '—'}</div>
              </CardContent>
            </Card>
            <Card onClick={() => { setZoneModalZone('red'); setZoneModalOpen(true); }} className="cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground">Consistent Red</div>
                <div className="text-2xl font-bold text-red-600">{consistentCounts.red}</div>
                <div className="text-xs text-muted-foreground">{totalTeachersSelected > 0 ? `${((consistentCounts.red / totalTeachersSelected) * 100).toFixed(2)}%` : '—'}</div>
              </CardContent>
            </Card>
          </div>

          {/* Zone modal */}
          <Dialog open={zoneModalOpen} onOpenChange={setZoneModalOpen}>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{zoneModalZone ? `${zoneModalZone[0].toUpperCase()}${zoneModalZone.slice(1)} Zone Teachers (${filters.period})` : 'Zone'}</DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Failure %</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zoneTeachers.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No teachers found</TableCell></TableRow>
                    )}
                    {zoneTeachers.map((t, i) => {
                      const perc = (() => {
                        const toNum = (x: any) => typeof x === 'number' ? x : parseFloat(x || '0');
                        const p1 = toNum(t.p1_percent);
                        const p2 = toNum(t.p2_percent);
                        const p3 = toNum((t as any).p3_percent);
                        if (filters.period === 'P1') return p1;
                        if (filters.period === 'P2') return p2;
                        if (filters.period === 'P3') return p3;
                        return Math.max(p1, p2, p3);
                      })();
                      const cat = (() => {
                        if (filters.period === 'P1') return t.p1_category;
                        if (filters.period === 'P2') return t.p2_category;
                        if (filters.period === 'P3') return (t as any).p3_category;
                        return t.p1_category || t.p2_category || (t as any).p3_category;
                      })();
                      return (
                        <TableRow key={i}>
                          <TableCell>{t.first_name} {t.last_name}</TableCell>
                          <TableCell>{t.department}</TableCell>
                          <TableCell>{typeof perc === 'number' ? `${perc.toFixed(2)}%` : '—'}</TableCell>
                          <TableCell>{cat || '—'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

        {/* Department Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Zone Distribution by Department ({filters.period})</CardTitle>
            <CardDescription>GREEN vs YELLOW vs RED per department</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ green: { label: 'GREEN' }, yellow: { label: 'YELLOW' }, red: { label: 'RED' } }}>
              <BarChart data={deptChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="green" fill="#22c55e" stackId="zones" radius={[4,4,0,0]} />
                <Bar dataKey="yellow" fill="#facc15" stackId="zones" radius={[4,4,0,0]} />
                <Bar dataKey="red" fill="#ef4444" stackId="zones" radius={[4,4,0,0]} />
              </BarChart>
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
            <CardDescription>Aggregated counts across all teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={totalsChartConfig}>
              <BarChart data={totalsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="enrolled" fill={COLOR_GREEN} radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" fill={COLOR_RED} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Existing content below remains unchanged */}
      {/* ... existing code ... */}
    </div>
  );
};

export default TeacherReports;