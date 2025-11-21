import React, { useEffect, useMemo, useRef, useState } from "react";
/* ---------- Simple UI components (replace shadcn/ui) ---------- */
const Button = ({ variant, onClick, children, ...props }) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 14px",
      margin: "2px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      backgroundColor: variant === "secondary" ? "#e0e0e0" : "#3b82f6",
      color: variant === "secondary" ? "#000" : "#fff",
    }}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ children }) => (
  <div
    style={{
      border: "1px solid #ccc",
      borderRadius: "10px",
      padding: "16px",
      marginBottom: "12px",
      background: "#fff",
    }}
  >
    {children}
  </div>
);
const CardHeader = ({ children }) => (
  <div style={{ marginBottom: "8px", fontWeight: "bold" }}>{children}</div>
);
const CardTitle = ({ children, className = "" }) => (
  <h2 className={`text-lg md:text-xl font-semibold ${className}`}>
    {children}
  </h2>
);
const CardContent = ({ children }) => <div>{children}</div>;

/* ---------- Tabs with simple state wiring ---------- */
const Tabs = ({ value, onValueChange, children }) => (
  <div>
    {React.Children.map(children, (child) =>
      React.cloneElement(child, {
        tabValue: value,
        onTabChange: onValueChange,
      })
    )}
  </div>
);

const TabsList = ({ children, tabValue, onTabChange }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginBottom: "12px",
    }}
  >
    {React.Children.map(children, (child) =>
      React.cloneElement(child, { tabValue, onTabChange })
    )}
  </div>
);

const TabsTrigger = ({ children, value, tabValue, onTabChange }) => (
  <Button
    variant={tabValue === value ? undefined : "secondary"}
    onClick={() => onTabChange && onTabChange(value)}
  >
    {children}
  </Button>
);

const TabsContent = ({ children, value, tabValue }) =>
  tabValue === value ? (
    <div style={{ marginTop: "12px" }}>{children}</div>
  ) : null;

const Switch = ({ checked, onCheckedChange }) => (
  <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  </label>
);
const Label = ({ children }) => (
  <span style={{ fontSize: "14px" }}>{children}</span>
);
const Progress = ({ value }) => (
  <div
    style={{
      width: "100%",
      height: "8px",
      background: "#eee",
      borderRadius: "4px",
    }}
  >
    <div
      style={{
        height: "8px",
        width: `${Math.max(0, Math.min(100, value || 0))}%`,
        background: "#3b82f6",
        borderRadius: "4px",
        transition: "width 0.2s",
      }}
    />
  </div>
);

export {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Switch,
  Label,
  Progress,
};