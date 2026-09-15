import React, { useState } from 'react';
import { NexusLogo } from './NexusLogo';
import { FooterInfoModal } from './FooterInfoModal';

export const Footer: React.FC<{ onStartChat: () => void }> = ({ onStartChat }) => {
  const [activeInfoItem, setActiveInfoItem] = useState<string | null>(null);

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-zinc-600 dark:text-zinc-400 text-sm transition-colors duration-200">
      <FooterInfoModal
        activeItem={activeInfoItem}
        onClose={() => setActiveInfoItem(null)}
        onStartChat={onStartChat}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="col-span-2 space-y-4 pr-4 font-outfit">
            <NexusLogo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
            <p className="text-xs font-instrument text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm tracking-normal">
              AVO AI is an intelligent conversational AI assistant built for product teams, developers, and creators. Designed with Apple and Linear UI standards.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="font-bold text-black dark:text-white text-xs uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveInfoItem('Conversations')} className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer">
                  Conversations
                </button>
              </li>
              <li>
                <button onClick={() => setActiveInfoItem('Chat Application')} className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer">
                  Chat Application
                </button>
              </li>
              <li>
                <button onClick={() => setActiveInfoItem('Vision OCR')} className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer">
                  Vision OCR
                </button>
              </li>
              <li>
                <button onClick={() => setActiveInfoItem('Pricing Plans')} className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer">
                  Pricing Plans
                </button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="font-bold text-black dark:text-white text-xs uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveInfoItem('About Us')} className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => setActiveInfoItem('Careers')} className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer">
                  Careers
                </button>
              </li>
              <li>
                <button onClick={() => setActiveInfoItem('Brand Assets')} className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer">
                  Brand Assets
                </button>
              </li>
              <li>
                <button onClick={() => setActiveInfoItem('Contact')} className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer">
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Resources & Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-black dark:text-white text-xs uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveInfoItem('Privacy Policy')} className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setActiveInfoItem('Terms of Service')} className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => setActiveInfoItem('Security Center')} className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer">
                  Security Center
                </button>
              </li>
              <li>
                <button onClick={() => setActiveInfoItem('SOC2 Compliance')} className="hover:text-black dark:hover:text-white transition-colors text-left cursor-pointer">
                  SOC2 Compliance
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} AVO AI, Inc. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
};
