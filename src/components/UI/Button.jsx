import React from "react";

export function Button({ children, onClick, className = "", ...props }) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1 rounded-md border shadow-sm hover:shadow-md transition disabled:opacity-60 " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}
