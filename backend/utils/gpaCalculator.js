/**
 * GPA Calculator Utility
 * Calculates GPA, CGPA, and grade points based on marks
 */

class GPACalculator {
    constructor() {
        this.gradeScale = {
            'A+': { min: 90, max: 100, points: 4.0 },
            'A': { min: 80, max: 89, points: 3.7 },
            'B+': { min: 75, max: 79, points: 3.3 },
            'B': { min: 70, max: 74, points: 3.0 },
            'C+': { min: 65, max: 69, points: 2.7 },
            'C': { min: 60, max: 64, points: 2.3 },
            'D': { min: 50, max: 59, points: 2.0 },
            'F': { min: 0, max: 49, points: 0 }
        };
    }

    /**
     * Calculate grade and grade points from percentage
     */
    calculateGrade(percentage) {
        for (const [grade, range] of Object.entries(this.gradeScale)) {
            if (percentage >= range.min && percentage <= range.max) {
                return { grade, gradePoints: range.points };
            }
        }
        return { grade: 'F', gradePoints: 0 };
    }

    /**
     * Calculate GPA for a semester
     * @param {Array} courses - Array of course objects with marks and credits
     */
    calculateSemesterGPA(courses) {
        let totalGradePoints = 0;
        let totalCredits = 0;

        for (const course of courses) {
            const { gradePoints } = this.calculateGrade(course.percentage);
            totalGradePoints += gradePoints * course.credits;
            totalCredits += course.credits;
        }

        return totalCredits === 0 ? 0 : (totalGradePoints / totalCredits);
    }

    /**
     * Calculate CGPA from all semesters
     * @param {Array} semesters - Array of semester GPA objects
     */
    calculateCGPA(semesters) {
        let totalGradePoints = 0;
        let totalCredits = 0;

        for (const semester of semesters) {
            totalGradePoints += semester.gpa * semester.totalCredits;
            totalCredits += semester.totalCredits;
        }

        return totalCredits === 0 ? 0 : (totalGradePoints / totalCredits);
    }

    /**
     * Calculate percentage from marks
     */
    calculatePercentage(obtained, total) {
        return (obtained / total) * 100;
    }

    /**
     * Predict future performance based on past trends
     */
    predictPerformance(pastResults) {
        if (!pastResults || pastResults.length === 0) return null;

        const sum = pastResults.reduce((acc, result) => acc + result.percentage, 0);
        const average = sum / pastResults.length;
        
        // Simple linear regression for trend prediction
        const x = pastResults.map((_, i) => i + 1);
        const y = pastResults.map(r => r.percentage);
        
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
        const sumX2 = x.reduce((acc, val) => acc + val * val, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        const predictedNext = slope * (n + 1) + intercept;
        
        return {
            average: average.toFixed(2),
            trend: slope > 0 ? 'improving' : slope < 0 ? 'declining' : 'stable',
            predictedNextPercentage: Math.min(100, Math.max(0, predictedNext)).toFixed(2),
            recommendation: this.getRecommendation(average, slope)
        };
    }

    /**
     * Get performance recommendation
     */
    getRecommendation(average, trend) {
        if (average >= 85 && trend > 0) {
            return 'Excellent performance! Keep up the great work.';
        } else if (average >= 75) {
            return 'Good performance. Focus on consistent improvement.';
        } else if (average >= 60) {
            return 'Satisfactory performance. Need more effort to improve grades.';
        } else if (average >= 50) {
            return 'Below average. Requires significant improvement.';
        } else {
            return 'Critical situation. Immediate intervention needed.';
        }
    }

    /**
     * Calculate class rank
     */
    calculateRank(students, studentId) {
        const sorted = [...students].sort((a, b) => b.cgpa - a.cgpa);
        const rank = sorted.findIndex(s => s.studentId === studentId) + 1;
        return {
            rank,
            totalStudents: students.length,
            percentile: ((students.length - rank) / students.length * 100).toFixed(2)
        };
    }
}

module.exports = new GPACalculator();