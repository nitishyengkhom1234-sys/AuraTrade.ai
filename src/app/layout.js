import "./globals.css";

export const metadata = {
  title: "AuraTrade | Professional Stock Screener & Analysis Dashboard",
  description: "Real-time algorithmic analysis and recommendation dashboard. Screens stocks for Intraday, Medium-Term, and Long-Term investment horizons using technical indicators and fundamentals.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
