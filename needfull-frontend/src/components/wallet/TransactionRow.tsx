import { formatCurrency } from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight, Lock, Unlock, Clock, RefreshCw } from "lucide-react";

interface TransactionRowProps {
  type: string;
  amountKobo: number;
  note?: string;
  createdAt: string;
}

export function TransactionRow({ type, amountKobo, note, createdAt }: TransactionRowProps) {
  const getIcon = () => {
    switch (type) {
      case "deposit":
      case "transfer_in":
      case "refund":
        return <ArrowDownLeft className="w-5 h-5 text-success-text" />;
      case "withdrawal":
      case "transfer_out":
      case "payment":
        return <ArrowUpRight className="w-5 h-5 text-error-text" />;
      case "escrow_lock":
        return <Lock className="w-5 h-5 text-warning-text" />;
      case "escrow_release":
        return <Unlock className="w-5 h-5 text-info-text" />;
      case "escrow_refund":
        return <RefreshCw className="w-5 h-5 text-success-text" />;
      default:
        return <Clock className="w-5 h-5 text-foreground-muted" />;
    }
  };

  const getAmountColor = () => {
    switch (type) {
      case "deposit":
      case "transfer_in":
      case "refund":
      case "escrow_refund":
      case "escrow_release":
        return "text-success-text";
      case "withdrawal":
      case "transfer_out":
      case "payment":
      case "escrow_lock":
        return "text-error-text";
      default:
        return "text-gray-900";
    }
  };

  const formattedAmount = formatCurrency(amountKobo);
  const prefix = ["deposit", "transfer_in", "refund", "escrow_refund", "escrow_release"].includes(type) ? "+" : "-";
  
  return (
    <div className="flex items-center justify-between p-4 border-b border-border-subtle last:border-0 hover:bg-surface-secondary transition-colors">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-surface-secondary rounded-full">
          {getIcon()}
        </div>
        <div>
          <p className="font-medium text-gray-900 capitalize">{type.replace("_", " ")}</p>
          <p className="text-sm text-gray-500">{note || "No details provided"}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${getAmountColor()}`}>
          {prefix}{formattedAmount}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
