function createSvg(weeks, totalContributions) {
  const blockSize = 13;
  const blockGap = 4;

  const headerHeight = 92;
  const weekdayLabelWidth = 30;

  const weekWidth = blockSize + blockGap;
  const totalWeeks = weeks.length;

  const calendarWidth = weekdayLabelWidth + totalWeeks * weekWidth;
  const calendarHeight = headerHeight + 7 * weekWidth;

  const blocks = [];

  /*
   * Contribution squares
   */
  weeks.forEach((week, weekIndex) => {
    week.contributionDays.forEach((day) => {
      // Fix: Append Z to parse strictly in UTC
      const date = new Date(`${day.date}T00:00:00Z`);

      // Fix: Use UTC day calculation
      const dayOfWeek = date.getUTCDay();

      const x = weekdayLabelWidth + weekIndex * weekWidth;
      const y = headerHeight + dayOfWeek * weekWidth;

      const level = levelToNumber(day.contributionLevel);

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

  /*
   * Month labels
   */
  const monthLabels = [];
  let previousMonth = "";
  let previousLabelX = -Infinity;

  weeks.forEach((week, weekIndex) => {
    const firstDay = week.contributionDays[0];
    if (!firstDay) return;

    // Fix: Parse month label date in UTC
    const date = new Date(`${firstDay.date}T00:00:00Z`);

    const month = date.toLocaleString("en-US", {
      month: "short",
      timeZone: "UTC",
    });

    const x = weekdayLabelWidth + weekIndex * weekWidth + 2;
    const minimumSpacing = 38;

    if (month !== previousMonth && x - previousLabelX >= minimumSpacing) {
      monthLabels.push(`
        <text
          x="${x}"
          y="${headerHeight - 10}"
          font-size="11"
          fill="#5D3140"
        >
          ${month}
        </text>
      `);

      previousMonth = month;
      previousLabelX = x;
    }
  });

  /*
   * Weekday labels
   */
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
          y="${headerHeight + index * weekWidth + 10}"
          font-size="10"
          fill="#5D3140"
        >
          ${name}
        </text>
      `
    )
    .join("");

  /*
   * Final SVG
   */
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

  <!-- Flower -->
  <text
    x="${calendarWidth / 2}"
    y="24"
    text-anchor="middle"
    font-size="20"
  >
    🌸
  </text>

  <!-- Title -->
  <text
    x="${calendarWidth / 2}"
    y="47"
    text-anchor="middle"
    font-size="18"
    font-weight="700"
    fill="#5D3140"
  >
    GitHub Contributions
  </text>

  <!-- Subtitle -->
  <text
    x="${calendarWidth / 2}"
    y="65"
    text-anchor="middle"
    font-size="11"
    fill="#CF4173"
  >
    Pabasara Ranasinghe's coding activity
  </text>

  <!-- Total contributions -->
  <text
    x="${calendarWidth / 2}"
    y="82"
    text-anchor="middle"
    font-size="10"
    font-weight="600"
    fill="#5D3140"
  >
    ${totalContributions.toLocaleString()} contributions in the last year
  </text>

  <!-- Month labels -->
  ${monthLabels.join("")}

  <!-- Weekday labels -->
  ${weekdayText}

  <!-- Contribution squares -->
  ${blocks.join("")}
</svg>
`;
}
