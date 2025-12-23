import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            title="Toggle theme"
        >
            <motion.div
                initial={false}
                animate={{ rotate: theme === "dark" ? 0 : 180 }}
                transition={{ duration: 0.3 }}
            >
                {theme === "dark" ? (
                    <Moon className="w-5 h-5 text-blue-300" />
                ) : (
                    <Sun className="w-5 h-5 text-amber-500" />
                )}
            </motion.div>
        </button>
    );
};
