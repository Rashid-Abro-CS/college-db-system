/**
 * Email Service for College Database System
 * Handles all email notifications including welcome emails, alerts, results, etc.
 */

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initTransporter();
    }

    /**
     * Initialize email transporter
     */
    initTransporter() {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            
            // Verify connection
            this.transporter.verify((error, success) => {
                if (error) {
                    console.error('Email service error:', error);
                } else {
                    console.log('Email service ready to send messages');
                }
            });
        } else {
            console.warn('Email credentials not configured. Email features disabled.');
        }
    }

    /**
     * Send email to single recipient
     */
    async sendEmail(to, subject, html, cc = null, bcc = null) {
        if (!this.transporter) {
            console.log('Email service not configured - email not sent');
            return { success: false, error: 'Email service not configured' };
        }

        const mailOptions = {
            from: `"College Database System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            cc: cc || null,
            bcc: bcc || null
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Email send error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send welcome email to new student
     */
    async sendWelcomeEmail(student) {
        const subject = 'Welcome to College Database System';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3; }
                    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 Welcome to College DB System</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${student.name}!</h2>
                        <p>Your account has been successfully created in the College Database System.</p>
                        
                        <div class="info-box">
                            <h3>Your Account Details:</h3>
                            <p><strong>Student ID:</strong> ${student.studentId}</p>
                            <p><strong>Enrollment Number:</strong> ${student.enrollmentNumber}</p>
                            <p><strong>Department:</strong> ${student.department}</p>
                            <p><strong>Semester:</strong> ${student.semester}</p>
                            <p><strong>Email:</strong> ${student.email}</p>
                        </div>
                        
                        <h3>You can now access:</h3>
                        <ul>
                            <li>📚 Course schedule and materials</li>
                            <li>✅ Attendance records</li>
                            <li>📊 Results and transcripts</li>
                            <li>🔔 Notifications and announcements</li>
                            <li>📝 Assignment submissions</li>
                        </ul>
                        
                        <a href="${process.env.APP_URL || 'http://localhost:5000'}" class="button">Login to Portal</a>
                        
                        <div class="footer">
                            <p>This is an automated message, please do not reply.</p>
                            <p>&copy; 2024 College Database System. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return await this.sendEmail(student.email, subject, html);
    }

    /**
     * Send welcome email to new teacher
     */
    async sendWelcomeTeacherEmail(teacher) {
        const subject = 'Welcome to College Database System - Teacher Portal';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4facfe; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>👨‍🏫 Welcome Teacher!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${teacher.name}!</h2>
                        <p>Your teacher account has been successfully created.</p>
                        
                        <div class="info-box">
                            <h3>Your Account Details:</h3>
                            <p><strong>Name:</strong> ${teacher.name}</p>
                            <p><strong>Email:</strong> ${teacher.email}</p>
                            <p><strong>Role:</strong> Teacher</p>
                        </div>
                        
                        <h3>Teacher Features:</h3>
                        <ul>
                            <li>📚 Create and manage courses</li>
                            <li>✅ Mark student attendance</li>
                            <li>📊 Add student results</li>
                            <li>📝 Upload course materials</li>
                            <li>🔔 Send announcements to students</li>
                        </ul>
                        
                        <a href="${process.env.APP_URL || 'http://localhost:5000'}" class="button">Login to Portal</a>
                        
                        <div class="footer">
                            <p>This is an automated message, please do not reply.</p>
                            <p>&copy; 2024 College Database System. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return await this.sendEmail(teacher.email, subject, html);
    }

    /**
     * Send low attendance alert
     */
    async sendLowAttendanceAlert(student, course, attendancePercentage) {
        const subject = `⚠️ Low Attendance Alert - ${course.courseCode}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #f44336; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .warning-box { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800; }
                    .danger-box { background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚠️ Attendance Warning</h1>
                    </div>
                    <div class="content">
                        <h2>Dear ${student.name},</h2>
                        <p>Your attendance in <strong>${course.courseName} (${course.courseCode})</strong> is below the required 75%.</p>
                        
                        <div class="${attendancePercentage < 65 ? 'danger-box' : 'warning-box'}">
                            <h3>Attendance Summary:</h3>
                            <p><strong>Current Attendance:</strong> ${attendancePercentage.toFixed(2)}%</p>
                            <p><strong>Required Attendance:</strong> 75%</p>
                            <p><strong>Classes Missed:</strong> ${this.calculateMissedClasses(attendancePercentage)} out of 40</p>
                            <p><strong>Classes Needed to Reach 75%:</strong> ${this.calculateClassesNeeded(attendancePercentage)}</p>
                        </div>
                        
                        <h3>Consequences of Low Attendance:</h3>
                        <ul>
                            <li>May be debarred from final examinations</li>
                            <li>Negative impact on overall performance</li>
                            <li>Required to meet with academic advisor</li>
                        </ul>
                        
                        <h3>Recommendations:</h3>
                        <ul>
                            <li>Attend all remaining classes</li>
                            <li>Submit medical certificates for any absences</li>
                            <li>Meet with your course instructor</li>
                        </ul>
                        
                        <div class="footer">
                            <p>Please ensure regular attendance to avoid academic consequences.</p>
                            <p>Contact your course instructor for more information.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return await this.sendEmail(student.email, subject, html);
    }

    /**
     * Send exam result notification
     */
    async sendResultNotification(student, course, result) {
        const subject = `📊 Exam Result: ${course.courseCode} - ${result.examType}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .result-box { background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
                    .grade-A { color: #4caf50; font-size: 48px; font-weight: bold; }
                    .grade-B { color: #2196f3; font-size: 48px; font-weight: bold; }
                    .grade-C { color: #ff9800; font-size: 48px; font-weight: bold; }
                    .grade-D { color: #f44336; font-size: 48px; font-weight: bold; }
                    .grade-F { color: #9e9e9e; font-size: 48px; font-weight: bold; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 Exam Result Published</h1>
                    </div>
                    <div class="content">
                        <h2>Dear ${student.name},</h2>
                        <p>Your results for <strong>${course.courseName}</strong> have been published.</p>
                        
                        <div class="result-box">
                            <h3>Result Details:</h3>
                            <p><strong>Course:</strong> ${course.courseCode} - ${course.courseName}</p>
                            <p><strong>Exam Type:</strong> ${result.examType}</p>
                            <p><strong>Marks Obtained:</strong> ${result.marksObtained}/${result.totalMarks}</p>
                            <p><strong>Percentage:</strong> ${result.percentage.toFixed(2)}%</p>
                            <p><strong>Grade:</strong> <span class="grade-${result.grade.replace('+', '')}">${result.grade}</span></p>
                            <p><strong>Grade Points:</strong> ${result.gradePoints}</p>
                        </div>
                        
                        <h3>Performance Analysis:</h3>
                        <ul>
                            <li>${this.getPerformanceMessage(result.percentage)}</li>
                            <li>${this.getImprovementSuggestion(result.percentage)}</li>
                        </ul>
                        
                        <a href="${process.env.APP_URL || 'http://localhost:5000'}" class="button">View Full Results</a>
                        
                        <div class="footer">
                            <p>Keep up the good work! Check your CGPA in the portal.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return await this.sendEmail(student.email, subject, html);
    }

    /**
     * Send performance improvement suggestions
     */
    async sendPerformanceSuggestions(student, prediction) {
        const subject = '📈 Performance Improvement Suggestions';
        let recommendationsHtml = '';
        
        prediction.recommendations.forEach(rec => {
            recommendationsHtml += `
                <li style="margin-bottom: 10px;">
                    <strong style="color: ${rec.priority === 'High' ? '#f44336' : '#ff9800'};">[${rec.priority} Priority]</strong>
                    <strong>${rec.area}:</strong> ${rec.message}
                </li>
            `;
        });
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .prediction-box { background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0; }
                    .recommendations { background: #fff3e0; padding: 20px; border-radius: 10px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📈 Personalized Learning Suggestions</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${student.name},</h2>
                        <p>Based on your current performance, here is an AI-powered analysis and suggestions to help you improve:</p>
                        
                        <div class="prediction-box">
                            <h3>📊 Performance Prediction:</h3>
                            <p><strong>Predicted Score:</strong> ${prediction.predictedScore}%</p>
                            <p><strong>Risk Level:</strong> <span style="color: ${prediction.riskLevel === 'High' ? '#f44336' : prediction.riskLevel === 'Medium' ? '#ff9800' : '#4caf50'}">${prediction.riskLevel}</span></p>
                            <p><strong>Confidence:</strong> ${prediction.confidence}%</p>
                        </div>
                        
                        <div class="recommendations">
                            <h3>💡 Recommendations:</h3>
                            <ul>${recommendationsHtml}</ul>
                        </div>
                        
                        <div class="prediction-box">
                            <h3>📚 Study Plan:</h3>
                            <ul>
                                <li>Study at least 2-3 hours daily</li>
                                <li>Review class notes within 24 hours</li>
                                <li>Practice previous exam papers</li>
                                <li>Join study groups</li>
                            </ul>
                        </div>
                        
                        <div class="footer">
                            <p>We're here to help you succeed! Reach out to your teachers or academic advisor for additional support.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return await this.sendEmail(student.email, subject, html);
    }

    /**
     * Send course material notification
     */
    async sendCourseMaterialNotification(student, course, material) {
        const subject = `📚 New Material Available - ${course.courseCode}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .material-box { background: #fff3e0; padding: 20px; border-radius: 10px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📚 New Course Material</h1>
                    </div>
                    <div class="content">
                        <h2>Dear ${student.name},</h2>
                        <p>New material has been uploaded for <strong>${course.courseName}</strong></p>
                        
                        <div class="material-box">
                            <h3>Material Details:</h3>
                            <p><strong>Title:</strong> ${material.title}</p>
                            <p><strong>Description:</strong> ${material.description || 'No description provided'}</p>
                            <p><strong>Uploaded By:</strong> ${material.uploadedByName || 'Instructor'}</p>
                            <p><strong>Uploaded At:</strong> ${new Date(material.uploadedAt).toLocaleString()}</p>
                        </div>
                        
                        <a href="${process.env.APP_URL || 'http://localhost:5000'}/courses/${course._id}" class="button">View Material</a>
                        
                        <div class="footer">
                            <p>Please review this material before the next class.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return await this.sendEmail(student.email, subject, html);
    }

    /**
     * Send bulk email to multiple recipients
     */
    async sendBulkEmail(recipients, subject, html) {
        const results = [];
        for (const recipient of recipients) {
            const result = await this.sendEmail(recipient.email, subject, html);
            results.push({ email: recipient.email, success: result.success });
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return results;
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
        const subject = 'Password Reset Request';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2196f3; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 24px; background: #2196f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${user.name},</h2>
                        <p>You requested to reset your password. Click the button below to proceed:</p>
                        
                        <a href="${resetUrl}" class="button">Reset Password</a>
                        
                        <p>If you didn't request this, please ignore this email.</p>
                        <p>This link will expire in 1 hour.</p>
                        
                        <div class="footer">
                            <p>For security reasons, do not share this link with anyone.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        return await this.sendEmail(user.email, subject, html);
    }

    /**
     * Helper method: Calculate missed classes
     */
    calculateMissedClasses(attendancePercentage, totalClasses = 40) {
        const attended = (attendancePercentage / 100) * totalClasses;
        const missed = totalClasses - attended;
        return Math.ceil(missed);
    }

    /**
     * Helper method: Calculate classes needed to reach 75%
     */
    calculateClassesNeeded(attendancePercentage, totalClasses = 40) {
        const currentAttended = (attendancePercentage / 100) * totalClasses;
        const neededAttended = 0.75 * totalClasses;
        const needed = neededAttended - currentAttended;
        return Math.ceil(Math.max(0, needed));
    }

    /**
     * Helper method: Get performance message
     */
    getPerformanceMessage(percentage) {
        if (percentage >= 90) return 'Excellent performance! Keep up the great work!';
        if (percentage >= 80) return 'Very good performance. Aim for A+ next time!';
        if (percentage >= 70) return 'Good performance. Consistent effort will improve results.';
        if (percentage >= 60) return 'Satisfactory. Need to work harder for better grades.';
        if (percentage >= 50) return 'Below average. Requires significant improvement.';
        return 'Needs improvement. Please contact your teacher for guidance.';
    }

    /**
     * Helper method: Get improvement suggestion
     */
    getImprovementSuggestion(percentage) {
        if (percentage >= 80) return 'Continue with your current study routine.';
        if (percentage >= 60) return 'Consider increasing study hours and practicing more.';
        if (percentage >= 50) return 'Seek help from teachers and join study groups.';
        return 'Immediate intervention needed. Schedule a meeting with academic advisor.';
    }
}

module.exports = new EmailService();