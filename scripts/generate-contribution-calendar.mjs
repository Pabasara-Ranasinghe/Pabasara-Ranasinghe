import fs from 'fs';
import path from 'path';

// ... (Your GitHub API fetching logic remains the same) ...

function generateSVG(contributionData) {
  const { totalContributions, weeks } = contributionData;

  const squareSize = 10;
  const squareGap = 3;
  const dayLabelWidth = 30; // Space for Mon/Wed/Fri labels
  
  // ADJUSTED SPACING: Extra header height prevents text overlap
  const headerHeight = 35;  // Height for "125 contributions..."
  const monthLabelHeight = 18; // Height for Jan, Feb, Mar labels
  
  const width = dayLabelWidth + (weeks.length * (squareSize + squareGap)) + 20;
  const height = headerHeight + monthLabelHeight + (7 * (squareSize + squareGap)) + 30;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<style>
    .text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10px; fill: #57606a; }
    .title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; fill: #24292f; }
    .day { rx: 2px; ry: 2px; }
  </style>`;

  // 1. Total Contributions Title (Positioned clearly above the calendar)
  svg += `<text x="${dayLabelWidth}" y="15" class="title">${totalContributions} contributions in the last year</text>`;

  // 2. Month Labels
  const monthY = headerHeight + 10;
  weeks.forEach((week, weekIndex) => {
    const firstDay = week.contributionDays[0];
    if (firstDay && firstDay.showMonthLabel) { // Render month text if new month starts
      const x = dayLabelWidth + weekIndex * (squareSize + squareGap);
      svg += `<text x="${x}" y="${monthY}" class="text">${firstDay.monthName}</text>`;
    }
  });

  // 3. Day Labels (Mon, Wed, Fri)
  const gridStartY = headerHeight + monthLabelHeight;
  const dayNames = [
    { name: 'Mon', index: 1 },
    { name: 'Wed', index: 3 },
    { name: 'Fri', index: 5 }
  ];
  dayNames.forEach(day => {
    const y = gridStartY + day.index * (squareSize + squareGap) + squareSize - 2;
    svg += `<text x="5" y="${y}" class="text">${day.name}</text>`;
  });

  // 4. Contribution Grid Squares (With hover tooltips)
  weeks.forEach((week, weekIndex) => {
    const x = dayLabelWidth + weekIndex * (squareSize + squareGap);

    week.contributionDays.forEach((day, dayIndex) => {
      // FIX: Ensure day exists and belongs strictly to the year's dataset
      if (!day || dayIndex > 6) return; 

      const y = gridStartY + dayIndex * (squareSize + squareGap);
      const color = day.color || '#ebedf0';

      const dateStr = day.date; // e.g., "2026-09-29"
      const count = day.contributionCount || 0;
      const tooltipText = `${count} contribution${count === 1 ? '' : 's'} on ${dateStr}`;

      svg += `<rect class="day" x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="${color}">`;
      svg += `<title>${tooltipText}</title>`;
      svg += `</rect>`;
    });
  });

  // 5. Legend (Less -> More)
  const legendY = gridStartY + (7 * (squareSize + squareGap)) + 15;
  svg += `<text x="${dayLabelWidth}" y="${legendY + 8}" class="text">Less</text>`;
  
  const colors = ['#ebedf0', '#fbe8eb', '#f19db1', '#cf4173', '#5d3140'];
  colors.forEach((col, idx) => {
    const lx = dayLabelWidth + 30 + idx * (squareSize + 2);
    svg += `<rect class="day" x="${lx}" y="${legendY}" width="${squareSize}" height="${squareSize}" fill="${col}" />`;
  });
  
  svg += `<text x="${dayLabelWidth + 30 + colors.length * (squareSize + 2) + 5}" y="${legendY + 8}" class="text">More</text>`;

  svg += `</svg>`;
  return svg;
}
