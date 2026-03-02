// resources/js/Pages/Salud/components/AreaHeader.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

export function AreaHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Icon className="h-6 w-6" />
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {badge ? <Badge variant="secondary">{badge}</Badge> : null}
            </div>
            {subtitle ? (
              <p className="text-sm text-muted-foreground max-w-3xl">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}