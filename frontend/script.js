const API_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('token');
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        verifyToken();
    }
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
});

// API Helper
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    if (data) options.body = JSON.stringify(data);
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const result = await response.json();
    
    if (!response.ok) {
        if (response.status === 401) {
            logout();
        }
        throw new Error(result.message || 'API call failed');
    }
    return result;
}

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (data.success) {
            token = data.token;
            currentUser = data.user;
            localStorage.setItem('token', token);
            showMainContent();
            loadDashboard();
        } else {
            alert('Login failed: ' + data.message);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Verify Token
async function verifyToken() {
    try {
        const result = await apiCall('/auth/me');
        if (result.success) {
            currentUser = result.data.user;
            showMainContent();
            loadDashboard();
        }
    } catch (error) {
        logout();
    }
}

// Show Main Content
function showMainContent() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    // Show/hide menu items based on role
    const navMenu = document.getElementById('navMenu');
    if (currentUser?.role !== 'Admin') {
        const adminLinks = navMenu.querySelectorAll('.admin-only');
        adminLinks.forEach(link => link.style.display = 'none');
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
}

// Page Navigation
function showPage(page) {
    const contentDiv = document.getElementById('pageContent');
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'students':
            loadStudents();
            break;
        case 'courses':
            loadCourses();
            break;
        case 'attendance':
            loadAttendance();
            break;
        case 'results':
            loadResults();
            break;
        case 'search':
            loadSearch();
            break;
    }
}

// Dashboard
async function loadDashboard() {
    const contentDiv = document.getElementById('pageContent');
    contentDiv.innerHTML = '<div class="spinner"></div>';
    
    try {
        const analytics = await apiCall('/analytics/dashboard');
        const topStudents = await apiCall('/analytics/top-students');
        
        contentDiv.innerHTML = `
            <h2 class="mb-4"><i class="fas fa-chart-line"></i> Dashboard</h2>
            
            <div class="row">
                <div class="col-md-3">
                    <div class="stat-card">
                        <i class="fas fa-users"></i>
                        <h3>${analytics.data.studentStats.reduce((sum, s) => sum + s.count, 0)}</h3>
                        <p>Total Students</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <i class="fas fa-book"></i>
                        <h3>${analytics.data.courseStats.reduce((sum, c) => sum + c.totalCourses, 0)}</h3>
                        <p>Total Courses</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <i class="fas fa-chalkboard-user"></i>
                        <h3>${analytics.data.attendanceStats.find(a => a._id === 'Present')?.count || 0}</h3>
                        <p>Present Today</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <i class="fas fa-chart-line"></i>
                        <h3>${analytics.data.performanceStats[0]?.avgMarks?.toFixed(1) || 0}%</h3>
                        <p>Average Performance</p>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">Department Distribution</div>
                        <div class="card-body">
                            <canvas id="deptChart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">Top Performing Students</div>
                        <div class="card-body">
                            <table class="table table-sm">
                                <thead>
                                    <tr><th>Student ID</th><th>Name</th><th>Average</th><th>CGPA</th></tr>
                                </thead>
                                <tbody>
                                    ${topStudents.data.map(s => `
                                        <tr>
                                            <td>${s.studentId}</td>
                                            <td>${s.userDetails[0]?.name || 'N/A'}</td>
                                            <td>${s.averageMarks?.toFixed(1)}%</td>
                                            <td>${s.cgpa?.toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Create chart
        const ctx = document.getElementById('deptChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: analytics.data.departmentDistribution.map(d => d._id),
                datasets: [{
                    data: analytics.data.departmentDistribution.map(d => d.total),
                    backgroundColor: ['#4361ee', '#3f37c9', #4caf50', '#ff9800', '#f44336']
                }]
            }
        });
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger">Error loading dashboard: ${error.message}</div>`;
    }
}

