'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'What is this AI training program about?',
      answer: 'Our AI training program helps entrepreneurs and small business owners understand and leverage artificial intelligence to improve their business operations, customer experiences, and growth strategies.'
    },
    {
      question: 'Who is this training for?',
      answer: 'This training is designed for business owners, entrepreneurs, and professionals who want to understand how to implement AI solutions in their business, regardless of their technical background.'
    },
    {
      question: 'How long does the program take to complete?',
      answer: 'The program is self-paced and typically takes about 20 hours to complete, including hands-on exercises and practical applications.'
    },
    {
      question: 'Do I need any prior experience with AI?',
      answer: 'No prior experience with AI is required. The program is designed to be accessible to beginners while still being valuable for those with some technical background.'
    },
    {
      question: 'What will I be able to do after completing the training?',
      answer: 'You\'ll be able to identify AI opportunities in your business, implement basic AI solutions, and make informed decisions about AI tools and technologies.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Find answers to common questions about our AI training program
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow">
              <button
                className="w-full px-6 py-4 text-left focus:outline-none"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
                aria-controls={`faq-${index}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {faq.question}
                  </h3>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>
              
              {openIndex === index && (
                <div 
                  id={`faq-${index}`}
                  className="px-6 pb-4 pt-0 text-gray-600"
                >
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
