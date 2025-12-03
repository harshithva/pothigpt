import { Container, Flex, Heading, Text, Button, Box, Grid, Card, Avatar, Badge, Separator } from '@radix-ui/themes'
import Link from 'next/link'
import { Header } from '@/components/landing/Header'

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="py-16 md:py-32 lg:py-40 relative overflow-hidden" style={{
          background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 50%, #ffffff 100%)'
        }}>
          {/* Decorative elements */}
          <Box className="hidden md:block absolute top-10 md:top-20 right-5 md:right-10 w-48 md:w-72 md:h-72 bg-blue-200 rounded-full opacity-20 blur-3xl" />
          <Box className="hidden md:block absolute bottom-10 md:bottom-20 left-5 md:left-10 w-64 md:w-96 md:h-96 bg-blue-300 rounded-full opacity-20 blur-3xl" />
          
          <Container size="4" className="relative z-10">
            <Flex direction="column" align="center" gap="4 md:8" className="text-center">
              <Badge size="2" color="blue" variant="soft" radius="full" highContrast>
                🚀 AI-Powered Ebook Creation Platform
              </Badge>
              
              <Heading 
                size="9" 
                weight="bold" 
                className="max-w-5xl gradient-text"
                style={{ lineHeight: '1.1', fontSize: 'clamp(2rem, 6vw, 4.5rem)' }}
              >
                Create Professional Ebooks in Minutes—No Design or Writing Skills Required
              </Heading>
              
              <Text size="5" className="max-w-3xl px-4 md:px-0 text-base md:text-lg" style={{ color: '#475569', lineHeight: '1.6' }}>
                Answer simple questions, let AI generate your content, customize with our visual editor, and export a beautiful ebook. It is that easy.
              </Text>

              <Flex direction="column" align="stretch" className="flex-col sm:flex-row gap-3 md:gap-4 mt-6 w-full sm:w-auto px-4 sm:px-0">
                <Button 
                  size="3" 
                  variant="solid" 
                  color="blue" 
                  highContrast 
                  asChild 
                  className="!cursor-pointer shadow-glow-blue"
                  style={{ paddingLeft: '1.5rem md:2rem', paddingRight: '1.5rem md:2rem' }}
                >
                  <Link href="/signup">Start Creating Free →</Link>
                </Button>
                <Button 
                  size="3" 
                  variant="outline" 
                  color="blue" 
                  asChild 
                  className="!cursor-pointer"
                >
                  <a href="#how-it-works">See How It Works</a>
                </Button>
              </Flex>

              {/* Enhanced Visual Preview */}
              <Card 
                size="4" 
                className="mt-8 md:mt-12 w-full max-w-4xl shadow-xl-blue mx-4 md:mx-0"
                style={{ 
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Grid columns={{ initial: "1", md: "3" }} gap="4 md:6" p="4 md:6">
                  <Card variant="surface" className="hover-lift" style={{ border: '1px solid #e0e7ff' }}>
                    <Flex direction="column" gap="3" align="center" p="4">
                      <Box 
                        className="text-4xl w-16 h-16 flex items-center justify-center rounded-2xl"
                        style={{ background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' }}
                      >
                        📝
                      </Box>
                      <Text size="3" weight="bold">Answer Questions</Text>
                      <Text size="2" color="gray" align="center">Simple guided questionnaire</Text>
                    </Flex>
                  </Card>
                  <Card variant="surface" className="hover-lift" style={{ border: '1px solid #e0e7ff' }}>
                    <Flex direction="column" gap="3" align="center" p="4">
                      <Box 
                        className="text-4xl w-16 h-16 flex items-center justify-center rounded-2xl"
                        style={{ background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' }}
                      >
                        🤖
                      </Box>
                      <Text size="3" weight="bold">AI Generates</Text>
                      <Text size="2" color="gray" align="center">Professional content instantly</Text>
                    </Flex>
                  </Card>
                  <Card variant="surface" className="hover-lift" style={{ border: '1px solid #e0e7ff' }}>
                    <Flex direction="column" gap="3" align="center" p="4">
                      <Box 
                        className="text-4xl w-16 h-16 flex items-center justify-center rounded-2xl"
                        style={{ background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' }}
                      >
                        📚
                      </Box>
                      <Text size="3" weight="bold">Export PDF</Text>
                      <Text size="2" color="gray" align="center">Print-ready ebook</Text>
                    </Flex>
                  </Card>
                </Grid>
              </Card>
            </Flex>
          </Container>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-20 lg:py-24 bg-white" id="features">
          <Container size="4">
            <Flex direction="column" align="center" gap="4 md:6" className="text-center mb-8 md:mb-16 px-4 md:px-0">
              <Badge size="2" color="blue" variant="soft">Features</Badge>
              <Heading size="7" weight="bold" className="max-w-3xl text-3xl md:text-4xl">
                Everything You Need to Create Amazing Ebooks
              </Heading>
              <Text size="4" color="gray" className="max-w-2xl text-base md:text-lg">
                Powerful features designed to make ebook creation effortless
              </Text>
            </Flex>

            <Grid columns={{ initial: "1", md: "2", lg: "3" }} gap="6 md:8">
              {[
                { icon: '🤖', title: 'AI-Powered Generation', desc: 'Advanced AI writes high-quality content based on your answers. No writing experience needed.', color: '#dbeafe' },
                { icon: '📋', title: 'Smart Questionnaire', desc: 'Answer targeted questions about your topic. Our system guides you through every step.', color: '#e0e7ff', badge: 'Popular' },
                { icon: '🎨', title: 'Visual Editor', desc: 'Canva-style drag-and-drop editor. Customize layouts, fonts, colors, and images with ease.', color: '#ddd6fe' },
                { icon: '📐', title: 'Professional Templates', desc: 'Choose from beautiful, professionally designed templates for any genre or industry.', color: '#fce7f3' },
                { icon: '📄', title: 'One-Click Export', desc: 'Export to high-quality PDF with a single click. Print-ready and perfect for digital distribution.', color: '#fef3c7' },
                { icon: '☁️', title: 'Auto-Save & Cloud', desc: 'Your work is automatically saved to the cloud. Access from anywhere, never lose progress.', color: '#d1fae5' }
              ].map((feature, i) => (
                <Card 
                  key={i}
                  size="4" 
                  className="hover-lift transition-all"
                  style={{ 
                    borderLeft: '4px solid #3b82f6',
                    cursor: 'pointer'
                  }}
                >
                  <Flex direction="column" gap="4" height="100%">
                    <Flex align="center" gap="3">
                      <Box 
                        className="text-3xl w-14 h-14 flex items-center justify-center rounded-xl"
                        style={{ background: feature.color }}
                      >
                        {feature.icon}
                      </Box>
                      <Flex direction="column" gap="1">
                        <Flex align="center" gap="2">
                          <Heading size="5" weight="bold">{feature.title}</Heading>
                          {feature.badge && <Badge color="blue" variant="soft" size="1">{feature.badge}</Badge>}
                        </Flex>
                      </Flex>
                    </Flex>
                    <Text size="3" style={{ color: '#64748b', lineHeight: '1.6' }}>
                      {feature.desc}
                    </Text>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Container>
        </section>

        {/* Interactive Demo Section */}
        <section className="py-12 md:py-20 lg:py-24 bg-gradient-to-b from-white to-blue-50">
          <Container size="4">
            <Flex direction="column" align="center" gap="4 md:6" className="text-center mb-8 md:mb-16 px-4 md:px-0">
              <Badge size="2" color="blue" highContrast>Live Demo</Badge>
              <Heading size="7" weight="bold" className="text-3xl md:text-4xl">
                See PothiGPT in Action
              </Heading>
              <Text size="4" color="gray" className="max-w-2xl text-base md:text-lg">
                Experience the power of AI-driven ebook creation
              </Text>
            </Flex>

            <Grid columns={{ initial: "1", md: "3" }} gap="6 md:8">
              {[
                {
                  title: 'Smart Questionnaire',
                  badge: 'Step 1',
                  items: ['📝 What is your ebook topic?', '🎯 Who is your target audience?', '📊 What chapters to include?', '✨ Preferred writing style?']
                },
                {
                  title: 'AI Generation',
                  badge: 'Step 2',
                  items: ['🤖 Analyzing responses...', '✍️ Writing chapter 1...', '📖 Creating table of contents...', '✅ Content ready!']
                },
                {
                  title: 'Visual Editor',
                  badge: 'Step 3',
                  items: ['🎨 Choose template', '🖼️ Add images', '✏️ Edit text', '📥 Export PDF']
                }
              ].map((demo, i) => (
                <Card 
                  key={i}
                  size="4" 
                  className="hover-lift min-h-[200px] md:min-h-[300px]"
                  style={{
                    background: 'white',
                    border: '1px solid #e0e7ff'
                  }}
                >
                  <Flex direction="column" gap="4" height="100%">
                    <Flex justify="between" align="center">
                      <Heading size="5" weight="bold">{demo.title}</Heading>
                      <Badge color="blue" variant="soft">{demo.badge}</Badge>
                    </Flex>
                    <Separator size="4" />
                    <Flex direction="column" gap="3">
                      {demo.items.map((item, j) => (
                        <Box key={j} p="3" style={{ background: '#f8fafc', borderRadius: '8px' }}>
                          <Text size="2">{item}</Text>
                        </Box>
                      ))}
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Container>
        </section>

        {/* How It Works Section */}
        <section className="py-12 md:py-20 lg:py-24 bg-white" id="how-it-works">
          <Container size="4">
            <Flex direction="column" align="center" gap="4 md:6" className="text-center mb-8 md:mb-16 px-4 md:px-0">
              <Badge size="2" color="blue" variant="soft">Process</Badge>
              <Heading size="7" weight="bold" className="text-3xl md:text-4xl">How PothiGPT Works</Heading>
              <Text size="4" color="gray" className="max-w-2xl text-base md:text-lg">
                From idea to published ebook in four simple steps
              </Text>
            </Flex>

            <Grid columns={{ initial: "1", md: "2" }} gap="6 md:8">
              {[
                { num: 1, title: 'Answer Questions', desc: 'Tell us about your ebook through a simple questionnaire. What is the topic? Who is your audience? What should it cover? Our smart system asks the right questions.' },
                { num: 2, title: 'AI Generates Content', desc: 'Our AI analyzes your responses and generates professional content. Chapters, sections, and even formatting—all created automatically in minutes.' },
                { num: 3, title: 'Customize Design', desc: 'Use our visual editor to personalize your ebook. Change layouts, adjust fonts, add images, and fine-tune every detail. No design skills required.' },
                { num: 4, title: 'Export & Share', desc: 'Download your ebook as a high-quality PDF. Share it with your audience, sell it online, or print physical copies. You are ready to publish!' }
              ].map((step) => (
                <Card 
                  key={step.num}
                  size="4" 
                  variant="classic"
                  className="hover-lift"
                >
                  <Flex direction="column" gap="4">
                    <Flex align="center" gap="3 md:4">
                      <Box 
                        className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl md:text-2xl flex-shrink-0"
                        style={{ 
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)'
                        }}
                      >
                        {step.num}
                      </Box>
                      <Heading size="5" weight="bold" className="text-xl md:text-2xl">{step.title}</Heading>
                    </Flex>
                    <Text size="4" style={{ color: '#64748b', lineHeight: '1.7' }}>
                      {step.desc}
                    </Text>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Container>
        </section>

        {/* Testimonials Section */}
        <section className="py-12 md:py-20 lg:py-24 bg-gradient-to-b from-white to-gray-50" id="testimonials">
          <Container size="4">
            <Flex direction="column" align="center" gap="4 md:6" className="text-center mb-8 md:mb-16 px-4 md:px-0">
              <Badge size="2" color="blue" variant="soft">Testimonials</Badge>
              <Heading size="7" weight="bold" className="text-3xl md:text-4xl">Loved by Creators Worldwide</Heading>
              <Text size="4" color="gray" className="max-w-2xl text-base md:text-lg">
                See what our users have to say about PothiGPT
              </Text>
            </Flex>

            <Grid columns={{ initial: "1", md: "3" }} gap="6 md:8">
              {[
                { name: "Sarah Mitchell", role: "Content Creator", quote: "I created my first ebook in under an hour. The AI understood exactly what I wanted, and the editor made it so easy to customize. This is a game-changer!", fallback: "SM", color: "blue" },
                { name: "James Chen", role: "Small Business Owner", quote: "As someone with zero design experience, I was amazed at how professional my ebook looked. The templates are stunning and so easy to work with.", fallback: "JC", color: "green" },
                { name: "Emily Parker", role: "Online Coach", quote: "PothiGPT saved me weeks of work. I used to struggle with writing and formatting, but now I can focus on my ideas while the AI handles the rest.", fallback: "EP", color: "purple" }
              ].map((testimonial, i) => (
                <Card 
                  key={i}
                  size="4" 
                  variant="surface"
                  className="hover-lift"
                >
                  <Flex direction="column" gap="5">
                    <Box className="text-4xl" style={{ color: '#3b82f6', opacity: 0.3 }}>"</Box>
                    <Text size="4" style={{ lineHeight: '1.7', color: '#1e293b' }}>
                      {testimonial.quote}
                    </Text>
                    <Separator size="4" />
                    <Flex gap="3" align="center">
                      <Avatar 
                        size="4" 
                        fallback={testimonial.fallback} 
                        color={testimonial.color as any}
                        style={{ background: `linear-gradient(135deg, var(--${testimonial.color}-3), var(--${testimonial.color}-5))` }}
                      />
                      <Flex direction="column">
                        <Text size="3" weight="bold">{testimonial.name}</Text>
                        <Text size="2" color="gray">{testimonial.role}</Text>
                      </Flex>
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Grid>

            {/* Trust Indicators */}
            <Grid columns={{ initial: "1", md: "3" }} gap="6 md:8" mt="8 md:16">
              {[
                { stat: '10,000+', label: 'Ebooks Created' },
                { stat: '5,000+', label: 'Happy Users' },
                { stat: '4.9/5', label: 'Average Rating' }
              ].map((item, i) => (
                <Flex key={i} direction="column" align="center" gap="2" p="6" style={{ background: 'white', borderRadius: '12px' }}>
                  <Text size="8" weight="bold" className="gradient-text">{item.stat}</Text>
                  <Text size="3" color="gray">{item.label}</Text>
                </Flex>
              ))}
            </Grid>
          </Container>
        </section>

        {/* CTA Section */}
        <section 
          className="py-16 md:py-24 lg:py-32 text-white relative overflow-hidden" 
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)'
          }}
        >
          <Box className="hidden md:block absolute top-0 right-0 w-64 md:w-96 md:h-96 bg-white rounded-full opacity-10 blur-3xl" />
          <Box className="hidden md:block absolute bottom-0 left-0 w-64 md:w-96 md:h-96 bg-white rounded-full opacity-10 blur-3xl" />
          
          <Container size="4" className="relative z-10">
            <Flex direction="column" align="center" gap="6 md:8" className="text-center px-4 md:px-0">
              <Heading size="7" weight="bold" className="text-white max-w-4xl text-3xl md:text-5xl">
                Ready to Create Your First Ebook?
              </Heading>
              <Text size="4" className="max-w-3xl text-base md:text-xl" style={{ color: '#dbeafe' }}>
                Join thousands of creators who trust PothiGPT to bring their ideas to life. No credit card required to start.
              </Text>
              <Button 
                size="3" 
                variant="solid" 
                highContrast
                className="!bg-white !text-blue-700 hover:!bg-blue-50 !cursor-pointer shadow-glow-blue"
                asChild
                style={{ paddingLeft: '1.5rem md:2.5rem', paddingRight: '1.5rem md:2.5rem' }}
              >
                <Link href="/signup">Start Creating Free →</Link>
              </Button>
              <Flex direction="column" align="center" className="flex-col sm:flex-row gap-3 sm:gap-6 mt-2">
                <Text size="2" style={{ color: '#bfdbfe' }}>✓ Free forever</Text>
                <Text size="2" style={{ color: '#bfdbfe' }}>✓ No credit card needed</Text>
                <Text size="2" style={{ color: '#bfdbfe' }}>✓ Cancel anytime</Text>
              </Flex>
            </Flex>
          </Container>
        </section>

        {/* FAQ Section */}
        <section className="py-12 md:py-20 lg:py-24 bg-gray-50" id="faq">
          <Container size="3" className="px-4 md:px-0">
            <Flex direction="column" align="center" gap="4 md:6" className="text-center mb-8 md:mb-16">
              <Badge size="2" color="blue" variant="soft">FAQ</Badge>
              <Heading size="7" weight="bold" className="text-3xl md:text-4xl">Frequently Asked Questions</Heading>
              <Text size="4" color="gray" className="text-base md:text-lg">
                Everything you need to know about PothiGPT
              </Text>
            </Flex>

            <Flex direction="column" gap="4">
              {[
                { q: "Do I need any writing experience?", a: "Not at all! PothiGPT is designed for everyone. Simply answer our questionnaire, and our AI will generate professional content for you. You can then customize it as much or as little as you would like." },
                { q: "What types of ebooks can I create?", a: "PothiGPT works for any type of ebook: how-to guides, business books, recipe collections, educational materials, marketing content, and more. Our AI adapts to your needs." },
                { q: "How long does it take to create an ebook?", a: "Most users create their first ebook in under an hour. The AI generates content in minutes, and you can spend as much time as you would like customizing the design." },
                { q: "Can I edit the AI-generated content?", a: "Absolutely! Our visual editor gives you complete control. Edit text, change layouts, add images, adjust formatting—everything is customizable to match your vision." },
                { q: "What format can I export my ebook in?", a: "You can export your ebook as a high-quality PDF, perfect for both digital distribution and print. The PDF maintains professional formatting and is ready to share immediately." },
                { q: "Is my work saved automatically?", a: "Yes! PothiGPT automatically saves your progress to the cloud as you work. You can access your ebooks from any device, and you will never lose your work." },
                { q: "Do I own the rights to my ebook?", a: "100% yes! You own all rights to the content and design of your ebook. Use it however you would like—sell it, distribute it for free, or print physical copies." },
                { q: "Can I create multiple ebooks?", a: "Of course! There is no limit to how many ebooks you can create. Build a library of content, experiment with different topics, and publish as much as you want." }
              ].map((faq, i) => (
                <Card 
                  key={i}
                  size="4"
                  className="transition-all hover:shadow-lg"
                  style={{ background: i % 2 === 0 ? 'white' : '#f8fafc' }}
                >
                  <Flex direction="column" gap="3">
                    <Flex align="center" gap="3">
                      <Box className="text-2xl">❓</Box>
                      <Heading size="5" weight="bold">{faq.q}</Heading>
                    </Flex>
                    <Text size="4" style={{ color: '#64748b', lineHeight: '1.7' }}>
                      {faq.a}
                    </Text>
                  </Flex>
                </Card>
              ))}
            </Flex>
          </Container>
        </section>
        
        {/* Footer */}
        <Box asChild>
          <footer className="bg-gray-900 text-white py-12 md:py-16">
            <Container size="4">
              <Grid columns={{ initial: "1", md: "4" }} gap="8 md:12" mb="8 md:12">
                {/* Brand */}
                <Flex direction="column" gap="4">
                  <Flex align="center" gap="2">
                    <Box className="text-2xl">📚</Box>
                    <Heading size="6" weight="bold">PothiGPT</Heading>
                  </Flex>
                  <Text size="3" color="gray">
                    AI-powered ebook creation made simple
                  </Text>
                </Flex>

                {/* Product */}
                <Flex direction="column" gap="4">
                  <Text size="3" weight="bold">Product</Text>
                  <Flex direction="column" gap="3">
                    <Text size="3" asChild>
                      <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
                    </Text>
                    <Text size="3" asChild>
                      <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</a>
                    </Text>
                    <Text size="3" asChild>
                      <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Testimonials</a>
                    </Text>
                    <Text size="3" asChild>
                      <a href="#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a>
                    </Text>
                  </Flex>
                </Flex>

                {/* Company */}
                <Flex direction="column" gap="4">
                  <Text size="3" weight="bold">Company</Text>
                  <Flex direction="column" gap="3">
                    <Text size="3" asChild>
                      <Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link>
                    </Text>
                    <Text size="3" asChild>
                      <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
                    </Text>
                  </Flex>
                </Flex>

                {/* Legal */}
                <Flex direction="column" gap="4">
                  <Text size="3" weight="bold">Legal</Text>
                  <Flex direction="column" gap="3">
                    <Text size="3" asChild>
                      <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
                    </Text>
                    <Text size="3" asChild>
                      <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
                    </Text>
                  </Flex>
                </Flex>
              </Grid>

              <Box style={{ 
                height: '1px', 
                background: 'linear-gradient(to right, transparent, #475569, transparent)',
                marginBottom: '2rem'
              }} />
              
              <Flex direction={{ initial: "column", md: "row" }} justify="between" align="center" gap="4">
                <Text size="3" color="gray">
                  © 2025 PothiGPT. All rights reserved.
                </Text>
                <Text size="3" color="gray">
                  Made with AI for creators everywhere 🚀
                </Text>
              </Flex>
            </Container>
          </footer>
        </Box>
      </main>
    </>
  )
}
