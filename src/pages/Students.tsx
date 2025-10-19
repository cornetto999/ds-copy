import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, AlertTriangle, Edit, Eye, Loader2, Upload, Download } from "lucide-react";
import ZoneBadge from "@/components/ZoneBadge";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email?: string;
  program_id?: number;
  // Optional fields that may be provided by backend; used with fallbacks
  program_name?: string;
  year_level: number;
  semester: string;
  academic_year: string;
  status: string;
  zone: "green" | "yellow" | "red";
  at_risk: boolean;
  notes?: string;
  created_at: string;
}

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [semester, setSemester] = useState("1st");
  const { toast } = useToast();

  // Generate academic years from 2023 to present
  const currentYear = new Date().getFullYear();
  const academicYears = [];
  for (let year = 2023; year <= currentYear; year++) {
    academicYears.push(`${year}-${year + 1}`);
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('students.php'));
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const [newStudent, setNewStudent] = useState<{
    student_id: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    email: string;
    program_id: string;
    year_level: string;
    semester: string;
    academic_year: string;
    status: string;
    zone: "green" | "yellow" | "red";
    notes: string;
    at_risk: boolean;
  }>({
    student_id: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    program_id: "",
    year_level: "1",
    semester: "1st",
    academic_year: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
    status: "Active",
    zone: "green",
    notes: "",
    at_risk: false
  });

  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
           student.student_id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading students...</span>
        </div>
      </div>
    );
  }

  const handleAddStudent = async () => {
    if (!newStudent.student_id || !newStudent.first_name || !newStudent.last_name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const studentData = {
        ...newStudent,
        program_id: newStudent.program_id ? parseInt(newStudent.program_id) : null,
        year_level: parseInt(newStudent.year_level),
        at_risk: newStudent.at_risk
      };

      const response = await fetch(apiUrl('students.php'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Student added successfully"
        });
        setNewStudent({
          student_id: "",
          first_name: "",
          last_name: "",
          middle_name: "",
          email: "",
          program_id: "",
          year_level: "1",
          semester: "1st",
          academic_year: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
          status: "Active",
          zone: "green",
          notes: "",
          at_risk: false
        });
        setIsAddDialogOpen(false);
        fetchStudents();
      } else {
        throw new Error('Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: "Failed to add student",
        variant: "destructive"
      });
    }
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload CSV files. Excel files may require additional setup.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'Students');

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

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Upload successful",
          description: result.message,
        });
        // Refresh the students list
        fetchStudents();
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload file",
          variant: "destructive"
        });
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
    const header = "student_id,first_name,last_name,email,program,year_level,status,gpa,at_risk,notes,grade_level";
    const blob = new Blob([header + "\n"], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">
            Manage student records and performance tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Upload CSV file"
            />
            <Button disabled={isUploading}>
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? `Uploading... ${uploadProgress}%` : "Upload CSV"}
            </Button>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Academic Year and Semester Selectors */}
      <div className="flex items-center gap-4">
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
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Enter student information below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student_id">Student ID *</Label>
                  <Input
                    id="student_id"
                    value={newStudent.student_id}
                    onChange={(e) => setNewStudent({...newStudent, student_id: e.target.value})}
                    placeholder="2024-BSCRIM-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year_level">Year Level</Label>
                  <Select value={newStudent.year_level} onValueChange={(value) => setNewStudent({...newStudent, year_level: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year level" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          Year {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={newStudent.first_name}
                    onChange={(e) => setNewStudent({...newStudent, first_name: e.target.value})}
                    placeholder="Juan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={newStudent.last_name}
                    onChange={(e) => setNewStudent({...newStudent, last_name: e.target.value})}
                    placeholder="Santos"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  value={newStudent.middle_name}
                  onChange={(e) => setNewStudent({...newStudent, middle_name: e.target.value})}
                  placeholder="Miguel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                  placeholder="juan.santos@phinma.edu.ph"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Select value={newStudent.semester} onValueChange={(value) => setNewStudent({...newStudent, semester: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st">1st Semester</SelectItem>
                      <SelectItem value="2nd">2nd Semester</SelectItem>
                      <SelectItem value="Summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year</Label>
                  <Input
                    id="academic_year"
                    value={newStudent.academic_year}
                    onChange={(e) => setNewStudent({...newStudent, academic_year: e.target.value})}
                    placeholder="2024-2025"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={newStudent.status} onValueChange={(value) => setNewStudent({...newStudent, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Graduated">Graduated</SelectItem>
                      <SelectItem value="Dropped">Dropped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zone">Performance Zone</Label>
                  <Select value={newStudent.zone} onValueChange={(value) => setNewStudent({...newStudent, zone: value as "green" | "yellow" | "red"})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="green">Green Zone</SelectItem>
                      <SelectItem value="yellow">Yellow Zone</SelectItem>
                      <SelectItem value="red">Red Zone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newStudent.notes}
                  onChange={(e) => setNewStudent({...newStudent, notes: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStudent}>
                  Add Student
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find students by name or ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>
            {filteredStudents.length} students found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Year Level</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>At Risk</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.student_id}
                  </TableCell>
                  <TableCell>{`${student.first_name} ${student.last_name}`}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {student.program_name || 'No Program'}
                    </Badge>
                  </TableCell>
                  <TableCell>Year {student.year_level}</TableCell>
                  <TableCell>{student.semester}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'Active' ? 'default' : 'secondary'}>
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ZoneBadge zone={student.zone} />
                  </TableCell>
                  <TableCell>
                    {student.at_risk ? (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Yes</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditStudent(student)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleViewStudent(student)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {students.filter(s => s.at_risk).length}
            </div>
            <p className="text-xs text-muted-foreground">At-risk students</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {students.filter(s => s.zone === "red").length}
            </div>
            <p className="text-xs text-muted-foreground">Red zone students</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {students.filter(s => s.status === 'Active').length}
            </div>
            <p className="text-xs text-muted-foreground">Active students</p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information.
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Editing: {`${selectedStudent.first_name} ${selectedStudent.last_name}`} ({selectedStudent.student_id})
              </div>
              <div className="space-y-2">
                <Label>Performance Zone</Label>
                <Select defaultValue={selectedStudent.zone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green">Green Zone</SelectItem>
                    <SelectItem value="yellow">Yellow Zone</SelectItem>
                    <SelectItem value="red">Red Zone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsEditDialogOpen(false)}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Complete student information.
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Student ID:</span>
                  <div>{selectedStudent.student_id}</div>
                </div>
                <div>
                  <span className="font-medium">Year Level:</span>
                  <div>Year {selectedStudent.year_level}</div>
                </div>
                <div>
                  <span className="font-medium">Name:</span>
                  <div>{selectedStudent.first_name} {selectedStudent.last_name}</div>
                </div>
                <div>
                  <span className="font-medium">Program:</span>
                  <div>{selectedStudent.program_name || 'No Program'}</div>
                </div>
                <div>
                  <span className="font-medium">Semester:</span>
                  <div>{selectedStudent.semester}</div>
                </div>
                <div>
                  <span className="font-medium">Academic Year:</span>
                  <div>{selectedStudent.academic_year}</div>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <div>{selectedStudent.status}</div>
                </div>
                <div>
                  <span className="font-medium">Zone:</span>
                  <div><ZoneBadge zone={selectedStudent.zone} /></div>
                </div>
                <div>
                  <span className="font-medium">At Risk:</span>
                  <div>{selectedStudent.at_risk ? "Yes" : "No"}</div>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <div>{selectedStudent.email || 'No email'}</div>
                </div>
              </div>
              {selectedStudent.notes && (
                <div>
                  <span className="font-medium text-sm">Notes:</span>
                  <div className="text-sm text-muted-foreground mt-1">
                    {selectedStudent.notes}
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Students;