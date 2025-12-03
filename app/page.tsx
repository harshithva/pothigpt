"use client";

import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { LampContainer } from "@/components/ui/modern/lamp";
import { BentoGrid, BentoGridItem } from "@/components/ui/modern/bento-grid";
import { InfiniteMovingCards } from "@/components/ui/modern/infinite-moving-cards";
import { Button, Container, Flex, Text, Box } from "@radix-ui/themes";
import { motion } from "framer-motion";
import {
  ReaderIcon,
} from "@radix-ui/react-icons";
import { 
  Bot, 
  ListTodo, 
  Palette, 
  LayoutTemplate, 
  FileDown,
  ArrowRight,
  BookOpen
} from "lucide-react";
import { 
  AIHeader, 
  QuestionnaireHeader, 
  EditorHeader, 
  TemplatesHeader, 
  ExportHeader 
} from "@/components/landing/FeatureHeaders";

export default function Home() {
  const features = [
    {
      title: "AI-Powered Generation",
      description:
        "Advanced AI writes high-quality content based on your answers. No writing experience needed.",
      header: <AIHeader />,
      icon: <Bot className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "Smart Questionnaire",
      description: "Answer targeted questions about your topic. Our system guides you through every step.",
      header: <QuestionnaireHeader />,
      icon: <ListTodo className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "Visual Editor",
      description: "Canva-style drag-and-drop editor. Customize layouts, fonts, colors, and images with ease.",
      header: <EditorHeader />,
      icon: <Palette className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "Professional Templates",
      description:
        "Choose from beautiful, professionally designed templates for any genre or industry.",
      header: <TemplatesHeader />,
      icon: <LayoutTemplate className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "One-Click Export",
      description: "Export to high-quality PDF with a single click. Print-ready and perfect for digital distribution.",
      header: <ExportHeader />,
      icon: <FileDown className="h-4 w-4 text-neutral-500" />,
    },
  ];

  const testimonials = [
    {
      quote:
        "I created my first ebook in under an hour. The AI understood exactly what I wanted, and the editor made it so easy to customize. This is a game-changer!",
      name: "Sarah Mitchell",
      title: "Content Creator",
    },
    {
      quote:
        "As someone with zero design experience, I was amazed at how professional my ebook looked. The templates are stunning and so easy to work with.",
      name: "James Chen",
      title: "Small Business Owner",
    },
    {
      quote: "PothiGPT saved me weeks of work. I used to struggle with writing and formatting, but now I can focus on my ideas while the AI handles the rest.",
      name: "Emily Parker",
      title: "Online Coach",
    },
    {
      quote:
        "The best investment I've made for my content marketing strategy. High quality outputs every time.",
      name: "Michael Ross",
      title: "Marketing Director",
    },
    {
      quote:
        "Finally, a tool that actually delivers on the promise of AI for creators. It feels like magic.",
      name: "Linda Wu",
      title: "Author",
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section - Lamp Effect (Light) */}
        <LampContainer>
          <motion.div
            initial={{ opacity: 0.5, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="mt-20 md:mt-0 bg-gradient-to-br from-slate-800 to-slate-600 py-4 bg-clip-text text-center tracking-tight text-transparent md:text-7xl"
          >
             <div className="inline-flex items-center justify-center px-4 py-1 mb-8 transition-colors border rounded-full border-blue-500/30 bg-blue-500/10 backdrop-blur-sm">
                <span className="text-xs font-bold text-blue-600">
                🚀 AI-Powered Ebook Creation Platform
                </span>
              </div>
            <br />
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-slate-900 leading-[1.1] md:leading-tight max-w-5xl mx-auto tracking-tight">
              Create Professional Ebooks in Minutes with <span className="text-blue-600">AI Magic</span>
            </h1>
            
            <p className="mt-8 text-base md:text-xl text-slate-600 max-w-2xl mx-auto font-normal px-4 leading-relaxed">
                Answer simple questions, let AI generate your content, customize with our visual editor, and export a beautiful ebook. It is that easy.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <button className="relative inline-flex h-12 md:h-14 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-50 shadow-lg hover:shadow-blue-500/25 transition-shadow duration-300">
                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#60A5FA_0%,#2563EB_50%,#60A5FA_100%)]" />
                    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-blue-600 px-8 md:px-10 py-1 text-sm md:text-base font-bold text-white backdrop-blur-3xl">
                      Start Creating Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  </button>
                </Link>
                
                <Link href="#how-it-works">
                  <button className="h-12 md:h-14 px-8 md:px-10 rounded-full bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 transition duration-200 text-sm md:text-base font-medium shadow-sm hover:shadow-md">
                    See How It Works
                  </button>
                </Link>
              </div>
          </motion.div>
        </LampContainer>

        {/* Features Section */}
        <section className="py-24 bg-white" id="features">
          <Container size="4">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">
                Everything You Need
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                Powerful features designed to make ebook creation effortless and professional.
              </p>
            </div>
            <BentoGrid>
              {features.map((item, i) => (
                <BentoGridItem
                  key={i}
                  title={item.title}
                  description={item.description}
                  header={item.header}
                  icon={item.icon}
                  className={i === 3 || i === 6 ? "md:col-span-2" : ""}
                />
              ))}
            </BentoGrid>
          </Container>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-slate-50" id="testimonials">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">
              Loved by Creators
            </h2>
          </div>
          <div className="h-[20rem] rounded-md flex flex-col antialiased bg-transparent items-center justify-center relative overflow-hidden">
            <InfiniteMovingCards
              items={testimonials}
              direction="right"
              speed="slow"
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative bg-blue-50 overflow-hidden">
          <div className="absolute inset-0 w-full h-full bg-blue-50">
             <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#3b82f61a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f61a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          </div>
          <Container size="3" className="relative z-10">
            <div className="text-center">
              <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-8">
                Ready to Create Your First Ebook?
              </h2>
              <p className="text-slate-600 text-xl mb-10 max-w-2xl mx-auto">
                Join thousands of creators who trust PothiGPT to bring their ideas to life. No credit card required to start.
              </p>
              <Button 
                size="4"
                variant="solid" 
                color="blue"
                highContrast
                asChild
                className="!cursor-pointer shadow-glow-blue !rounded-full !px-12 !py-6 !text-lg !h-auto"
              >
                <Link href="/signup">Start Now - It&apos;s Free</Link>
              </Button>
            </div>
          </Container>
        </section>
        
        {/* Footer */}
        <Box asChild>
          <footer className="bg-white text-slate-600 py-16 border-t border-slate-200">
            <Container size="4">
              <Flex justify="between" align="center" direction={{ initial: "column", md: "row" }} gap="6">
                  <Flex align="center" gap="2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <Text weight="bold" size="5" className="text-slate-900">PothiGPT</Text>
                </Flex>
                <Text size="2" className="text-slate-500">
                  © 2025 PothiGPT. All rights reserved.
                </Text>
                <Flex gap="6">
                  <Link href="#" className="hover:text-blue-600 transition-colors">Privacy</Link>
                  <Link href="#" className="hover:text-blue-600 transition-colors">Terms</Link>
                  <Link href="#" className="hover:text-blue-600 transition-colors">Contact</Link>
                </Flex>
              </Flex>
            </Container>
          </footer>
        </Box>
      </main>
    </>
  );
}
