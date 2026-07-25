import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceItem {
  itemName: string;
  quantity: number;
}

interface InvoiceData {
  date: string | Date;
  receivedFrom: string;
  receivedFromAddress?: string;
  receivedBy?: string;
  items: InvoiceItem[];
}

interface SettingsData {
  restaurantName: string;
  logo?: string;
  address: string;
  phone: string;
  footerMessage: string;
}

export function generateInvoicePDF(invoice: InvoiceData, settings: SettingsData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const margin = 20;
  let currentY = 20;

  // 1. Restaurant Logo (Right Side)
  if (settings.logo) {
    try {
      // Standardize size to max 50mm width and 22mm height, positioned at top right
      doc.addImage(settings.logo, "PNG", pageWidth - margin - 50, currentY, 50, 22);
    } catch (err) {
      console.error("Failed to render logo in PDF:", err);
    }
  }

  // 2. Invoice Title & Restaurant Info (Left Side)
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235); // Blue color (#2563eb)
  doc.text("INVOICE", margin, currentY + 5);
  currentY += 13;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(28, 25, 23); // Dark stone
  doc.text(settings.restaurantName, margin, currentY);
  currentY += 4.5;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(120, 113, 108); // Muted stone color
  
  const addressLines = doc.splitTextToSize(settings.address, 100);
  addressLines.forEach((line: string) => {
    doc.text(line, margin, currentY);
    currentY += 4;
  });

  doc.text(`Phone: ${settings.phone}`, margin, currentY);
  currentY += 10; // Space before billing block

  // 3. Shaded Billing block (Bill to / Ship to)
  const blockHeight = 35;
  doc.setFillColor(240, 246, 252); // Soft light blue/gray background
  doc.rect(margin, currentY, pageWidth - 2 * margin, blockHeight, "F");

  // Headers inside block
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text("Bill to", margin + 6, currentY + 7);
  doc.text("Ship to", pageWidth / 2 + 8, currentY + 7);

  // Bill to details (Sourcing place)
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59); // slate-800
  let billToY = currentY + 12;
  doc.text(invoice.receivedFrom, margin + 6, billToY);
  billToY += 4.5;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  if (invoice.receivedFromAddress) {
    const recAddressLines = doc.splitTextToSize(invoice.receivedFromAddress, 70);
    recAddressLines.forEach((line: string) => {
      doc.text(line, margin + 6, billToY);
      billToY += 4;
    });
  }

  // Ship to details (Our restaurant)
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59); // slate-800
  let shipToY = currentY + 12;
  doc.text(settings.restaurantName, pageWidth / 2 + 8, shipToY);
  shipToY += 4.5;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  const shipAddressLines = doc.splitTextToSize(settings.address, 70);
  shipAddressLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2 + 8, shipToY);
    shipToY += 4;
  });

  currentY += blockHeight + 6; // Space after billing block

  // 4. Invoice Details
  const formattedDate = new Date(invoice.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("Invoice details", margin, currentY);
  currentY += 5;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Invoice date: ${formattedDate}`, margin, currentY);
  if (invoice.receivedBy) {
    currentY += 4;
    doc.text(`Received by: ${invoice.receivedBy}`, margin, currentY);
  }
  currentY += 8;

  // 5. Invoice Items Table
  const tableHeaders = [["S.No", "Item Name", "Quantity"]];
  const tableData = invoice.items.map((item, index) => [
    (index + 1).toString(),
    item.itemName,
    item.quantity.toString(),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: tableHeaders,
    body: tableData,
    margin: { left: margin, right: margin },
    theme: "plain",
    headStyles: {
      fillColor: [248, 250, 252], // slate-50
      textColor: [71, 85, 105], // slate-600
      font: "Helvetica",
      fontStyle: "bold",
      fontSize: 9,
      halign: "left",
    },
    bodyStyles: {
      font: "Helvetica",
      fontSize: 9,
      textColor: [51, 65, 85], // slate-700
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "left" }, // S.No
      1: { halign: "left" }, // Item Name
      2: { cellWidth: 25, halign: "left" }, // Quantity
    },
    styles: {
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.1,
    },
    didDrawPage: (data: any) => {
      currentY = data.cursor.y;
    },
  });

  // Adjust currentY after table
  currentY += 20;

  // Check space before signature
  const pageHeight = doc.internal.pageSize.height;
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 25;
  }

  // 6. Authorized Signature (Bottom Right)
  const rightColumnX = pageWidth - margin - 50;
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.3);
  doc.line(rightColumnX, currentY, pageWidth - margin, currentY); // Signature line
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Authorized Signature", rightColumnX + 5, currentY + 5);

  // 7. Footer Thank You Message (Bottom Left)
  doc.setFont("Helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(settings.footerMessage, margin, currentY + 5);

  return doc;
}
