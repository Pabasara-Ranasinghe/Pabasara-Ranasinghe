import fs from "fs";

const username = "Pabasara-Ranasinghe";

const COLORS = [
  "#F6D8BD",
  "#F39399",
  "#CF4173",
  "#A83A5D",
  "#5D3140",
];

const query = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

async function getContributions() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GITHUB_TOKEN is not available.");
  }

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",

    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      query,
      variables: {
        login: username,
      },
    }),
  });

  const result = await response.json();

  if (!response.ok || result.errors) {
    console.error(result);
    throw new Error("Failed to fetch GitHub contributions.");
  }

  return result.data.user.contributionsCollection.contributionCalendar
    .weeks;
}

function levelToNumber(level) {
  const levels = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4,
  };

  return levels[level] ?? 0;
}

function createSvg(weeks) {
  const blockSize = 13;
  const blockGap = 4;

  const monthLabelHeight = 24;
  const weekdayLabelWidth = 30;

  const weekWidth = blockSize + blockGap;
  const totalWeeks = weeks.length;

  const calendarWidth =
    weekdayLabelWidth + totalWeeks * weekWidth;

  const calendarHeight =
    monthLabelHeight + 7 * weekWidth;

  const blocks = [];

  weeks.forEach((week, weekIndex) => {
    week.contributionDays.forEach((day) => {
      const date = new Date(`${day.date}T00:00:00`);

      const dayOfWeek = date.getDay();

      const x =
        weekdayLabelWidth +
        weekIndex * weekWidth;

      const y =
        monthLabelHeight +
        dayOfWeek * weekWidth;

      const level = levelToNumber(
        day.contributionLevel
      );

      blocks.push(`
        <rect
          x="${x}"
          y="${y}"
          width="${blockSize}"
          height="${blockSize}"
          rx="3"
          fill="${COLORS[level]}"
        />
      `);
    });
  });

  const monthLabels = [];

  let previousMonth = "";
  let previousLabelX = -Infinity;

  weeks.forEach((week, weekIndex) => {
    const firstDay = week.contributionDays[0];

    if (!firstDay) return;

    const date = new Date(`${firstDay.date}T00:00:00`);

    const month = date.toLocaleString("en-US", {
      month: "short",
    });

    const x =
      weekdayLabelWidth +
      weekIndex * weekWidth +
      2;

    // Approximate width of a month label.
    // Prevents labels such as "Sep" and "Oct"
    // from touching each other.
    const minimumSpacing = 38;

    if (
      month !== previousMonth &&
      x - previousLabelX >= minimumSpacing
    ) {
      monthLabels.push(`
        <text
          x="${x}"
          y="14"
          font-size="11"
          fill="#5D3140"
        >
          ${month}
        </text>
    `  );

      previousMonth = month;
      previousLabelX = x;
    }
});
  const weekdayLabels = [
    { name: "Mon", index: 1 },
    { name: "Wed", index: 3 },
    { name: "Fri", index: 5 },
  ];

  const weekdayText = weekdayLabels
    .map(
      ({ name, index }) => `
        <text
          x="0"
          y="${
            monthLabelHeight +
            index * weekWidth +
            10
          }"
          font-size="10"
          fill="#5D3140"
        >
          ${name}
        </text>
      `
    )
    .join("");

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${calendarWidth}"
  height="${calendarHeight}"
  viewBox="0 0 ${calendarWidth} ${calendarHeight}"
  role="img"
  aria-label="GitHub contribution calendar for ${username}"
>
  <rect
    width="100%"
    height="100%"
    fill="#FFFAF7"
    rx="18"
  />

  ${monthLabels.join("")}

  ${weekdayText}

  ${blocks.join("")}
</svg>
`;
}

async function main() {
  console.log(
    `Fetching GitHub contributions for ${username}...`
  );

  const weeks = await getContributions();

  console.log(
    `Received ${weeks.length} weeks of contribution data.`
  );

  const svg = createSvg(weeks);

  fs.mkdirSync("public", {
    recursive: true,
  });

  fs.writeFileSync(
    "public/contribution-calendar.svg",
    svg.trim()
  );

  console.log(
    "Created public/contribution-calendar.svg"
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
