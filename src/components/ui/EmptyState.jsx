import React from "react";
import { Link } from "react-router-dom";
import { PackageOpen } from "lucide-react";
import { motion } from "framer-motion";
import Button from "./Button";

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = "No items found",
  description = "There is nothing here yet. Explore our products and discover something you love.",
  actionText,
  actionLink,
  onAction,
  className = "",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border-2 border-gray-100 shadow-sm ${className}`}
    >
      <div className="relative mb-5">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center">
          <Icon className="w-10 h-10 text-amber-500" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
          <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
        </div>
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && (
        actionLink ? (
          <Link to={actionLink}>
            <Button variant="primary" className="px-6 py-2.5 shadow-md hover:shadow-lg transition-all">
              {actionText}
            </Button>
          </Link>
        ) : onAction ? (
          <Button variant="primary" onClick={onAction} className="px-6 py-2.5 shadow-md hover:shadow-lg transition-all">
            {actionText}
          </Button>
        ) : null
      )}
    </motion.div>
  );
}
