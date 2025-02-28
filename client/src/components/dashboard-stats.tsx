import * as React from "react";
import { Card, CardContent } from "./ui/card";

interface StatItem {
  title: string;
  value: number | string;
  change?: number;
  icon?: React.ReactNode;
}

interface DashboardStatsProps {
  stats: StatItem[];
  isLoading?: boolean;
  className?: string;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  isLoading = false,
  className = "",
}) => {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-24"></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
                {stat.change !== undefined && (
                  <p
                    className={`mt-1 text-sm ${
                      stat.change >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.change >= 0 ? "+" : ""}
                    {stat.change}%
                  </p>
                )}
              </div>
              {stat.icon && (
                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                  {stat.icon}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export { DashboardStats, type StatItem }; 