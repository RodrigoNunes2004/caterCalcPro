import React, { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { BarChart3, Download, LineChart as LineChartIcon, Receipt } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import Navigation from "@/components/Navigator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatNZCurrency } from "@/lib/gstCalculation";
import AnalyticsDateRangeBar from "@/components/AnalyticsDateRangeBar";
import {
  ANALYTICS_RANGE_PARAM,
  analyticsRangeStateToUrlParams,
  parseAnalyticsRangeFromSearchParams,
  rangeQueryStateToSearchParams,
  type AnalyticsRangeQueryState,
} from "@/lib/analyticsDateRangeClient";

type OverviewData = {
  monthlyProfit?: number;
  averageMarginPercent?: number;
  inventorySpend?: number;
  snapshotCount?: number;
  dateRange?: { start: string; end: string };
  topCostEvents?: Array<{
    eventId: string;
    eventName: string;
    totalCost: number;
  }>;
};

type CostTrendRow = {
  id: string;
  eventId: string;
  totalCost: number;
  targetPrice: number;
  profit: number;
  profitMargin: number;
  guestCount: number;
  createdAt: string;
};

type TopRecipeRow = {
  recipeId: string;
  recipeName: string;
  estimatedCostImpact: number | null;
  createdAt: string;
};

type GstSummaryResponse = {
  gstRate: number;
  currency: string;
  region: string;
  inventory: {
    lineCount: number;
    totalExclusive: number;
    totalGst: number;
    totalInclusive: number;
  };
  eventSnapshots: {
    periodDays: number | null;
    dateRange?: { start: string; end: string };
    assumeTargetPriceGstInclusive: boolean;
    rows: Array<{
      snapshotId: string;
      eventId: string;
      eventName: string;
      eventDate: string | null;
      snapshotCreatedAt: string | null;
      totalCost: number;
      targetPrice: number;
      profit: number;
      targetExclusive: number;
      gstOnTarget: number;
    }>;
    totals: {
      sumTotalCost: number;
      sumTargetPrice: number;
      sumProfit: number;
      sumGstOnTarget: number;
      sumTargetExclusive: number;
    };
  };
  assumptions: string[];
};

const costTrendChartConfig = {
  profit: {
    label: "Profit ($)",
    color: "hsl(142 71% 35%)",
  },
  totalCost: {
    label: "Total cost ($)",
    color: "hsl(24 95% 53%)",
  },
} satisfies ChartConfig;

function formatSnapshotDate(value: string | Date | undefined): string {
  if (value == null) return "—";
  try {
    const d = typeof value === "string" ? parseISO(value) : value;
    if (Number.isNaN(d.getTime())) return "—";
    return format(d, "MMM d, HH:mm");
  } catch {
    return "—";
  }
}

function formatChartTick(value: string): string {
  try {
    const d = parseISO(value);
    if (Number.isNaN(d.getTime())) return value;
    return format(d, "MMM d");
  } catch {
    return value;
  }
}

function formatIsoRange(startIso: string, endIso: string): string {
  try {
    const a = parseISO(startIso);
    const b = parseISO(endIso);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "";
    return `${format(a, "MMM d, yyyy")} – ${format(b, "MMM d, yyyy")}`;
  } catch {
    return "";
  }
}

function gstEventSnapshotPeriodLabel(ev: GstSummaryResponse["eventSnapshots"]): string {
  if (ev.dateRange) {
    const y = new Date(ev.dateRange.start).getUTCFullYear();
    if (y < 1980) return "All time (snapshots)";
    return formatIsoRange(ev.dateRange.start, ev.dateRange.end);
  }
  if (ev.periodDays == null) return "—";
  return `Last ${ev.periodDays} days`;
}

export default function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gstTargetInclusive, setGstTargetInclusive] = useState(true);

  const rangeState = useMemo(
    () => parseAnalyticsRangeFromSearchParams(searchParams),
    [searchParams]
  );

  const setRangeState = useCallback(
    (next: AnalyticsRangeQueryState) => {
      setSearchParams(
        (prev) => {
          const merged = new URLSearchParams(prev);
          for (const k of [ANALYTICS_RANGE_PARAM, "startDate", "endDate", "days"]) {
            merged.delete(k);
          }
          analyticsRangeStateToUrlParams(next).forEach((v, k) => merged.set(k, v));
          return merged;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const rangeQs = useMemo(
    () => rangeQueryStateToSearchParams(rangeState),
    [rangeState]
  );

  const overviewQuery = useQuery({
    queryKey: ["analytics-overview", rangeQs],
    queryFn: async (): Promise<OverviewData> => {
      const response = await fetch(`/api/analytics/overview?${rangeQs}`);
      if (!response.ok) throw new Error("Failed to load analytics overview");
      return response.json();
    },
  });

  const trendsQuery = useQuery({
    queryKey: ["analytics-cost-trends", rangeQs],
    queryFn: async (): Promise<CostTrendRow[]> => {
      const response = await fetch(`/api/analytics/cost-trends?${rangeQs}`);
      if (!response.ok) throw new Error("Failed to load cost trends");
      const data = await response.json();
      return Array.isArray(data?.trends) ? data.trends : [];
    },
  });

  const recipesQuery = useQuery({
    queryKey: ["analytics-top-cost-recipes", rangeQs],
    queryFn: async (): Promise<TopRecipeRow[]> => {
      const response = await fetch(`/api/analytics/top-cost-recipes?${rangeQs}`);
      if (!response.ok) throw new Error("Failed to load top recipes");
      const data = await response.json();
      return Array.isArray(data?.recipes) ? data.recipes : [];
    },
  });

  const gstExportQuery = useMemo(() => {
    const params = new URLSearchParams(rangeQs);
    params.set("targetInclusive", gstTargetInclusive ? "true" : "false");
    return params.toString();
  }, [rangeQs, gstTargetInclusive]);

  const gstQuery = useQuery({
    queryKey: ["analytics-gst-summary", rangeQs, gstTargetInclusive],
    queryFn: async (): Promise<GstSummaryResponse> => {
      const params = new URLSearchParams(rangeQs);
      params.set("targetInclusive", gstTargetInclusive ? "true" : "false");
      const response = await fetch(`/api/analytics/gst/summary?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to load GST summary");
      return response.json();
    },
  });

  const chartData = useMemo(() => {
    const trends = trendsQuery.data;
    if (!trends?.length) return [];
    return [...trends]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .map((t) => ({
        isoDate: typeof t.createdAt === "string" ? t.createdAt : "",
        profit: Number(t.profit) || 0,
        totalCost: Number(t.totalCost) || 0,
      }));
  }, [trendsQuery.data]);

  const overview = overviewQuery.data;
  const topEvents = overview?.topCostEvents ?? [];
  const recipes = recipesQuery.data ?? [];
  const kpiPeriodLabel =
    overview?.dateRange?.start && overview?.dateRange?.end
      ? formatIsoRange(overview.dateRange.start, overview.dateRange.end)
      : null;

  const isLoadingAny =
    overviewQuery.isLoading ||
    trendsQuery.isLoading ||
    recipesQuery.isLoading ||
    gstQuery.isLoading;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-6 w-6 text-orange-600" />
              <h1 className="text-xl font-semibold text-foreground">
                Analytics
              </h1>
            </div>
            <Navigation />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <AnalyticsDateRangeBar value={rangeState} onChange={setRangeState} />

        <section aria-label="Summary KPIs">
              {overviewQuery.isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <Skeleton className="h-4 w-28" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {overviewQuery.isError && (
                <p className="text-destructive text-sm">
                  Summary metrics could not be loaded.
                </p>
              )}
              {!overviewQuery.isLoading && !overviewQuery.isError && overview && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Profit (snapshots)</CardTitle>
                      {kpiPeriodLabel && (
                        <CardDescription className="text-xs">{kpiPeriodLabel}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold tabular-nums">
                      ${Number(overview.monthlyProfit ?? 0).toFixed(2)}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Average margin</CardTitle>
                      {kpiPeriodLabel && (
                        <CardDescription className="text-xs">{kpiPeriodLabel}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold tabular-nums">
                      {Number(overview.averageMarginPercent ?? 0).toFixed(2)}%
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Inventory movement</CardTitle>
                      {kpiPeriodLabel && (
                        <CardDescription className="text-xs">{kpiPeriodLabel}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold tabular-nums">
                      ${Number(overview.inventorySpend ?? 0).toFixed(2)}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Event snapshots</CardTitle>
                      {kpiPeriodLabel && (
                        <CardDescription className="text-xs">{kpiPeriodLabel}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold tabular-nums">
                      {Number(overview.snapshotCount ?? 0)}
                    </CardContent>
                  </Card>
                </div>
              )}
            </section>

            <section aria-label="Cost trends from event snapshots">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5 text-orange-600" />
                    <CardTitle>Cost & profit trend</CardTitle>
                  </div>
                  <CardDescription>
                    Event cost snapshots in the selected period (up to 200 points). Older
                    left, newer right.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {trendsQuery.isLoading && (
                    <Skeleton className="h-[280px] w-full rounded-md" />
                  )}
                  {trendsQuery.isError && (
                    <p className="text-destructive text-sm">
                      Cost trend data could not be loaded.
                    </p>
                  )}
                  {!trendsQuery.isLoading &&
                    !trendsQuery.isError &&
                    chartData.length === 0 && (
                      <div
                        className="rounded-lg border border-dashed p-8 text-center text-muted-foreground"
                        role="status"
                      >
                        <p className="mb-2 font-medium text-foreground">
                          No snapshot history yet
                        </p>
                        <p className="mb-4 text-sm">
                          Create snapshots from the Events area after you price an
                          event. Trends appear here once snapshots exist.
                        </p>
                        <Button asChild variant="outline" size="sm">
                          <Link to="/events">Go to events</Link>
                        </Button>
                      </div>
                    )}
                  {!trendsQuery.isLoading &&
                    !trendsQuery.isError &&
                    chartData.length > 0 && (
                      <ChartContainer
                        config={costTrendChartConfig}
                        className="aspect-auto h-[min(320px,50vh)] w-full"
                      >
                        <LineChart
                          accessibilityLayer
                          data={chartData}
                          margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey="isoDate"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={24}
                            tickFormatter={formatChartTick}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            width={56}
                            tickFormatter={(v) =>
                              typeof v === "number" ? v.toFixed(0) : String(v)
                            }
                          />
                          <ChartTooltip
                            cursor={false}
                            content={
                              <ChartTooltipContent
                                labelFormatter={(label) =>
                                  typeof label === "string"
                                    ? formatSnapshotDate(label)
                                    : ""
                                }
                                formatter={(value, name) => (
                                  <span className="font-mono tabular-nums">
                                    {name === "profit" || name === "totalCost"
                                      ? `$${Number(value).toFixed(2)}`
                                      : String(value)}
                                  </span>
                                )}
                              />
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="profit"
                            stroke="var(--color-profit)"
                            strokeWidth={2}
                            dot={false}
                            name="profit"
                          />
                          <Line
                            type="monotone"
                            dataKey="totalCost"
                            stroke="var(--color-totalCost)"
                            strokeWidth={2}
                            dot={false}
                            name="totalCost"
                          />
                        </LineChart>
                      </ChartContainer>
                    )}
                </CardContent>
              </Card>
            </section>

            <section aria-label="GST reporting">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-orange-600" />
                        <CardTitle>GST reporting (NZ)</CardTitle>
                      </div>
                      <CardDescription>
                        Inventory stock value uses each line&apos;s GST setting. Event rows use
                        snapshot target price with the inclusive/exclusive rule below.
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-3 sm:min-w-[220px]">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/api/analytics/gst/export/csv?${gstExportQuery}`}>
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            CSV
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/api/analytics/gst/export/pdf?${gstExportQuery}`}>
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            PDF
                          </a>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Exports use the same reporting period as the dashboard above.
                      </p>
                      <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                        <Label htmlFor="gst-target-mode" className="text-xs cursor-pointer">
                          Target price is GST-inclusive
                        </Label>
                        <Switch
                          id="gst-target-mode"
                          checked={gstTargetInclusive}
                          onCheckedChange={setGstTargetInclusive}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {gstQuery.isLoading && (
                    <Skeleton className="h-40 w-full rounded-md" />
                  )}
                  {gstQuery.isError && (
                    <p className="text-destructive text-sm">
                      GST summary could not be loaded.
                    </p>
                  )}
                  {gstQuery.data && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">Inventory (stock on hand)</p>
                          <p className="text-lg font-semibold tabular-nums">
                            {formatNZCurrency(gstQuery.data.inventory.totalExclusive)}{" "}
                            <span className="text-xs font-normal text-muted-foreground">excl. GST</span>
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 tabular-nums">
                            GST {formatNZCurrency(gstQuery.data.inventory.totalGst)} · Incl.{" "}
                            {formatNZCurrency(gstQuery.data.inventory.totalInclusive)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {gstQuery.data.inventory.lineCount} line(s)
                          </p>
                        </div>
                        <div className="rounded-md border p-3 sm:col-span-2">
                          <p className="text-xs text-muted-foreground">
                            Event snapshots ({gstEventSnapshotPeriodLabel(gstQuery.data.eventSnapshots)})
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                            <div>
                              <p className="text-muted-foreground text-xs">Sum target</p>
                              <p className="font-medium tabular-nums">
                                {formatNZCurrency(gstQuery.data.eventSnapshots.totals.sumTargetPrice)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">GST on target</p>
                              <p className="font-medium tabular-nums">
                                {formatNZCurrency(gstQuery.data.eventSnapshots.totals.sumGstOnTarget)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Target excl. GST</p>
                              <p className="font-medium tabular-nums">
                                {formatNZCurrency(
                                  gstQuery.data.eventSnapshots.totals.sumTargetExclusive
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Sum cost (snapshots)</p>
                              <p className="font-medium tabular-nums">
                                {formatNZCurrency(gstQuery.data.eventSnapshots.totals.sumTotalCost)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {gstQuery.data.eventSnapshots.rows.length === 0 ? (
                        <p className="text-sm text-muted-foreground" role="status">
                          No event snapshots in this period. Create snapshots from Events to see
                          per-event GST columns.
                        </p>
                      ) : (
                        <div className="overflow-x-auto rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Event</TableHead>
                                <TableHead className="text-right">Target</TableHead>
                                <TableHead className="text-right">GST on target</TableHead>
                                <TableHead className="text-right">Target excl.</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                                <TableHead className="text-right hidden sm:table-cell">Snapshot</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {gstQuery.data.eventSnapshots.rows.map((row) => (
                                <TableRow key={row.snapshotId}>
                                  <TableCell className="font-medium max-w-[180px] truncate">
                                    {row.eventName}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    {formatNZCurrency(row.targetPrice)}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    {formatNZCurrency(row.gstOnTarget)}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    {formatNZCurrency(row.targetExclusive)}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    {formatNZCurrency(row.totalCost)}
                                  </TableCell>
                                  <TableCell className="text-right text-xs text-muted-foreground hidden sm:table-cell">
                                    {row.snapshotCreatedAt
                                      ? format(parseISO(row.snapshotCreatedAt), "MMM d, yyyy")
                                      : "—"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                        {gstQuery.data.assumptions.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </CardContent>
              </Card>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section aria-label="Highest-cost events">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Top cost events</CardTitle>
                    <CardDescription>
                      Highest snapshot cost in the selected period.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {overviewQuery.isLoading && (
                      <Skeleton className="h-32 w-full rounded-md" />
                    )}
                    {!overviewQuery.isLoading &&
                      !overviewQuery.isError &&
                      topEvents.length === 0 && (
                        <p className="text-sm text-muted-foreground" role="status">
                          No events ranked yet. Snapshot at least one priced event
                          to populate this list.
                        </p>
                      )}
                    {!overviewQuery.isLoading &&
                      !overviewQuery.isError &&
                      topEvents.length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Event</TableHead>
                              <TableHead className="text-right">
                                Snapshot cost
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {topEvents.map((ev) => (
                              <TableRow key={ev.eventId}>
                                <TableCell className="font-medium">
                                  {ev.eventName}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  ${Number(ev.totalCost).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                  </CardContent>
                </Card>
              </section>

              <section aria-label="Recent recipes">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Recent recipes</CardTitle>
                    <CardDescription>
                      Recipes added in the selected period.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recipesQuery.isLoading && (
                      <Skeleton className="h-32 w-full rounded-md" />
                    )}
                    {recipesQuery.isError && (
                      <p className="text-destructive text-sm">
                        Recipe list could not be loaded.
                      </p>
                    )}
                    {!recipesQuery.isLoading &&
                      !recipesQuery.isError &&
                      recipes.length === 0 && (
                        <div
                          className="rounded-lg border border-dashed p-6 text-center text-muted-foreground"
                          role="status"
                        >
                          <p className="mb-3 text-sm">
                            No recipes yet. Add recipes to see them listed here.
                          </p>
                          <Button asChild variant="outline" size="sm">
                            <Link to="/recipes">Go to recipes</Link>
                          </Button>
                        </div>
                      )}
                    {!recipesQuery.isLoading &&
                      !recipesQuery.isError &&
                      recipes.length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead className="text-right">Added</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recipes.map((r) => (
                              <TableRow key={r.recipeId}>
                                <TableCell className="font-medium">
                                  {r.recipeName}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-xs">
                                  {formatSnapshotDate(r.createdAt)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                  </CardContent>
                </Card>
              </section>
            </div>

        {isLoadingAny && (
          <p className="sr-only" aria-live="polite">
            Loading analytics
          </p>
        )}
      </main>
    </div>
  );
}
