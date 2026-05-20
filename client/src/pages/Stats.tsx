import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { RARITY_CONFIG } from "../components/QuoteCard";

interface Stats {
  totalQuotes: number;
  collectedQuotes: number;
  favorites: number;
  byRarity: Record<string, { total: number; collected: number }>;
}

interface DailyStatus {
  packsOpened: number;
  packsRemaining: number;
  maxPacks: number;
  date: string;
}

export default function Stats() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    queryFn: () => apiRequest("GET", "/api/stats").then(r => r.json()),
  });

  const { data: status } = useQuery<DailyStatus>({
    queryKey: ["/api/daily-status"],
    queryFn: () => apiRequest("GET", "/api/daily-status").then(r => r.json()),
  });

  const completion = stats ? Math.round((stats.collectedQuotes / stats.totalQuotes) * 100) : 0;
  const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary"] as const;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Your Stats</h1>
        <p className="text-muted-foreground text-sm mb-8">Track your wisdom collection progress</p>

        {/* Overall progress */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Collected", value: stats?.collectedQuotes ?? 0, color: "#60a5fa" },
            { label: "Total Available", value: stats?.totalQuotes ?? 0, color: "#9ca3af" },
            { label: "Favorites", value: stats?.favorites ?? 0, color: "#ef4444" },
            { label: "Packs Today", value: `${status?.packsOpened ?? 0}/${status?.maxPacks ?? 10}`, color: "#a78bfa" },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-xl p-4 border border-border bg-muted/30"
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Collection progress bar */}
        <div className="rounded-2xl border border-border bg-muted/30 p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold">Collection Progress</span>
            <span className="text-lg font-bold" style={{ color: "#fbbf24" }}>{completion}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${completion}%`,
                background: "linear-gradient(90deg, #7c3aed, #4f46e5, #2563eb, #fbbf24)",
              }}
              data-testid="progress-bar"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {stats?.collectedQuotes ?? 0} of {stats?.totalQuotes ?? 0} quotes collected
          </p>
        </div>

        {/* By rarity */}
        <div className="space-y-3 mb-8">
          <h2 className="font-semibold text-lg mb-4">By Rarity</h2>
          {rarities.map(rarity => {
            const cfg = RARITY_CONFIG[rarity];
            const rarityStats = stats?.byRarity[rarity];
            const pct = rarityStats ? Math.round((rarityStats.collected / rarityStats.total) * 100) : 0;
            return (
              <div
                key={rarity}
                className="rounded-xl p-4"
                style={{
                  background: cfg.bg,
                  border: `1.5px solid ${cfg.border}`,
                  boxShadow: `0 0 10px ${cfg.glow}20`,
                }}
                data-testid={`rarity-stat-${rarity}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} width="10" height="10" viewBox="0 0 10 10">
                          <polygon points="5,1 6.5,4 9.5,4 7,6 8,9 5,7 2,9 3,6 0.5,4 3.5,4" fill={i < cfg.stars ? cfg.color : "rgba(255,255,255,0.1)"} />
                        </svg>
                      ))}
                    </div>
                    <span className="font-semibold text-white">{rarity}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white">{rarityStats?.collected ?? 0}</span>
                    <span className="text-white/50 text-sm"> / {rarityStats?.total ?? 0}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-black/30 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: cfg.color }}
                  />
                </div>
                <div className="text-xs text-white/50 mt-1 text-right">{pct}% complete</div>
              </div>
            );
          })}
        </div>

        {/* Motivational message */}
        <div className="rounded-2xl border border-border bg-muted/20 p-6 text-center">
          {completion === 0 && (
            <>
              <div className="text-4xl mb-3">🎴</div>
              <p className="text-muted-foreground">Your journey begins! Open some packs to start collecting wisdom.</p>
            </>
          )}
          {completion > 0 && completion < 25 && (
            <>
              <div className="text-4xl mb-3">🌱</div>
              <p className="text-muted-foreground">A fine start, Seeker. The path of wisdom unfolds before you.</p>
            </>
          )}
          {completion >= 25 && completion < 50 && (
            <>
              <div className="text-4xl mb-3">📚</div>
              <p className="text-muted-foreground">Impressive! You've gathered the words of many great minds.</p>
            </>
          )}
          {completion >= 50 && completion < 75 && (
            <>
              <div className="text-4xl mb-3">⭐</div>
              <p className="text-muted-foreground">Remarkable! Over halfway to completing your wisdom collection.</p>
            </>
          )}
          {completion >= 75 && completion < 100 && (
            <>
              <div className="text-4xl mb-3">🔥</div>
              <p className="text-muted-foreground">Almost there! You are among the greatest collectors of wisdom.</p>
            </>
          )}
          {completion === 100 && (
            <>
              <div className="text-4xl mb-3">👑</div>
              <p className="text-muted-foreground font-semibold">Perfect collection! You have achieved true Wisdom.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
