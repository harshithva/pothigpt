"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Bot, 
  ListTodo, 
  Palette, 
  LayoutTemplate, 
  FileDown, 
  Sparkles,
  Check,
  Type,
  Image as ImageIcon,
  MousePointer2
} from "lucide-react";

export const AIHeader = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-violet-100 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 items-center justify-center p-4 overflow-hidden relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-3 max-w-[200px] w-full border border-neutral-200 dark:border-neutral-800 z-10"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
            <Bot className="w-3 h-3 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="h-2 w-20 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
        </div>
        <div className="space-y-1.5">
          <motion.div 
            className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          <motion.div 
            className="h-2 w-[80%] bg-neutral-100 dark:bg-neutral-800 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "80%" }}
            transition={{ duration: 1, delay: 0.7 }}
          />
          <motion.div 
            className="h-2 w-[90%] bg-neutral-100 dark:bg-neutral-800 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "90%" }}
            transition={{ duration: 1, delay: 0.9 }}
          />
        </div>
      </motion.div>
      <div className="absolute inset-0 bg-grid-neutral-100/50 dark:bg-grid-neutral-900/50 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
    </div>
  );
};

export const QuestionnaireHeader = () => {
  const items = [1, 2, 3];
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-100 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-4 w-[180px] border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 mb-3">
          <ListTodo className="w-4 h-4 text-blue-500" />
          <div className="h-2 w-16 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
        </div>
        <div className="space-y-2">
          {items.map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2 }}
              className="flex items-center gap-2"
            >
              <div className="w-3 h-3 rounded-full border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.2 + 0.3 }}
                >
                  <Check className="w-2 h-2 text-blue-500" />
                </motion.div>
              </div>
              <div className="h-1.5 flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const EditorHeader = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg w-[200px] h-[120px] border border-neutral-200 dark:border-neutral-800 flex overflow-hidden">
        <div className="w-8 border-r border-neutral-200 dark:border-neutral-800 flex flex-col items-center py-2 gap-2 bg-neutral-50 dark:bg-neutral-900">
          <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
            <Type className="w-2.5 h-2.5 text-orange-500" />
          </div>
          <div className="w-4 h-4 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <ImageIcon className="w-2.5 h-2.5 text-neutral-400" />
          </div>
          <div className="w-4 h-4 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Palette className="w-2.5 h-2.5 text-neutral-400" />
          </div>
        </div>
        <div className="flex-1 p-2 relative">
          <motion.div
            initial={{ x: 20, y: 20, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-orange-50 dark:bg-orange-900/20 rounded p-2 mb-2 w-[80%]"
          >
            <div className="h-1.5 w-[60%] bg-orange-200 dark:bg-orange-800 rounded-full mb-1" />
            <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full" />
          </motion.div>
          <motion.div
            className="absolute bottom-4 right-4"
            animate={{ 
              x: [0, -10, -10, 0],
              y: [0, 0, -10, -10] 
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          >
            <MousePointer2 className="w-4 h-4 text-neutral-800 dark:text-neutral-200 fill-neutral-800 dark:fill-neutral-200" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export const TemplatesHeader = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 items-center justify-center p-4">
      <div className="grid grid-cols-3 gap-2 w-[200px]">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05, y: -5 }}
            className="aspect-[3/4] rounded-md bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200 dark:border-neutral-800 p-1.5"
          >
            <div className={`w-full h-[40%] rounded-sm mb-1.5 ${
              i === 1 ? 'bg-emerald-100 dark:bg-emerald-900/50' : 
              i === 2 ? 'bg-teal-100 dark:bg-teal-900/50' : 
              'bg-green-100 dark:bg-green-900/50'
            }`} />
            <div className="space-y-1">
              <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full" />
              <div className="h-1 w-[70%] bg-neutral-100 dark:bg-neutral-800 rounded-full" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const ExportHeader = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-rose-100 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 items-center justify-center p-4">
      <div className="relative">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            duration: 1, 
            repeat: Infinity, 
            repeatDelay: 1 
          }}
          className="absolute -top-8 left-1/2 -translate-x-1/2"
        >
          <div className="bg-rose-500 text-white p-1.5 rounded-full shadow-lg">
            <FileDown className="w-4 h-4" />
          </div>
        </motion.div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg w-16 h-20 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
          <div className="text-[10px] font-bold text-neutral-400">PDF</div>
        </div>
        <div className="absolute -right-2 -bottom-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
          <Check className="w-2 h-2" />
          Done
        </div>
      </div>
    </div>
  );
};

