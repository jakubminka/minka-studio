
import React, { useState, useEffect } from 'react';
import { Review } from '../../types';
import { REVIEWS as INITIAL_REVIEWS } from '../../constants';
import { 
  Star, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  ExternalLink,
  Search,
  CheckCircle2,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataStore } from '../../lib/db';

const ReviewManager: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Review>>({
    author: '',
    text: '',
    rating: 5,
    platform: 'google',
    date: ''
  });

  const mapFromDb = (item: any): Review => {
    return {
      id: item.id,
      author: item.author || 'Anonymní klient',
      text: item.text || item.content || '',
      rating: typeof item.rating === 'number' ? item.rating : 5,
      platform: item.platform || item.company || 'manual',
      date: item.date || ''
    } as Review;
  };

  const mapToDb = (review: Review) => {
    return {
      id: review.id,
      author: review.author,
      content: review.text,
      rating: review.rating,
      company: review.platform,
      date: review.date
    };
  };

  const loadData = async () => {
    const initKey = 'jakub_minka_reviews_initialized';
    // Try to migrate from old localStorage key
    const oldData = localStorage.getItem('jakub_minka_reviews');
    if (oldData) {
      const oldReviews = JSON.parse(oldData);
      for (const review of oldReviews) {
        await dataStore.collection('reviews').save(review);
      }
      localStorage.removeItem('jakub_minka_reviews'); // Remove old data
    }

    // Load from dataStore
    const saved = await dataStore.collection('reviews').getAll();
    const isInitialized = localStorage.getItem(initKey) === 'true';
    if (saved && saved.length > 0) {
      setReviews(saved.map(mapFromDb));
      if (!isInitialized) localStorage.setItem(initKey, 'true');
      return;
    }

    if (!isInitialized) {
      // Initialize with default reviews only on first run
      for (const review of INITIAL_REVIEWS) {
        await dataStore.collection('reviews').save(mapToDb(review));
      }
      setReviews(INITIAL_REVIEWS);
      localStorage.setItem(initKey, 'true');
    } else {
      setReviews([]);
    }
  };

  useEffect(() => { loadData(); }, []);

  const saveReview = async (review: Review) => {
    await dataStore.collection('reviews').save(mapToDb(review));
    await loadData();
  };

  const deleteReview = async (id: string) => {
    await dataStore.collection('reviews').delete(id);
    await loadData();
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const newReview: Review = {
      id: Math.random().toString(36).substr(2, 9),
      author: formData.author || 'Anonymní klient',
      text: formData.text || '',
      rating: formData.rating || 5,
      platform: formData.platform as any || 'manual',
      date: formData.date || new Date().toLocaleDateString('cs-CZ', { year: 'numeric', month: 'long' })
    };

    await saveReview(newReview);
    setShowForm(false);
    setFormData({ author: '', text: '', rating: 5, platform: 'google', date: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Opravdu chcete tuto recenzi smazat?')) {
      await deleteReview(id);
    }
  };

  const startEdit = (review: Review) => {
    setIsEditing(review.id);
    setFormData(review);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const reviewToUpdate = reviews.find(r => r.id === isEditing);
    if (reviewToUpdate) {
      await saveReview({ ...reviewToUpdate, ...formData } as Review);
      setIsEditing(null);
      setFormData({ author: '', text: '', rating: 5, platform: 'google', date: '' });
    }
  };

  const filteredReviews = reviews.filter(r => 
    r.author.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Toolbar */}
      <div className="bg-white p-6 rounded-sm border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowForm(true)}
            className="bg-[#007BFF] text-white px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-[#007BFF]/20"
          >
            <Plus size={16} /> Přidat recenzi
          </button>
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Hledat v recenzích..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-50 border border-gray-100 py-3 pl-12 pr-6 text-xs font-medium focus:outline-none focus:border-[#007BFF] w-64 transition-all"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">
           <span>Celkem {reviews.length} referencí</span>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-10 border border-[#007BFF]/20 shadow-2xl relative"
          >
            <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black">
              <X size={20} />
            </button>
            <h3 className="text-xl font-black uppercase tracking-widest mb-8 flex items-center gap-3">
              <MessageSquare size={20} className="text-[#007BFF]" /> Nová reference
            </h3>
            
            <form onSubmit={handleAddReview} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Jméno klienta / Firmy</label>
                <input 
                  type="text" 
                  value={formData.author}
                  onChange={e => setFormData({...formData, author: e.target.value})}
                  required
                  className="w-full bg-gray-50 border border-gray-100 p-4 text-sm focus:outline-none focus:border-[#007BFF]"
                  placeholder="např. Jan Novák, Škoda Auto"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Zdroj recenze</label>
                <select 
                  value={formData.platform}
                  onChange={e => setFormData({...formData, platform: e.target.value as any})}
                  className="w-full bg-gray-50 border border-gray-100 p-4 text-sm focus:outline-none focus:border-[#007BFF]"
                >
                  <option value="google">Google Maps</option>
                  <option value="firmy">Firmy.cz</option>
                  <option value="manual">Vlastní (Ověřeno)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Datum (nepovinné)</label>
                <input 
                  type="text" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 p-4 text-sm focus:outline-none focus:border-[#007BFF]"
                  placeholder="např. před měsícem"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hodnocení</label>
                <div className="flex gap-2 p-3 bg-gray-50 border border-gray-100">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setFormData({...formData, rating: star})}
                      className={`transition-colors ${star <= (formData.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`}
                    >
                      <Star size={24} fill="currentColor" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Obsah recenze</label>
                <textarea 
                  rows={4}
                  value={formData.text}
                  onChange={e => setFormData({...formData, text: e.target.value})}
                  required
                  className="w-full bg-gray-50 border border-gray-100 p-4 text-sm focus:outline-none focus:border-[#007BFF] resize-none"
                  placeholder="Co klient o spolupráci napsal..."
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="bg-[#007BFF] text-white px-12 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                  Uložit recenzi
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredReviews.map((review) => (
          <div 
            key={review.id} 
            className={`bg-white border rounded-sm p-8 transition-all group relative ${isEditing === review.id ? 'border-[#007BFF] ring-2 ring-[#007BFF]/10' : 'border-gray-100 hover:shadow-xl hover:border-gray-200'}`}
          >
            {isEditing === review.id ? (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    value={formData.author} 
                    onChange={e => setFormData({...formData, author: e.target.value})}
                    className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-[#007BFF] font-bold text-sm"
                  />
                  <select 
                    value={formData.platform}
                    onChange={e => setFormData({...formData, platform: e.target.value as any})}
                    className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-[#007BFF] text-[10px] font-black uppercase"
                  >
                    <option value="google">Google</option>
                    <option value="firmy">Firmy.cz</option>
                    <option value="manual">Vlastní</option>
                  </select>
                </div>
                <textarea 
                  value={formData.text}
                  onChange={e => setFormData({...formData, text: e.target.value})}
                  className="w-full bg-gray-50 p-4 text-xs border border-gray-100 focus:outline-none focus:border-[#007BFF] resize-none"
                  rows={3}
                />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditing(null)} className="p-2 text-gray-400 hover:text-red-500">
                    <X size={18} />
                  </button>
                  <button type="submit" className="bg-[#007BFF] text-white px-6 py-2 text-[9px] font-black uppercase tracking-widest">
                    <Save size={14} className="inline mr-2" /> Uložit změny
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-0.5 text-yellow-400">
                    {[...Array(review.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(review)} className="p-2 hover:text-[#007BFF] text-gray-300">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(review.id)} className="p-2 hover:text-red-500 text-gray-300">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed mb-6 italic line-clamp-3">"{review.text}"</p>
                
                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                  <div>
                    <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-900">{review.author}</h4>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]">{review.date}</span>
                  </div>
                  <div className="bg-gray-50 px-3 py-1 rounded-full">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#007BFF]">
                      {review.platform === 'google' ? 'Google' : review.platform === 'firmy' ? 'Firmy.cz' : 'Vlastní'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="py-32 bg-white border border-gray-100 border-dashed rounded-sm flex flex-col items-center justify-center text-center">
          <AlertCircle size={40} className="text-gray-100 mb-4" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Žádné recenze nenalezeny</h4>
        </div>
      )}
    </div>
  );
};

export default ReviewManager;
