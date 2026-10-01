import fs from "fs";

const username = process.env.GITHUB_USERNAME;
const token = process.env.GITHUB_TOKEN;

if (!username || !token) {
  throw new Error("GITHUB_USERNAME and GITHUB_TOKEN are required.");
}

const query = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}
`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "github-contribution-calendar"
  },
  body: JSON.stringify({
    query,
    variables: {
      login: username
    }
  })
});

if (!response.ok) {
  throw new Error(`GitHub API request failed: ${response.status}`);
}

const result = await response.json();

if (result.errors) {
  throw new Error(JSON.stringify(result.errors, null, 2));
}

const calendar =
  result.data.user.contributionsCollection.contributionCalendar;

/* --------------------------------
   COLORS
-------------------------------- */

const COLORS = {
  NONE: "#ebedf0",
  FIRST: "#F6D8BD",
  SECOND: "#F39399",
  THIRD: "#CF4173",
  FOURTH: "#5D3140"
};

function getColor(day) {
  const count = day.contributionCount ?? 0;

  if (count === 0) return COLORS.NONE;
  if (count <= 2) return COLORS.FIRST;
  if (count <= 5) return COLORS.SECOND;
  if (count <= 9) return COLORS.THIRD;

  return COLORS.FOURTH;
}

/* --------------------------------
   CALENDAR DATA
-------------------------------- */

const weeks = calendar.weeks;

/* --------------------------------
   SVG DIMENSIONS
-------------------------------- */

const cellSize = 12;
const gap = 4;

const leftMargin = 44;
const rightMargin = 20;

const topMargin = 50;
const bottomMargin = 42;

const columns = weeks.length;

const width =
  leftMargin +
  columns * (cellSize + gap) +
  rightMargin;

const height =
  topMargin +
  7 * (cellSize + gap) +
  bottomMargin;

/* --------------------------------
   MONTH LABELS
-------------------------------- */

const months = [];

let lastMonth = "";

weeks.forEach((week, weekIndex) => {
  const firstDay = week.contributionDays[0];

  if (!firstDay) return;

  const date = new Date(firstDay.date + "T00:00:00");

  const monthName = date.toLocaleString("en-US", {
    month: "short"
  });

  /*
   Only add a month label when the
   month actually changes.
  */
  if (monthName !== lastMonth) {
    months.push({
      name: monthName,
      weekIndex
    });

    lastMonth = monthName;
  }
});

/* --------------------------------
   START SVG
-------------------------------- */

let svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  role="img"
  aria-label="GitHub contribution calendar for ${username}"
>

<rect
  width="100%"
  height="100%"
  fill="white"
  rx="12"
/>

<style>

  text {
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Arial,
      sans-serif;

    fill: #5D3140;
  }

  .title {
    font-size: 12px;
    font-weight: 600;
  }

  .month {
    font-size: 10px;
  }

  .weekday {
    font-size: 10px;
  }

  .legend {
    font-size: 10px;
  }

  .day {
    rx: 3;
  }

</style>
`;

/* --------------------------------
   TITLE
-------------------------------- */

svg += `
<text
  class="title"
  x="${leftMargin}"
  y="20"
>
  ${calendar.totalContributions.toLocaleString()}
  contributions in the last year
</text>
`;

/* --------------------------------
   MONTH LABELS

   Start them lower than the title
   so they don't overlap.
-------------------------------- */

months.forEach(month => {

  const x =
    leftMargin +
    month.weekIndex * (cellSize + gap);

  svg += `
  <text
    class="month"
    x="${x}"
    y="38"
  >
    ${month.name}
  </text>
  `;
});

/* --------------------------------
   WEEKDAY LABELS
-------------------------------- */

const weekdays = [
  { name: "Mon", row: 1 },
  { name: "Wed", row: 3 },
  { name: "Fri", row: 5 }
];

weekdays.forEach(day => {

  const y =
    topMargin +
    day.row * (cellSize + gap) +
    9;

  svg += `
  <text
    class="weekday"
    x="4"
    y="${y}"
  >
    ${day.name}
  </text>
  `;
});

/* --------------------------------
   CONTRIBUTION SQUARES
-------------------------------- */

weeks.forEach((week, weekIndex) => {

  week.contributionDays.forEach(day => {

    const date =
      new Date(day.date + "T00:00:00");

    /*
     Sunday = 0

     Convert to:
     Monday = 0
     Tuesday = 1
     ...
     Sunday = 6
    */

    const dayOfWeek = date.getDay();

    const row =
      dayOfWeek === 0
        ? 6
        : dayOfWeek - 1;

    const x =
      leftMargin +
      weekIndex * (cellSize + gap);

    const y =
      topMargin +
      row * (cellSize + gap);

    const count =
      day.contributionCount;

    const label =
      count === 0
        ? `No contributions on ${day.date}`
        : `${count} contribution${
            count === 1 ? "" : "s"
          } on ${day.date}`;

    svg += `
    <rect
      class="day"
      x="${x}"
      y="${y}"
      width="${cellSize}"
      height="${cellSize}"
      fill="${getColor(day)}"
    >
      <title>${label}</title>
    </rect>
    `;
  });
});

/* --------------------------------
   LEGEND
-------------------------------- */

const legendY = height - 18;

svg += `
<text
  class="legend"
  x="${leftMargin}"
  y="${legendY}"
>
  Less
</text>
`;

const legendColors = [
  COLORS.NONE,
  COLORS.FIRST,
  COLORS.SECOND,
  COLORS.THIRD,
  COLORS.FOURTH
];

legendColors.forEach((color, index) => {

  const x =
    leftMargin +
    28 +
    index * 20;

  svg += `
  <rect
    x="${x}"
    y="${legendY - 10}"
    width="${cellSize}"
    height="${cellSize}"
    rx="3"
    fill="${color}"
  />
  `;
});

svg += `
<text
  class="legend"
  x="${
    leftMargin +
    28 +
    legendColors.length * 20 +
    4
  }"
  y="${legendY}"
>
  More
</text>
`;

/* --------------------------------
   CLOSE SVG
-------------------------------- */

svg += `
</svg>
`;

/* --------------------------------
   SAVE FILE
-------------------------------- */

fs.mkdirSync("public", {
  recursive: true
});

fs.writeFileSync(
  "public/contribution-calendar-light.svg",
  svg
);

console.log(
  `Generated contribution calendar with ${calendar.totalContributions} contributions.`
);
