import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "InsightKuy — AI Analytics Dashboard",
  description: "AI-powered Google Analytics dashboard. Upload Excel files, get AI insights, compare data, and receive actionable recommendations to boost your platform engagement.",
  keywords: "analytics, dashboard, AI, Google Analytics, data insights, recommendations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
