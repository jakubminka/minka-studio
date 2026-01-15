
import React, { useState, useEffect } from 'react';
import { Mail, Search, X, MessageSquare, Calendar, User, Tag, CheckCircle2, Trash2, UserX, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inquiry } from '../../types';
import { dataStore } from '../../lib/db';

const InquiryManager: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const loadData = async () => {
    const saved = await dataStore.collection('inquiries').getAll();
    setInquiries(saved);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const markAsRead = async (id: string) => {
    await dataStore.collection('inquiries').update(id, { status: 'read' });
  };

  const deleteInquiry = async (id: string) => {
    if (confirm('Smazat dotaz?')) {
      await dataStore.collection('inquiries').delete(id);
      setSelectedInquiry(null);
    }
  };

  const anonymizeInquiry = async (id: string) => {
    if (confirm('Anonymizovat údaje?')) {
      await dataStore.collection('inquiries').update(id, { name: 'GDPR ANONYMIZOVÁNO', email: 'smazano@anonym.cz' });
      loadData(); // Re-sync local selection
    }
  };

  const filteredInquiries = inquiries.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-sm border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="relative flex-grow max-w-xl">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Hledat v dotazech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 py-3.5 pl-12 pr-6 text-xs font-medium focus:outline-none focus:border-[#007BFF] text-black"
          />
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nové zprávy: {inquiries.filter(i => i.status === 'new').length}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-white border border-gray-100 shadow-sm max-h-[70vh] overflow-y-auto custom-scrollbar">
          {filteredInquiries.length > 0 ? (
            filteredInquiries.map((inquiry) => (
              <div 
                key={inquiry.id} 
                onClick={() => { setSelectedInquiry(inquiry); if (inquiry.status === 'new') markAsRead(inquiry.id); }}
                className={`p-6 border-b border-gray-50 cursor-pointer transition-all hover:bg-gray-50 relative ${selectedInquiry?.id === inquiry.id ? 'bg-blue-50/50 border-l-4 border-l-[#007BFF]' : ''}`}
              >
                {inquiry.status === 'new' && <div className="absolute top-6 right-6 w-2 h-2 bg-[#007BFF] rounded-full shadow-[0_0_10px_#007BFF]"></div>}
                <div className="flex justify-between items-start mb-1">
                   <h4 className="text-xs font-black uppercase tracking-widest truncate max-w-[200px] text-black">{inquiry.name}</h4>
                   <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(inquiry.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                   <Mail size={10} className="text-[#007BFF]" />
                   <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{inquiry.email}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-950 uppercase mb-2 truncate">{inquiry.subject}</p>
              </div>
            ))
          ) : (
            <div className="p-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-widest">Žádné dotazy</div>
          )}
        </div>

        <div className="lg:col-span-7">
           <AnimatePresence mode="wait">
             {selectedInquiry ? (
               <motion.div key={selectedInquiry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white border border-gray-100 shadow-sm p-10 space-y-8 min-h-[50vh] relative">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-[#007BFF]"><User size={24} /></div>
                        <div>
                           <h3 className="text-lg font-black uppercase tracking-widest text-black">{selectedInquiry.name}</h3>
                           <a href={`mailto:${selectedInquiry.email}`} className="text-xs font-black text-[#007BFF] hover:underline uppercase tracking-widest">{selectedInquiry.email}</a>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => anonymizeInquiry(selectedInquiry.id)} className="p-3 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-all rounded-sm"><UserX size={18} /></button>
                        <button onClick={() => deleteInquiry(selectedInquiry.id)} className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all rounded-sm"><Trash2 size={18} /></button>
                     </div>
                  </div>
                  <div className="bg-gray-50 p-8 border border-gray-100 text-sm whitespace-pre-wrap font-medium">
                     {selectedInquiry.message}
                  </div>
               </motion.div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center bg-gray-50 border border-gray-100 border-dashed p-20 text-center">
                  <MessageSquare size={48} className="text-gray-200 mb-6" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vyberte dotaz</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default InquiryManager;
