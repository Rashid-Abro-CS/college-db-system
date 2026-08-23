/**
 * AI-based Student Performance Prediction
 * Uses machine learning concepts to predict student performance
 */

class AIPrediction {
    constructor() {
        this.weights = {
            attendance: 0.25,
            previousMarks: 0.35,
            assignmentCompletion: 0.20,
            classParticipation: 0.10,
            studyHours: 0.10
        };
    }

    /**
     * Predict student performance for a course
     * @param {Object} studentData - Student's historical data
     */
    async predictCoursePerformance(studentData) {
        const {
            attendancePercentage,
            previousMarks = [],
            assignmentScores = [],
            participationScore = 50,
            estimatedStudyHours = 5
        } = studentData;

        // Calculate previous marks average
        const avgPreviousMarks = previousMarks.length > 0 
            ? previousMarks.reduce((a, b) => a + b, 0) / previousMarks.length 
            : 50;

        // Calculate assignment completion rate
        const assignmentCompletion = assignmentScores.length > 0
            ? assignmentScores.reduce((a, b) => a + b, 0) / assignmentScores.length
            : 0;

        // Normalize study hours (assuming 0-10 hours range)
        const normalizedStudyHours = Math.min(100, (estimatedStudyHours / 10) * 100);

        // Calculate weighted score
        let predictedScore = 
            (attendancePercentage * this.weights.attendance) +
            (avgPreviousMarks * this.weights.previousMarks) +
            (assignmentCompletion * this.weights.assignmentCompletion) +
            (participationScore * this.weights.classParticipation) +
            (normalizedStudyHours * this.weights.studyHours);

        // Add some randomness for natural variation
        predictedScore += (Math.random() - 0.5) * 5;
        
        // Ensure score is within 0-100 range
        predictedScore = Math.min(100, Math.max(0, predictedScore));

        // Determine risk level
        let riskLevel = 'Low';
        if (predictedScore < 50) riskLevel = 'High';
        else if (predictedScore < 65) riskLevel = 'Medium';

        // Generate recommendations
        const recommendations = this.generateRecommendations({
            attendancePercentage,
            avgPreviousMarks,
            assignmentCompletion,
            predictedScore
        });

        return {
            predictedScore: predictedScore.toFixed(2),
            predictedGrade: this.getPredictedGrade(predictedScore),
            riskLevel,
            confidence: this.calculateConfidence(studentData),
            recommendations,
            factors: {
                attendance: attendancePercentage,
                previousPerformance: avgPreviousMarks,
                assignments: assignmentCompletion,
                participation: participationScore,
                studyHours: estimatedStudyHours
            }
        };
    }

    /**
     * Predict at-risk students
     * @param {Array} students - Array of student data
     */
    async predictAtRiskStudents(students) {
        const predictions = [];
        
        for (const student of students) {
            const prediction = await this.predictCoursePerformance(student);
            if (prediction.riskLevel === 'High' || prediction.predictedScore < 60) {
                predictions.push({
                    studentId: student.studentId,
                    name: student.name,
                    predictedScore: prediction.predictedScore,
                    riskLevel: prediction.riskLevel,
                    recommendations: prediction.recommendations
                });
            }
        }
        
        return predictions.sort((a, b) => a.predictedScore - b.predictedScore);
    }

    /**
     * Generate personalized recommendations
     */
    generateRecommendations(factors) {
        const recommendations = [];
        
        if (factors.attendancePercentage < 75) {
            recommendations.push({
                area: 'Attendance',
                message: 'Your attendance is below 75%. Regular attendance can improve your score by 15-20%.',
                priority: 'High'
            });
        }
        
        if (factors.avgPreviousMarks < 60) {
            recommendations.push({
                area: 'Academics',
                message: 'Consider seeking tutoring or forming study groups to strengthen your fundamentals.',
                priority: 'High'
            });
        }
        
        if (factors.assignmentCompletion < 70) {
            recommendations.push({
                area: 'Assignments',
                message: 'Complete all assignments on time. They contribute significantly to your final grade.',
                priority: 'Medium'
            });
        }
        
        if (factors.predictedScore < 65) {
            recommendations.push({
                area: 'Overall',
                message: 'Schedule a meeting with your academic advisor for personalized guidance.',
                priority: 'High'
            });
        }
        
        return recommendations;
    }

    /**
     * Get predicted grade based on score
     */
    getPredictedGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 75) return 'B+';
        if (score >= 70) return 'B';
        if (score >= 65) return 'C+';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    }

    /**
     * Calculate prediction confidence
     */
    calculateConfidence(studentData) {
        let confidence = 70; // Base confidence
        
        // More data = higher confidence
        if (studentData.previousMarks && studentData.previousMarks.length >= 3) confidence += 15;
        if (studentData.assignmentScores && studentData.assignmentScores.length >= 5) confidence += 10;
        if (studentData.attendancePercentage) confidence += 5;
        
        return Math.min(95, confidence);
    }

    /**
     * Analyze learning patterns
     */
    analyzeLearningPatterns(studentHistory) {
        const patterns = {
            improving: false,
            declining: false,
            stable: true,
            bestTimeOfDay: null,
            preferredSubjects: []
        };
        
        if (studentHistory.length >= 3) {
            const recent = studentHistory.slice(-3);
            const scores = recent.map(h => h.score);
            
            if (scores[2] > scores[0]) patterns.improving = true;
            if (scores[2] < scores[0]) patterns.declining = true;
            if (scores[2] === scores[0]) patterns.stable = true;
        }
        
        return patterns;
    }

    /**
     * Generate study plan based on weak areas
     */
    generateStudyPlan(weakAreas) {
        const studyPlan = {
            daily: [],
            weekly: [],
            resources: []
        };
        
        for (const area of weakAreas) {
            switch(area) {
                case 'Mathematics':
                    studyPlan.daily.push('Practice 10 problems daily');
                    studyPlan.resources.push('Khan Academy - Mathematics');
                    break;
                case 'Programming':
                    studyPlan.daily.push('Code for 1 hour daily');
                    studyPlan.weekly.push('Complete one mini-project per week');
                    studyPlan.resources.push('LeetCode, HackerRank');
                    break;
                case 'Theory Subjects':
                    studyPlan.daily.push('Review notes for 30 minutes');
                    studyPlan.weekly.push('Create summary sheets');
                    break;
                default:
                    studyPlan.daily.push('Review and practice regularly');
            }
        }
        
        return studyPlan;
    }
}

module.exports = new AIPrediction();