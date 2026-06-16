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
        return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case "withdrawal":
      case "transfer_out":
      case "payment":
        return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      case "escrow_lock":
        return <Lock className="w-5 h-5 text-orange-600" />;
      case "escrow_release":
        return <Unlock className="w-5 h-5 text-blue-600" />;
      case "escrow_refund":
        return <RefreshCw className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getAmountColor = () => {
    switch (type) {
      case "deposit":
      case "transfer_in":
      case "refund":
      case "escrow_refund":
      case "escrow_release":
        return "text-green-600";
      case "withdrawal":
      case "transfer_out":
      case "payment":
      case "escrow_lock":
        return "text-red-600";
      default:
        return "text-gray-900";
    }
  };

  const formattedAmount = `₦${(amountKobo / 100).toLocaleString()}`;
  const prefix = ["deposit", "transfer_in", "refund", "escrow_refund", "escrow_release"].includes(type) ? "+" : "-";
  
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-gray-100 rounded-full">
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
        <p className="text-xs text-gray-400 mt-1">
          {new Date(createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
