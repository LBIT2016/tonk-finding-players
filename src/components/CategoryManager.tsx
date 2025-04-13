import React from "react";

const CategoryManager: React.FC = () => {
  return (
    <div
      className="mb-6 rounded-xl overflow-hidden category-manager"
      style={{ backgroundColor: "#F2F2F7" }}
    >
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: "rgba(0, 0, 0, 0.05)" }}
      >
        <h3
          className="font-semibold flex items-center gap-2"
          style={{ fontSize: "15px" }}
        >
          Categories
        </h3>
      </div>
      <div className="p-4">
        <p style={{ color: "#8E8E93" }}>Category management is disabled.</p>
      </div>
    </div>
  );
};

export default CategoryManager;
