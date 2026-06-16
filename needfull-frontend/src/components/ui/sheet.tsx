import * as React from "react"

export const Sheet = ({ children, open, onOpenChange }: any) => <div className="sheet">{children}</div>
export const SheetTrigger = ({ children, asChild }: any) => <div className="sheet-trigger">{children}</div>
export const SheetContent = ({ children, side, className }: any) => <div className={className}>{children}</div>
export const SheetHeader = ({ children }: any) => <div className="sheet-header">{children}</div>
export const SheetTitle = ({ children }: any) => <div className="sheet-title">{children}</div>
export const SheetDescription = ({ children }: any) => <div className="sheet-description">{children}</div>
