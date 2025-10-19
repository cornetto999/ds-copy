import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Removed unused Checkbox import
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Removed unused DropdownMenu imports
import { Plus, Search, User, Edit, Eye, Loader2, Upload, Download, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ZoneBadge from "@/components/ZoneBadge";
import CategoryBadge from "@/components/CategoryBadge";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

interface Teacher {
  id: number;
  teacher_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email?: string;
  department: string;
  position?: string;
  status: string;
  zone: "green" | "yellow" | "red";
  notes?: string;
  enrolled_students?: number;
  failed_students?: number;
  failure_percentage?: number;
  p1_failed?: number;
  p1_percent?: number;
  p1_category?: string;
  p2_failed?: number;
  p2_percent?: number;
  p2_category?: string;
  p3_failed?: number;
  p3_percent?: number;
  p3_category?: string;
  created_at: string;
}

const Teachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [semester, setSemester] = useState("1st");
  const [selectedPeriod, setSelectedPeriod] = useState("All");
  const [formData, setFormData] = useState({
    teacher_id: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    department: "",
    position: "",
    status: "Active",
    zone: "green" as Teacher["zone"],
    notes: ""
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState({
    teacher_id: true,
    name: true,
    department: true,
    enrolled: true,
    p1_performance: true,
    p2_performance: true,
    p3_performance: true,
    zone: true,
    actions: true
  });
  const [filters, setFilters] = useState({
    department: '',
    zone: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const { toast } = useToast();

  // Generate academic years from 2023 to present
  const currentYear = new Date().getFullYear();
  const academicYears = [];
  for (let year = 2023; year <= currentYear; year++) {
    academicYears.push(`${year}-${year + 1}`);
  }

  const navigate = useNavigate();

  useEffect(() => {
    fetchTeachers();
  }, [academicYear, semester]);

  useEffect(() => {
    setVisibleColumns(prev => ({
      ...prev,
      p1_performance: selectedPeriod === 'All' || selectedPeriod === 'P1',
      p2_performance: selectedPeriod === 'All' || selectedPeriod === 'P2',
      p3_performance: selectedPeriod === 'All' || selectedPeriod === 'P3',
    }));
  }, [selectedPeriod]);

  const calcPercent = (failed?: number | string, enrolled?: number | string) => {
    const f = Number(failed);
    const e = Number(enrolled);
    if (!isFinite(f) || !isFinite(e) || e <= 0) return null;
    return (f / e) * 100;
  };

  const categorizeFromPercent = (failed?: number | string, enrolled?: number | string) => {
    const pct = calcPercent(failed, enrolled);
    if (pct === null) return null;
    if (pct === 0) return 'GREEN (0%)';
    if (pct <= 10) return 'GREEN (0.01%-10%)';
    if (pct <= 40) return 'YELLOW (10.01%-40%)';
    return 'RED (40.01%-100%)';
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

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (academicYear) params.set('school_year', academicYear);
      if (semester) params.set('semester', semester);
      params.set('recompute', '0');
      const response = await fetch(apiUrl(`teachers.php?${params.toString()}`));
      const data = await response.json();
      if (Array.isArray(data)) {
        setTeachers(data);
      } else {
        console.error('Invalid data format:', data);
        setTeachers([]);
        toast({
          title: "Error",
          description: "Invalid data format received from server",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
      toast({
        title: "Error",
        description: "Failed to load teachers data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced filtering and sorting logic
  const filteredTeachers = (teachers || []).filter(teacher => {
    const fullName = `${teacher.first_name} ${teacher.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
           teacher.teacher_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
           teacher.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !filters.department || teacher.department === filters.department;
    const matchesZone = !filters.zone || teacher.zone === filters.zone;
    const matchesStatus = !filters.status || teacher.status === filters.status;

    const periodMatches = selectedPeriod === 'All' ? true : (() => {
      const base = selectedPeriod.toLowerCase();
      const failedVal = (teacher as any)[`${base}_failed`];
      const percentVal = (teacher as any)[`${base}_percent`];
      const categoryVal = (teacher as any)[`${base}_category`];
      return (failedVal !== undefined && failedVal !== null) ||
             (percentVal !== undefined && percentVal !== null) ||
             (typeof categoryVal === 'string' && categoryVal.trim() !== '');
    })();
    
    return matchesSearch && matchesDepartment && matchesZone && matchesStatus && periodMatches;
  });

  // No interactive sorting on Teachers table; keep filtered order
  const sortedTeachers = filteredTeachers;

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sortedTeachers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeachers = sortedTeachers.slice(startIndex, startIndex + itemsPerPage);

  // Handlers for pagination
  const handlePageChange = (page: number) => {
    const clamped = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(clamped);
  };

  const handleItemsPerPageChange = (value: string) => {
    const next = Number(value) || 10;
    setItemsPerPage(next);
    setCurrentPage(1);
  };

  // Get unique values for filters
  const departments = [...new Set(teachers.map(t => t.department))];
  const zones = [...new Set(teachers.map(t => t.zone))];
  const statuses = [...new Set(teachers.map(t => t.status))];

  // Removed obsolete sort and pagination handlers

  // P1, P2, and P3 are always available

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading teachers...</span>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      teacher_id: "",
      first_name: "",
      last_name: "",
      middle_name: "",
      email: "",
      department: "",
      position: "",
      status: "Active",
      zone: "green",
      notes: ""
    });
  };

  const handleAdd = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      teacher_id: teacher.teacher_id,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      middle_name: teacher.middle_name || "",
      email: teacher.email || "",
      department: teacher.department,
      position: teacher.position || "",
      status: teacher.status,
      zone: teacher.zone,
      notes: teacher.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsViewDialogOpen(true);
  };

  const handleSaveTeacher = async () => {
    if (!formData.teacher_id || !formData.first_name || !formData.last_name || !formData.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(apiUrl('teachers.php'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Teacher added successfully"
        });
        setIsAddDialogOpen(false);
        resetForm();
        fetchTeachers();
      } else {
        throw new Error('Failed to add teacher');
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      toast({
        title: "Error",
        description: "Failed to add teacher",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTeacher = async () => {
    if (!selectedTeacher || !formData.teacher_id || !formData.first_name || !formData.last_name || !formData.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(apiUrl(`teachers.php?id=${selectedTeacher.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Teacher updated successfully"
        });
        setIsEditDialogOpen(false);
        setSelectedTeacher(null);
        resetForm();
        fetchTeachers();
      } else {
        throw new Error('Failed to update teacher');
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      toast({
        title: "Error",
        description: "Failed to update teacher",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please choose a CSV file to upload.",
        variant: "destructive"
      });
      return;
    }

    if (file.size <= 0) {
      toast({
        title: "Empty file",
        description: "The selected file appears to be empty (0 bytes).",
        variant: "destructive"
      });
      return;
    }

    // Validate file type - only CSV supported for typed import
    const allowedTypes = ['text/csv', 'text/plain', 'application/csv', 'application/octet-stream'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      toast({
        title: "Excel file not supported",
        description: (
          <div className="space-y-2">
            <p>Excel files (.xlsx, .xls) are not directly supported.</p>
            <div className="text-sm">
              <p className="font-medium">Please convert to CSV:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Open your Excel file</li>
                <li>Go to File → Save As</li>
                <li>Choose "CSV (Comma delimited)" format</li>
                <li>Save the file</li>
                <li>Upload the CSV file instead</li>
              </ol>
            </div>
          </div>
        ),
        variant: "destructive",
        duration: 10000
      });
      return;
    }

    if (!allowedTypes.includes(file.type) && fileExtension !== 'csv') {
      toast({
        title: "Invalid file type",
        description: "Please upload CSV files only.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file); // must match PHP key
      formData.append('type', 'teachers');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(apiUrl('upload.php'), {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      let result: any = {};
      try {
        result = await response.json();
      } catch (e) {
        result = { success: false, message: 'Invalid JSON response from server' };
      }

      if (response.ok && result.success) {
        const extra = result.filename && result.filesize ? ` (saved as ${result.filename}, ${result.filesize} bytes)` : '';
        toast({
          title: "Upload successful",
          description: `${result.message}${extra}`,
        });
        fetchTeachers();
      } else {
        // Handle Excel file error with instructions
        if (Array.isArray(result.instructions)) {
          const instructionText = result.instructions.join('\n');
          toast({
            title: "Excel file not supported",
            description: (
              <div className="space-y-2">
                <p>{result.message}</p>
                <div className="text-sm">
                  <p className="font-medium">Instructions:</p>
                  <pre className="whitespace-pre-wrap text-xs">{instructionText}</pre>
                </div>
              </div>
            ),
            variant: "destructive",
            duration: 10000
          });
        } else {
          const backendMessage = result?.message || 'Failed to upload file';
          const errorList = Array.isArray(result?.errors)
            ? result.errors.slice(0, 8).map((e: any) => typeof e === 'string' ? e : JSON.stringify(e))
            : [];

          toast({
            title: "Upload failed",
            description: (
              <div className="space-y-2">
                <p>{backendMessage}</p>
                {errorList.length > 0 && (
                  <div className="text-sm">
                    <p className="font-medium">Details:</p>
                    <pre className="whitespace-pre-wrap text-xs">{errorList.join('\n')}</pre>
                  </div>
                )}
              </div>
            ),
            variant: "destructive",
            duration: errorList.length > 0 ? 12000 : 6000
          });
        }
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Network error occurred during upload",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = () => {
    let header = "FacultyNo,FacultyName,EnrolledStudents,P1_Failed,P1_Percent,P1_Category,P2_Failed,P2_Percent,P2_Category";
    if (semester === "2nd") {
      header += ",P3_Failed,P3_Percent,P3_Category";
    }
    const blob = new Blob([header + "\n"], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachers_performance_template_${semester}_semester.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Teachers</h1>
          <p className="text-muted-foreground">
            Manage faculty records and performance evaluation
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <Button variant="default" onClick={() => navigate('/reports')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Reports</span>
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Download Template</span>
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Upload CSV file"
            />
            <Button disabled={isUploading}>
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{isUploading ? `Uploading... ${uploadProgress}%` : "Upload CSV"}</span>
            </Button>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Teacher</span>
          </Button>
        </div>
      </div>

      {/* Academic Year and Semester Selectors */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Academic Year:</span>
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {String(year)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Vertical separator line */}
        <div className="h-6 w-px bg-border"></div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Semester:</span>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="w-24 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1st">1st</SelectItem>
              <SelectItem value="2nd">2nd</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Period selector dropdown */}
        <div className="flex items-center gap-2 ml-2">
          <span className="text-sm text-muted-foreground">Period:</span>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-20 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="P1">P1</SelectItem>
              <SelectItem value="P2">P2</SelectItem>
              <SelectItem value="P3">P3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find teachers by name or ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label htmlFor="department-filter">Department</Label>
                  <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value === '__ALL_DEPARTMENTS__' ? '' : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ALL_DEPARTMENTS__">All departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="zone-filter">Zone</Label>
                  <Select value={filters.zone} onValueChange={(value) => setFilters(prev => ({ ...prev, zone: value === '__ALL_ZONES__' ? '' : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All zones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ALL_ZONES__">All zones</SelectItem>
                      {zones.map(zone => (
                        <SelectItem key={zone} value={zone}>
                          {zone.charAt(0).toUpperCase() + zone.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === '__ALL_STATUSES__' ? '' : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ALL_STATUSES__">All statuses</SelectItem>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Faculty List</CardTitle>
          <CardDescription>
            {sortedTeachers.length} teachers found
          </CardDescription>
        </CardHeader>
        <CardContent>
            {/* Horizontal scroll only for this card content */}
            <div className="w-full max-w-full overflow-x-auto">
            <Table className="min-w-full border-collapse table-fixed">
              <TableHeader>
                <TableRow>
                  {visibleColumns.teacher_id && (
                    <TableHead className="w-40 whitespace-nowrap text-left">Faculty Number</TableHead>
                  )}
                  {visibleColumns.name && (
                    <TableHead className="w-56 whitespace-nowrap text-left">Faculty Name</TableHead>
                  )}
                  {visibleColumns.department && (
                    <TableHead className="w-44 whitespace-nowrap text-left">Department</TableHead>
                  )}
                  {visibleColumns.enrolled && (
                    <TableHead className="w-64 whitespace-nowrap text-left">Number of Enrolled Students</TableHead>
                  )}
                  {visibleColumns.p1_performance && (
                    <>
                      <TableHead className="w-44 whitespace-nowrap text-left">P1 Number of Failed</TableHead>
                      <TableHead className="w-44 whitespace-nowrap text-left">P1 % of Failed</TableHead>
                      <TableHead className="w-44 whitespace-nowrap text-left">P1 Categorization</TableHead>
                    </>
                  )}
                  {visibleColumns.p2_performance && (
                    <>
                      <TableHead className="w-44 whitespace-nowrap text-left">P2 Number of Failed</TableHead>
                      <TableHead className="w-44 whitespace-nowrap text-left">P2 % of Failed</TableHead>
                      <TableHead className="w-44 whitespace-nowrap text-left">P2 Categorization</TableHead>
                    </>
                  )}
                  {visibleColumns.p3_performance && (
                    <>
                      <TableHead className="w-44 whitespace-nowrap text-left">P3 Number of Failed</TableHead>
                      <TableHead className="w-44 whitespace-nowrap text-left">P3 % of Failed</TableHead>
                      <TableHead className="w-44 whitespace-nowrap text-left">P3 Categorization</TableHead>
                    </>
                  )}
                  {visibleColumns.zone && (
                    <TableHead className="w-28 whitespace-nowrap text-left">Zone</TableHead>
                  )}
                  {visibleColumns.actions && (
                    <TableHead className="w-32 whitespace-nowrap text-left">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTeachers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="text-center text-muted-foreground">
                      No records found for this period
                    </TableCell>
                  </TableRow>
                )}
                {paginatedTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    {visibleColumns.teacher_id && (
                      <TableCell className="w-40 font-medium whitespace-nowrap">
                        {teacher.teacher_id}
                      </TableCell>
                    )}
                    {visibleColumns.name && (
                      <TableCell className="w-56 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">
                            {`${teacher.first_name} ${teacher.last_name}`}
                          </span>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.department && (
                      <TableCell className="w-44 whitespace-nowrap">
                        <Badge variant="outline" className="truncate max-w-[150px]">
                          {teacher.department}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.enrolled && (
                      <TableCell className="w-64 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {Number(teacher.enrolled_students) || 0}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.p1_performance && (
                      <>
                        <TableCell className="w-44 whitespace-nowrap">
                          <div className="text-sm">{Number(teacher.p1_failed) || 0}</div>
                        </TableCell>
                        <TableCell className="w-44 whitespace-nowrap">
                          <div className="text-sm text-muted-foreground">
                            {(() => {
                              const pct = percentFromData(teacher.p1_percent, teacher.p1_failed, teacher.enrolled_students);
                              if (pct === null) return 'N/A';
                              return `${pct.toFixed(2)}%`;
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="w-44 whitespace-nowrap">
                          {(() => {
                            const pct = percentFromData(teacher.p1_percent, teacher.p1_failed, teacher.enrolled_students);
                            const cat = pct !== null ? categoryFromPercentValue(pct) : (teacher.p1_category || 'N/A');
                            return <CategoryBadge category={cat} />;
                          })()}
                        </TableCell>
                      </>
                    )}
                    {visibleColumns.p2_performance && (
                      <>
                        <TableCell className="w-44 whitespace-nowrap">
                          <div className="text-sm">{Number(teacher.p2_failed) || 0}</div>
                        </TableCell>
                        <TableCell className="w-44 whitespace-nowrap">
                          <div className="text-sm text-muted-foreground">
                            {(() => {
                              const pct = percentFromData(teacher.p2_percent, teacher.p2_failed, teacher.enrolled_students);
                              if (pct === null) return 'N/A';
                              return `${pct.toFixed(2)}%`;
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="w-44 whitespace-nowrap">
                          {(() => {
                            const pct = percentFromData(teacher.p2_percent, teacher.p2_failed, teacher.enrolled_students);
                            const cat = pct !== null ? categoryFromPercentValue(pct) : (teacher.p2_category || 'N/A');
                            return <CategoryBadge category={cat} />;
                          })()}
                        </TableCell>
                      </>
                    )}
                    {visibleColumns.p3_performance && (
                      <>
                        <TableCell className="w-44 whitespace-nowrap">
                          <div className="text-sm">{Number(teacher.p3_failed) || 0}</div>
                        </TableCell>
                        <TableCell className="w-44 whitespace-nowrap">
                          <div className="text-sm text-muted-foreground">
                            {(() => {
                              const pct = percentFromData(teacher.p3_percent, teacher.p3_failed, teacher.enrolled_students);
                              if (pct === null) return 'N/A';
                              return `${pct.toFixed(2)}%`;
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="w-44 whitespace-nowrap">
                          {(() => {
                            const pct = percentFromData(teacher.p3_percent, teacher.p3_failed, teacher.enrolled_students);
                            const cat = pct !== null ? categoryFromPercentValue(pct) : (teacher.p3_category || 'N/A');
                            return <CategoryBadge category={cat} />;
                          })()}
                        </TableCell>
                      </>
                    )}
                    {visibleColumns.zone && (
                      <TableCell className="w-28 whitespace-nowrap">
                        <ZoneBadge zone={teacher.zone} />
                      </TableCell>
                    )}
                    {visibleColumns.actions && (
                      <TableCell className="w-32 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(teacher)}>
                            <Edit className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleView(teacher)}>
                            <Eye className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
        </CardContent>
        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-6 pb-6">
          <div className="flex items-center gap-2">
            <Label htmlFor="itemsPerPage" className="text-sm">Rows per page:</Label>
            <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger id="itemsPerPage" className="w-24 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Department Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 aspect-[16/9]">
            <div className="text-2xl font-bold">
              {new Set((teachers || []).map(t => t.department)).size}
            </div>
            <p className="text-xs text-muted-foreground">Departments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 aspect-[16/9]">
            <div className="text-2xl font-bold">
              {(teachers || []).filter(t => t.zone === "green").length}
            </div>
            <p className="text-xs text-muted-foreground">High performers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 aspect-[16/9]">
            <div className="text-2xl font-bold">
              {(teachers || []).filter(t => t.zone === "red").length}
            </div>
            <p className="text-xs text-muted-foreground">Need support</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Teacher Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new teacher to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacher_id" className="text-right">Teacher ID*</Label>
              <Input
                id="teacher_id"
                value={formData.teacher_id}
                onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                className="col-span-3"
                placeholder="T001"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="first_name" className="text-right">First Name*</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="col-span-3"
                placeholder="First Name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last_name" className="text-right">Last Name*</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="col-span-3"
                placeholder="Last Name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="middle_name" className="text-right">Middle Name</Label>
              <Input
                id="middle_name"
                value={formData.middle_name}
                onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                className="col-span-3"
                placeholder="Middle Name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="col-span-3"
                placeholder="teacher@school.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">Department*</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="col-span-3"
                placeholder="General Education"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                className="col-span-3"
                placeholder="Faculty"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="zone" className="text-right">Zone</Label>
              <Select value={formData.zone} onValueChange={(value: Teacher["zone"]) => setFormData({...formData, zone: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="col-span-3"
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTeacher}>Add Teacher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>
              Update the teacher's information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_teacher_id" className="text-right">Teacher ID*</Label>
              <Input
                id="edit_teacher_id"
                value={formData.teacher_id}
                onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_first_name" className="text-right">First Name*</Label>
              <Input
                id="edit_first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_last_name" className="text-right">Last Name*</Label>
              <Input
                id="edit_last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_middle_name" className="text-right">Middle Name</Label>
              <Input
                id="edit_middle_name"
                value={formData.middle_name}
                onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_email" className="text-right">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_department" className="text-right">Department*</Label>
              <Input
                id="edit_department"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_position" className="text-right">Position</Label>
              <Input
                id="edit_position"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_status" className="text-right">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_zone" className="text-right">Zone</Label>
              <Select value={formData.zone} onValueChange={(value: Teacher["zone"]) => setFormData({...formData, zone: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_notes" className="text-right">Notes</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateTeacher}>Update Teacher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Teacher Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
            <DialogDescription>
              View teacher information
            </DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Teacher ID:</Label>
                <div className="col-span-3">{selectedTeacher.teacher_id}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Name:</Label>
                <div className="col-span-3">{selectedTeacher.first_name} {selectedTeacher.last_name}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Email:</Label>
                <div className="col-span-3">{selectedTeacher.email || 'No email'}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Position:</Label>
                <div className="col-span-3">{selectedTeacher.position || 'No position'}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Status:</Label>
                <div className="col-span-3">{selectedTeacher.status}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Department:</Label>
                <div className="col-span-3">{selectedTeacher.department}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Zone:</Label>
                <div className="col-span-3">
                  <ZoneBadge zone={selectedTeacher.zone} />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Notes:</Label>
                <div className="col-span-3">{selectedTeacher.notes || "No notes"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Created:</Label>
                <div className="col-span-3">{new Date(selectedTeacher.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teachers;