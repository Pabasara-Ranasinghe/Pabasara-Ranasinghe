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

const calendar = result.data.user.contributionsCollection.contributionCalendar;

const days = calendar.weeks.flatMap(
  week => week.contributionDays
);

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

const cellSize = 12;
const gap = 4;

const leftMargin = 42;
const topMargin = 32;
const bottomMargin = 42;

const columns = calendar.weeks.length;

const width =
  leftMargin +
  columns * (cellSize + gap) +
  20;

const height =
  topMargin +
  7 * (cellSize + gap) +
  bottomMargin;

const firstDate = new Date(days[0].date + "T00:00:00");

const months = [];

let previousMonth = "";

days.forEach((day, index) => {
  const date = new Date(day.date + "T00:00:00");

  if (date.getDate() === 1 || index === 0) {
    const monthName = date.toLocaleString("en-US", {
      month: "short"
    });

    if (monthName !== previousMonth) {
      months.push({
        name: monthName,
        weekIndex: Math.floor(index / 7)
      });

      previousMonth = monthName;
    }
  }
});

const weekdays = [
  { name: "Mon", row: 1 },
  { name: "Wed", row: 3 },
  { name: "Fri", row: 5 }
];

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

  .weekday {
    font-size: 10px;
  }

  .month {
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

svg += `
<text
  x="${leftMargin}"
  y="18"
  font-size="12"
  font-weight="600"
>
  ${calendar.totalContributions.toLocaleString()} contributions in the last year
</text>
`;

for (const month of months) {
  const x =
    leftMargin +
    month.weekIndex * (cellSize + gap);

  svg += `
  <text
    class="month"
    x="${x}"
    y="${topMargin - 10}"
  >
    ${month.name}
  </text>
  `;
}

for (const weekday of weekdays) {
  const y =
    topMargin +
    weekday.row * (cellSize + gap) +
    9;

  svg += `
  <text
    class="weekday"
    x="4"
    y="${y}"
  >
    ${weekday.name}
  </text>
  `;
}

calendar.weeks.forEach((week, weekIndex) => {
  week.contributionDays.forEach(day => {
    const date = new Date(day.date + "T00:00:00");

    const dayOfWeek = date.getDay();

    // Convert Sunday=0 to Monday=0
    const row = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const x =
      leftMargin +
      weekIndex * (cellSize + gap);

    const y =
      topMargin +
      row * (cellSize + gap);

    const count = day.contributionCount;

    const label =
      count === 0
        ? `No contributions on ${day.date}`
        : `${count} contribution${count === 1 ? "" : "s"} on ${day.date}`;

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
  x="${leftMargin + 28 + legendColors.length * 20 + 4}"
  y="${legendY}"
>
  More
</text>
`;

svg += `
</svg>
`;

fs.mkdirSync("public", { recursive: true });

fs.writeFileSync(
  "public/contribution-calendar-light.svg",
  svg
);

console.log(
  `Generated contribution calendar with ${calendar.totalContributions} contributions.`
);
