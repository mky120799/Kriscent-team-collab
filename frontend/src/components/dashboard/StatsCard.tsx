

import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: number | string;
}

const StatsCard = ({ title, value }: StatsCardProps) => {
  return (
    <Card>
      <CardHeader>{title}</CardHeader>
      <CardContent className="text-2xl font-bold">{value}</CardContent>
    </Card>
  );
};

export default StatsCard;