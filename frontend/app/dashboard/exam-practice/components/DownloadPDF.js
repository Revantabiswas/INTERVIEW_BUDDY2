// Download PDF functionality for test papers and results
"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText, Printer } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export function DownloadTestPDF({ testData, type = "test" }) {
  const generateTestPDF = async () => {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Header
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text(testData.title || "Practice Test", margin, yPosition);
    yPosition += 15;

    // Test info
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Subject: ${testData.subject || "General"}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Duration: ${testData.duration || 60} minutes`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Total Questions: ${testData.totalQuestions || 0}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Maximum Marks: ${testData.maxMarks || 100}`, margin, yPosition);
    yPosition += 15;

    // Instructions
    pdf.setFont("helvetica", "bold");
    pdf.text("Instructions:", margin, yPosition);
    yPosition += 10;
    pdf.setFont("helvetica", "normal");
    const instructions = [
      "• Read all questions carefully before answering",
      "• All questions are compulsory",
      "• There is negative marking for wrong answers",
      "• Use blue/black pen for writing",
      "• Mobile phones are not allowed"
    ];
    
    instructions.forEach(instruction => {
      pdf.text(instruction, margin, yPosition);
      yPosition += 7;
    });
    yPosition += 10;

    // Questions
    if (testData.questions) {
      testData.questions.forEach((question, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFont("helvetica", "bold");
        pdf.text(`Q${index + 1}. `, margin, yPosition);
        
        // Question text
        pdf.setFont("helvetica", "normal");
        const questionLines = pdf.splitTextToSize(question.question, pageWidth - margin * 2 - 20);
        pdf.text(questionLines, margin + 20, yPosition);
        yPosition += questionLines.length * 7 + 5;

        // Options for MCQ
        if (question.type === "mcq" && question.options) {
          question.options.forEach((option, optIndex) => {
            const optionText = `${String.fromCharCode(65 + optIndex)}. ${option}`;
            const optionLines = pdf.splitTextToSize(optionText, pageWidth - margin * 2 - 30);
            pdf.text(optionLines, margin + 30, yPosition);
            yPosition += optionLines.length * 6 + 3;
          });
        }

        // Answer space for numerical
        if (question.type === "numerical") {
          pdf.text("Answer: _________________", margin + 30, yPosition);
          yPosition += 15;
        }

        // Marks
        pdf.setFont("helvetica", "italic");
        pdf.text(`[${question.marks || 4} marks]`, pageWidth - margin - 50, yPosition - 5);
        yPosition += 10;
      });
    }

    // Save the PDF
    pdf.save(`${testData.title || 'practice-test'}.pdf`);
  };

  const generateResultsPDF = async () => {
    const pdf = new jsPDF();
    const margin = 20;
    let yPosition = margin;

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Test Results Report", margin, yPosition);
    yPosition += 15;

    // Test details
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Test: ${testData.testTitle}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Score: ${testData.score}/${testData.maxScore}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Percentage: ${((testData.score / testData.maxScore) * 100).toFixed(1)}%`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Percentile: ${testData.percentile}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Rank: ${testData.rank}`, margin, yPosition);
    yPosition += 15;

    // Performance summary
    pdf.setFont("helvetica", "bold");
    pdf.text("Performance Summary:", margin, yPosition);
    yPosition += 10;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Correct Answers: ${testData.correct}`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Incorrect Answers: ${testData.incorrect}`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Unattempted: ${testData.unattempted}`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Accuracy: ${testData.accuracy}%`, margin, yPosition);
    yPosition += 15;

    pdf.save(`test-results-${Date.now()}.pdf`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={type === "test" ? generateTestPDF : generateResultsPDF}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Download {type === "test" ? "Test" : "Results"} PDF
    </Button>
  );
}

export function PrintTest({ testData }) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${testData.title || 'Practice Test'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .question { margin-bottom: 25px; }
            .options { margin-left: 20px; }
            .marks { float: right; font-style: italic; }
            @media print { 
              .no-print { display: none; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${testData.title || 'Practice Test'}</h1>
            <p><strong>Subject:</strong> ${testData.subject || 'General'} | 
               <strong>Duration:</strong> ${testData.duration || 60} minutes | 
               <strong>Total Marks:</strong> ${testData.maxMarks || 100}</p>
            <hr>
          </div>
          
          <div class="instructions">
            <h3>Instructions:</h3>
            <ul>
              <li>Read all questions carefully before answering</li>
              <li>All questions are compulsory</li>
              <li>There is negative marking for wrong answers</li>
              <li>Use blue/black pen for writing</li>
            </ul>
          </div>
          
          <div class="questions">
            ${testData.questions?.map((question, index) => `
              <div class="question">
                <p><strong>Q${index + 1}.</strong> ${question.question} 
                   <span class="marks">[${question.marks || 4} marks]</span></p>
                ${question.type === 'mcq' && question.options ? `
                  <div class="options">
                    ${question.options.map((option, optIndex) => 
                      `<p>${String.fromCharCode(65 + optIndex)}. ${option}</p>`
                    ).join('')}
                  </div>
                ` : `
                  <p style="margin-left: 20px;">Answer: ____________________________</p>
                `}
              </div>
            `).join('') || ''}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
      <Printer className="h-4 w-4" />
      Print Test
    </Button>
  );
}
