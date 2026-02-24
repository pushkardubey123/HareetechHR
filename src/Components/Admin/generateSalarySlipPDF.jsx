import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addCommonHeaderFooter, addCommonFooter } from "../../Utils/pdfHeaderFooter"; // Adjust path if needed
import moment from "moment";

// --- Currency Formatter ---
const fmt = (val) => val ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";

// --- Number to Words (Indian Format) ---
const numToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'Overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str ? str.trim() + ' Only' : 'Zero';
};

export const generateSalarySlipPDF = async (payroll, settings, employeesList = []) => {
    const doc = new jsPDF("portrait", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Add Header
    try {
        await addCommonHeaderFooter(doc, settings);
    } catch (err) {
        console.warn("Header load failed");
    }

    // 2. Fetch Full Employee Details from List (Solves the PAN/Bank missing issue)
    const empData = employeesList.find(e => e._id === payroll.employeeId?._id) || payroll.employeeId || {};
    
    let currentY = 45;

    // 3. Payslip Title Box
    const monthName = moment(payroll.month, "YYYY-MM").format("MMMM YYYY");
    doc.setFillColor(240, 240, 240); // Light Gray BG
    doc.rect(14, currentY, pageWidth - 28, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`PAYSLIP FOR THE MONTH OF ${monthName.toUpperCase()}`, pageWidth / 2, currentY + 6.5, { align: "center" });

    currentY += 15;

    // 4. Employee Information Box
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.roundedRect(14, currentY, pageWidth - 28, 32, 2, 2, "D");

    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);

    // Left Column
    doc.setFont("helvetica", "bold");
    doc.text("Employee Name", 18, currentY + 7);
    doc.text("Department", 18, currentY + 14);
    doc.text("Designation", 18, currentY + 21);
    doc.text("Total Paid Days", 18, currentY + 28);

    doc.setFont("helvetica", "normal");
    doc.text(`:  ${empData.name || "N/A"}`, 50, currentY + 7);
    doc.text(`:  ${empData.departmentId?.name || "N/A"}`, 50, currentY + 14);
    doc.text(`:  ${empData.designationId?.name || "N/A"}`, 50, currentY + 21);
    doc.text(`:  ${payroll.paidDays || 0} Days`, 50, currentY + 28);

    // Right Column
    doc.setFont("helvetica", "bold");
    doc.text("Date of Joining", pageWidth / 2 + 10, currentY + 7);
    doc.text("PAN Number", pageWidth / 2 + 10, currentY + 14);
    doc.text("Bank A/c No", pageWidth / 2 + 10, currentY + 21);
    doc.text("Working Days", pageWidth / 2 + 10, currentY + 28);

    doc.setFont("helvetica", "normal");
    const dojFmt = empData.doj ? moment(empData.doj).format("DD MMM YYYY") : "N/A";
    doc.text(`:  ${dojFmt}`, pageWidth / 2 + 45, currentY + 7);
    doc.text(`:  ${empData.pan || "N/A"}`, pageWidth / 2 + 45, currentY + 14);
    doc.text(`:  ${empData.bankAccount || "N/A"}`, pageWidth / 2 + 45, currentY + 21);
    doc.text(`:  ${payroll.workingDays || 0} Days`, pageWidth / 2 + 45, currentY + 28);

    currentY += 40;

    // 5. Structure Data for Split Table (Earnings vs Deductions)
    const earnings = [{ title: "Basic Salary", amount: payroll.basicSalary || 0 }, ...(payroll.allowances || [])];
    const deductions = payroll.deductions || [];
    
    let totalEarn = 0;
    let totalDed = 0;
    
    const maxLen = Math.max(earnings.length, deductions.length);
    const tableBody = [];

    for (let i = 0; i < maxLen; i++) {
        const earn = earnings[i];
        const ded = deductions[i];
        
        if (earn) totalEarn += Number(earn.amount || 0);
        if (ded) totalDed += Number(ded.amount || 0);
        
        tableBody.push([
            earn ? earn.title : "",
            earn ? fmt(earn.amount) : "",
            ded ? ded.title : "",
            ded ? fmt(ded.amount) : ""
        ]);
    }

    // Push Totals Row
    tableBody.push([
        { content: "Total Earnings", styles: { fontStyle: 'bold', fillColor: [240,240,240] } },
        { content: fmt(totalEarn), styles: { fontStyle: 'bold', fillColor: [240,240,240] } },
        { content: "Total Deductions", styles: { fontStyle: 'bold', fillColor: [240,240,240] } },
        { content: fmt(totalDed), styles: { fontStyle: 'bold', fillColor: [240,240,240] } }
    ]);

    // 6. Earnings & Deductions Table
    autoTable(doc, {
        startY: currentY,
        head: [["Earnings", "Amount (Rs.)", "Deductions", "Amount (Rs.)"]],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: "bold" },
        bodyStyles: { textColor: [20, 20, 20], lineColor: [180, 180, 180] },
        columnStyles: {
            0: { halign: "left" },
            1: { halign: "right" },
            2: { halign: "left" },
            3: { halign: "right" }
        },
        styles: { fontSize: 9, cellPadding: 5 },
        margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // 7. Net Pay Block
    const netSalary = payroll.netSalary || 0;
    doc.setDrawColor(180, 180, 180);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, "FD");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Net Salary Payable : Rs. ${fmt(netSalary)}`, 18, currentY + 8);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Amount in words : Rupees ${numToWords(Math.round(netSalary))}`, 18, currentY + 15);

    currentY += 40;

    // 8. Signatures
    doc.setFont("helvetica", "bold");
    doc.text("__________________________", 25, currentY);
    doc.text("Employer Signature", 30, currentY + 5);

    doc.text("__________________________", pageWidth - 75, currentY);
    doc.text("Employee Signature", pageWidth - 70, currentY + 5);

    // 9. Footer
    try {
        addCommonFooter(doc, settings);
    } catch (err) {
        console.warn("Footer load failed");
    }

    // 10. Save PDF
    const safeEmpName = (empData.name || "Employee").replace(/\s+/g, "_");
    doc.save(`Payslip_${monthName.replace(" ", "_")}_${safeEmpName}.pdf`);
};