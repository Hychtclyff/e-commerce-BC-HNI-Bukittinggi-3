"use client";

import React from "react";
import { motion } from "framer-motion";

export interface AuthCardWrapperProps {
    children: React.ReactNode;
    className?: string;
}

export function AuthCardWrapper({ children, className = "" }: AuthCardWrapperProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={`relative overflow-hidden bg-surface/90 backdrop-blur-xl border border-border-subtle rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 transition-all duration-300 ${className}`}
        >
            {/* Animated Decorative Blobs */}
            <motion.div
                animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.15, 0.28, 0.15],
                    y: [0, -10, 0],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-14 -right-14 w-44 h-44 rounded-full bg-primary-sage/20 blur-2xl pointer-events-none"
            />
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.15, 0.3, 0.15],
                    y: [0, 10, 0],
                }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-14 -left-14 w-48 h-48 rounded-full bg-accent-gold/20 blur-2xl pointer-events-none"
            />

            <div className="relative z-10 flex flex-col gap-6">
                {children}
            </div>
        </motion.div>
    );
}

export default AuthCardWrapper;
