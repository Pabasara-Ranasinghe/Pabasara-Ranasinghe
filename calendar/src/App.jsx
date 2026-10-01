import { GitHubCalendar } from "react-github-calendar";
import "./App.css";

const theme = {
  light: [
    "#F6D8BD",
    "#F39399",
    "#CF4173",
    "#A83A5D",
    "#5D3140",
  ],
};

function App() {
  return (
    <main className="calendar-page">
      <section className="calendar-card">
        <div className="header">
          <div className="flower">🌸</div>

          <h1>GitHub Contributions</h1>

          <p>
            Pabasara Ranasinghe's coding activity
          </p>
        </div>

        <div className="divider" />

        <div className="calendar-wrapper">
          <GitHubCalendar
            username="Pabasara-Ranasinghe"
            colorScheme="light"
            theme={theme}
            blockSize={13}
            blockMargin={4}
            blockRadius={3}
            fontSize={14}
            showWeekdayLabels={true}
            showMonthLabels={true}
          />
        </div>

        <div className="footer-text">
          <span>🌸</span>
          <span>Keep building. Keep learning. Keep growing.</span>
          <span>✨</span>
        </div>
      </section>
    </main>
  );
}

export default App;