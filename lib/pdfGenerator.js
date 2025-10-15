import 'jspdf-autotable';
import logoBase64 from './logoBase64';

// Import base64 encoded fonts
import dejaVuSansNormal from './fonts/DejaVuSans-base64.txt';
import dejaVuSansBold from './fonts/DejaVuSans-Bold-base64.txt';
import dejaVuSansOblique from './fonts/DejaVuSans-Oblique-base64.txt';
import dejaVuSansBoldOblique from './fonts/DejaVuSans-BoldOblique-base64.txt';

// Load DejaVu Sans font
const loadDejaVuSansFont = (doc) => {
  doc.addFileToVFS('DejaVuSans-normal.ttf', dejaVuSansNormal);
  doc.addFileToVFS('DejaVuSans-bold.ttf', dejaVuSansBold);
  doc.addFileToVFS('DejaVuSans-oblique.ttf', dejaVuSansOblique);
  doc.addFileToVFS('DejaVuSans-boldoblique.ttf', dejaVuSansBoldOblique);

  doc.addFont('DejaVuSans-normal.ttf', 'DejaVuSans', 'normal');
  doc.addFont('DejaVuSans-bold.ttf', 'DejaVuSans', 'bold');
  doc.addFont('DejaVuSans-oblique.ttf', 'DejaVuSans', 'italic');
  doc.addFont('DejaVuSans-boldoblique.ttf', 'DejaVuSans', 'bolditalic');
};

const sanitizeText = (text) => {
  if (!text) return '-';
  return text.toString().trim();
};

