import fs from 'fs';
import path from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = 'Pabasara-Ranasinghe';

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN is missing from environment variables.');
  process.exit(1);
}

const query = `
query($username: String!) {
  user(login: $username) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            color
            contributionCount
            date
          }
        }
      }
    }
  }
}
`;

async function fetchContributions() {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Node.js'
    },
    body: JSON.stringify({ query, variables: { username: USERNAME } })
  });

  const json = await response.json();
  if (json.errors) {
    console.error('GitHub API Query Error:', JSON.stringify(json.errors, null, 2));
    process.exit(1);
  }

  return json.data.user.contributionsCollection.contributionCalendar;
}

function generateSVG(calendar) {
  const { totalContributions, weeks } = calendar;

  const squareSize = 10;
  const squareGap = 3;
  const dayLabelWidth = 30;
  const headerHeight = 35;
  const monthLabelHeight = 18;

  const width = dayLabelWidth + (weeks.length * (squareSize + squareGap)) + 20;
  const height = headerHeight + monthLabelHeight + (7 * (squareSize + squareGap)) + 30;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<style>
    .text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10px; fill: #57606a; }
    .title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; fill: #24292f; }
    .day { rx: 2px; ry: 2px; }
  </style>`;

  // Title
  svg += `<text x="${dayLabelWidth}" y="15" class="title">${totalContributions} contributions in the last year</text>`;

  // Month Labels
  const monthY = headerHeight + 10;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let lastMonth = -1;

  weeks.forEach((week, weekIndex) => {
    const firstDay = week.contributionDays[0];
    if (firstDay) {
      const d = new Date(firstDay.date);
      const m = d.getMonth();
      if (m !== lastMonth) {
        lastMonth = m;
        const x = dayLabelWidth + weekIndex * (squareSize + squareGap);
        svg += `<text x="${x}" y="${monthY}" class="text">${months[m]}</text>`;
      }
    }
  });

  // Day Labels
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

  // Grid Squares
  weeks.forEach((week, weekIndex) => {
    const x = dayLabelWidth + weekIndex * (squareSize + squareGap);

    week.contributionDays.forEach((day, dayIndex) => {
      if (!day || dayIndex > 6) return;

      const y = gridStartY + dayIndex * (squareSize + squareGap);
      const color = day.color || '#ebedf0';
      const count = day.contributionCount || 0;
      const tooltipText = `${count} contribution${count === 1 ? '' : 's'} on ${day.date}`;

      svg += `<rect class="day" x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="${color}">`;
      svg += `<title>${tooltipText}</title>`;
      svg += `</rect>`;
    });
  });

  // Legend
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

async function run() {
  try {
    const calendar = await fetchContributions();
    const svgContent = generateSVG(calendar);

    const outputDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(path.join(outputDir, 'contribution-calendar-light.svg'), svgContent);
    console.log('Successfully generated contribution-calendar-light.svg!');
  } catch (err) {
    console.error('Execution Failed:', err);
    process.exit(1);
  }
}

run();