// Students Management
async function loadStudents() {
    const contentDiv = document.getElementById('pageContent');
    contentDiv.innerHTML = '<div class="spinner"></div>';
    
    try {
        const result = await apiCall('/students');
        
        contentDiv.innerHTML = `
            <div class="d-flex justify-content-between mb-4">
                <h2><i class="fas fa-users"></i> Students Management</h2>
                ${currentUser?.role === 'Admin' ? '<button class="btn btn-primary" onclick="showStudentModal()"><i class="fas fa-plus"></i> Add Student</button>' : ''}
            </div>
            
            <div class="search-box">
                <input type="text" id="searchStudent" placeholder="Search by name, ID, or enrollment..." onkeyup="searchStudents()">
                <button onclick="searchStudents()"><i class="fas fa-search"></i></button>
            </div>
            
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr><th>Student ID</th><th>Name</th><th>Email</th><th>Department</th><th>Semester</th><th>CGPA</th><th>Actions</th></tr>
                    </thead>
                    <tbody id="studentsTableBody">
                        ${result.data.map(s => `
                            <tr>
                                <td>${s.studentId}</td>
                                <td>${s.user?.name || 'N/A'}</td>
                                <td>${s.user?.email || 'N/A'}</td>
                                <td>${s.department}</td>
                                <td>Semester ${s.semester}</td>
                                <td>${s.cgpa?.toFixed(2) || 'N/A'}</td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="viewStudent('${s._id}')"><i class="fas fa-eye"></i></button>
                                    ${currentUser?.role === 'Admin' ? `
                                        <button class="btn btn-sm btn-warning" onclick="editStudent('${s._id}')"><i class="fas fa-edit"></i></button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteStudent('${s._id}')"><i class="fas fa-trash"></i></button>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger">Error loading students: ${error.message}</div>`;
    }
}

// Show Student Modal
function showStudentModal(studentId = null) {
    const modal = new bootstrap.Modal(document.getElementById('studentModal'));
    if (studentId) {
        // Load student data for editing
        apiCall(`/students/${studentId}`).then(result => {
            const s = result.data;
            document.getElementById('studentId').value = s._id;
            document.getElementById('studentName').value = s.user?.name || '';
            document.getElementById('studentEmail').value = s.user?.email || '';
            document.getElementById('studentIdNumber').value = s.studentId;
            document.getElementById('enrollmentNumber').value = s.enrollmentNumber;
            document.getElementById('department').value = s.department;
            document.getElementById('semester').value = s.semester;
            document.getElementById('batch').value = s.batch;
        });
    } else {
        document.getElementById('studentForm').reset();
        document.getElementById('studentId').value = '';
    }
    modal.show();
}

// Save Student
document.getElementById('studentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('studentId').value;
    const data = {
        name: document.getElementById('studentName').value,
        email: document.getElementById('studentEmail').value,
        studentId: document.getElementById('studentIdNumber').value,
        enrollmentNumber: document.getElementById('enrollmentNumber').value,
        department: document.getElementById('department').value,
        semester: parseInt(document.getElementById('semester').value),
        batch: document.getElementById('batch').value
    };
    
    try {
        if (studentId) {
            await apiCall(`/students/${studentId}`, 'PUT', data);
        } else {
            await apiCall('/students', 'POST', data);
        }
        bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
        loadStudents();
        alert('Student saved successfully!');
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Delete Student
async function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        try {
            await apiCall(`/students/${id}`, 'DELETE');
            loadStudents();
            alert('Student deleted successfully!');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

// View Student Details
async function viewStudent(id) {
    try {
        const result = await apiCall(`/students/${id}`);
        const s = result.data;
        alert(`
            Student Details:
            Name: ${s.user?.name}
            Email: ${s.user?.email}
            Student ID: ${s.studentId}
            Department: ${s.department}
            Semester: ${s.semester}
            CGPA: ${s.cgpa?.toFixed(2) || 'N/A'}
            Courses Enrolled: ${s.courses?.length || 0}
        `);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Courses Management
async function loadCourses() {
    const contentDiv = document.getElementById('pageContent');
    contentDiv.innerHTML = '<div class="spinner"></div>';
    
    try {
        const result = await apiCall('/courses');
        
        contentDiv.innerHTML = `
            <div class="d-flex justify-content-between mb-4">
                <h2><i class="fas fa-book"></i> Courses Management</h2>
                ${currentUser?.role === 'Admin' ? '<button class="btn btn-primary" onclick="showCourseModal()"><i class="fas fa-plus"></i> Add Course</button>' : ''}
            </div>
            
            <div class="search-box">
                <input type="text" id="searchCourse" placeholder="Search by course code or name..." onkeyup="searchCourses()">
            </div>
            
            <div class="row" id="coursesContainer">
                ${result.data.map(c => `
                    <div class="col-md-4 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">${c.courseCode} - ${c.courseName}</h5>
                                <p class="card-text">
                                    <strong>Credits:</strong> ${c.credits}<br>
                                    <strong>Department:</strong> ${c.department}<br>
                                    <strong>Semester:</strong> ${c.semester}<br>
                                    <strong>Teacher:</strong> ${c.teacher?.name || 'Not assigned'}<br>
                                    <strong>Enrolled:</strong> ${c.enrolledStudents?.length || 0} students
                                </p>
                                ${currentUser?.role === 'Teacher' || currentUser?.role === 'Admin' ? `
                                    <button class="btn btn-sm btn-info" onclick="viewCourseDetails('${c._id}')">View Details</button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        contentDiv.innerHTML = `<div class="alert alert-danger">Error loading courses: ${error.message}</div>`;
    }
}

// Attendance Management
async function loadAttendance() {
    const contentDiv = document.getElementById('pageContent');
    contentDiv.innerHTML = `
        <h2><i class="fas fa-calendar-check"></i> Attendance Management</h2>
        
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">Mark Attendance</div>
                    <div class="card-body">
                        <form id="attendanceForm">
                            <div class="mb-3">
                                <label>Student</label>
                                <select id="attendanceStudent" class="form-control" required></select>
                            </div>
                            <div class="mb-3">
                                <label>Course</label>
                                <select id="attendanceCourse" class="form-control" required></select>
                            </div>
                            <div class="mb-3">
                                <label>Status</label>
                                <select id="attendanceStatus" class="form-control" required>
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Late">Late</option>
                                    <option value="Excused">Excused</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Date</label>
                                <input type="date" id="attendanceDate" class="form-control" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Mark Attendance</button>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">My Attendance Summary</div>
                    <div class="card-body" id="attendanceSummary">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Load students and courses for dropdown
    const students = await apiCall('/students');
    const courses = await apiCall('/courses');
    
    const studentSelect = document.getElementById('attendanceStudent');
    studentSelect.innerHTML = students.data.map(s => `<option value="${s._id}">${s.user?.name} (${s.studentId})</option>`).join('');
    
    const courseSelect = document.getElementById('attendanceCourse');
    courseSelect.innerHTML = courses.data.map(c => `<option value="${c._id}">${c.courseCode} - ${c.courseName}</option>`).join('');
    
    document.getElementById('attendanceDate').valueAsDate = new Date();
    
    document.getElementById('attendanceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiCall('/attendance', 'POST', {
                studentId: document.getElementById('attendanceStudent').value,
                courseId: document.getElementById('attendanceCourse').value,
                date: document.getElementById('attendanceDate').value,
                status: document.getElementById('attendanceStatus').value
            });
            alert('Attendance marked successfully!');
            loadAttendanceSummary();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
    
    loadAttendanceSummary();
}

async function loadAttendanceSummary() {
    if (currentUser?.role === 'Student') {
        const studentResult = await apiCall('/students');
        const student = studentResult.data.find(s => s.user?._id === currentUser.id);
        if (student) {
            const attendance = await apiCall(`/attendance/student/${student._id}`);
            const summary = attendance.summary;
            document.getElementById('attendanceSummary').innerHTML = `
                <h4>Attendance Overview</h4>
                <p>Total Classes: ${summary.totalClasses}</p>
                <p>Present: ${summary.present}</p>
                <p>Absent: ${summary.absent}</p>
                <p>Percentage: <strong class="${summary.percentage >= 75 ? 'text-success' : 'text-danger'}">${summary.percentage}%</strong></p>
                <div class="progress">
                    <div class="progress-bar ${summary.percentage >= 75 ? 'bg-success' : 'bg-danger'}" style="width: ${summary.percentage}%"></div>
                </div>
            `;
        }
    }
}

// Results Management
async function loadResults() {
    const contentDiv = document.getElementById('pageContent');
    contentDiv.innerHTML = `
        <h2><i class="fas fa-chart-simple"></i> Results Management</h2>
        
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">Add Result</div>
                    <div class="card-body">
                        <form id="resultForm">
                            <div class="mb-3">
                                <label>Student</label>
                                <select id="resultStudent" class="form-control" required></select>
                            </div>
                            <div class="mb-3">
                                <label>Course</label>
                                <select id="resultCourse" class="form-control" required></select>
                            </div>
                            <div class="mb-3">
                                <label>Exam Type</label>
                                <select id="examType" class="form-control" required>
                                    <option value="Midterm">Midterm</option>
                                    <option value="Final">Final</option>
                                    <option value="Quiz">Quiz</option>
                                    <option value="Assignment">Assignment</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Marks Obtained</label>
                                <input type="number" id="marksObtained" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label>Total Marks</label>
                                <input type="number" id="totalMarks" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label>Exam Date</label>
                                <input type="date" id="examDate" class="form-control" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Add Result</button>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">My Results</div>
                    <div class="card-body" id="resultsList"></div>
                </div>
            </div>
        </div>
    `;
    
    const students = await apiCall('/students');
    const courses = await apiCall('/courses');
    
    document.getElementById('resultStudent').innerHTML = students.data.map(s => `<option value="${s._id}">${s.user?.name} (${s.studentId})</option>`).join('');
    document.getElementById('resultCourse').innerHTML = courses.data.map(c => `<option value="${c._id}">${c.courseCode} - ${c.courseName}</option>`).join('');
    document.getElementById('examDate').valueAsDate = new Date();
    
    document.getElementById('resultForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiCall('/results', 'POST', {
                student: document.getElementById('resultStudent').value,
                course: document.getElementById('resultCourse').value,
                examType: document.getElementById('examType').value,
                marksObtained: parseInt(document.getElementById('marksObtained').value),
                totalMarks: parseInt(document.getElementById('totalMarks').value),
                examDate: document.getElementById('examDate').value
            });
            alert('Result added successfully!');
            loadMyResults();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
    
    loadMyResults();
}

async function loadMyResults() {
    if (currentUser?.role === 'Student') {
        const studentResult = await apiCall('/students');
        const student = studentResult.data.find(s => s.user?._id === currentUser.id);
        if (student) {
            const results = await apiCall(`/results/student/${student._id}`);
            document.getElementById('resultsList').innerHTML = `
                <h4>Your Academic Results</h4>
                <p><strong>CGPA:</strong> ${results.cgpa}</p>
                <table class="table table-sm">
                    <thead><tr><th>Course</th><th>Exam</th><th>Marks</th><th>Grade</th></tr></thead>
                    <tbody>
                        ${results.data.map(r => `
                            <tr>
                                <td>${r.course?.courseCode}</td>
                                <td>${r.examType}</td>
                                <td>${r.marksObtained}/${r.totalMarks} (${r.percentage.toFixed(1)}%)</td>
                                <td class="grade-${r.grade.replace('+', '')}">${r.grade}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }
}

// Search Functionality
async function loadSearch() {
    const contentDiv = document.getElementById('pageContent');
    contentDiv.innerHTML = `
        <h2><i class="fas fa-search"></i> Global Search</h2>
        
        <div class="search-box mt-4">
            <input type="text" id="globalSearch" placeholder="Search students, courses, or anything..." style="width: 100%; padding: 15px;">
            <button onclick="performSearch()" style="right: 10px;"><i class="fas fa-search"></i></button>
        </div>
        
        <div id="searchResults" class="mt-4"></div>
    `;
    
    document.getElementById('globalSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}

async function performSearch() {
    const query = document.getElementById('globalSearch').value;
    if (!query) return;
    
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '<div class="spinner"></div>';
    
    try {
        const results = await apiCall(`/search?q=${encodeURIComponent(query)}&type=all`);
        
        resultsDiv.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">Students (${results.data.students?.length || 0})</div>
                        <div