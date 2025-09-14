import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ZoneBadgeProps {
  zone: "green" | "yellow" | "red";
  className?: string;
}

const ZoneBadge = ({ zone, className }: ZoneBadgeProps) => {
  const getZoneConfig = (zone: string) => {
    switch (zone) {
      case "green":
        return {
          label: "Green Zone",
          className: "bg-zone-green-light text-zone-green border-zone-green/20",
        };
      case "yellow":
        return {
          label: "Yellow Zone",
          className: "bg-zone-yellow-light text-zone-yellow border-zone-yellow/20",
        };
      case "red":
        return {
          label: "Red Zone",
          className: "bg-zone-red-light text-zone-red border-zone-red/20",
        };
      default:
        return {
          label: "Unknown",
          className: "bg-muted text-muted-foreground",
        };
    }
  };

  const config = getZoneConfig(zone);

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
};

export default ZoneBadge;