export const generateTripStopPDF = ({
  doc,
  data,
  totals,
  t = (key) => key,
  dateFormat = 'dd/MM/yyyy',
  columns = null
}) => {
  try {
    // Load and set DejaVu Sans as default font
    loadDejaVuSansFont(doc);
    doc.setFont('DejaVuSans');

    doc.addImage(logoBase64, 'PNG', 10, 5, 35, 15);
    doc.setFontSize(20);
    doc.setFont('DejaVuSans', 'bold');
    doc.text('Trip Stop Report', 140, 20, { align: 'center' });

    // Date range
    let startDate = '';
    let endDate = '';
    if (data && data.length > 0 && data[0].d && data[0].d.length > 0) {
      startDate = data[0].d[0].time_from?.split(' ')[0] || '';
      endDate = data[0].d[data[0].d.length - 1].time_to?.split(' ')[0] || '';
    }
    const dateRange =
      startDate && endDate
        ? `Date Range: ${startDate} - ${endDate}`
        : `Date Range: ${new Date().toISOString().split('T')[0]}`;
    doc.setFontSize(12);
    doc.setFont('DejaVuSans', 'normal');
    doc.text(dateRange, 140, 30, { align: 'center' });

    // Table of Contents (TOC)
    const toc = [];
    doc.setFontSize(16);
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(12);
    doc.setFont('DejaVuSans', 'normal');

    // Calculate dimensions for landscape orientation
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginTop = 20;
    const marginBottom = 20;
    const lineHeight = 10;
    const firstPageHeaderHeight = 50; // Height of the header on first page
    const usableHeight = pageHeight - marginTop - marginBottom;
    const firstPageUsableHeight = pageHeight - firstPageHeaderHeight - marginBottom;
    const entriesPerPage = Math.floor(usableHeight / lineHeight);
    const firstPageEntries = Math.floor(firstPageUsableHeight / lineHeight);

    // First, collect all vehicle data and create TOC
    data.forEach((vehicle, index) => {
      toc.push({
        title: vehicle.vehicleName || `Vehicle ${index + 1}`,
        page: index + 2, // Start from page 2 since page 1 is for TOC
      });
    });

    // Generate TOC pages first
    doc.setPage(1);
    let tocPosY = firstPageHeaderHeight + 0; // Start TOC after the header
    doc.setFontSize(16);
    doc.setFont('DejaVuSans', 'bold');
    doc.text('Table of Contents', 10, tocPosY);
    tocPosY += 10;
    doc.setFontSize(12);
    doc.setFont('DejaVuSans', 'normal');

    // Split TOC into pages
    let remainingEntries = toc.length;
    let currentIndex = 0;

    while (remainingEntries > 0) {
      const isFirstPage = doc.internal.getCurrentPageInfo().pageNumber === 1;
      const entriesForThisPage = isFirstPage ? firstPageEntries : entriesPerPage;
      const pageEntries = toc.slice(currentIndex, currentIndex + entriesForThisPage);
      
      pageEntries.forEach((entry) => {
        // Add TOC entry text
        doc.text(entry.title, 20, tocPosY);
        doc.text(`${entry.page}`, pageWidth - 20, tocPosY, { align: 'right' });
        
        // Add internal link
        doc.link(20, tocPosY - 5, pageWidth - 40, 10, {
          pageNumber: entry.page
        });

        tocPosY += lineHeight;
      });

      remainingEntries -= entriesForThisPage;
      currentIndex += entriesForThisPage;

      if (remainingEntries > 0) {
        doc.addPage();
        tocPosY = marginTop;
      }
    }

    // Now generate content for each vehicle
    data.forEach((vehicle) => {
      doc.addPage();

      // Vehicle header
      doc.setFontSize(16);
      doc.setFont('DejaVuSans', 'bold');
      doc.text(`Vehicle: ${vehicle.vehicleName || 'Unknown'}`, 10, 20);

      // Summary calculation
      let calculatedSummary = {
        totalDistance: 0,
        totalFuel: 0,
        totalDuration: 0,
      };
      if (vehicle.d && vehicle.d.length > 0) {
        calculatedSummary = vehicle.d.reduce((acc, trip) => {
          acc.totalDistance += parseFloat(trip.distance || 0);
          acc.totalFuel += parseFloat(trip.fuel_used || 0);
          if (trip.time_from && trip.time_to) {
            const timeFrom = new Date(trip.time_from);
            const timeTo = new Date(trip.time_to);
            acc.totalDuration += (timeTo.getTime() - timeFrom.getTime()) / 1000;
          }
          return acc;
        }, calculatedSummary);
      }
      const formatDuration = (totalSeconds) => {
        const days = Math.floor(totalSeconds / (24 * 3600));
        const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        let result = '';
        if (days > 0) result += `${days}d `;
        result += `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return result;
      };
      const summary = {
        totalDistance: vehicle.summary?.totalDistance || calculatedSummary.totalDistance.toFixed(3),
        totalFuel: vehicle.summary?.totalFuel || calculatedSummary.totalFuel.toFixed(3),
        totalDuration: vehicle.summary?.totalDuration || formatDuration(calculatedSummary.totalDuration),
      };

      // Show summary
      doc.setFontSize(12);
      doc.setFont('DejaVuSans', 'normal');
      doc.text(`Total Distance: ${summary.totalDistance} km`, 10, 30);
      doc.text(`Total Fuel Used: ${summary.totalFuel} L`, 10, 35);
      doc.text(`Total Duration: ${summary.totalDuration}`, 10, 40);

      // Trip data table
      if (vehicle.d && vehicle.d.length > 0) {
        doc.autoTable({
          startY: 45,
          head: [
            [
              'State',
              'From',
              'To',
              'Time From',
              'Time To',
              'Duration',
              'Distance',
              'Worker',
              'Avg Speed',
            ],
          ],
          body: vehicle.d.map((trip) => [
            trip.state || '-',
            sanitizeText(trip.address) || '-',
            sanitizeText(trip.next_address) || '-',
            trip.time_from || '-',
            trip.time_to || '-',
            trip.duration || '-',
            `${trip.distance || '0'} km`,
            trip.worker || '-',
            `${trip.avg_speed || '0'} km/h`,
          ]),
          theme: 'striped',
          styles: {
            fontSize: 8,
            cellPadding: 3,
            font: 'DejaVuSans',
            fontStyle: 'normal',
          },
          headStyles: {
            fillColor: [33, 150, 243],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            font: 'DejaVuSans',
          },
          bodyStyles: {
            font: 'DejaVuSans',
            fontStyle: 'normal',
          },
        });
      }
    });

    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 20,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      );
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
  }

  return doc;
};
