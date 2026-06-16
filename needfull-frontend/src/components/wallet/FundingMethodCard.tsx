"use client";

import { CreditCard, Landmark, CheckCircle } from "lucide-react";

interface FundingMethodCardProps {
  method: "card" | "transfer";
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export function FundingMethodCard({ method, title, description, selected, onClick }: FundingMethodCardProps) {
  const Icon = method === "card" ? CreditCard : Landmark;

  return (
    <div 
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
        selected ? "border-primary bg-primary/5" : "border-gray-200 bg-white hover:border-primary/50"
      }`}
    >
      {selected && (
        <div className="absolute top-3 right-3 text-primary">
          <CheckCircle className="w-5 h-5" />
        </div>
      )}
      
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-full ${selected ? "bg-primary/20 text-primary" : "bg-gray-100 text-gray-500"}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className={`font-semibold ${selected ? "text-primary" : "text-gray-900"}`}>{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}
