import jsPDF from "jspdf";

export const addCommonHeaderFooter = async (doc, settings) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  const companyName = settings?.name || "Company Name";
  const companyAddress = settings?.address || "Registered Corporate Office Address";
  const companyPhone = settings?.phone || "N/A";
  const companyEmail = settings?.email || "N/A";
  const companyWebsite = settings?.website || "";
  const companyRegNo = settings?.cinNumber || settings?.registrationNumber || ""; 
  
  const logoPath = settings?.logo ? `${import.meta.env.VITE_API_URL}${settings.logo}` : null;

  // Convert Image URL to Base64
  const urlToDataUrl = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.log("Logo load failed:", err);
      return null;
    }
  };

  let logoDataUrl = null;
  if (logoPath) logoDataUrl = await urlToDataUrl(logoPath);

  // ==========================================
  // 🏢 EXECUTIVE DARK HEADER (PREMIUM BLACK)
  // ==========================================
  
  // 1. Solid Dark Header Background (Rich Charcoal Black)
  doc.setFillColor(20, 20, 22); 
  doc.rect(0, 0, pageWidth, 42, "F");

  // 2. Elegant Bottom Accent Line (Silver/Gray border below black)
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.5);
  doc.line(0, 42, pageWidth, 42);

  // 3. Logo on the Left (Inside the dark box)
  if (logoDataUrl) {
    const imgType = logoDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
    doc.addImage(logoDataUrl, imgType, 14, 10, 40, 20, undefined, 'FAST'); 
  }

  // 4. Company Info on the Right
  const rightMargin = pageWidth - 14;
  let currentY = 16;
  
  // Company Title (Bright White)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255); 
  doc.text(companyName.toUpperCase(), rightMargin, currentY, { align: "right" }); 
  
  // Company Address (Light Gray)
  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(200, 200, 200); 
  doc.text(companyAddress, rightMargin, currentY, { align: "right" });

  // Contact Info with dot separators (Light Gray)
  currentY += 5;
  let contactStr = [];
  if(companyPhone && companyPhone !== "N/A") contactStr.push(`Tel: ${companyPhone}`);
  if(companyEmail && companyEmail !== "N/A") contactStr.push(`Email: ${companyEmail}`);
  if(companyWebsite) contactStr.push(`${companyWebsite}`);
  
  doc.text(contactStr.join("  •  "), rightMargin, currentY, { align: "right" });

  // CIN / Registration (Dim Gray/Silver)
  if (companyRegNo) {
    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`CIN / Reg No: ${companyRegNo}`, rightMargin, currentY, { align: "right" });
  }

  return doc;
};

export const addCommonFooter = (doc, settings) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const companyName = settings?.name || "Company"; 
  
  // ==========================================
  // 🏢 EXECUTIVE FOOTER
  // ==========================================

  const footerY = pageHeight - 12;

  // 1. Crisp Dark Border above footer text
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.4);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

  // 2. LEFT: Confidentiality Tag (Bold & Professional)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text("PRIVATE & CONFIDENTIAL", 14, footerY);
  
  // 3. CENTER: Disclaimer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(`This is a computer-generated document by ${companyName}.`, pageWidth / 2, footerY, { align: "center" });
  
  // 4. RIGHT: Exact Timestamp
  const generatedOn = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Generated On: ${generatedOn}`, pageWidth - 14, footerY, { align: "right" });

  // 5. Bottom Anchor Bar (Thin black strip at the absolute bottom edge of the page)
  doc.setFillColor(20, 20, 22);
  doc.rect(0, pageHeight - 3, pageWidth, 3, "F");

  return doc;
};