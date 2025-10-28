import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Testimonials } from '@/components/landing/Testimonials'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      
      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full opacity-10 animate-pulse" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-black mb-6 drop-shadow-lg">
            Ready to Create Your First eBook?
          </h2>
          <p className="text-xl md:text-2xl font-semibold mb-12 max-w-2xl mx-auto drop-shadow-md">
            Join thousands of creators and start publishing professional ebooks today
          </p>
          <a
            href="/signup"
            className="inline-block px-12 py-6 text-2xl font-black bg-black text-amber-400 border-4 border-white shadow-[10px_10px_0px_0px_rgba(255,255,255,1)] hover:shadow-[14px_14px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all rounded-lg"
          >
            Get Started Free
          </a>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-lg">
            © 2025 PothiGPT. All rights reserved.
          </p>
          <p className="text-gray-400 mt-2">
            Create, Edit, Export - Your story, beautifully told.
          </p>
        </div>
      </footer>
    </main>
  )
}
